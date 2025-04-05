import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get('profileId');
  const sectionKey = searchParams.get('sectionKey');
  
  if (!profileId || !sectionKey) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    );
  }
  
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if a section with this key already exists for this profile
    const { data, error, count } = await supabase
      .from('profile_sections')
      .select('*', { count: 'exact' })
      .eq('profile_id', profileId)
      .eq('section_key', sectionKey);
    
    if (error) {
      throw error;
    }
    
    // Return whether a duplicate exists
    return NextResponse.json({
      exists: count ? count > 0 : false,
      count: count || 0
    });
  } catch (error) {
    console.error('Error checking for duplicate section:', error);
    return NextResponse.json(
      { error: 'Failed to check for duplicate section' },
      { status: 500 }
    );
  }
}
