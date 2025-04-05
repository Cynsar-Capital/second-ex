"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/supabase/utils";
import { Avatar, Heading, Text } from "@medusajs/ui";
import { Container } from "@medusajs/ui"
import { InlineTip } from "@medusajs/ui"

interface ProfileRecommendationsProps {
  profileId: string;
}

export function ProfileRecommendations({ profileId }: ProfileRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecommendations() {
      if (!profileId) return;
      
      try {
        setLoading(true);
        
        // Fetch approved and public recommendations for this profile
        const { data, error } = await supabase
          .from('profile_recommendations')
          .select('*')
          .eq('profile_id', profileId)
          .eq('status', 'approved')
          .eq('is_public', true)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setRecommendations(data || []);
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError('Failed to load recommendations');
      } finally {
        setLoading(false);
      }
    }
    
    fetchRecommendations();
  }, [profileId]);
  
  if (loading) {
    return (
      <div className="animate-pulse mt-8">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }
  
  if (error) {
    return <div className="text-red-500 mt-8">{error}</div>;
  }
  
  if (recommendations.length === 0) {
    return null; // Don't show anything if there are no recommendations
  }
  
  return (
    <div className="mt-8">
      <Heading level="h2" className="text-xl font-semibold mb-4">Recommendations</Heading>
      <div className="space-y-4">
        {recommendations.map((recommendation) => (
          <Container key={recommendation.id} className="p-4 shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg">
            <InlineTip label="Given by" variant="success">
              
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-4">
                {recommendation.recommender_avatar ? (
                  <Avatar 
                    src={recommendation.recommender_avatar} 
                    fallback={recommendation.recommender_name.charAt(0).toUpperCase()}
                  />
                ) : (
                  <Avatar fallback={recommendation.recommender_name.charAt(0).toUpperCase()} />
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium">{recommendation.recommender_name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {new Date(recommendation.created_at).toLocaleDateString()}
                </div>
                <Text className="whitespace-pre-wrap">{recommendation.recommendation_text}</Text>
              </div>
            </div>
            </InlineTip>
          </Container>
        ))}
      </div>
    </div>
  );
}
