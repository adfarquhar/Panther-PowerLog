'use server';

import { createServerComponentClient } from '@/lib/supabase/server';
import { unstable_noStore as noStore } from 'next/cache';

export async function getExercisesByMuscleGroup(muscleGroupId: string) {
  noStore();
  const supabase = await createServerComponentClient();

  if (!muscleGroupId) {
    return { error: 'Muscle group ID is required.', data: [] };
  }

  const { data, error } = await supabase
    .from('exercises')
    .select('id, name, muscle_group_id') // Assuming you have a muscle_group_id foreign key
    .eq('muscle_group_id', muscleGroupId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching exercises by muscle group:', error);
    return { error: 'Failed to load exercises.', details: error.message, data: [] };
  }

  return { data: data || [], error: null };
}

// We might also need a function to get a single exercise's details later
export async function getExerciseById(exerciseId: string) {
  noStore();
  const supabase = await createServerComponentClient();

  if (!exerciseId) {
    return { error: 'Exercise ID is required.', data: null };
  }

  const { data, error } = await supabase
    .from('exercises')
    .select('*') // Select all details for the chosen exercise
    .eq('id', exerciseId)
    .single();

  if (error) {
    console.error('Error fetching exercise by ID:', error);
    return { error: 'Failed to load exercise details.', details: error.message, data: null };
  }
  return { data, error: null };
} 