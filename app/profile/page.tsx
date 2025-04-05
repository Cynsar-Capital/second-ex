import { createServerSupabaseClient } from '@/supabase/server'
import { notFound } from 'next/navigation'
import ProfileComponent from '@/components/profile'
import { RouteFocusModal } from '@/components/route-focus-modal'
import { Suspense } from 'react'

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
        <ProfileComponent profile={profile} isOwner={true} />
        <Suspense fallback={<div>Loading...</div>}>
          <RouteFocusModal profile={profile} />
        </Suspense>
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
  
  // Check if the current user is the owner of this profile using the secure getUser method
  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user?.id === profile.id
  
  // Return the profile component with the requested user's profile data
  return (
    <>
      <ProfileComponent profile={profile} isOwner={isOwner} />
      <Suspense fallback={<div>Loading...</div>}>
        <RouteFocusModal profile={profile} />
      </Suspense>
    </>
  )
}
