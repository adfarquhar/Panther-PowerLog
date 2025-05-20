'use server'

import { z } from 'zod'
import { createServerActionClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { Database } from '@/lib/supabase/database.types'

const LogSetSchema = z.object({
  workoutExerciseId: z.string().uuid(),
  reps: z.coerce.number().min(0), // Coerce to number, min 0 reps
  notes: z.string().optional(),
})

export async function logExerciseSet(formData: FormData) {
  const cookieStore = cookies()
  const supabase = await createServerActionClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be logged in to log a set.' }
  }

  const validation = LogSetSchema.safeParse({
    workoutExerciseId: formData.get('workoutExerciseId'),
    reps: formData.get('reps'),
    notes: formData.get('notes'),
  })

  if (!validation.success) {
    return { error: 'Invalid input.', details: validation.error.flatten() }
  }

  const { workoutExerciseId, reps, notes } = validation.data

  try {
    // 1. Fetch the workout_exercise to get weight and current total_volume
    const { data: workoutExercise, error: workoutExerciseError } =
      await supabase
        .from('workout_exercises')
        .select('weight, total_volume, exercise_id, workout_session_id')
        .eq('id', workoutExerciseId)
        .eq('user_id', user.id)
        .single()

    if (workoutExerciseError || !workoutExercise) {
      return {
        error: 'Failed to fetch workout exercise details.',
        details: workoutExerciseError?.message,
      }
    }

    // Revert to original destructuring, assuming types will be correct
    const { weight, total_volume, exercise_id, workout_session_id } = workoutExercise;
    const setVolume = reps * (weight || 0)

    // 2. Determine the next set_number
    const { data: lastSet, error: lastSetError } = await supabase
      .from('exercise_sets')
      .select('set_number')
      .eq('workout_exercise_id', workoutExerciseId)
      .eq('user_id', user.id)
      .order('set_number', { ascending: false })
      .limit(1)
      .maybeSingle() // Use maybeSingle as there might be no sets yet

    if (lastSetError) {
      return {
        error: 'Failed to determine next set number.',
        details: lastSetError.message,
      }
    }

    const nextSetNumber = (lastSet?.set_number || 0) + 1

    // 3. Insert the new set
    const setWeight = workoutExercise.weight; // The weight for this specific set

    const { data: newSet, error: insertError } = await supabase
      .from('exercise_sets')
      .insert({
        workout_exercise_id: workoutExerciseId,
        user_id: user.id,
        set_number: nextSetNumber,
        reps: reps,
        weight: setWeight, // Explicitly insert the weight for the set
        notes: notes,
        // is_pr_set_for_weight will be handled later if we implement that specific PR logic
      })
      .select('id, set_number, reps, weight, notes') // Be explicit about returned fields
      .single()

    if (insertError || !newSet) {
      return {
        error: 'Failed to log new set.',
        details: insertError?.message,
      }
    }

    // 4. Update total_volume in workout_exercises
    const newTotalVolume = (total_volume || 0) + setVolume
    const { error: updateVolumeError } = await supabase
      .from('workout_exercises')
      .update({ total_volume: newTotalVolume })
      .eq('id', workoutExerciseId)
      .eq('user_id', user.id)

    if (updateVolumeError) {
      // Attempt to roll back or log this critical error
      console.error('Failed to update total_volume:', updateVolumeError)
      // Potentially delete the 'newSet' if we want transactional behavior,
      // or just report the error and let user retry / fix manually.
      // For now, we'll proceed but this is a point of attention for robustness.
      return {
        error: 'Set logged, but failed to update total volume.',
        details: updateVolumeError.message,
        newSet, // return the set even if volume update fails
      }
    }
    
    // Revalidate paths
    revalidatePath(`/workout/${workout_session_id}/log/${exercise_id}`)
    revalidatePath(`/workout/${workout_session_id}/edit`)
    // Potentially revalidate a dashboard or PR page if those exist

    // 5. Fetch updated PRs
    let newPrAtWeight: number | null = null
    try {
      const { data: prAtWeightData, error: prAtWeightError } = await supabase.rpc(
        'get_user_exercise_pr_at_weight',
        {
          p_user_id: user.id,
          p_exercise_id: exercise_id, // from workoutExercise
          p_weight: setWeight,       // weight of the current set
        },
      )
      if (prAtWeightError) {
        console.error('Error fetching PR at weight post-set log:', prAtWeightError)
        // Non-fatal, proceed
      } else {
        newPrAtWeight = typeof prAtWeightData === 'number' ? prAtWeightData : null
      }
    } catch (rpcError) {
        console.error('RPC call get_user_exercise_pr_at_weight failed:', rpcError)
    }

    let newOverallPr: number | null = null
    try {
        const { data: overallPrData, error: overallPrError } = await supabase.rpc(
            'get_user_exercise_pr_overall',
            {
            p_user_id: user.id,
            p_exercise_id: exercise_id, // from workoutExercise
            },
        )
        if (overallPrError) {
            console.error('Error fetching overall PR post-set log:', overallPrError)
            // Non-fatal, proceed
        } else {
            newOverallPr = typeof overallPrData === 'number' ? overallPrData : null
        }
    } catch (rpcError) {
        console.error('RPC call get_user_exercise_pr_overall failed:', rpcError)
    }
    

    return { data: newSet, newTotalVolume, newPrAtWeight, newOverallPr }
  } catch (e) {
    const error = e as Error
    return { error: 'An unexpected error occurred.', details: error.message }
  }
} 