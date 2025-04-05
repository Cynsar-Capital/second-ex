"use client";

import { useState } from "react";
import { Button, Input, Label, Text } from "@medusajs/ui";
import { signIn, signUp, supabase, setCrossDomainCookies } from "@/supabase/utils";

interface AuthFormProps {
  onSuccess?: () => void;
  onToggle?: () => void;
}

export function SignInForm({ onSuccess, onToggle }: AuthFormProps): JSX.Element {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    console.log('Attempting to sign in with:', email);

    try {
      // Sign in with email and password
      const { data, error } = await signIn(email, password);
      
      console.log('Sign in response:', { data, error });
      
      if (error) {
        console.error('Sign in error:', error);
        setError(error.message);
        setLoading(false);
        return;
      }
      
      if (data?.session) {
        console.log('Authentication successful, session created');
        
        // Set the session directly first
        // await supabase.auth.setSession({
        //   access_token: data.session.access_token,
        //   refresh_token: data.session.refresh_token,
        // });
        
        // Store session in localStorage as a backup
        localStorage.setItem('supabase.auth.token', JSON.stringify({
          currentSession: data.session,
          expiresAt: Math.floor(Date.now() / 1000) + (data.session.expires_in || 3600)
        }));
        
        // Trigger any success callbacks
        if (onSuccess) {
          console.log('Calling onSuccess callback');
          onSuccess();
        }
        
        // Get the authenticated user data first
        try {
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            console.error('Error getting authenticated user:', userError);
            setError('Error getting user data: ' + userError.message);
            return;
          }
          
          if (!user) {
            console.error('No user found after authentication');
            setError('Authentication failed: No user found');
            return;
          }
          
          console.log('Authentication successful with user:', user.id);
          
          // Now fetch the user profile from the profiles table
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error fetching user profile:', profileError);
            setError('Error fetching profile: ' + profileError.message);
          }
          
          // Combine user and profile data
          const userData = {
            ...user,
            profile: profile || null
          };
          
          console.log('User data with profile:', userData);
          
          // Dispatch a custom event to notify components that auth state changed
          console.log('Dispatching auth-state-changed event');
          window.dispatchEvent(new CustomEvent('auth-state-changed', { 
            detail: { event: 'SIGNED_IN', user: userData }
          }));
          
          // Call onSuccess to close the drawer
          if (onSuccess) {
            console.log('Calling onSuccess to close the drawer');
            onSuccess();
          }
          
          // Refresh the page to show the user profile
          console.log('Authentication complete, refreshing page to show profile');
          window.location.reload();
        } catch (error) {
          console.error('Error during authentication:', error);
          setError('Error during authentication: ' + (error instanceof Error ? error.message : String(error)));
        } finally {
          // Always set loading to false, regardless of success or failure
          setLoading(false);
        }
      } else {
        console.error('No session data returned from sign in');
        setError("Authentication successful but no session was created. Please try again.");
        setLoading(false);
      }
    } catch (err) {
      console.error('Unexpected error during sign in:', err);
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="border-gray-300 dark:border-gray-700"
          required
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="border-gray-300 dark:border-gray-700"
          required
        />
      </div>
      {error && <Text className="text-red-500 text-sm">{error}</Text>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing in..." : "Sign In"}
      </Button>
      <div className="text-center mt-4">
        <Text className="text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={onToggle}
            className="text-blue-600 hover:underline"
          >
            Sign Up
          </button>
        </Text>
      </div>
    </form>
  );
}

export function SignUpForm({ onSuccess, onToggle }: AuthFormProps): JSX.Element {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupStep, setSignupStep] = useState<"credentials" | "username" | "success">("credentials");
  const [userId, setUserId] = useState<string | null>(null);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await signUp(email, password);
      if (error) {
        setError(error.message);
      } else if (data?.user) {
        setUserId(data.user.id);
        setSignupStep("username");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!username) {
      setError("Username is required");
      setLoading(false);
      return;
    }

    // Check if username is valid (alphanumeric and underscore only)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("Username can only contain letters, numbers, and underscores");
      setLoading(false);
      return;
    }

    try {
      // Check if username is available
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        setError("Error checking username availability");
        setLoading(false);
        return;
      }

      if (existingUser) {
        setError("Username already taken");
        setLoading(false);
        return;
      }

      // Create or update profile with username
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          username: username,
          updated_at: new Date().toISOString(),
        });

      if (updateError) {
        setError(updateError.message);
      } else {
        setSignupStep("success");
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (signupStep === "success") {
    // Function to handle redirect while preserving authentication
    const handleRedirectToProfile = async () => {
      setLoading(true);
      try {
        // Get the authenticated user data (more secure than getSession)
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('Error getting authenticated user:', userError);
          setError('Error getting authenticated user: ' + userError.message);
          setLoading(false);
          return;
        }
        
        if (user) {
          // Update user metadata with the username
          await supabase.auth.updateUser({
            data: { username: username }
          });
          
          console.log('Updated user metadata with username:', username);
          
          // Dispatch auth state changed event to close the drawer
          window.dispatchEvent(new CustomEvent('auth-state-changed', { 
            detail: { event: 'SIGNED_IN', user: user }
          }));
          
          // No need to set cross-domain cookies here
          console.log('Authentication successful, proceeding with user:', user.id);
        }
        
        // Refresh the page to show the user profile
        console.log('Authentication complete, profile created with username:', username);
        // Set loading to false before refreshing
        setLoading(false);
        // Refresh the page to show the profile
        console.log('Refreshing page to show profile');
        window.location.reload();
      } catch (error) {
        console.error('Error during authentication sync:', error);
        setError('Error during authentication: ' + (error instanceof Error ? error.message : String(error)));
        setLoading(false);
      }
    };
    
    return (
      <div className="space-y-4 text-center">
        <div className="p-4 bg-green-50 rounded-lg">
          <Text className="text-green-600 font-medium">Account created successfully!</Text>
          <Text className="text-green-600 mt-2">Your profile is now available at:</Text>
          <Text className="block mt-2 text-blue-600 font-bold">
            {username}.2nd.exchange
          </Text>
        </div>
        <Button 
          onClick={handleRedirectToProfile}
          className="w-full"
        >
          Go to Your Profile
        </Button>
      </div>
    );
  }

  if (signupStep === "username") {
    return (
      <form onSubmit={handleUsernameSubmit} className="space-y-4">
        <div className="text-center mb-4">
          <Text className="text-lg font-medium">Choose Your Username</Text>
          <Text className="text-sm text-gray-500 mt-1">
            This will be your unique profile URL: username.2nd.exchange
          </Text>
        </div>
        <div>
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            placeholder="yourname"
            className="border-gray-300 dark:border-gray-700"
            required
          />
        </div>
        {error && (
          <Text className="text-red-500 text-sm">{error}</Text>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Checking availability..." : "Create Your Profile"}
        </Button>
        <div className="text-center mt-4">
          <Text className="text-sm text-gray-500">
            Your profile will be available at: {username ? `${username}.2nd.exchange` : "username.2nd.exchange"}
          </Text>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleCredentialsSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="border-gray-300 dark:border-gray-700"
          required
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="border-gray-300 dark:border-gray-700"
          required
        />
      </div>
      <div>
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          className="border-gray-300 dark:border-gray-700"
          required
        />
      </div>
      {error && (
        <Text className="text-red-500 text-sm">{error}</Text>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating account..." : "Next"}
      </Button>
      <div className="text-center mt-4">
        <Text className="text-sm text-gray-500">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onToggle}
            className="text-blue-600 hover:underline"
          >
            Sign In
          </button>
        </Text>
      </div>
    </form>
  );
}
