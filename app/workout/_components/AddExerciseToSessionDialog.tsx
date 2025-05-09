'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { addExerciseToSession } from '@/actions/workout-exercises'
import { Tables } from '@/lib/supabase/database.types'
import { PlusCircleIcon } from '@heroicons/react/24/outline'

// Define the structure for exercises passed as props
export type ExerciseSelectItem = Pick<Tables<'exercises'>, 'id' | 'name'> & {
  muscle_groups: Pick<Tables<'muscle_groups'>, 'name'> | null
}

interface AddExerciseToSessionDialogProps {
  workoutSessionId: string
  availableExercises: ExerciseSelectItem[]
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  userId: string // For future use: filtering exercises (e.g. user-specific global selection)
}

export function AddExerciseToSessionDialog({
  workoutSessionId,
  availableExercises,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  userId, // This prop is currently unused but kept for future functionality
}: AddExerciseToSessionDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('')
  const [weight, setWeight] = useState<string>('')

  const handleSubmit = async (formData: FormData) => {
    if (!selectedExerciseId) {
      toast.error('Please select an exercise.')
      return
    }
    if (!weight) {
        toast.error('Please enter a weight.')
        return
    }

    formData.set('exerciseId', selectedExerciseId)
    // workoutSessionId and weight are already on formData via hidden input and controlled input

    startTransition(async () => {
      // The return type of addExerciseToSession is Promise<{ data: NewWorkoutExerciseType } | { error: ... }>
      // where NewWorkoutExerciseType includes `exercises: { name: string | null, ... } | null`
      const result = await addExerciseToSession(formData)

      if (result?.error) {
        toast.error(result.error, {
          description: result.details?.toString(),
        })
      } else if (result?.data) {
        // result.data.exercises might be null if the join failed or no exercise was found, 
        // though the action implies `exercises` is part of the select on `newWorkoutExercise`.
        // The select is `exercises ( name, muscle_groups ( name ) )` on the `workout_exercises` table, joined from `exercise_id`.
        // This means `result.data` (which is a workout_exercise row) will have an `exercises` field.
        const exerciseName = result.data.exercises?.name || 'Exercise' 
        toast.success(
          `Added ${exerciseName} to session!`,
        )
        setSelectedExerciseId('')
        setWeight('')
        setIsOpen(false) // Close dialog on success
      } else {
        toast.error('An unexpected error occurred. Please try again.')
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full md:w-auto">
          <PlusCircleIcon className="w-5 h-5 mr-2" />
          Add Exercise to Session
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Exercise to Session</DialogTitle>
          <DialogDescription>
            Select an exercise and specify the weight you&apos;ll be using for this
            session.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <input
            type="hidden"
            name="workoutSessionId"
            value={workoutSessionId}
          />
          <div>
            <Label htmlFor="exerciseId">Exercise</Label>
            <Select
              name="exerciseId" // This won't directly be used by FormData if onValueChange is how we get it
              value={selectedExerciseId}
              onValueChange={setSelectedExerciseId}
              required
            >
              <SelectTrigger id="exerciseId" className="w-full mt-1">
                <SelectValue placeholder="Select an exercise" />
              </SelectTrigger>
              <SelectContent>
                {availableExercises.map((exercise) => (
                  <SelectItem key={exercise.id} value={exercise.id}>
                    {exercise.name}{exercise.muscle_groups?.name ? ` (${exercise.muscle_groups.name})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
              id="weight"
              name="weight"
              type="number"
              inputMode="decimal" // For mobile numeric keyboard with decimal
              placeholder="Enter weight (e.g., 22.5)"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="mt-1"
              required
              min="0"
              step="any" // Allow decimals
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !selectedExerciseId || !weight}>
              {isPending ? 'Adding...' : 'Add Exercise'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 