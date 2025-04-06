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
    return (
      <div className="mt-8">
        <div className="relative max-w-4xl w-full">
          {/* Timeline dot - semi-circle with shadow - improved responsive sizing */}
          <div className="absolute left-[43px] sm:left-[65px] md:left-[75px] lg:left-[85px] xl:left-[85px] 2xl:left-[85px] top-0 w-4 h-2 overflow-hidden z-10">
            <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-white dark:border-gray-800 shadow-md transform -translate-y-1/2"></div>
          </div>
          <div className="p-6 pt-8 mt-[-8px] bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-medium">Recommendations</h2>
            </div>
            <Text className="text-gray-600 dark:text-gray-300 mb-3">No recommendations yet</Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400">
              Share your profile with friends and colleagues and ask them for recommendations
            </Text>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="mt-8">
      <div className="space-y-4">
        <div className="relative max-w-4xl w-full">
          {/* Timeline dot - semi-circle with shadow - improved responsive sizing */}
          <div className="absolute left-[43px] sm:left-[65px] md:left-[75px] lg:left-[85px] xl:left-[85px] 2xl:left-[85px] top-0 w-4 h-2 overflow-hidden z-10">
            <div className="w-4 h-4 rounded-full bg-blue-500 dark:bg-blue-400 border-2 border-white dark:border-gray-800 shadow-md transform -translate-y-1/2"></div>
          </div>
          <div className="p-6 pt-8 mt-[-8px] bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-medium">Recommendations</h2>
            </div>
            {recommendations.map((recommendation) => (
              <div key={recommendation.id} className="mb-4 pb-4 divide-y py-0 border-b border-gray-200 dark:border-gray-700 last:border-b-0 last:mb-0 last:pb-0">
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
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
