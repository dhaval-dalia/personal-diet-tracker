// src/services/n8nWebhooks.ts
// This file defines functions to interact with n8n workflows via Next.js API routes.
// It acts as an abstraction layer, preventing direct exposure of n8n webhook URLs
// to the client-side and ensuring all calls are proxied through a secure backend route.

/**
 * Logs a meal by sending meal data to the /api/n8n/meal-log Next.js API route.
 * This route then forwards the data to the n8n Meal Logging Workflow.
 * @param mealData - The data for the meal to be logged.
 * @returns A promise that resolves with the response data from the n8n workflow.
 * @throws An error if the API call fails.
 */
export const logMeal = async (mealData: any) => {
    try {
      const response = await fetch('/api/n8n/meal-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mealData),
      });
  
      if (!response.ok) {
        const errorBody = await response.json();
        // Throw a specific error message from the backend if available, otherwise a generic one.
        throw new Error(errorBody.message || 'Failed to log meal via n8n.');
      }
      return response.json();
    } catch (error: any) {
      console.error('Error in logMeal service:', error);
      throw error; // Re-throw to be handled by the calling component/hook
    }
  };
  
  /**
   * Triggers the onboarding workflow by sending user data to the /api/n8n/onboarding
   * Next.js API route. This route then forwards the data to the n8n Onboarding Workflow.
   * @param userData - The initial user data for onboarding.
   * @returns A promise that resolves with the response data from the n8n workflow.
   * @throws An error if the API call fails.
   */
  export const triggerOnboarding = async (userData: any) => {
    try {
      const response = await fetch('/api/n8n/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
  
      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.message || 'Failed to trigger onboarding.');
      }
      return response.json();
    } catch (error: any) {
      console.error('Error in triggerOnboarding service:', error);
      throw error;
    }
  };
  
  /**
   * Requests recommendations by sending a user ID to the /api/n8n/recommendations
   * Next.js API route. This route then forwards the request to the n8n Recommendations Workflow.
   * @param userId - The ID of the user for whom recommendations are requested.
   * @returns A promise that resolves with the response data from the n8n workflow.
   * @throws An error if the API call fails.
   */
  export const requestRecommendations = async (userId: string) => {
    try {
      const response = await fetch('/api/n8n/recommendations', {
        method: 'POST', // Using POST as it triggers a backend process
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
  
      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.message || 'Failed to request recommendations.');
      }
      return response.json();
    } catch (error: any) {
      console.error('Error in requestRecommendations service:', error);
      throw error;
    }
  };
  
  // You might add more n8n related service functions here as needed.
  