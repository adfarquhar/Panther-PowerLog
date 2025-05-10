'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PlusCircleIcon } from '@heroicons/react/24/outline'

// Keep availableExercises for now, might be useful for the subsequent pages
// Or it can be fetched on the respective pages.
// For now, simplifying by removing it from this specific button component's direct props if not used.

interface AddExerciseButtonProps {
  workoutSessionId: string
  // availableExercises: ExerciseSelectItem[] // Potentially remove if not directly used by this button
  // userId: string // Potentially remove if not directly used by this button
}

// Renaming the component to reflect its new purpose is a good idea,
// but for this step, I'll modify it in place.
// Consider renaming to e.g., NavigateToAddExerciseButton
export function AddExerciseToSessionDialog({
  workoutSessionId,
}: AddExerciseButtonProps) {
  const router = useRouter() // Initialize router

  const handleNavigate = () => {
    router.push(`/workout/${workoutSessionId}/add-exercise/muscle-groups`)
  }

  return (
    // The button no longer triggers a dialog directly
    <Button className="w-full md:w-auto" onClick={handleNavigate}>
      <PlusCircleIcon className="w-5 h-5 mr-2" />
      Add Exercise to Session
    </Button>
  )
} 