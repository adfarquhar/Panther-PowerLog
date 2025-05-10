'use client';

import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button'; // Assuming Button component from Shadcn UI
import type { User } from '@supabase/supabase-js';
import { toast } from 'sonner';

export default function AuthButton({ initialUser }: { initialUser: User | null }) {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(initialUser);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        // If user logs out, middleware should redirect. If login, they'll be on a protected page or homepage.
        // Refresh if needed, or rely on middleware and redirects.
        if (_event === 'SIGNED_OUT') {
          router.push('/login');
        } else if (_event === 'SIGNED_IN' && window.location.pathname === '/login') {
          router.push('/');
        }
        // router.refresh(); // Could be too aggressive, let's see.
      }
    );

    // If not relying on initialUser or for robustness, fetch user on mount
    if (initialUser === undefined) { // Or some other condition if initialUser might not be passed
        supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
            setUser(currentUser);
        });
    }

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase, router, initialUser]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(`Logout failed: ${error.message}`);
    } else {
      toast.success('Logged out successfully');
      setUser(null); // Optimistically update UI
      router.push('/login'); // Ensure redirection
    }
  };

  const handleLogin = () => {
    router.push('/login');
  };

  if (user) {
    return (
      <div className="flex items-center gap-2 sm:gap-4">
        <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:inline">
          {user.email}
        </span>
        <Button onClick={handleLogout} variant="outline" size="sm">
          Logout
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={handleLogin} variant="outline" size="sm">
      Login
    </Button>
  );
} 