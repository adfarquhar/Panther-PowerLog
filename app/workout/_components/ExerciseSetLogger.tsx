'use client'

import { useEffect, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { logExerciseSet } from '@/actions/exercise-sets' // Import the server action
import { Tables } from '@/lib/supabase/database.types' // Used for CompletedSetType
// import { InformationCircleIcon } from '@heroicons/react/24/outline' // Unused

// Define a more specific type for a completed set for clarity in the component
type CompletedSetType = Pick<
  Tables<'exercise_sets'>,
  'id' | 'set_number' | 'reps' | 'weight' | 'notes'
>

interface ExerciseSetLoggerProps {
  exerciseName: string
  workoutExerciseId: string // This is workout_exercises.id
  initialWeight: number | null // Weight for this exercise in this session
  initialLastSetReps: number | null
  initialSetNumber: number // Next set number to log
  initialRunningVolume: number
  initialPrAtWeight: number | null
  initialOverallPr: number | null
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  exerciseId: string // For future use: re-fetching PRs
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  workoutSessionId: string // For future use: navigation/re-fetching PRs
  allSets: CompletedSetType[] // Add allSets prop
}

export function ExerciseSetLogger({
  exerciseName,
  workoutExerciseId,
  initialWeight,
  initialLastSetReps,
  initialSetNumber,
  initialRunningVolume,
  initialPrAtWeight,
  initialOverallPr,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  exerciseId, // Prop is currently unused but kept for future PR re-fetching logic
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  workoutSessionId, // Prop is currently unused but kept for future PR re-fetching/navigation
  allSets: initialAllSets, // Receive allSets prop
}: ExerciseSetLoggerProps) {
  const [isPending, startTransition] = useTransition()
  const [reps, setReps] = useState<string>('')
  const [notes, setNotes] = useState<string>('')

  // UI display states, updated after successful submission or from initial props
  const [currentSetNumber, setCurrentSetNumber] = useState(initialSetNumber)
  const [lastSetRepsDisplay, setLastSetRepsDisplay] = useState<number | null>(
    initialLastSetReps,
  )
  const [runningVolumeDisplay, setRunningVolumeDisplay] = useState(
    initialRunningVolume,
  )
  const [prAtWeightDisplay, setPrAtWeightDisplay] = useState(initialPrAtWeight)
  const [overallPrDisplay, setOverallPrDisplay] = useState(initialOverallPr)

  const [completedSets, setCompletedSets] = useState<CompletedSetType[]>(initialAllSets)

  // Reset reps and notes when the workoutExerciseId changes (e.g. user navigates to log a different exercise)
  // or when currentSetNumber changes, so the input is fresh for the new set.
  useEffect(() => {
    setReps('')
    setNotes('')
  }, [workoutExerciseId, currentSetNumber])

  const weight = initialWeight ?? 0 // Default to 0 if null, though it should ideally always be set

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      const result = await logExerciseSet(formData)

      if (result?.error) {
        toast.error(result.error, {
          description: result.details?.toString() || 'Please try again.',
        })
      } else if (result?.data) {
        const loggedSet = result.data
        toast.success(
          `Set ${loggedSet.set_number} logged: ${loggedSet.reps} reps!`,
        )
        setCurrentSetNumber(loggedSet.set_number + 1)
        setLastSetRepsDisplay(loggedSet.reps)
        if (result.newTotalVolume !== undefined) {
            setRunningVolumeDisplay(result.newTotalVolume)
        }
        
        const newSet: CompletedSetType = {
            id: loggedSet.id, 
            set_number: loggedSet.set_number,
            reps: loggedSet.reps,
            weight: loggedSet.weight, 
            notes: loggedSet.notes || null, 
        };
        setCompletedSets(prevSets => [...prevSets, newSet]);
        
        // Handle PRs
        if (result.newPrAtWeight !== undefined) {
          if (result.newPrAtWeight !== null && result.newPrAtWeight === loggedSet.reps && loggedSet.weight === weight) {
            // Check if this set *is* the new PR for this weight
            // This condition might need refinement based on how get_user_exercise_pr_at_weight defines a PR.
            // Assuming it returns max reps, and we logged a set that matches these max reps at this weight.
             if (initialPrAtWeight === null || loggedSet.reps > initialPrAtWeight) {
                 toast.success(`🎉 New PR at ${loggedSet.weight}lbs: ${loggedSet.reps} reps!`);
             }
          }
          setPrAtWeightDisplay(result.newPrAtWeight)
        }

        if (result.newOverallPr !== undefined) {
          // The definition of "overall PR" needs to be clear.
          // Assuming get_user_exercise_pr_overall returns the highest weight lifted for any reps.
          // And that newOverallPr holds this value.
          // If the current set's weight is part of this new overall PR.
          // This is a simplified check; a more robust check would compare against the previous overallPrDisplay
          if (result.newOverallPr !== null && loggedSet.weight === result.newOverallPr ) {
             if (initialOverallPr === null || loggedSet.weight > initialOverallPr) {
                toast.success(`🏆 New Overall PR: ${loggedSet.weight}lbs!`);
             }
          }
          // Or, if overall PR is max volume (weight * reps)
          // const currentSetVolume = loggedSet.reps * loggedSet.weight;
          // if (result.newOverallPr !== null && currentSetVolume === result.newOverallPr) {
          //    if (initialOverallPr === null || currentSetVolume > initialOverallPr) {
          //      toast.success(`🏆 New Overall PR Volume: ${currentSetVolume} lbs-reps!`);
          //    }
          // }
          setOverallPrDisplay(result.newOverallPr)
        }

        setReps('') 
        setNotes('') 
      } else {
        toast.error('An unexpected error occurred. Please try again.')
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6 p-4 md:p-6">
      <input type="hidden" name="workoutExerciseId" value={workoutExerciseId} />

      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          {exerciseName}
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          Weight: {weight} {weight !== 0 ? 'lbs' : '(Bodyweight)'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-center">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Set #
          </p>
          <p className="text-3xl font-semibold text-gray-900 dark:text-white">
            {currentSetNumber}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Last Set
          </p>
          <p className="text-3xl font-semibold text-gray-900 dark:text-white">
            {lastSetRepsDisplay === null ? '-' : `${lastSetRepsDisplay} reps`}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="reps" className="text-lg font-medium">
            Reps
          </Label>
          <Input
            id="reps"
            name="reps"
            type="number"
            inputMode="numeric" // For mobile numeric keyboard
            placeholder="Enter reps"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            className="mt-1 h-16 text-3xl text-center" // Larger input
            required
            min="0"
          />
        </div>
        <div>
          <Label htmlFor="notes" className="text-lg font-medium">
            Notes (Optional)
          </Label>
          <Textarea
            id="notes"
            name="notes"
            placeholder="e.g., felt strong, slight form breakdown"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 min-h-[80px] text-lg" // Larger textarea
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-16 text-2xl font-semibold"
        disabled={isPending || !reps}
      >
        {isPending ? 'Logging...' : 'Log Set'}
      </Button>

      {/* Display Completed Sets */}
      {completedSets.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-center mb-4 text-gray-800 dark:text-gray-100">
            Completed Sets
          </h3>
          <ul className="space-y-3">
            {completedSets.map((set) => (
              <li
                key={set.id}
                className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm"
              >
                <div className="flex items-center mb-2 sm:mb-0">
                  <span className="font-semibold text-gray-700 dark:text-gray-200 mr-3">
                    Set {set.set_number}:
                  </span>
                  <span className="text-lg text-gray-900 dark:text-white">
                    {set.reps} reps @ {set.weight} lbs
                  </span>
                </div>
                {set.notes && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 sm:ml-4 italic">
                    Notes: {set.notes}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 space-y-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-semibold text-center text-gray-800 dark:text-gray-100">
          Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Running Volume
            </p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {runningVolumeDisplay.toFixed(1)} lbs
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              PR at {weight} lbs
            </p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {prAtWeightDisplay === null ? '-' : `${prAtWeightDisplay} reps`}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Overall PR
            </p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {overallPrDisplay === null ? '-' : `${overallPrDisplay} lbs`}
            </p>
          </div>
        </div>
        {/* TODO: Add PR celebration visuals here if a new PR is hit */}
      </div>
    </form>
  )
} 