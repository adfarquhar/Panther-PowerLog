import { createServerComponentClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

interface SetData {
  set_id: string;
  set_number: number;
  reps: number;
  weight: number;
  notes?: string | null;
}

interface ExerciseInSessionData {
  workout_exercise_id: string;
  exercise_id: string;
  exercise_name: string;
  exercise_weight: number; // Target weight for the exercise in this session
  exercise_notes?: string | null; // Notes for the exercise in this session
  sets: SetData[];
}

interface SessionDetailsData {
  session_id: string;
  session_name?: string | null;
  session_date: string; // Timestamp string
  session_notes?: string | null;
  exercises: ExerciseInSessionData[];
}

async function getSessionDetails( 
  supabase: SupabaseClient<Database>,
  sessionId: string, 
  userId: string
): Promise<SessionDetailsData | null> {
  const { data, error } = await supabase.rpc<SessionDetailsData>('get_session_details_with_exercises', {
    p_session_id: sessionId,
    p_user_id: userId,
  });

  if (error || !data) {
    console.error('Error fetching session details:', error?.message);
    return null;
  }
  // The RPC is expected to return a single JSONB object matching SessionDetailsData.
  // By providing the generic <SessionDetailsData> to the rpc call,
  // 'data' is now correctly typed as SessionDetailsData | null.
  // The 'if (!data)' check above ensures 'data' is not null here.
  return data;
}

export default async function SessionDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await paramsPromise;
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const sessionDetails = await getSessionDetails(supabase, sessionId, user.id);

  if (!sessionDetails) {
    notFound();
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-3xl">
      <div className="mb-6">
        <Link href="/history/sessions" className="inline-flex items-center text-sm text-primary hover:underline mb-4">
          <ArrowLeftIcon className="w-4 h-4 mr-1.5" />
          Back to All Sessions
        </Link>
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {sessionDetails.session_name || 'Workout Session'}
            </h1>
            <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
                <CalendarDaysIcon className="w-4 h-4 mr-1.5" />
                {new Date(sessionDetails.session_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                })}
            </div>
            {sessionDetails.session_notes && (
                <p className="mt-3 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{sessionDetails.session_notes}</p>
            )}
        </div>
      </div>

      {sessionDetails.exercises.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400 py-8">No exercises were logged in this session.</p>
      )}

      <div className="space-y-6">
        {sessionDetails.exercises.map((exercise) => (
          <div key={exercise.workout_exercise_id} className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
            <div className="p-4 md:p-5 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{exercise.exercise_name}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Target Weight for session: {exercise.exercise_weight} lbs</p>
              {exercise.exercise_notes && (
                <p className="mt-1 text-xs italic text-gray-500 dark:text-gray-400">Session notes for exercise: {exercise.exercise_notes}</p>
              )}
            </div>
            {exercise.sets.length > 0 ? (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {exercise.sets.map((set) => (
                  <li key={set.set_id} className="p-4 md:p-5 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                    <div className="flex justify-between items-center">
                      <div className="font-medium text-gray-800 dark:text-gray-100">
                        Set {set.set_number}: <span className="font-normal text-gray-700 dark:text-gray-200">{set.reps} reps @ {set.weight} lbs</span>
                      </div>
                      {/* You could add PR indicators here if the RPC provided that info for each set */}
                    </div>
                    {set.notes && (
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 italic">Notes: {set.notes}</p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-4 text-sm text-gray-500 dark:text-gray-400">No sets logged for this exercise.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 