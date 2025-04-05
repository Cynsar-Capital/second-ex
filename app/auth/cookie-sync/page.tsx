"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/supabase/utils';

// Simple page to set session from URL parameter and redirect
export default function CookieSync() {
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('Setting authentication cookies...');

  useEffect(() => {
    const handleSession = async () => {
      try {
        console.log('Cookie sync page loaded');
        
        // Get the session data from the URL
        const urlParams = new URLSearchParams(window.location.search);
        const sessionParam = urlParams.get('session');
        const redirectTo = urlParams.get('redirectTo') || '/';
        
        if (sessionParam) {
          console.log('Session parameter found, setting session');
          const session = JSON.parse(decodeURIComponent(sessionParam));
          
          // Set the session in Supabase
          const { error } = await supabase.auth.setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          });
          
          if (error) {
            console.error('Error setting session:', error);
            setStatus('error');
            setMessage(`Error setting session: ${error.message}`);
            return;
          }
          
          // Verify the user is properly authenticated using getUser (more secure)
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            console.error('Error verifying user authentication:', userError);
            setStatus('error');
            setMessage(`Error verifying authentication: ${userError.message}`);
            return;
          }
          
          if (!user) {
            console.error('No authenticated user found after setting session');
            setStatus('error');
            setMessage('Authentication failed: No user found');
            return;
          }
          
          console.log('User authenticated successfully:', user.id);
          
          // Store in localStorage as a backup
          localStorage.setItem('supabase.auth.token', JSON.stringify({
            currentSession: session,
            expiresAt: Math.floor(Date.now() / 1000) + (session.expires_in || 3600)
          }));
          
          console.log('Session set successfully');
          setStatus('success');
          setMessage('Authentication successful!');
          
          // Redirect after a short delay
          if (redirectTo) {
            console.log('Redirecting to:', redirectTo);
            setTimeout(() => {
              window.location.href = redirectTo;
            }, 500); // Small delay to ensure cookies are set
          }
        } else {
          // No session parameter
          console.log('No session parameter found');
          setStatus('error');
          setMessage('No session data provided');
          
          // Redirect to home after a delay
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
        }
      } catch (error: any) {
        console.error('Error handling session:', error);
        setStatus('error');
        setMessage(`Error: ${error?.message || 'Unknown error'}`);
        
        // Redirect to home after a delay
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      }
    };
    
    handleSession();
  }, []);
  
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      textAlign: 'center',
      maxWidth: '400px',
      margin: '40px auto',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      backgroundColor: status === 'error' ? '#fff8f8' : '#f8f9fa'
    }}>
      <h2 style={{ color: status === 'error' ? '#e53e3e' : '#3182ce' }}>
        {status === 'pending' ? 'Authenticating...' : 
         status === 'success' ? 'Authentication Successful' : 'Authentication Error'}
      </h2>
      <p>{message}</p>
      {status === 'success' && (
        <p style={{ fontSize: '14px', color: '#718096' }}>
          You will be redirected automatically...
        </p>
      )}
    </div>
  );
}
