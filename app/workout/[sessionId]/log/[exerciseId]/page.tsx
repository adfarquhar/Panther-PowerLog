import { createServerComponentClient } from '@/lib/supabase/server'
// import { cookies } from 'next/headers' // Removed unused import
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { ExerciseSetLogger } from '@/app/workout/_components/ExerciseSetLogger'
import { SupabaseClient } from '@supabase/supabase-js' // Import SupabaseClient
import { Database } from '@/lib/supabase/database.types' // Import Database

interface LogExercisePageProps {
  params: Promise<{ sessionId: string; exerciseId: string }>
  searchParams: Promise<{ woExerciseId?: string }>
}

// Helper to fetch all necessary data for the logger
async function getLoggerData(
  supabase: SupabaseClient<Database>, // Changed type to SupabaseClient<Database>
  userId: string,
  exerciseId: string, // exercises.id
  workoutExerciseId: string, // workout_exercises.id
) {
  // 1. Get the specific workout_exercise to find the weight used for this session
  const { data: workoutExercise, error: woError } = await supabase
    .from('workout_exercises')
    .select('id, weight, total_volume, exercise_id, workout_session_id, exercises (name)') // Added exercise_id, workout_session_id
    .eq('id', workoutExerciseId)
    .eq('user_id', userId)
    .single()

  if (woError || !workoutExercise) {
    console.error('Error fetching workout_exercise:', woError)
    return { error: 'Workout exercise not found.' }
  }

  // 2. Get the exercise name (already fetched via join)
  const exerciseName = workoutExercise.exercises?.name || 'Exercise'

  // 3. Get the last logged set for this workout_exercise
  const { data: lastSet, error: lastSetError } = await supabase
    .from('exercise_sets')
    .select('reps, set_number')
    .eq('workout_exercise_id', workoutExerciseId)
    .eq('user_id', userId)
    .order('set_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (lastSetError) {
    console.error('Error fetching last set:', lastSetError)
    // Non-fatal, proceed with null/default values
  }

  // 4. Get PR at current weight (using the RPC function)
  const { data: prAtWeightData, error: prAtWeightError } = await supabase.rpc(
    'get_user_exercise_pr_at_weight',
    {
      p_user_id: userId,
      p_exercise_id: workoutExercise.exercise_id, // Use exercise_id from workoutExercise
      p_weight: workoutExercise.weight,
    },
  )
  if (prAtWeightError) {
    console.error('Error fetching PR at weight:', prAtWeightError)
  }

  // 5. Get overall PR for the exercise (using the RPC function)
  const { data: overallPrData, error: overallPrError } = await supabase.rpc(
    'get_user_exercise_pr_overall',
    {
      p_user_id: userId,
      p_exercise_id: workoutExercise.exercise_id, // Use exercise_id from workoutExercise
    },
  )
  if (overallPrError) {
    console.error('Error fetching overall PR:', overallPrError)
  }

  return {
    exerciseName,
    workoutExerciseId: workoutExercise.id,
    initialWeight: workoutExercise.weight,
    initialLastSetReps: lastSet?.reps ?? null,
    initialSetNumber: (lastSet?.set_number ?? 0) + 1,
    initialRunningVolume: workoutExercise.total_volume ?? 0,
    initialPrAtWeight: typeof prAtWeightData === 'number' ? prAtWeightData : null, // RPC returns number or null
    initialOverallPr: typeof overallPrData === 'number' ? overallPrData : null, // RPC returns number or null
    exerciseId: workoutExercise.exercise_id, // Pass through for potential re-fetch
    workoutSessionId: workoutExercise.workout_session_id, // Pass through for navigation/re-fetch
  }
}

export default async function LogExercisePage({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: LogExercisePageProps) {
  const params = await paramsPromise;
  const searchParams = await searchParamsPromise;

  // const cookieStore = cookies() // Removed as createServerComponentClient handles it
  const supabase = await createServerComponentClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login') // Or your actual login page
  }

  const { sessionId, exerciseId: routeExerciseId } = params
  const workoutExerciseId = searchParams.woExerciseId

  if (!workoutExerciseId) {
    // This toast call on the server won't be visible if notFound() is called immediately after.
    // Consider redirecting to an error page or the previous page with a query param for the client to show a toast.
    // For now, console.error is the most reliable server-side feedback here.
    console.error('woExerciseId missing from searchParams, cannot display log page.');
    notFound();
  }

  const loggerProps = await getLoggerData(
    supabase,
    user.id,
    routeExerciseId, // This is the exercise.id from the route
    workoutExerciseId, // This is workout_exercises.id from searchParam
  )

  if (loggerProps.error) {
    // Handle error, e.g., show a not found page or an error message
    // For now, just using notFound(), but a more user-friendly approach is needed.
    console.error('Error getting logger data:', loggerProps.error)
    notFound()
  }

  return (
    <div className="container mx-auto p-0 md:p-6 max-w-xl">
       <div className="p-4 md:p-0 mb-4">
        <Button asChild variant="outline" className="mb-4">
          <Link href={`/workout/${sessionId}/edit`}>
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Workout
          </Link>
        </Button>
      </div>
      <ExerciseSetLogger
        exerciseName={loggerProps.exerciseName!}
        workoutExerciseId={loggerProps.workoutExerciseId!}
        initialWeight={loggerProps.initialWeight ?? null}
        initialLastSetReps={loggerProps.initialLastSetReps ?? null}
        initialSetNumber={loggerProps.initialSetNumber!}
        initialRunningVolume={loggerProps.initialRunningVolume!}
        initialPrAtWeight={loggerProps.initialPrAtWeight ?? null}
        initialOverallPr={loggerProps.initialOverallPr ?? null}
        exerciseId={loggerProps.exerciseId!}
        workoutSessionId={loggerProps.workoutSessionId!}
      />
    </div>
  )
} 