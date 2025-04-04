"use client";

import { useState } from "react";
import { signIn, signUp, signInWithProvider } from "@/supabase/utils";
import { Button, Alert } from "@medusajs/ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthMode = "signin" | "signup";

export default function AuthForm() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === "signin") {
        const { data, error } = await signIn(email, password);
        if (error) throw error;
        setMessage({ type: "success", text: "Successfully signed in!" });
      } else {
        const { data, error } = await signUp(email, password);
        if (error) throw error;
        setMessage({ 
          type: "success", 
          text: "Check your email for the confirmation link!" 
        });
      }
    } catch (error: any) {
      setMessage({ 
        type: "error", 
        text: error.message || "An error occurred during authentication" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github' | 'facebook') => {
    try {
      const { data, error } = await signInWithProvider(provider);
      if (error) throw error;
    } catch (error: any) {
      setMessage({ 
        type: "error", 
        text: error.message || `Failed to sign in with ${provider}` 
      });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{mode === "signin" ? "Sign In" : "Sign Up"}</h1>
        <p className="text-gray-500 mt-2">
          {mode === "signin" 
            ? "Welcome back! Sign in to your account" 
            : "Create a new account to get started"}
        </p>
      </div>

      {message && (
        <Alert variant={message.type === "error" ? "error" : "success"}>
          {message.text}
        </Alert>
      )}

      <form onSubmit={handleAuth} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={loading}
        >
          {loading 
            ? "Loading..." 
            : mode === "signin" 
              ? "Sign In" 
              : "Sign Up"
          }
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button 
          variant="secondary" 
          onClick={() => handleOAuthSignIn("google")}
        >
          Google
        </Button>
        <Button 
          variant="secondary" 
          onClick={() => handleOAuthSignIn("github")}
        >
          GitHub
        </Button>
      </div>

      <div className="text-center text-sm">
        {mode === "signin" ? (
          <p>
            Don&apos;t have an account?{" "}
            <button
              type="button"
              className="text-blue-600 hover:underline"
              onClick={() => setMode("signup")}
            >
              Sign up
            </button>
          </p>
        ) : (
          <p>
            Already have an account?{" "}
            <button
              type="button"
              className="text-blue-600 hover:underline"
              onClick={() => setMode("signin")}
            >
              Sign in
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
