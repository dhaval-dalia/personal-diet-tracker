// src/hooks/useRecommendations.ts
// This custom hook handles fetching personalized recommendations for the user.
// It interacts with the n8n recommendations workflow via the n8nWebhooks service.

import { useState, useCallback, useEffect } from 'react';
import { useErrorHandling } from './useErrorHandling';
import { requestRecommendations } from '../services/n8nWebhooks';
import { useAuth } from './useAuth'; // To get the current user's ID

// Define a type for the recommendation data structure
interface Recommendation {
  id: string;
  userId: string;
  type: 'nutrition' | 'exercise' | 'general';
  title: string;
  content: string;
  createdAt: string; // ISO date string
  // Add any other fields your recommendations might have
}

export const useRecommendations = () => {
  const { user, isAuthReady } = useAuth(); // Get user and auth status from useAuth hook
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { handleError } = useErrorHandling();

  /**
   * Fetches recommendations for the current user.
   * This function is memoized using useCallback to prevent unnecessary re-renders.
   */
  const fetchRecommendations = useCallback(async () => {
    if (!user?.id) {
      setError('User not authenticated or user ID not available.');
      setRecommendations([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Call the n8n webhook service to request recommendations
      const response = await requestRecommendations(user.id);
      // Assuming the response.data contains an array of recommendations
      setRecommendations(response.data || []);
    } catch (err) {
      handleError(err, 'Fetching recommendations');
      setError('Failed to fetch recommendations');
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, handleError]); // Re-run if user.id changes

  // Automatically fetch recommendations when the user is authenticated and ready
  useEffect(() => {
    if (isAuthReady && user?.id) {
      fetchRecommendations();
    }
  }, [isAuthReady, user?.id, fetchRecommendations]); // Dependencies for this effect

  return {
    recommendations,
    isLoading,
    error,
    fetchRecommendations, // Allow components to manually refresh recommendations
  };
};
