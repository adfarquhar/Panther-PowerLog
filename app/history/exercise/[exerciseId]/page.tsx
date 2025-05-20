import { createServerComponentClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { VolumeHistoryChart } from './_components/VolumeHistoryChart';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

// Define the expected shape of the data from the RPC
interface ExerciseVolumeHistoryPoint {
  workout_date: string; // Date string
  total_volume: number;
}

async function getExerciseDetails(supabase: SupabaseClient<Database>, exerciseId: string, userId: string) {
  const { data, error } = await supabase
    .from('exercises')
    .select('name')
    .eq('id', exerciseId)
    .eq('user_id', userId) // Or remove if exercises are public/shared
    .single();

  if (error || !data) {
    console.error('Error fetching exercise details:', error);
    return null;
  }
  return data;
}

async function getExerciseVolumeData(
    supabase: SupabaseClient<Database>,
    exerciseId: string,
    userId: string
): Promise<ExerciseVolumeHistoryPoint[]> {
    const { data, error } = await supabase.rpc('get_exercise_volume_history', {
        p_user_id: userId,
        p_exercise_id: exerciseId,
    });

    if (error) {
        console.error('Error fetching exercise volume history:', error);
        // Return empty array or throw error depending on how you want to handle
        return [];
    }
    return (data as ExerciseVolumeHistoryPoint[] || []);
}

export default async function ExerciseHistoryPage({
  params: paramsPromise,
}: {
  params: Promise<{ exerciseId: string }>
}) {
  const { exerciseId } = await paramsPromise;
  const supabase = await createServerComponentClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const exerciseDetails = await getExerciseDetails(supabase, exerciseId, user.id);
  if (!exerciseDetails) {
    notFound(); // Or some other error handling
  }

  const volumeHistoryData = await getExerciseVolumeData(supabase, exerciseId, user.id);

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <div className="mb-6">
        <Link href="/history" className="inline-flex items-center text-sm text-primary hover:underline mb-4">
            <ArrowLeftIcon className="w-4 h-4 mr-1.5" />
            Back to History
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Progress for {exerciseDetails.name}
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 md:p-6">
        <VolumeHistoryChart data={volumeHistoryData} exerciseName={exerciseDetails.name} />
      </div>
      
      {/* TODO: Add a section for detailed logs for this exercise below the chart */}
      {/* For example, a table of all sets, reps, weight, notes for this exercise across sessions */}
    </div>
  );
} 