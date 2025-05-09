'use client'

import { useEffect, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { logExerciseSet } from '@/actions/exercise-sets' // Import the server action
// import { Tables } from '@/lib/supabase/database.types' // Unused
// import { InformationCircleIcon } from '@heroicons/react/24/outline' // Unused

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [prAtWeightDisplay, setPrAtWeightDisplay_unused] = useState(initialPrAtWeight) // To be used later
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [overallPrDisplay, setOverallPrDisplay_unused] = useState(initialOverallPr) // To be used later

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
        toast.success(
          `Set ${result.data.set_number} logged: ${result.data.reps} reps!`,
        )
        // Update UI state based on the successful submission
        setCurrentSetNumber(result.data.set_number + 1)
        setLastSetRepsDisplay(result.data.reps)
        if (result.newTotalVolume !== undefined) {
            setRunningVolumeDisplay(result.newTotalVolume)
        }
        
        // TODO: Re-fetch PRs to see if they changed
        // Example using currently passed (but unused) props:
        // const newPrs = await getRefreshedPRs(exerciseId, userIdFromAuth, weight)
        // setPrAtWeightDisplay_unused(newPrs.prAtWeight)
        // setOverallPrDisplay_unused(newPrs.overallPr)

        // Clear form for next set
        setReps('') // Already handled by useEffect on currentSetNumber change
        setNotes('') // Already handled by useEffect on currentSetNumber change
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
          Weight: {weight} {weight !== 0 ? 'kg' : '(Bodyweight)'}
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
              {runningVolumeDisplay.toFixed(1)} kg
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              PR at {weight} kg
            </p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {prAtWeightDisplay === null ? '-' : `${prAtWeightDisplay} kg`}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Overall Exercise PR
            </p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {overallPrDisplay === null ? '-' : `${overallPrDisplay} kg`}
            </p>
          </div>
        </div>
        {/* TODO: Add PR celebration visuals here if a new PR is hit */}
      </div>
    </form>
  )
} 