"use client";

import { Button, Drawer, Text, Tabs } from "@medusajs/ui";
import { useState } from "react";
import { signOut } from "@/supabase/utils";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { SignInForm, SignUpForm } from "./auth-forms";

interface ProfileDrawerProps {
  isOwner: boolean;
  isLoggedIn: boolean;
  username?: string;
}

export function ProfileDrawer({ isOwner, isLoggedIn, username }: ProfileDrawerProps) {
  const [open, setOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      setOpen(false);
      window.location.href = "/";
    }
  };

  const handleAuthSuccess = () => {
    setOpen(false);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <Drawer.Trigger asChild>
        <Button 
          variant="secondary" 
          className="fixed top-4 right-4 z-40 rounded-full p-2 w-10 h-10 flex items-center justify-center shadow-md"
        >
          <PlusIcon className="h-5 w-5" />
        </Button>
      </Drawer.Trigger>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>
            {isLoggedIn 
              ? (isOwner ? "Your Profile" : `${username}&apos;s Profile`) 
              : "Sign In or Create Account"}
          </Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="p-4">
          {isLoggedIn ? (
            <>
              {isOwner ? (
                <div className="space-y-4">
                  <Text>You are viewing your own profile.</Text>
                  <div className="flex flex-col space-y-2">
                    <Link href="/profile/edit">
                      <Button className="w-full">Edit Profile</Button>
                    </Link>
                    <Button variant="secondary" onClick={handleSignOut}>
                      Sign Out
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Text>You are viewing {username}&apos;s public profile.</Text>
                  <div className="flex flex-col space-y-2">
                    <Link href="/">
                      <Button className="w-full">View Your Profile</Button>
                    </Link>
                    <Button variant="secondary" onClick={handleSignOut}>
                      Sign Out
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <Text className="mb-4">
                You are viewing a public profile. Sign in to manage your own profile.
              </Text>
              
              <Tabs value={authTab} onValueChange={(value) => setAuthTab(value as "signin" | "signup")}>
                <Tabs.List className="grid grid-cols-2 mb-4">
                  <Tabs.Trigger value="signin" className="text-center">
                    Sign In
                  </Tabs.Trigger>
                  <Tabs.Trigger value="signup" className="text-center">
                    Create Account
                  </Tabs.Trigger>
                </Tabs.List>
                
                <Tabs.Content value="signin" className="pt-2">
                  <SignInForm 
                    onSuccess={handleAuthSuccess} 
                    onToggle={() => setAuthTab("signup")} 
                  />
                </Tabs.Content>
                
                <Tabs.Content value="signup" className="pt-2">
                  <SignUpForm 
                    onSuccess={handleAuthSuccess} 
                    onToggle={() => setAuthTab("signin")} 
                  />
                </Tabs.Content>
              </Tabs>
            </div>
          )}
        </Drawer.Body>
        <Drawer.Footer>
          <Drawer.Close asChild>
            <Button variant="secondary">Close</Button>
          </Drawer.Close>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  );
}
