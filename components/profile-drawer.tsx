"use client";

import { Button, Drawer, Text, Tabs, Avatar, Badge, Heading } from "@medusajs/ui";
import { useState, useEffect, useCallback } from "react";
import { signOut, supabase } from "@/supabase/utils";
import Link from "next/link";
import { PlusIcon, MailIcon, GlobeIcon } from "lucide-react";
import { SignInForm, SignUpForm } from "./auth-forms";
import { ProfileData } from "@/types/profile";

interface ProfileDrawerProps {
  isOwner: boolean;
  isLoggedIn: boolean;
  username?: string;
}

export function ProfileDrawer({ isOwner, isLoggedIn, username }: ProfileDrawerProps) {
  const [open, setOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [pendingRecommendations, setPendingRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [localIsLoggedIn, setLocalIsLoggedIn] = useState(isLoggedIn);
  
  // Listen for auth state changes
  useEffect(() => {
    const handleAuthStateChange = (event: any) => {
      console.log('Auth state changed in profile drawer', event.detail);
      if (event.detail.event === 'SIGNED_IN') {
        console.log('Auth state changed to SIGNED_IN in profile drawer');
        setLocalIsLoggedIn(true);
        setOpen(false); // Close the drawer
        // No need to reload the page
      } else if (event.detail.event === 'SIGNED_OUT') {
        console.log('Auth state changed to SIGNED_OUT in profile drawer');
        setLocalIsLoggedIn(false);
      }
    };

    window.addEventListener('auth-state-changed', handleAuthStateChange);
    
    return () => {
      window.removeEventListener('auth-state-changed', handleAuthStateChange);
    };
  }, []);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      setOpen(false);
      window.location.href = "/";
    }
  };

  // Function to fetch profile data from Supabase
  const fetchProfileData = useCallback(async () => {
    if (!isLoggedIn) return;
    
    setLoading(true);
    try {
      // Use getUser() which is more secure than getSession()
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting authenticated user:', userError);
        setLoading(false);
        return;
      }
      
      if (user) {
        console.log('Fetching profile data for user:', user.id);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
        setProfileData(data);
        
        // Fetch pending recommendations if this is the profile owner
        if (isOwner) {
          await fetchPendingRecommendations(user.id);
        }
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, isOwner]);
  
  // Function to fetch pending recommendations
  const fetchPendingRecommendations = async (profileId: string) => {
    setLoadingRecommendations(true);
    try {
      const { data, error } = await supabase
        .from('profile_recommendations')
        .select('*')
        .eq('profile_id', profileId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setPendingRecommendations(data || []);
    } catch (error) {
      console.error('Error fetching pending recommendations:', error);
      setPendingRecommendations([]);
    } finally {
      setLoadingRecommendations(false);
    }
  };
  
  const handleAuthSuccess = () => {
    setOpen(false);
    fetchProfileData();
  };
  
  // Fetch profile data when drawer opens
  useEffect(() => {
    if (open && isLoggedIn) {
      fetchProfileData();
    }
  }, [open, isLoggedIn, fetchProfileData]);
  
  // Function to handle recommendation approval/rejection
  const handleRecommendationAction = async (recommendationId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('profile_recommendations')
        .update({ status: newStatus, is_public: true })
        .eq('id', recommendationId);
        
      if (error) throw error;
      
      // Refresh the recommendations list
      if (profileData) {
        fetchPendingRecommendations(profileData.id);
      }
    } catch (error) {
      console.error(`Error ${newStatus === 'approved' ? 'approving' : 'rejecting'} recommendation:`, error);
    }
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <Drawer.Trigger asChild>
        <Button 
          variant="secondary" 
          className={`fixed top-4 right-4 z-40 rounded-full p-2 w-10 h-10 flex items-center justify-center shadow-md ${open ? 'opacity-0 pointer-events-none' : ''}`}
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
                <div className="space-y-6">
                  {loading ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-pulse h-4 w-3/4 bg-gray-200 rounded"></div>
                    </div>
                  ) : profileData ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <Avatar
                          src={profileData.avatar_url || ''}
                          fallback={profileData.full_name?.[0] || 'U'}
                        />
                        <div>
                          <Text size="large" weight="plus">{profileData.full_name || 'User'}</Text>
                          <Text size="small" className="text-gray-500">@{profileData.username}</Text>
                        </div>
                      </div>
                      
                      <div className="space-y-2 border-t border-b py-3">
                        {profileData.email && (
                          <div className="flex items-center space-x-2">
                            <MailIcon className="h-4 w-4 text-gray-500" />
                            <Text size="small">{profileData.email}</Text>
                          </div>
                        )}
                        {profileData.website && (
                          <div className="flex items-center space-x-2">
                            <GlobeIcon className="h-4 w-4 text-gray-500" />
                            <Text size="small">{profileData.website}</Text>
                          </div>
                        )}
                      </div>
                      
                      {profileData.bio && (
                        <div className="space-y-1">
                          <Text size="small" weight="plus">Bio</Text>
                          <Text size="small" className="text-gray-600">{profileData.bio}</Text>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Text>Unable to load profile data.</Text>
                  )}
                  
                  {/* Pending Recommendations Section */}
                  {isOwner && (
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-2">
                        <Heading level="h3" className="text-base font-medium">Pending Recommendations</Heading>
                        {pendingRecommendations.length > 0 && (
                          <Badge size="small">{pendingRecommendations.length}</Badge>
                        )}
                      </div>
                      
                      {loadingRecommendations ? (
                        <div className="animate-pulse space-y-2">
                          <div className="h-16 bg-gray-100 rounded"></div>
                          <div className="h-16 bg-gray-100 rounded"></div>
                        </div>
                      ) : pendingRecommendations.length > 0 ? (
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                          {pendingRecommendations.map((rec) => (
                            <div key={rec.id} className="p-3 border rounded-md bg-gray-50">
                              <div className="flex justify-between items-start mb-1">
                                <Text size="small" className="font-medium">{rec.recommender_name}</Text>
                                <Text size="xsmall" className="text-gray-500">
                                  {new Date(rec.created_at).toLocaleDateString()}
                                </Text>
                              </div>
                              <Text size="small" className="line-clamp-2 mb-2">{rec.recommendation_text}</Text>
                              <div className="flex gap-2">
                                <Button 
                                  size="small" 
                                  variant="secondary" 
                                  className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                                  onClick={() => handleRecommendationAction(rec.id, 'approved')}
                                >
                                  Approve
                                </Button>
                                <Button 
                                  size="small" 
                                  variant="secondary" 
                                  className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                                  onClick={() => handleRecommendationAction(rec.id, 'rejected')}
                                >
                                  Reject
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Text size="small" className="text-gray-500 italic">
                          No pending recommendations
                        </Text>
                      )}
                    </div>
                  )}
                  
                  {/* Edit Profile button removed as requested */}
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
          {isLoggedIn ? (
            <Button variant="secondary" onClick={handleSignOut} className="w-full">
              Sign Out
            </Button>
          ) : (
            <Drawer.Close asChild>
              <Button variant="secondary">Close</Button>
            </Drawer.Close>
          )}
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  );
}
