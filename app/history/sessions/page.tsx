import { createServerComponentClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ArrowLeftIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

interface WorkoutSessionSummary {
  session_id: string;
  session_name: string;
  session_date: string; // Timestamp string
  total_exercises: number;
  total_sets: number;
}

async function getWorkoutSessions(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<WorkoutSessionSummary[]> {
  const { data, error } = await supabase.rpc('get_user_workout_sessions', { p_user_id: userId });
  if (error) {
    console.error('Error fetching workout sessions:', error);
    return [];
  }
  return (data as WorkoutSessionSummary[] || []);
}

export default async function WorkoutSessionsHistoryPage() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const sessions = await getWorkoutSessions(supabase, user.id);

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <div className="mb-8">
        <Link href="/history" className="inline-flex items-center text-sm text-primary hover:underline mb-4">
            <ArrowLeftIcon className="w-4 h-4 mr-1.5" />
            Back to Main History
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          All Workout Sessions
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Browse your past workout sessions.
        </p>
      </div>

      {sessions.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400">No workout sessions found. Start a new workout!</p>
      )}
      <div className="space-y-4">
        {sessions.map((session) => (
          // TODO: Link to a detailed session page e.g., /history/sessions/${session.session_id}
          <Card key={session.session_id} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {session.session_name || 'Unnamed Session'}
                {/* Optional: Add an icon or button to view details */}
              </CardTitle>
              <CardDescription className="flex items-center mt-1">
                <CalendarDaysIcon className="w-4 h-4 mr-1.5 text-gray-500 dark:text-gray-400" />
                {new Date(session.session_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </CardDescription>
            </CardHeader>
            <CardContent> {/* Using CardContent for the details below header */}
                <p className="text-sm text-gray-600 dark:text-gray-300">Exercises: {session.total_exercises}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Total Sets: {session.total_sets}</p>
                 {/* Consider adding a button here to navigate to the session detail page */}
                 <Link href={`/history/sessions/${session.session_id}`} className="mt-3 inline-block text-sm text-primary hover:underline">
                    View Details
                 </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 