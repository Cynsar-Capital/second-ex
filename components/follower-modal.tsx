"use client";

import { useState } from 'react';
import { FocusModal, Text, Button, Input, Label, Alert, Textarea } from "@medusajs/ui";
import { CheckCircleSolid } from "@medusajs/icons";
import { supabase } from '@/supabase/utils';

interface FollowerModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileId: string | undefined;
  username: string | undefined;
}

export function FollowerModal({ isOpen, onClose, profileId, username }: FollowerModalProps) {
  // State for follower form
  const [followerData, setFollowerData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [followSubmitted, setFollowSubmitted] = useState(false);
  const [followError, setFollowError] = useState('');

  // Handle follower form submission
  const handleFollowerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFollowError('');
    
    try {
      if (!followerData.name || !followerData.email) {
        setFollowError('Name and email are required');
        return;
      }
      
      // Insert into profile_followers table
      const { error } = await supabase
        .from('profile_followers')
        .insert({
          profile_id: profileId,
          follower_name: followerData.name,
          follower_email: followerData.email,
          follower_message: followerData.message || null
        });

      if (error) {
        console.error('Error adding follower:', error);
        setFollowError(error.message);
        return;
      }

      // Show success state
      setFollowSubmitted(true);
    } catch (error: any) {
      console.error('Error submitting follower data:', error);
      setFollowError(error.message || 'An error occurred');
    }
  };
  
  // Handle creating your own profile
  const handleCreateProfile = () => {
    window.location.href = '/signup';
  };

  // Handle modal close
  const handleModalClose = () => {
    // Reset form state
    setFollowerData({
      name: '',
      email: '',
      message: ''
    });
    setFollowSubmitted(false);
    setFollowError('');
    onClose();
  };

  return (
    <FocusModal open={isOpen} onOpenChange={(open) => {
      if (!open) handleModalClose();
    }}>
      <FocusModal.Content className="max-w-md w-full mx-auto" style={{ zIndex: 50 }}>
        {!followSubmitted ? (
          <>
            <FocusModal.Header>
              <h2 className="text-xl font-semibold">Follow {username || "this profile"}</h2>
            </FocusModal.Header>
            <FocusModal.Body className="py-4 px-6">
              <form id="follower-form" onSubmit={handleFollowerSubmit}>
                <div className="space-y-5">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Enter your details to follow this profile. You&apos;ll receive updates when they make changes.
                  </p>
                  
                  {followError && (
                    <Alert variant="error" className="mb-4">
                      <Text size="small">{followError}</Text>
                    </Alert>
                  )}
                  
                  <div>
                    <Label htmlFor="follower-name">Your Name *</Label>
                    <Input 
                      id="follower-name"
                      placeholder="Enter your name"
                      value={followerData.name}
                      onChange={(e) => setFollowerData({...followerData, name: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="follower-email">Your Email *</Label>
                    <Input 
                      id="follower-email"
                      type="email"
                      placeholder="Enter your email"
                      value={followerData.email}
                      onChange={(e) => setFollowerData({...followerData, email: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="follower-message">Message (Optional)</Label>
                    <Textarea 
                      id="follower-message"
                      placeholder="Add a message (optional)"
                      value={followerData.message}
                      onChange={(e) => setFollowerData({...followerData, message: e.target.value})}
                    />
                  </div>
                </div>
              </form>
            </FocusModal.Body>
            <FocusModal.Footer className="border-t border-gray-200 p-4">
              <div className="flex justify-end gap-x-3 w-full">
                <Button variant="secondary" onClick={handleModalClose}>
                  Cancel
                </Button>
                <Button form="follower-form" type="submit">
                  Follow
                </Button>
              </div>
            </FocusModal.Footer>
          </>
        ) : (
          <>
            <FocusModal.Header>
              <h2 className="text-xl font-semibold">Thanks for Following!</h2>
            </FocusModal.Header>
            <FocusModal.Body className="py-4 px-6">
              <div className="space-y-5">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Thank you for following {username || "this profile"}! You&apos;ll receive updates when they make changes.
                </p>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-md mt-6">
                  <div className="flex items-center gap-x-2 mb-3">
                    <CheckCircleSolid className="text-green-500 h-5 w-5" />
                    <Text size="small" className="font-medium">Want your own profile?</Text>
                  </div>
                  <Text size="small" className="text-gray-600 dark:text-gray-300 mb-4">
                    Create your own profile to showcase your work and connect with others.
                  </Text>
                  <Button size="small" className="w-full sm:w-auto" onClick={handleCreateProfile}>
                    Create Your Profile
                  </Button>
                </div>
              </div>
            </FocusModal.Body>
            <FocusModal.Footer className="border-t border-gray-200 p-4">
              <div className="flex justify-end w-full">
                <Button variant="secondary" onClick={handleModalClose}>
                  Close
                </Button>
              </div>
            </FocusModal.Footer>
          </>
        )}
      </FocusModal.Content>
    </FocusModal>
  );
}
