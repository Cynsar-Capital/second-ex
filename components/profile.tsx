// components/ProfileComponent.js
"use client";
import { Avatar, Container, DropdownMenu, IconButton, Button, Tooltip, TooltipProvider } from "@medusajs/ui"
import { ProfileCustomSections } from "./profile-custom-sections";
import {  PencilSquare } from "@medusajs/icons"
import { SubscribeDrawer } from "./subs";
import { ProfileDrawer } from "./profile-drawer";
import { ProfileRecommendations } from "./profile-recommendations";

import { useEffect, useState } from "react";
import {  getCurrentUser, getSession, onAuthStateChange } from "@/supabase/utils";
import { useRouter } from "next/navigation";

// Define work experience item type
type WorkExperience = {
  position: string;
  company: string;
  years: string;
  respo: string;
};

// Define the Profile type
type ProfileData = {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  background_url?: string;
  website?: string;
  bio?: string;
  email?: string;
  profile_sections?: {
    work?: WorkExperience[];
    [key: string]: any;
  };
  custom_fields?: {
    work?: WorkExperience[];
    [key: string]: any;
  };
};

// Default profile data to use as fallback
const defaultProfile = {
  full_name: "User Profile",
  email: "",
  avatar_url: "/profile-placeholder.png",
  bio: "This user hasn't added a bio yet.",
  fields: [
    ["Username", ""],
    ["Email", ""],
  ] as [string, string][],
  work: [] as WorkExperience[],
};

interface ProfileComponentProps {
  profile?: ProfileData;
  isOwner?: boolean;
}

