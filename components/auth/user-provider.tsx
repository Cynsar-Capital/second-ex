"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { supabase, getCurrentUser } from "@/supabase/utils";
import type { User, AuthChangeEvent, Session } from "@supabase/supabase-js";

/**
 * Utility function to check if an error is likely a network error
 */
const isNetworkError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return (
      error.message.includes('network') ||
      error.message.includes('Network') ||
      error.message.includes('connection') ||
      error.message.toLowerCase().includes('offline')
    );
  }
  return false;
};

/**
 * Custom error types for better error handling
 */
type AuthError = {
  type: 'auth' | 'network' | 'unknown';
  message: string;
  originalError?: unknown;
};

/**
 * Type definition for the authentication context
 */
type UserContextType = {
  user: User | null;
  isLoading: boolean;
  error: AuthError | null;
  refreshUser: () => Promise<void>;
};

/**
 * Configuration constants for authentication behavior
 */
const AUTH_CONFIG = {
  /** Base delay between retry attempts in milliseconds */
  RETRY_DELAY: 1000,
  /** Maximum number of retry attempts */
  MAX_RETRIES: 3,
  /** Debounce delay for loading state changes in milliseconds */
  LOADING_DEBOUNCE: 300,
} as const;

/**
 * Context for managing authentication state
 */
const UserContext = createContext<UserContextType>({
  user: null,
  isLoading: true,
  error: null,
  refreshUser: async () => {},
});

/**
 * Provider component for authentication state
 */
export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout>();
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  /**
   * Utility function for handling retries with exponential backoff
   */
  const retryOperation = useCallback(async (
    operation: () => Promise<void>,
    retryCount: number = 0
  ): Promise<void> => {
    try {
      await operation();
    } catch (error) {
      if (retryCount < AUTH_CONFIG.MAX_RETRIES && isNetworkError(error)) {
        const delay = AUTH_CONFIG.RETRY_DELAY * Math.pow(2, retryCount);
        console.log(`Retrying operation (${retryCount + 1}/${AUTH_CONFIG.MAX_RETRIES}) after ${delay}ms...`);
        
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
        
        return new Promise((resolve) => {
          retryTimeoutRef.current = setTimeout(() => {
            resolve(retryOperation(operation, retryCount + 1));
          }, delay);
        });
      }
      throw error;
    }
  }, []);

  /**
   * Refreshes the current user's data
   */
  const refreshUser = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      await retryOperation(async () => {
        const { user, error } = await getCurrentUser();
        if (error) throw error;
        
        // Only update user state if it has actually changed
        setUser(prevUser => {
          if (!prevUser && !user) return prevUser;
          if (!prevUser || !user) return user;
          if (prevUser.id !== user.id) return user;
          if (JSON.stringify(prevUser) !== JSON.stringify(user)) return user;
          return prevUser;
        });
      });
    } catch (error) {
      console.error("Error refreshing user:", error);
      setUser(null);
      setError({
        type: isNetworkError(error) ? 'network' : 'auth',
        message: error instanceof Error ? error.message : 'Failed to refresh user',
        originalError: error
      });
    } finally {
      // Debounce loading state changes
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      loadingTimeoutRef.current = setTimeout(() => {
        setIsLoading(false);
      }, AUTH_CONFIG.LOADING_DEBOUNCE);
    }
  }, [retryOperation]);

  /**
   * Handles authentication state changes from Supabase
   */
  const handleAuthStateChange = useCallback(async (event: AuthChangeEvent, session: Session | null) => {
    console.log('Auth state changed:', event, session?.user?.id);
    
    switch (event) {
      case 'SIGNED_IN':
      case 'TOKEN_REFRESHED':
        await refreshUser();
        break;
        
      case 'SIGNED_OUT':
        setUser(null);
        setError(null);
        setIsLoading(false);
        break;
        
      default:
        if (session) {
          await refreshUser();
        } else {
          setUser(null);
          setIsLoading(false);
        }
    }
  }, [refreshUser]);

  // Initialize auth state and set up listeners
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await refreshUser();
        } else {
          setUser(null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        setUser(null);
        setIsLoading(false);
      }
    };

    initAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => {
      subscription.unsubscribe();
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [handleAuthStateChange, refreshUser]);

  return (
    <UserContext.Provider value={{ user, isLoading, error, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};

/**
 * Hook to access authentication context
 */
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
