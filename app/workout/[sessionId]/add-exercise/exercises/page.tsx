import { getExercisesByMuscleGroup } from '@/actions/exercises';
import Link from 'next/link';
import { ChevronRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

// Interface for the resolved params object
interface ExercisePageResolvedParams {
  sessionId: string;
}

// Interface for the resolved searchParams object
interface ExercisePageResolvedSearchParams {
  muscleGroupId?: string;
}

// Type alias for the Promise-wrapped params
type ExercisePageParamsPromise = Promise<ExercisePageResolvedParams>;
// Type alias for searchParams which must also be a Promise if provided
type ExercisePageSearchParamsPromise = Promise<ExercisePageResolvedSearchParams>;

export default async function ExerciseSelectionPage({
  params: paramsPromise,
  searchParams: searchParamsPromise, // This will now be ExercisePageSearchParamsPromise | undefined
}: {
  params: ExercisePageParamsPromise;
  searchParams?: ExercisePageSearchParamsPromise; // searchParams can be optional, but if present, it's a Promise
}) {
  const params = await paramsPromise;
  // Await searchParams if the promise for it exists, otherwise searchParams will be undefined.
  const searchParams = searchParamsPromise ? await searchParamsPromise : undefined;

  const { sessionId } = params;
  // Safely access muscleGroupId, defaulting to undefined if searchParams or muscleGroupId is not present
  const muscleGroupId = searchParams?.muscleGroupId;

  if (!muscleGroupId) {
    // TODO: Handle missing muscleGroupId, maybe redirect or show an error
    // For now, log and return a placeholder
    console.error("Muscle group ID is missing from searchParams");
    return (
      <div className="p-4">
        <p>Error: Muscle Group ID is required.</p>
        <Link href={`/workout/${sessionId}/add-exercise/muscle-groups`} className="text-primary hover:underline">
          Go back to select a muscle group
        </Link>
      </div>
    );
  }

  const exerciseResult = await getExercisesByMuscleGroup(muscleGroupId);

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center">
        <Link
          href={`/workout/${sessionId}/add-exercise/muscle-groups`}
          className="mr-4 p-2 hover:bg-gray-200 rounded-full"
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </Link>
        <h1 className="text-2xl font-bold">Select Exercise</h1>
      </div>

      {exerciseResult.error && (
        <p className="text-red-500">Error loading exercises: {exerciseResult.error}</p>
      )}

      {!exerciseResult.error && exerciseResult.data && exerciseResult.data.length === 0 && (
        <p>No exercises found for this muscle group.</p>
      )}

      {!exerciseResult.error && exerciseResult.data && exerciseResult.data.length > 0 && (
        <ul className="space-y-3">
          {exerciseResult.data.map((exercise) => (
            <li key={exercise.id}>
              <Link
                href={`/workout/${sessionId}/add-exercise/log-entry?exerciseId=${exercise.id}&exerciseName=${encodeURIComponent(exercise.name)}`}
                className="flex items-center justify-between rounded-lg bg-white p-4 shadow transition-shadow hover:shadow-md"
              >
                <span className="text-lg font-medium">{exercise.name}</span>
                <ChevronRightIcon className="h-5 w-5" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 