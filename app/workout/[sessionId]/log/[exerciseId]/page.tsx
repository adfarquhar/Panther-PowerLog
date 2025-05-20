import { createServerComponentClient } from '@/lib/supabase/server'
// import { cookies } from 'next/headers' // Removed unused import
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { ExerciseSetLogger } from '@/app/workout/_components/ExerciseSetLogger'
import { SupabaseClient } from '@supabase/supabase-js' 
import { Database, Tables } from '@/lib/supabase/database.types' // Import Tables

interface LogExercisePageProps {
  params: Promise<{ sessionId: string; exerciseId: string }>
  searchParams: Promise<{ woExerciseId?: string }>
}

// Define the shape of a completed set for this page
type PageCompletedSetType = Pick<
  Tables<'exercise_sets'>,
  'id' | 'set_number' | 'reps' | 'weight' | 'notes'
>

// Define the successful data structure
interface LoggerDataSuccessProps {
  exerciseName: string
  workoutExerciseId: string
  initialWeight: number | null
  initialLastSetReps: number | null
  initialSetNumber: number
  initialRunningVolume: number
  initialPrAtWeight: number | null
  initialOverallPr: number | null
  exerciseId: string
  workoutSessionId: string
  allSets: PageCompletedSetType[]
}

// Define the error data structure
interface LoggerDataErrorProps {
  error: string
}

// Union type for the result of getLoggerData
type LoggerDataResult = LoggerDataSuccessProps | LoggerDataErrorProps

// Helper to fetch all necessary data for the logger
async function getLoggerData(
  supabase: SupabaseClient<Database>,
  userId: string,
  exerciseId: string, // exercises.id
  workoutExerciseId: string, // workout_exercises.id
): Promise<LoggerDataResult> { // Explicit return type
  // 1. Get the specific workout_exercise to find the weight used for this session
  const { data: workoutExercise, error: woError } = await supabase
    .from('workout_exercises')
    .select('id, weight, total_volume, exercise_id, workout_session_id, exercises (name)')
    .eq('id', workoutExerciseId)
    .eq('user_id', userId)
    .single()

  if (woError || !workoutExercise) {
    console.error('Error fetching workout_exercise:', woError)
    return { error: 'Workout exercise not found.' } // Conforms to LoggerDataErrorProps
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

  // 3.5. Get all logged sets for this workout_exercise
  const { data: allSetsData, error: allSetsError } = await supabase
    .from('exercise_sets')
    .select('id, set_number, reps, weight, notes')
    .eq('workout_exercise_id', workoutExerciseId)
    .eq('user_id', userId)
    .order('set_number', { ascending: true })

  if (allSetsError) {
    console.error('Error fetching all sets:', allSetsError)
    // Non-fatal for now, logger can still function but won't show history.
    // Ensure allSets property is an empty array in this case for type consistency.
  }
  
  const allSets: PageCompletedSetType[] = allSetsData || []


  // 4. Get PR at current weight (using the RPC function)
  const { data: prAtWeightData, error: prAtWeightError } = await supabase.rpc(
    'get_user_exercise_pr_at_weight',
    {
      p_user_id: userId,
      p_exercise_id: workoutExercise.exercise_id,
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
      p_exercise_id: workoutExercise.exercise_id,
    },
  )
  if (overallPrError) {
    console.error('Error fetching overall PR:', overallPrError)
  }

  // Conforms to LoggerDataSuccessProps
  return {
    exerciseName,
    workoutExerciseId: workoutExercise.id,
    initialWeight: workoutExercise.weight,
    initialLastSetReps: lastSet?.reps ?? null,
    initialSetNumber: (lastSet?.set_number ?? 0) + 1,
    initialRunningVolume: workoutExercise.total_volume ?? 0,
    initialPrAtWeight: typeof prAtWeightData === 'number' ? prAtWeightData : null,
    initialOverallPr: typeof overallPrData === 'number' ? overallPrData : null,
    exerciseId: workoutExercise.exercise_id,
    workoutSessionId: workoutExercise.workout_session_id,
    allSets: allSets, // This is now explicitly PageCompletedSetType[]
  }
}

export default async function LogExercisePage({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: LogExercisePageProps) {
  const params = await paramsPromise;
  const searchParams = await searchParamsPromise;

  const supabase = await createServerComponentClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { sessionId, exerciseId: routeExerciseId } = params
  const workoutExerciseId = searchParams.woExerciseId

  if (!workoutExerciseId) {
    console.error('woExerciseId missing from searchParams, cannot display log page.');
    notFound();
  }

  const loggerProps = await getLoggerData(
    supabase,
    user.id,
    routeExerciseId,
    workoutExerciseId,
  )

  // Use 'in' operator for type guarding a discriminated union
  if ('error' in loggerProps) {
    console.error('Error getting logger data:', loggerProps.error)
    notFound()
  }

  // At this point, loggerProps is narrowed to LoggerDataSuccessProps
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
        exerciseName={loggerProps.exerciseName}
        workoutExerciseId={loggerProps.workoutExerciseId}
        initialWeight={loggerProps.initialWeight}
        initialLastSetReps={loggerProps.initialLastSetReps}
        initialSetNumber={loggerProps.initialSetNumber}
        initialRunningVolume={loggerProps.initialRunningVolume}
        initialPrAtWeight={loggerProps.initialPrAtWeight}
        initialOverallPr={loggerProps.initialOverallPr}
        exerciseId={loggerProps.exerciseId}
        workoutSessionId={loggerProps.workoutSessionId}
        allSets={loggerProps.allSets} // Now loggerProps.allSets is correctly typed as PageCompletedSetType[]
      />
      <div className="mt-6 p-4 md:p-0 text-center">
        <Button asChild variant="secondary" size="lg" className="w-full md:w-auto">
          <Link href={`/workout/${sessionId}/edit`}>
            End Exercise & Return to Workout
          </Link>
        </Button>
      </div>
    </div>
  )
} 