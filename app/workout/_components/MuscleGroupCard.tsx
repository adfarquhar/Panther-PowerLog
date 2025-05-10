'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface MuscleGroupCardProps {
  sessionId: string;
  group: {
    id: string;
    name: string;
  };
  // getImagePath: (muscleGroupName: string) => string; // Removed from props
}

// Helper function to generate image path (moved inside)
const getImagePath = (muscleGroupName: string) => {
  const slug = muscleGroupName.toLowerCase().replace(/\s+/g, '-');
  return `/assets/muscle-groups/${slug}.webp`;
};

export function MuscleGroupCard({ sessionId, group }: MuscleGroupCardProps) { // Removed getImagePath from destructuring
  const [imageHasError, setImageHasError] = useState(false);
  const imagePath = getImagePath(group.name);
  const isOther = group.name.toLowerCase() === "other";

  return (
    <Link
      key={group.id}
      href={`/workout/${sessionId}/add-exercise/exercises?muscleGroupId=${group.id}`}
      className="relative block rounded-lg border bg-card text-card-foreground shadow-sm transition-colors hover:bg-muted/80 active:bg-muted/90 overflow-hidden group"
    >
      <div className={`relative h-32 w-full sm:h-40 ${(isOther || imageHasError) ? 'bg-black' : ''}`}>
        {!isOther && !imageHasError && (
          <Image
            src={imagePath}
            alt={group.name}
            fill
            style={{ objectFit: 'cover' }}
            className="transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
            onError={() => {
              setImageHasError(true);
            }}
          />
        )}
        <div className="absolute inset-0 bg-[rgba(0,0,0,0.1)] group-hover:bg-[rgba(0,0,0,0.15)] transition-opacity duration-300" />
        <div className="absolute inset-0 flex items-center justify-center p-2">
           <span className="font-bold text-white text-center text-3xl uppercase [text-shadow:0_0_8px_rgba(0,0,0,1),_0_0_30px_rgba(0,0,0,0.9)]">{group.name}</span>
        </div>
      </div>
    </Link>
  );
} 