// components/ProfileComponent.js
"use client";
import {  DropdownMenu, IconButton, Button, Tooltip, TooltipProvider } from "@medusajs/ui"
import { ProfileCustomSections } from "./profile-custom-sections";
import {  PencilSquare } from "@medusajs/icons"
import { useProfile } from "@/lib/hooks/use-profile"
import { SubscribeDrawer } from "./subs";
import { ProfileDrawer } from "./profile-drawer";
import { ProfileRecommendations } from "./profile-recommendations";

import { useState, useEffect, useCallback } from 'react';
import {  getCurrentUser, getSession, onAuthStateChange } from "@/supabase/utils";
import { useRouter } from "next/navigation";
import Image from "next/image";

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

const ProfileComponent = ({ profile: initialProfile, isOwner: isOwnerProp = false }: ProfileComponentProps) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isProfileOwner, setIsProfileOwner] = useState(isOwnerProp);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  // Use TanStack Query to fetch and cache profile data
  // If initialProfile is provided, use it immediately and let TanStack Query update it in the background
  const { data: fetchedProfile, isLoading: isProfileLoading } = 
    useProfile(initialProfile?.id);
    
  // Use initialProfile as fallback while loading to prevent unnecessary loading states
  const profile = isProfileLoading && initialProfile ? initialProfile : fetchedProfile;

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

  // TanStack Query already handles profile refreshing automatically
  // No need for manual refresh functions or global window objects
  
  // Simplified user authentication effect
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
    
    // Listen for auth state changes
    const { data: authListener } = onAuthStateChange(async (event: string, session: any) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchUser();
        // TanStack Query will automatically refresh when needed
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
  }, [profile, isOwnerProp]); // Only depend on profile and isOwnerProp
  
  // Only show loading state if we don't have any profile data at all
  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
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
      
      {/* Timeline dashed line - improved responsive sizing */}
      <div className="absolute left-[43px] sm:left-[65px] md:left-[75px] lg:left-[390px] xl:left-[390px] 2xl:left-[390px] top-72 bottom-8 border-l-2 border-dashed border-gray-300 dark:border-gray-600 z-0"></div>
      
      {/* Profile header with background image */}
      <div className="space-y-8 max-w-4xl w-full relative pt-10 px-4 sm:px-0">
        <div className="relative w-full h-48 sm:h-56 md:h-64 lg:h-72 rounded-xl overflow-hidden mb-12 sm:mb-14 md:mb-16 lg:mb-20">
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
          
          {/* Avatar positioned on the cover image */}
          <div className="absolute bottom-[10%] xs:bottom-[10%] sm:bottom-[10%] md:bottom-[10%] lg:bottom-[5%] left-4 sm:left-6 md:left-8 lg:left-10 z-20">
            <div className="rounded-lg overflow-hidden border-4 border-white dark:border-slate-800 shadow-lg h-28 w-28 xs:h-32 xs:w-32 sm:h-36 sm:w-36 md:h-40 md:w-40 lg:h-44 lg:w-44 relative">
              {userData.avatar ? (
                <Image
                  src={userData.avatar}
                  alt={userData.name || "User avatar"}
                  fill
                  sizes="(max-width: 640px) 7rem, (max-width: 768px) 9rem, (max-width: 1024px) 10rem, 11rem"
                  priority
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white text-4xl font-bold">
                  {userData.name.charAt(0) || "U"}
                </div>
              )}
            </div>
          </div>
          
          {/* Name, username and subscribe/follow buttons */}
          <div className="absolute bottom-4 left-36 xs:left-44 sm:left-52 md:left-60 lg:left-64 right-4 flex flex-col sm:flex-row sm:justify-between sm:items-end">
            <div className="mb-2 sm:mb-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white drop-shadow-md truncate pr-4">{userData.name}</h1>
              {userData.username && (
                <p className="text-xs sm:text-sm text-white/80 drop-shadow-md">@{userData.username}</p>
              )}
            </div>
            <div className="flex-shrink-0 flex gap-2 mt-2 sm:mt-0">
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
        
        <div className="relative mb-8 max-w-4xl w-full">
          {/* Timeline dot - semi-circle with shadow - improved responsive sizing */}
          <div className="absolute left-[43px] sm:left-[65px] md:left-[75px] lg:left-[85px] xl:left-[85px] 2xl:left-[85px] top-0 w-4 h-2 overflow-hidden z-10">
            <div className="w-4 h-4 rounded-full bg-blue-500 dark:bg-blue-400 border-2 border-white dark:border-gray-800 shadow-md transform -translate-y-1/2"></div>
          </div>
          <div className="p-6 pt-8 mt-[-8px] bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 w-full">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-medium">Profile Information</h2>
                {isProfileOwner && (
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
                )}
              </div>
              
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
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
              <div className="py-6 border-t border-gray-200 dark:border-gray-700">
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
        </div>

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
          <ProfileRecommendations profileId={profile.id} />
        )}

      </div>
    </div>
  );
};
export default ProfileComponent;
