// app/page.tsx - Home page using App Router
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/supabase/server';
import ProfileComponent from "@/components/profile";

export default async function HomePage() {
  const supabase = createServerSupabaseClient();
  
  // Get the current user's session
  const { data: { session } } = await supabase.auth.getSession();
  
  // If user is logged in, try to get their profile
  if (session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (profile) {
      // If they have a profile, show it
      return <ProfileComponent profile={profile} />;
    }
  }
  
  // If no user is logged in or they don't have a profile yet,
  // just render the profile component with default values
  return <ProfileComponent />;
}
