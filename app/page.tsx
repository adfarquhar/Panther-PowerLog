'use client';

import { createNewWorkoutSession } from "@/actions/workout-sessions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useTransition } from "react";

export default function HomePage() {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      toast.loading('Starting new workout...');
      try {
        const result = await createNewWorkoutSession(formData);
        // Dismiss the loading toast regardless of the outcome before showing a new one
        toast.dismiss();

        if (result?.error) {
          toast.error(result.error);
          // For debugging, you could log fieldErrors if they exist:
          // if (result.fieldErrors) console.log("Field errors:", result.fieldErrors);
        }
        // No explicit success toast here as the action handles redirection.
      } catch (e) {
        // Catch errors if createNewWorkoutSession itself throws (unlikely for this action)
        toast.dismiss(); // Ensure loading toast is dismissed
        toast.error("An unexpected error occurred while starting the workout.");
        console.error("Error in handleSubmit transition:", e);
      }
    });
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-8 bg-[url('/assets/panther.webp')] bg-no-repeat bg-[length:auto_90vh] bg-bottom">
      <div className="text-center mb-12">
        <h1 className="text-6xl font-bold tracking-tight">
          Panther <span className="text-emerald-400">PowerLog</span>
        </h1>
        <p className="mt-4 text-2xl ">
          Track your gains. Crush your PRs.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm p-8 rounded-xl shadow-2xl space-y-6"
      >
        <div>
          <Label htmlFor="workoutName" className="text-lg font-medium">
            Workout Name
          </Label>
          <Input
            id="workoutName"
            name="workoutName"
            type="text"
            placeholder="e.g., Morning Lift, Leg Day"
            className="mt-2 w-full text-white placeholder-slate-400 focus:ring-emerald-500 focus:border-emerald-500 h-12 text-lg"
          />
        </div>
        <div className="flex justify-center">
          <Button
            type="submit"
            className="bg-emerald-500 hover:bg-emerald-600 font-semibold rounded-lg text-xl transition-all duration-150 ease-in-out transform active:scale-95 px-6 py-3"
            disabled={isPending}
          >
            {isPending ? 'Starting Workout...' : 'BEGIN'}
          </Button>
        </div>
      </form>
    </main>
  );
} 