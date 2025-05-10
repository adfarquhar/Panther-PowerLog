import { getMuscleGroups } from '@/actions/muscle-groups';
import Link from 'next/link';
import Image from 'next/image'; // Added import for Next.js Image component
// import { ChevronRightIcon } from '@heroicons/react/24/outline'; // Removed unused import
import { toast } from 'sonner'; // For displaying errors, though ideally handled by an error component

// Interface for the resolved params object
interface MuscleGroupPageResolvedParams {
  sessionId: string;
}

// Type alias for the Promise-wrapped params
type MuscleGroupPageParamsPromise = Promise<MuscleGroupPageResolvedParams>;

// Helper function to generate image path (assuming names match filenames)
// Converts "Upper Back" to "upper-back.webp"
const getImagePath = (muscleGroupName: string) => {
  return `/assets/muscle-groups/${muscleGroupName.toLowerCase().replace(/\s+/g, '-')}.webp`;
};

export default async function MuscleGroupSelectionPage({
  params: paramsPromise, // Expect params as a Promise
}: {
  params: MuscleGroupPageParamsPromise; // Type annotation for the destructured props object
}) {
  const params = await paramsPromise; // Await the params
  const { sessionId } = params;
  const { data: muscleGroups, error } = await getMuscleGroups();

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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Select Muscle Group</h1>
        <Link href={`/workout/${sessionId}/log`} className="text-sm text-primary hover:underline">
          Cancel
        </Link>
      </div>
      
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"> {/* Using a grid for better layout */}
        {muscleGroups.map((group) => (
          <Link
            key={group.id}
            href={`/workout/${sessionId}/add-exercise/exercises?muscleGroupId=${group.id}`}
            className="relative block rounded-lg border bg-card text-card-foreground shadow-sm transition-colors hover:bg-muted/80 active:bg-muted/90 overflow-hidden group" // Added relative, overflow-hidden and group
          >
            <div className="relative h-32 w-full sm:h-40"> {/* Container for image, ensure it has a defined height */}
              <Image
                src={getImagePath(group.name)} // Use helper to get image path
                alt={group.name}
                fill // Use fill to make image responsive within its parent
                style={{ objectFit: 'cover' }} // Ensure image covers the area
                className="transition-transform duration-300 group-hover:scale-105" // Optional: zoom effect on hover
                // It's good practice to provide width/height if not using fill, or if fill's parent isn't sized.
                // For fill to work, parent must be relative, block, or flex. Here, parent div is relative.
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw" // Optimize image loading
              />
              <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-40 transition-opacity duration-300" /> {/* Dark overlay for better text visibility */}
              <div className="absolute inset-0 flex items-center justify-center p-2">
                <span className="font-semibold text-white text-center text-lg drop-shadow-md">{group.name}</span>
              </div>
            </div>
            {/* Removed ChevronRightIcon as it might clutter the image card design */}
            {/* If needed, it can be added back, perhaps next to the text or in a corner */}
          </Link>
        ))}
      </div>
    </div>
  );
} 