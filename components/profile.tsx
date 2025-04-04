// components/ProfileComponent.js
"use client";

import Image from "next/image";
import { AlertDescription, AlertTitle } from "./ui/alert";
import { Alert, Avatar, Container, DropdownMenu, IconButton, Button, Tooltip, TooltipProvider } from "@medusajs/ui"
import { ProfileCustomSections } from "./profile-custom-sections";
import { EllipsisHorizontal, PencilSquare, Plus, Trash } from "@medusajs/icons"
import { SubscribeDrawer } from "./subs";
import { ProfileDrawer } from "./profile-drawer";
import { ProfileEditForms } from "./profile-edit-forms";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/supabase/utils";
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
  create: any;
}

const ProfileComponent = ({ profile, create }: ProfileComponentProps) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Navigate to edit route
  const openEditModal = (type: string, workIndex?: number) => {
    const params = new URLSearchParams();
    params.set('type', type);
    if (workIndex !== undefined) {
      params.set('index', workIndex.toString());
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
    
    // Add event listener for URL changes
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      // @ts-ignore
      delete window.refreshProfileData;
    };
  }, []);
  
  // Fetch current user on component mount and when refresh is triggered
  useEffect(() => {
    async function fetchUser() {
      const { user } = await getCurrentUser();
      setCurrentUser(user);
      setIsLoading(false);
      setIsLoggedIn(!!user);
      if (user && profile) {
        setIsOwner(user.id === profile.id);
      }
    }
    fetchUser();
  }, [profile, refreshTrigger]); // Refresh when profile changes or refresh is triggered
  
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
        isOwner={isOwner} 
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
          <div className="absolute inset-0 bg-[url(https://images.unsplash.com/photo-1579546929518-9e396f3cc809)] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
          
          {/* Avatar positioned at bottom of cover image */}
          <div className="absolute -bottom-12 left-6 sm:left-10">
            <Avatar
              src={userData.avatar}
              fallback={userData.name.charAt(0) || "U"}
              className="h-24 w-24 sm:h-32 sm:w-32 ring-4 ring-white dark:ring-slate-800 shadow-lg"
            />
          </div>
          
          {/* Name, username and subscribe button */}
          <div className="absolute bottom-4 left-36 sm:left-48 right-4 flex justify-between items-end">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white drop-shadow-md truncate pr-4">{userData.name}</h1>
              {userData.username && (
                <p className="text-sm text-white/80 drop-shadow-md">@{userData.username}</p>
              )}
            </div>
            <div className="flex-shrink-0">
              <SubscribeDrawer create={create} />
            </div>
          </div>
        </div>
        
        <Container className="mb-8">
          <div className="p-6  bg-white dark:bg-slate-800">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-medium">Profile Information</h2>
                {isOwner ? (
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
                    <dd className="mt-1 text-sm">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            
            <div>
              <div className="py-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-sm font-medium">About</h2>
                  {isOwner ? (
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
            isOwner={isOwner} 
            onEditSection={(type) => openEditModal(type)}
          />
        )}
      </div>
    </div>
  );
};
export default ProfileComponent;
