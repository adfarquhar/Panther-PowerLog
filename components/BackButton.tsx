'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import type * as React from 'react';

type BackButtonProps = Omit<React.ComponentProps<typeof Button>, 'children'>;

export function BackButton({ className, variant = 'destructive', size = 'icon', ...props }: BackButtonProps) {
  const router = useRouter();

  return (
    <Button
      variant={variant}
      size={size}
      className={`p-2 ${className || ''}`}
      onClick={() => router.back()}
      aria-label="Go back"
      {...props}
    >
      <ArrowLeftIcon className="h-6 w-6 stroke-2" />
    </Button>
  );
} 