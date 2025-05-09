'use server'

import { z } from 'zod'
import { createServerActionClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

const AddExerciseToSessionSchema = z.object({
  workoutSessionId: z.string().uuid(),
  exerciseId: z.string().uuid(),
  weight: z.coerce.number().min(0), // Weight must be non-negative
})

export async function addExerciseToSession(formData: FormData) {
  const cookieStore = cookies()
  const supabase = await createServerActionClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be logged in to add an exercise.' }
  }

  const validation = AddExerciseToSessionSchema.safeParse({
    workoutSessionId: formData.get('workoutSessionId'),
    exerciseId: formData.get('exerciseId'),
    weight: formData.get('weight'),
  })

  if (!validation.success) {
    return { error: 'Invalid input.', details: validation.error.flatten() }
  }

  const { workoutSessionId, exerciseId, weight } = validation.data

  try {
    // 1. Determine the next order_num for this session
    const { data: lastExerciseInSession, error: lastExerciseError } =
      await supabase
        .from('workout_exercises')
        .select('order_num')
        .eq('workout_session_id', workoutSessionId)
        .eq('user_id', user.id)
        .order('order_num', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (lastExerciseError) {
      return {
        error: 'Failed to determine exercise order.',
        details: lastExerciseError.message,
      }
    }
    const nextOrderNum = (lastExerciseInSession?.order_num || 0) + 1

    // 2. Insert the new workout_exercise
    const { data: newWorkoutExercise, error: insertError } = await supabase
      .from('workout_exercises')
      .insert({
        workout_session_id: workoutSessionId,
        exercise_id: exerciseId,
        user_id: user.id,
        weight: weight,
        order_num: nextOrderNum,
        total_volume: 0,
      })
      .select(
        'id, exercise_id, weight, order_num, exercises ( name, muscle_groups ( name ) )'
      )
      .single()

    if (insertError || !newWorkoutExercise) {
      if (insertError?.code === '23505') { // Unique constraint violation
        return { error: 'This exercise (or its order) might already exist in the session.' }
      }
      return {
        error: 'Failed to add exercise to session.',
        details: insertError?.message,
      }
    }

    // Revalidate the session edit page
    revalidatePath(`/workout/${workoutSessionId}/edit`)

    return { data: newWorkoutExercise }
  } catch (e) {
    const error = e as Error
    return { error: 'An unexpected error occurred.', details: error.message }
  }
} 