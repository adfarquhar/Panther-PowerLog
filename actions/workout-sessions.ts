'use server';

import { createServerActionClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const NewWorkoutSessionSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1, "Workout name cannot be empty").optional(),
  date: z.string().optional(), // Will default to now() in DB
});

export async function createNewWorkoutSession(formData: FormData) {
  const supabase = await createServerActionClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // This should be caught by RLS or page-level auth checks as well,
    // but good to have a server-side check.
    // Consider redirecting to login or showing an error.
    console.error("User not authenticated to create workout session.");
    return {
      error: "Authentication required.",
      success: false,
    };
  }

  const rawFormData = {
    userId: user.id,
    name: formData.get("workoutName") || `Workout - ${new Date().toLocaleDateString()}`,
    // date will be handled by default in DB or can be passed if needed
  };

  const validation = NewWorkoutSessionSchema.safeParse(rawFormData);

  if (!validation.success) {
    console.error("Validation failed:", validation.error.flatten().fieldErrors);
    return {
      error: "Invalid data provided.",
      fieldErrors: validation.error.flatten().fieldErrors,
      success: false,
    };
  }

  const { data: newSession, error } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: validation.data.userId,
      name: validation.data.name,
      // date: validation.data.date, // Let DB handle default for now
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating new workout session:", error);
    return {
      error: "Could not create workout session.",
      success: false,
    };
  }

  if (newSession) {
    console.log("New session created:", newSession);
    // Revalidate paths if you have pages listing sessions
    revalidatePath("/"); // Example: revalidate home page if it lists sessions
    revalidatePath("/history"); // Example: if you have a history page
    
    // Redirect to the page where user adds exercises to this session
    redirect(`/workout/${newSession.id}/edit`); // Or /add-exercise, or similar
  } else {
    return {
        error: "Failed to retrieve new session ID after creation.",
        success: false,
    };
  }

  // Should not be reached if redirect happens
  return { success: true, sessionId: newSession?.id }; 
} 