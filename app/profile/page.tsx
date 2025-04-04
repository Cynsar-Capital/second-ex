import { createServerSupabaseClient } from '@/supabase/server'
import { notFound } from 'next/navigation'
import ProfileComponent from '@/components/profile'
import { create } from '../actions/email'
import { RouteFocusModal } from '@/components/route-focus-modal'

export default async function ProfilePage({
  searchParams
}: {
  searchParams: { username?: string }
}) {
  const supabase = createServerSupabaseClient()
  
  // Get the username from the query parameter (set by middleware for subdomain routing)
  const username = searchParams.username
  
  if (!username) {
    // If no username is provided, get the current user's profile
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      // If not logged in and no username provided, redirect to login
      return notFound()
    }
    
    // Get the current user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    
    if (!profile) {
      return notFound()
    }
    
    // Return the profile component with the user's profile data
    return (
      <>
        <ProfileComponent profile={profile} create={create} />
        <RouteFocusModal profile={profile} />
      </>
    )
  }
  
  // If a username is provided, get that user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()
  
  if (!profile) {
    return notFound()
  }
  
  // Return the profile component with the requested user's profile data
  return (
    <>
      <ProfileComponent profile={profile} create={create} />
      <RouteFocusModal profile={profile} />
    </>
  )
}
