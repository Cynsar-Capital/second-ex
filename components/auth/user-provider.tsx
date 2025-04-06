"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase, getCurrentUser } from "@/supabase/utils";
import type { User, AuthChangeEvent } from "@supabase/supabase-js";

type UserContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  refreshUser: () => Promise<void>;
};

const UserContext = createContext<UserContextType>({
  user: null,
  isLoading: true,
  error: null,
  refreshUser: async () => {},
});

const RETRY_DELAY = 1000; // 1 second
const MAX_RETRIES = 3;

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout>();

  const refreshUser = async (retryCount = 0) => {
    try {
      setError(null);
      const { user, error } = await getCurrentUser();
      if (error) throw error;
      setUser(user);
    } catch (error) {
      console.error("Error refreshing user:", error);
      
      // Implement retry logic
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying user refresh (${retryCount + 1}/${MAX_RETRIES})...`);
        setTimeout(() => refreshUser(retryCount + 1), RETRY_DELAY);
        return;
      }
      
      setUser(null);
      setError(error instanceof Error ? error : new Error('Failed to refresh user'));
    } finally {
      // Debounce loading state changes
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      loadingTimeoutRef.current = setTimeout(() => {
        setIsLoading(false);
      }, 300); // 300ms debounce
    }
  };

  useEffect(() => {
    // Initial fetch of user
    refreshUser();
    // We intentionally don't include refreshUser in deps as it would cause an infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
    
    // Note: Storage buckets should be pre-created in the Supabase dashboard
    // with appropriate RLS policies for authenticated users

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session) => {
        console.log('Auth state changed:', event);
        setIsLoading(true);
        
        switch (event) {
          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
            if (session) {
              await refreshUser();
            }
            break;
            
          case 'SIGNED_OUT':
          case 'USER_DELETED' as AuthChangeEvent:
            setUser(null);
            setError(null);
            setIsLoading(false);
            break;
            
          default:
            // For other events, only refresh if we have a session
            if (session) {
              await refreshUser();
            } else {
              setUser(null);
              setIsLoading(false);
            }
        }
      }
    );

    // Cleanup subscription
    return () => {
      authListener.subscription.unsubscribe();
    };
  });

  // Cleanup function
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, isLoading, error, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
