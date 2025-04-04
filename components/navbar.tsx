"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useUser } from "./auth/user-provider";
import { signOut } from "@/supabase/utils";
import { Button } from "@medusajs/ui";

export default function Navbar() {
  const { user, isLoading } = useUser();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    await signOut();
  };

  if (!mounted) return null;

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold">
                Saransh Sharma
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Home
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {isLoading ? (
              <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {user.email}
                </span>
                <Button
                  onClick={handleSignOut}
                  variant="secondary"
                  size="small"
                >
                  Sign out
                </Button>
              </div>
            ) : (
              <Link href="/auth">
                <Button>Sign in</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
