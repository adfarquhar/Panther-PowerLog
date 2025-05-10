'use client';

import { useState, useEffect, useTransition } from 'react';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { getExerciseById } from '@/actions/exercises';
import { addExerciseToSession } from '@/actions/workout-exercises'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import type { Tables } from '@/lib/supabase/database.types';
import Link from 'next/link';

// Define interfaces for the resolved params and searchParams
interface LogEntryPageResolvedParams {
  sessionId: string;
}

interface LogEntryPageResolvedSearchParams {
  exerciseId?: string;
}

export default function LogEntryPage({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: {
  params: Promise<LogEntryPageResolvedParams>; // Expecting a Promise
  searchParams: Promise<LogEntryPageResolvedSearchParams>; // Expecting a Promise
}) {
  // Unwrap the promises using React.use()
  const params = React.use(paramsPromise);
  const searchParams = React.use(searchParamsPromise);

  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { sessionId } = params;
  const { exerciseId } = searchParams;

  const [exercise, setExercise] = useState<Tables<"exercises"> | null>(null);
  const [weight, setWeight] = useState('');
  const [isLoadingExercise, setIsLoadingExercise] = useState(true);

  useEffect(() => {
    if (exerciseId) {
      setIsLoadingExercise(true);
      getExerciseById(exerciseId)
        .then((result) => {
          if (result.error || !result.data) {
            toast.error(result.error || 'Failed to load exercise details.');
            // Consider redirecting back or showing a more persistent error
            router.push(`/workout/${sessionId}/add-exercise/exercises?muscleGroupId=${exercise?.muscle_group_id || ''}`);
          } else {
            setExercise(result.data);
          }
        })
        .finally(() => setIsLoadingExercise(false));
    } else {
      toast.error('Exercise ID not provided.');
      router.push(`/workout/${sessionId}/add-exercise/muscle-groups`);
    }
  }, [exerciseId, sessionId, router, exercise?.muscle_group_id]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!exerciseId || !weight) {
      toast.error('Please enter a weight.');
      return;
    }

    const formData = new FormData();
    formData.append('workoutSessionId', sessionId);
    formData.append('exerciseId', exerciseId);
    formData.append('weight', weight);

    startTransition(async () => {
      const result = await addExerciseToSession(formData);
      if (result?.error) {
        let descriptionString: string | undefined;
        if (result.details) {
          if (typeof result.details === 'string') {
            descriptionString = result.details;
          } else if (typeof result.details === 'object' && result.details !== null) {
            // For Zod errors, fieldErrors might be useful
            // For now, a generic message or JSON.stringify for debugging
            descriptionString = JSON.stringify(result.details); // Or a more user-friendly summary
          }
        }
        toast.error(result.error, {
          description: descriptionString,
        });
      } else if (result?.data) {
        toast.success(`Started ${exercise?.name || 'exercise'} with ${weight}kg.`);
        // The result.data.id is the workout_exercise_id
        router.push(`/workout/${sessionId}/log/${result.data.id}`);
      } else {
        toast.error('An unexpected error occurred.');
      }
    });
  };
  
  const exerciseName = exercise?.name || 'Loading exercise...';
  const muscleGroupId = exercise?.muscle_group_id;
  const backToExercisesLink = `/workout/${sessionId}/add-exercise/exercises?muscleGroupId=${muscleGroupId || ''}`;

  if (isLoadingExercise) {
     return (
      <div className="container mx-auto py-8 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-var(--header-height))]">
        <p>Loading exercise details...</p>
        {/* You can add a spinner here */}
      </div>
    );
  }

  if (!exerciseId || !exercise) {
    // This case should ideally be handled by the useEffect redirect, but as a fallback:
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-red-500">Exercise not found or ID missing.</p>
        <Link href={`/workout/${sessionId}/add-exercise/muscle-groups`} className="text-primary hover:underline mt-4">
          Choose another exercise
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6 flex items-center">
        <Link 
          href={backToExercisesLink}
          className="mr-4 p-2 rounded-md hover:bg-muted active:bg-muted-foreground/20 -ml-2"
          aria-label="Back to exercises"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold truncate" title={exerciseName}>{exerciseName}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
        <div>
          <Label htmlFor="weight" className="text-lg">Initial Weight (kg)</Label>
          <Input
            id="weight"
            name="weight"
            type="number"
            inputMode="decimal"
            placeholder="e.g., 22.5"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="mt-2 text-xl p-4"
            required
            min="0"
            step="any"
            autoFocus
          />
        </div>

        <Button type="submit" className="w-full text-lg py-6" disabled={isPending || !weight}>
          {isPending ? 'Starting...' : `Start ${exercise?.name || 'Exercise'}`}
        </Button>
      </form>
    </div>
  );
} 