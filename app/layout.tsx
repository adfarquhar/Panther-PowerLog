import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { createServerComponentClient } from "@/lib/supabase/server";
import AuthButton from "@/components/AuthButton";
import BottomNav from "@/components/BottomNav";
import Link from 'next/link';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Panther PowerLog",
  description: "Log your workouts and track your strength progress.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    /* suppressHydrationWarning for potential themeing/dark mode issues initially */
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 pb-16 md:pb-0`}>
        <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div className="container mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="mr-4 flex items-center">
              <Link href="/" className="font-bold text-lg text-gray-900 dark:text-white">
                Panther <span className="text-emerald-500 dark:text-emerald-400">PowerLog</span>
              </Link>
            </div>
            <AuthButton initialUser={user} />
          </div>
        </header>
        <main className="flex-1 w-full container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        {user && <BottomNav />}
        <Toaster />
      </body>
    </html>
  );
} 