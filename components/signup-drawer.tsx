"use client";

import { Button, Drawer, Text, Tabs } from "@medusajs/ui";
import { useState, useEffect } from "react";
import { ArrowRightIcon } from "lucide-react";
import { SignInForm, SignUpForm } from "./auth-forms";

interface SignupDrawerProps {
  buttonText?: string;
  buttonVariant?: "primary" | "secondary" | "transparent" | "danger";
  buttonSize?: "sm" | "default" | "lg";
  buttonClassName?: string;
  defaultTab?: "signin" | "signup";
  children?: React.ReactNode;
  showArrow?: boolean;
}

export function SignupDrawer({ 
  buttonText = "Sign Up", 
  buttonVariant = "primary", 
  buttonSize = "default",
  buttonClassName = "",
  defaultTab = "signup",
  showArrow = false
}: SignupDrawerProps) {
  const [open, setOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"signin" | "signup">(defaultTab);

  // Listen for auth state changes
  useEffect(() => {
    const handleAuthStateChange = () => {
      console.log('Auth state changed, closing drawer');
      setOpen(false);
    };

    window.addEventListener('auth-state-changed', handleAuthStateChange);
    
    return () => {
      window.removeEventListener('auth-state-changed', handleAuthStateChange);
    };
  }, []);

  const handleAuthSuccess = () => {
    console.log('Auth success, closing drawer');

    setOpen(false);
    // Route to profile
    window.location.href = "/";
  };

  const getButtonVariant = () => {
    switch (buttonVariant) {
      case "primary": return "primary";
      case "secondary": return "secondary";
      case "transparent": return "transparent";
      case "danger": return "danger";
      default: return "primary";
    }
  };

  const getButtonSize = () => {
    switch (buttonSize) {
      case "sm": return "";
      case "default": return "";
      case "lg": return "px-8 py-6 text-lg";
      default: return "";
    }
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <Drawer.Trigger asChild>
        <Button 
          variant={getButtonVariant()} 
          className={`${getButtonSize()} ${buttonClassName}`}
        >
          {buttonText}
          {showArrow && <span className="ml-2"><ArrowRightIcon className="h-5 w-5 inline" /></span>}
        </Button>
      </Drawer.Trigger>
      <Drawer.Content className="z-[100]">
          <Drawer.Header className="relative z-[110]">
            <Drawer.Title className="text-xl font-bold">
              {authTab === "signin" ? "Welcome Back" : "Join 2nd.exchange"}
            </Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="p-4 relative z-[110]">
            <Tabs value={authTab} onValueChange={(value) => setAuthTab(value as "signin" | "signup")}>
              <Tabs.List className="mb-4">
                <Tabs.Trigger value="signin" className="flex-1">Sign In</Tabs.Trigger>
                <Tabs.Trigger value="signup" className="flex-1">Sign Up</Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content value="signin">
                <SignInForm 
                  onSuccess={handleAuthSuccess} 
                  onToggle={() => setAuthTab("signup")} 
                />
              </Tabs.Content>
              <Tabs.Content value="signup">
                <SignUpForm 
                  onSuccess={handleAuthSuccess} 
                  onToggle={() => setAuthTab("signin")} 
                />
              </Tabs.Content>
            </Tabs>
            <div className="mt-6 text-center">
              <Text className="text-sm text-gray-500">
                By signing up, you agree to our{" "}
                <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>
                {" "}and{" "}
                <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
              </Text>
            </div>
          </Drawer.Body>
      </Drawer.Content>
    </Drawer>
  );
}
