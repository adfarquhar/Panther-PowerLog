import { getMuscleGroups } from '@/actions/muscle-groups';
import Link from 'next/link'; // No longer needed for Cancel button
import { toast } from 'sonner'; // For displaying errors, though ideally handled by an error component
import { MuscleGroupCard } from '@/app/workout/_components/MuscleGroupCard'; // Import the new component
import { BackButton } from '@/components/BackButton'; // Import the new BackButton

// Interface for the resolved params object
interface MuscleGroupPageResolvedParams {
  sessionId: string;
}

// Type alias for the Promise-wrapped params
type MuscleGroupPageParamsPromise = Promise<MuscleGroupPageResolvedParams>;

// Helper function to generate image path
/* // Commenting out as it's moved to MuscleGroupCard, can be deleted if not used elsewhere
const getImagePath = (muscleGroupName: string) => {
  const slug = muscleGroupName.toLowerCase().replace(/\s+/g, '-');
  // All specific mappings removed as filenames now match the slugified names.
  // For 'other', if other.webp is not available and no default is set, it will 404.
  // Consider adding other.webp or a default.webp and logic here.
  return `/assets/muscle-groups/${slug}.webp`;
};
*/

export default async function MuscleGroupSelectionPage({
  params: paramsPromise, // Expect params as a Promise
}: {
  params: MuscleGroupPageParamsPromise; // Type annotation for the destructured props object
}) {
  const params = await paramsPromise; // Await the params
  const { sessionId } = params;
  const { data: initialMuscleGroups, error } = await getMuscleGroups();
  let muscleGroups = initialMuscleGroups;
  console.log("Fetched muscle groups:", muscleGroups); // Log all fetched groups

  if (error) {
    // This is a server component, so toast won't work directly here for client-side display.
    // Consider a more robust error handling, like an error boundary or passing error to a client component.
    // For now, we can log it and show a simple message.
    console.error("Error in MuscleGroupSelectionPage:", error);
    // Or, if you have a global error display mechanism, use that.
    // For a quick feedback if sonner is globally available or via a layout toast:
    toast.error("Could not load muscle groups."); // This line might not render as expected.
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Select Muscle Group</h1>
        <p className="text-red-500">Error loading muscle groups. Please try again later.</p>
        <Link href={`/workout/${sessionId}/log`} className="text-primary hover:underline mt-4 inline-block">
          Back to Workout Log
        </Link>
      </div>
    );
  }

  if (!muscleGroups || muscleGroups.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Select Muscle Group</h1>
        <p>No muscle groups found.</p>
        <Link href={`/workout/${sessionId}/log`} className="text-primary hover:underline mt-4 inline-block">
          Back to Workout Log
        </Link>
      </div>
    );
  }

  // Sort muscle groups to put "Other" last
  if (muscleGroups) {
    muscleGroups = muscleGroups.sort((a, b) => {
      if (a.name.toLowerCase() === 'other') return 1; // Move a to the end
      if (b.name.toLowerCase() === 'other') return -1; // Move b to the end (so a comes before)
      return 0; // Keep original order for others (or apply other sorting like a.name.localeCompare(b.name) if needed)
    });
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Sticky BackButton at the top left */}
      <div className="sticky top-4 left-0 z-50 mb-4"> {/* Re-added sticky, top-4, left-0, z-50 */}
        <BackButton />
      </div>

      {/* Header text was removed in a previous step */}
      
      <div className="grid grid-cols-2 gap-4"> {/* Max 2 columns wide */}
        {muscleGroups.map((group) => {
          // const imagePath = getImagePath(group.name); // Logic moved to component
          // const isOther = group.name.toLowerCase() === "other"; // Logic moved to component
          // console.log(`Muscle Group: "${group.name}", Generated Path: "${imagePath}"`); // Logging can be inside component if needed or removed
          return (
            <MuscleGroupCard
              key={group.id}
              sessionId={sessionId}
              group={group}
              // getImagePath={getImagePath} // Removed prop
            />
          );
        })}
      </div>
    </div>
  );
} 