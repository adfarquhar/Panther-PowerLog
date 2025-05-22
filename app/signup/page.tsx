'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();

  const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // This is where the user will be redirected after clicking the confirmation link
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) {
        toast.error(error.message);
      } else if (data.user && data.user.identities?.length === 0) {
        // This case handles if the user already exists but is not confirmed.
        toast.info('User already exists. Please check your email to confirm your account or try logging in.');
      } else if (data.session === null && data.user) {
        // This means a new user signed up and needs to confirm their email
        toast.success(
          'Sign up successful! Please check your email to confirm your account.'
        );
        // Optionally redirect to a page that informs them to check their email
        // router.push('/check-email'); 
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      } else if (data.session && data.user) {
        // This case should ideally not happen if email confirmation is on,
        // but if it does, it means user is signed up and logged in.
        toast.success('Sign up successful and logged in!');
        router.push('/');
      } else {
        toast.info('Please check your email to complete the sign-up process.')
      }
    } catch (error) {
      toast.error('An unexpected error occurred during sign up.');
      console.error('Signup error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-3xl font-bold">
          Create Account
        </h1>
        <form onSubmit={handleSignup} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email address
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6} // Supabase default minimum password length
              className="mt-1"
            />
          </div>
           <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium">
              Confirm Password
            </label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="mt-1"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
} 