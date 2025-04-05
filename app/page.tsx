// app/page.tsx - Home page using App Router

import { createServerSupabaseClient } from '@/supabase/server';
import ProfileComponent from "@/components/profile";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SignupDrawer } from '@/components/signup-drawer';

// Icons
import { CheckIcon } from 'lucide-react';

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
      // If they have a profile, redirect to their profile
      return <ProfileComponent profile={profile} />;
    }
  }
  
  // If no user is logged in, show the landing page
  return <LandingPage />;
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="text-2xl font-bold text-gray-900">2nd.exchange</div>
        <div className="flex gap-4">
          <SignupDrawer buttonText="Log in" buttonVariant="transparent" defaultTab="signin" />
          <SignupDrawer buttonText="Sign up" buttonVariant="primary" />
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Lets Ditch Attention-Seeking <br />
          <span className="text-blue-600">Professional Networks</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
          A clean, simple platform for professionals to showcase their work without
          the noise, algorithms, and constant pressure to post.
        </p>
        <div className="flex justify-center gap-4">
          <SignupDrawer 
            buttonText="Create Your Profile" 
            buttonSize="sm" 
            buttonClassName="px-8" 
            buttonVariant="danger"
            showArrow={true}
          />
          <Link href="https://saransh.2nd.exchange">
            <Button variant="default" size="lg" className="px-8 py-6">
              See Examples
            </Button>
          </Link>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-16">Why We are Better</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Benefit 1 */}
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="bg-blue-100 text-blue-600 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <CheckIcon className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Just One Page</h3>
            <p className="text-gray-600">
              No endless scrolling or complex profiles. Just one clean, professional page that showcases who you are.
            </p>
          </div>

          {/* Benefit 2 */}
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="bg-blue-100 text-blue-600 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <CheckIcon className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold mb-3">No Algorithms</h3>
            <p className="text-gray-600">
              Connect with professionals directly without fighting algorithms that decide who sees your content.
            </p>
          </div>

          {/* Benefit 3 */}
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="bg-blue-100 text-blue-600 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <CheckIcon className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold mb-3">No Daily Posts</h3>
            <p className="text-gray-600">
              Free from the pressure to post daily. Only bots and marketing companies can keep up with that pace anyway.
            </p>
          </div>

          {/* Benefit 4 */}
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="bg-blue-100 text-blue-600 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <CheckIcon className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Your Content, Yours</h3>
            <p className="text-gray-600">
              A better place to showcase your professional side without a company mining and monetizing your data.
            </p>
          </div>
        </div>
      </section>      

      {/* Footer */}

    </div>
  );
}