const ProfileComponent = ({ profile, isOwner: isOwnerProp = false }: ProfileComponentProps) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isProfileOwner, setIsProfileOwner] = useState(isOwnerProp);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Navigate to edit route
  const openEditModal = (type: string, workIndex?: number, sectionKey?: string) => {
    const params = new URLSearchParams();
    params.set('type', type);
    if (workIndex !== undefined) {
      params.set('index', workIndex.toString());
    }
    if (sectionKey) {
      params.set('section', sectionKey);
    }
    
    // Check if we're on a subdomain (username.2nd.exchange or username.localhost)
    const hostname = window.location.hostname;
    const isSubdomain = hostname.includes('.') && !hostname.startsWith('www.');
    
    // If we're on a subdomain, stay on the same path but add query params
    if (isSubdomain) {
      router.push(`${window.location.pathname}?${params.toString()}`);
    } else {
      router.push(`/profile?${params.toString()}`);
    }
  };

  // State to trigger data refresh
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Function to manually trigger a refresh
  const refreshProfile = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Expose the refresh function to the window object for direct access
  useEffect(() => {
    // @ts-ignore
    window.refreshProfileData = refreshProfile;
    
    // Listen for URL changes to trigger refresh
    const handleRouteChange = () => {
      // Increment refresh trigger to cause a re-fetch
      refreshProfile();
    };

    // Listen for custom auth state change events
    const handleAuthStateChange = () => {
      console.log('Auth state changed, refreshing profile data');
      refreshProfile();
    };
    
    // Add event listeners
    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('auth-state-changed', handleAuthStateChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('auth-state-changed', handleAuthStateChange);
      // @ts-ignore
      delete window.refreshProfileData;
    };
  }, []);
  
  // Fetch current user on component mount and when refresh is triggered
  useEffect(() => {
    async function fetchUser() {
      try {
        // First check session which is more reliable for login state
        const { session } = await getSession();
        const isUserLoggedIn = !!session?.user;
        
        // Then get user details if logged in
        if (isUserLoggedIn) {
          const { user } = await getCurrentUser();
          setCurrentUser(user);
          setIsLoggedIn(true);
          if (user && profile) {
            setIsProfileOwner(isOwnerProp || (user.id === profile.id));
          }
        } else {
          setCurrentUser(null);
          setIsLoggedIn(false);
          setIsProfileOwner(isOwnerProp);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setCurrentUser(null);
        setIsLoggedIn(false);
        setIsProfileOwner(isOwnerProp);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUser();
    
    // Also listen for auth state changes
    const { data: authListener } = onAuthStateChange(async (event: string, session: any) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchUser();
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setIsLoggedIn(false);
        setIsProfileOwner(isOwnerProp);
        setIsLoading(false);
      }
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [profile, refreshTrigger, isOwnerProp]); // Refresh when profile changes, refresh is triggered, or isOwnerProp changes
  
  // Extract profile data or use defaults
  const userData = {
    name: profile?.full_name || defaultProfile.full_name,
    email: profile?.email || defaultProfile.email,
    avatar: profile?.avatar_url || defaultProfile.avatar_url,
    bio: profile?.bio || defaultProfile.bio,
    username: profile?.username || "",
    // Generate fields from profile data
    fields: [
      ["Email", profile?.email || ""],
      ["Website", profile?.website || ""],
    ].filter(([_, value]) => value) as [string, string][],
  };
  
  // These values are already set in state, so we don't need to recompute them
  
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800 py-6 sm:py-12 text-black dark:text-white flex justify-center overflow-hidden">
      {/* Profile drawer for authentication and profile actions */}
      <ProfileDrawer 
        isOwner={isProfileOwner} 
        isLoggedIn={isLoggedIn} 
        username={userData.username}
      />
      
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-20 bg-[url(/grid.svg)] bg-center"></div>
      
      {/* Profile header with background image */}
      <div className="space-y-8 max-w-4xl w-full relative pt-10 px-4 sm:px-0">
        <div className="relative w-full h-48 sm:h-64 rounded-xl overflow-hidden mb-16">
          {/* Cover image - can be customized per user */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-80"></div>
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay" 
            style={{ 
              backgroundImage: profile?.background_url 
                ? `url(${profile.background_url})` 
                : 'url(https://images.unsplash.com/photo-1579546929518-9e396f3cc809)'
            }}
          ></div>
          
          {/* Avatar positioned at bottom of cover image */}
          <div className="absolute -bottom-12 left-6 sm:left-10">
            <Avatar
              size="xlarge"
              src={userData.avatar}
              fallback={userData.name.charAt(0) || "U"}
              className="sm:h-40 sm:w-40 ring-4 ring-white dark:ring-slate-800 shadow-lg"
            />
          </div>
          
          {/* Name, username and subscribe/follow buttons */}
          <div className="absolute bottom-4 left-32 sm:left-56 right-4 flex justify-between items-end">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white drop-shadow-md truncate pr-4">{userData.name}</h1>
              {userData.username && (
                <p className="text-sm text-white/80 drop-shadow-md">@{userData.username}</p>
              )}
            </div>
            <div className="flex-shrink-0 flex gap-2">
              {!isProfileOwner && profile && (
                <Button 
                  onClick={() => router.push(`${window.location.pathname}?type=follow`)}
                  size="small"
                  variant="secondary"
                  className="flex items-center justify-center gap-1 bg-white/90 hover:bg-white text-blue-600 border-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                  </svg>
                  Follow
                </Button>
              )}
              <SubscribeDrawer 
                profileId={profile?.id} 
                username={profile?.username} 
              />
            </div>
          </div>
        </div>
        
        <Container className="mb-8">
          <div className="p-6  bg-white dark:bg-slate-800">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-medium">Profile Information</h2>
                {isProfileOwner ? (
                  <DropdownMenu>
                    <DropdownMenu.Trigger asChild>
                      <IconButton variant="transparent" size="small">
                        <PencilSquare className="text-ui-fg-subtle h-4 w-4" />
                      </IconButton>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content>
                      <DropdownMenu.Item className="gap-x-2" onClick={() => openEditModal("profile")}>
                        <PencilSquare className="text-ui-fg-subtle" />
                        Edit Profile Info
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu>
                ) : (
                  <TooltipProvider>
                  <Tooltip content="Login to edit profile">
                    <IconButton variant="transparent" size="small" onClick={() => (document.querySelector('.drawer-trigger') as HTMLElement)?.click()}>
                      <PencilSquare className="text-ui-fg-subtle h-4 w-4" />
                    </IconButton>
                  </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {userData.fields.filter(([_, value]) => value).map(([field, value]: [string, string]) => (
                  <div key={field} className="mt-2">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{field}</dt>
                    <dd className="mt-1 text-sm">
                      {field.toLowerCase() === 'website' || value.match(/^(https?:\/\/)/i) ? (
                        <a 
                          href={value.match(/^(https?:\/\/)/i) ? value : `https://${value}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {value}
                        </a>
                      ) : (
                        value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            
            <div>
              <div className="py-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-sm font-medium">About</h2>
                  {isProfileOwner && (
                    <DropdownMenu>
                      <DropdownMenu.Trigger asChild>
                        <IconButton variant="transparent" size="small">
                          <PencilSquare className="text-ui-fg-subtle h-4 w-4" />
                        </IconButton>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Content>
                        <DropdownMenu.Item className="gap-x-2" onClick={() => openEditModal("bio")}>
                          <PencilSquare className="text-ui-fg-subtle" />
                          Edit Bio
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu>
                  )}
                </div>
                <p className="text-sm">{userData.bio}</p>
              </div>
            </div>
          </div>
        </Container>

        {/* Work section removed - now handled by ProfileCustomSections */}
        
        {/* Custom Sections */}
        {profile && (
          <ProfileCustomSections 
            profile={profile} 
            isOwner={isProfileOwner}
            onEditSection={openEditModal}
          />
        )}
        
        {/* Recommendations Section */}
        {profile && (
          <Container className="mt-8">
            <ProfileRecommendations profileId={profile.id} />
          </Container>
        )}

      </div>
    </div>
  );
};
export default ProfileComponent;
