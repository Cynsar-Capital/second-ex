"use client";

import { useState } from "react";
import { Button, Input, Label, Text } from "@medusajs/ui";
import { signIn, signUp } from "@/supabase/utils";

interface AuthFormProps {
  onSuccess?: () => void;
  onToggle?: () => void;
}

export function SignInForm({ onSuccess, onToggle }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      } else if (data) {
        // Trigger any success callbacks
        if (onSuccess) onSuccess();
        
        // Instead of reloading the page, use the auth state change listener
        // The onAuthStateChange listener in profile.tsx will handle the state update
        
        // Optionally, we can dispatch a custom event to notify components that auth state changed
        window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { event: 'SIGNED_IN' } }));
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
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

export function SignUpForm({ onSuccess, onToggle }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
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
      } else if (data) {
        if (onSuccess) onSuccess();
        // Show confirmation message
        setError("Check your email for a confirmation link!");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
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
        <Text className={error.includes("Check your email") ? "text-green-500 text-sm" : "text-red-500 text-sm"}>
          {error}
        </Text>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating account..." : "Sign Up"}
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
