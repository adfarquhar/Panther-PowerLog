import { createServerComponentClient } from '@/lib/supabase/server'
// import { cookies } from 'next/headers' // Removed unused import
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { notFound, redirect } from 'next/navigation'
import { Tables, Database } from '@/lib/supabase/database.types'
import { PlayIcon } from '@heroicons/react/24/outline'
import { AddExerciseToSessionDialog } from '@/app/workout/_components/AddExerciseToSessionDialog'
import { SupabaseClient } from '@supabase/supabase-js'

// Define ExerciseSelectItem here as it's used by getAvailableExercises
// Commenting out as getAvailableExercises is no longer called.
// interface ExerciseSelectItem {
//   id: string;
//   name: string;
//   muscle_groups: { name: string } | null;
// }

async function getSessionDetails(
  supabase: SupabaseClient<Database>,
  sessionId: string,
  userId: string,
) {
  const { data: session, error } = await supabase
    .from('workout_sessions')
    .select('id, name, date, notes')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single()

  if (error || !session) {
    console.error('Error fetching session:', error)
    return null
  }
  return session
}

async function getWorkoutExercises(
  supabase: SupabaseClient<Database>,
  sessionId: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from('workout_exercises')
    .select(
      'id, order_num, weight, total_volume, notes, exercises (id, name, muscle_groups (name))'
    )
    .eq('workout_session_id', sessionId)
    .eq('user_id', userId)
    .order('order_num', { ascending: true })

  if (error) {
    console.error('Error fetching workout exercises:', error)
    return []
  }
  return data as unknown as Array<
    Pick<Tables<'workout_exercises'>, 'id' | 'order_num' | 'weight' | 'total_volume' | 'notes'> &
    { exercises: Pick<Tables<'exercises'>, 'id' | 'name'> & { muscle_groups: Pick<Tables<'muscle_groups'>, 'name'> | null } }
  >
}

export default async function EditWorkoutSessionPage({
  params: paramsPromise,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const params = await paramsPromise
  const supabase = await createServerComponentClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const sessionId = params.sessionId
  const session = await getSessionDetails(supabase, sessionId, user.id)
  const workoutExercises = await getWorkoutExercises(supabase, sessionId, user.id)
  // const availableExercises = await getAvailableExercises(supabase, user.id) // Removed as it's not used

  if (!session) {
    notFound()
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {session.name || 'Workout Session'}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          {new Date(session.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
        {session.notes && (
          <p className="mt-1 text-gray-500 dark:text-gray-400">{session.notes}</p>
        )}
      </div>

      <div className="mb-6">
        <AddExerciseToSessionDialog 
            workoutSessionId={sessionId} 
            // availableExercises={availableExercises} // Removed as the prop is commented out in the Dialog component
            // userId={user.id} // Also commented out in Dialog, assuming not needed by this button
        />
      </div>

      {workoutExercises.length === 0 && (
        <div className="text-center py-10 px-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-xl font-medium text-gray-900 dark:text-white">No exercises added yet</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by adding an exercise to your session.</p>
        </div>
      )}

      {workoutExercises.length > 0 && (
        <div className="space-y-4">
          {workoutExercises.map((woExercise) => (
            <div
              key={woExercise.id}
              className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 md:p-6"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                    {woExercise.exercises.name}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {woExercise.exercises.muscle_groups?.name || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Target Weight: {woExercise.weight} lbs
                  </p>
                  {woExercise.total_volume !== null && woExercise.total_volume > 0 && (
                     <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                        Volume: {woExercise.total_volume.toFixed(1)} lbs
                    </p>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-2 sm:mt-0">
                  <Button asChild size="sm" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white">
                    <Link
                      href={`/workout/${sessionId}/log/${woExercise.exercises.id}?woExerciseId=${woExercise.id}`}
                    >
                      <PlayIcon className="w-4 h-4 mr-1.5" /> Log Sets
                    </Link>
                  </Button>
                </div>
              </div>
              {woExercise.notes && (
                 <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 italic">Session Notes: {woExercise.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}

        <div className="mt-8 flex justify-end">
            <Button variant="default" size="lg">
                Finish Workout
            </Button>
        </div>

    </div>
  )
} 