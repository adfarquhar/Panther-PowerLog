'use server';

import { createServerComponentClient } from '@/lib/supabase/server';
import { unstable_noStore as noStore } from 'next/cache';

export async function getMuscleGroups() {
  noStore(); // Opt out of caching for dynamic data
  const supabase = await createServerComponentClient();

  const { data, error } = await supabase
    .from('muscle_groups')
    .select('id, name')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching muscle groups:', error);
    // Consider throwing the error or returning a more specific error object
    return { error: 'Failed to load muscle groups.', details: error.message, data: [] };
  }

  return { data: data || [], error: null };
} 