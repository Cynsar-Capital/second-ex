import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase, getCurrentUser } from "@/supabase/utils";

interface SubscribeDrawerProps {
  profileId?: string;
  username?: string;
}

export function SubscribeDrawer({ profileId, username }: SubscribeDrawerProps) {
  const [open, setOpen] = useState(false);
  const [recommendationData, setRecommendationData] = useState({
    name: "",
    email: "",
    text: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setRecommendationData(prev => ({
      ...prev,
      [id === "recommendation-text" ? "text" : id]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      // Validate form data
      if (!recommendationData.name || !recommendationData.email || !recommendationData.text) {
        throw new Error('Please fill in all required fields');
      }
      
      if (!profileId) {
        throw new Error('Profile information is missing');
      }
      
      // Check if user is logged in
      const { user } = await getCurrentUser();
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(recommendationData.email)) {
        throw new Error('Please enter a valid email address');
      }
      
      // Insert recommendation into Supabase
      const { data: insertData, error: insertError } = await supabase
        .from('profile_recommendations')
        .insert({
          profile_id: profileId,
          recommender_id: user?.id || null,
          recommender_name: recommendationData.name,
          recommender_email: recommendationData.email,
          recommendation_text: recommendationData.text,
          status: 'pending'
        });

      if (insertError) throw insertError;
      
      // Recommendation has been successfully saved to the database
      
      setSubmitted(true);
    } catch (err: any) {
      console.error('Error submitting recommendation:', err);
      setError(err.message || 'An error occurred while submitting your recommendation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Recommend me</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Recommend {username || 'this profile'}</DialogTitle>
          <DialogDescription>
            Your recommendation will be reviewed before being made public.
            Share your experience or thoughts about this profile to help others.
          </DialogDescription>
        </DialogHeader>
        
        {!submitted ? (
          <div className="grid gap-4 py-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Your Name
              </Label>
              <Input
                id="name"
                value={recommendationData.name}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="John Doe"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Your Email
              </Label>
              <Input
                id="email"
                type="email"
                value={recommendationData.email}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="your-email@example.com"
              />
            </div>
            
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="recommendation-text" className="text-right pt-2">
                Recommendation
              </Label>
              <Textarea
                id="recommendation-text"
                value={recommendationData.text}
                onChange={handleInputChange}
                className="col-span-3 min-h-[100px]"
                placeholder="Share your experience or thoughts about this profile..."
              />
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                onClick={handleSubmit} 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Recommendation"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="mb-4 flex justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-lg font-medium mb-2">Thank you for your recommendation!</div>
            <div className="text-gray-600 mb-4">
              Your recommendation has been submitted and is awaiting approval by {username ? `@${username}` : 'the profile owner'}.
            </div>
            <div className="text-sm text-gray-500 mb-4">
              Once approved, your recommendation will appear on their public profile.
            </div>
            <DialogFooter>
              <Button onClick={() => setOpen(false)} className="mt-2">
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
