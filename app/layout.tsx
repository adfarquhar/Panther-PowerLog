import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"; // Assuming sonner will be a shadcn component

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Panther PowerLog",
  description: "Log your workouts and track your strength progress.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning> {/* suppressHydrationWarning for potential themeing/dark mode issues initially */}
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
} 