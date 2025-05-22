import { createServerComponentClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ListBulletIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

interface PerformedExercise {
  exercise_id: string;
  exercise_name: string;
  last_performed_date: string; // Date string
}

async function getPerformedExercises(supabase: SupabaseClient<Database>, userId: string): Promise<PerformedExercise[]> {
  const { data, error } = await supabase.rpc('get_user_performed_exercises', { p_user_id: userId });
  if (error) {
    console.error('Error fetching performed exercises:', error);
    return [];
  }
  return (data as PerformedExercise[] || []);
}

export default async function HistoryPage() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const exercises = await getPerformedExercises(supabase, user.id);

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Workout History
        </h1>
        <p className="text-lg">
          Review your progress and past workout sessions.
        </p>
        <div className="mt-4">
            <Link href="/history/sessions" className="text-primary hover:underline inline-flex items-center">
                <ListBulletIcon className="w-5 h-5 mr-1.5" />
                View All Workout Sessions
            </Link>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">
          Exercise Progress
        </h2>
        {exercises.length === 0 && (
          <p>No exercises logged yet. Start a workout to see your progress here!</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercises.map((exercise) => (
            <Link key={exercise.exercise_id} href={`/history/exercise/${exercise.exercise_id}`} passHref>
              <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {exercise.exercise_name}
                    <ChartBarIcon className="w-5 h-5 text-primary" />
                  </CardTitle>
                  {exercise.last_performed_date && (
                     <CardDescription>
                        Last performed: {new Date(exercise.last_performed_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </CardDescription>
                  )}
                </CardHeader>
                {/* Optionally, add CardContent for more details like overall PR or a mini-chart sparkline if desired */}
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
} 