"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase, getCurrentUser } from "@/supabase/utils";
import type { User } from "@supabase/supabase-js";

type UserContextType = {
  user: User | null;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
};

const UserContext = createContext<UserContextType>({
  user: null,
  isLoading: true,
  refreshUser: async () => {},
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const { user, error } = await getCurrentUser();
      if (error) throw error;
      setUser(user);
    } catch (error) {
      console.error("Error refreshing user:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch of user
    refreshUser();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    // Cleanup subscription
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, isLoading, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
