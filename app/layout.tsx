import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { createServerComponentClient } from "@/lib/supabase/server";
import AuthButton from "@/components/AuthButton";
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
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <header className="z-50 w-full">
          <div className="flex h-14 items-center justify-between px-4 sm:px-6 text-white lg:px-8">
            <div className="mr-4 flex items-center">
              <Link href="/" className="font-bold text-lg">
                Panther <span className="text-emerald-400">PowerLog</span>
              </Link>
            </div>
            <AuthButton initialUser={user} />
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <Toaster />
      </body>
    </html>
  );
} 