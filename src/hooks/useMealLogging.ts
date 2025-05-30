// src/hooks/useMealLogging.ts
// This custom hook encapsulates the logic for logging meals,
// managing state related to meal entry, and interacting with the
// n8n meal logging workflow via the n8nWebhooks service.

import { useState, useCallback } from 'react';
import { useErrorHandling } from './useErrorHandling';
import { useAuth } from './useAuth';
import { logMeal, MealLogData } from '../services/n8nWebhooks';
import { mealLogSchema, foodItemSchema } from '../utils/validation';
import { z } from 'zod';

// Define types for meal and food items based on Zod schemas
export type FoodItemData = z.infer<typeof foodItemSchema>;

export const useMealLogging = () => {
  const [isLogging, setIsLogging] = useState(false);
  const [logSuccess, setLogSuccess] = useState(false);
  const { handleError } = useErrorHandling();
  const { user } = useAuth();

  /**
   * Submits meal data to the n8n meal logging workflow.
   * @param mealData - The complete meal log data.
   */
  const submitMealLog = useCallback(async (mealData: Omit<MealLogData, 'user_id' | 'created_at'>) => {
    if (!user?.id) throw new Error('User must be logged in to log meals');
    
    setIsLogging(true);
    setLogSuccess(false);
    try {
      const completeMealData: MealLogData = {
        ...mealData,
        user_id: user.id,
        created_at: new Date().toISOString()
      };

      mealLogSchema.parse(completeMealData);
      const response = await logMeal(completeMealData);
      console.log('Meal logged successfully:', response);
      setLogSuccess(true);
      return response;
    } catch (error) {
      handleError(error);
      setLogSuccess(false);
      throw error;
    } finally {
      setIsLogging(false);
    }
  }, [handleError, user?.id]);

  return {
    isLogging,
    logSuccess,
    submitMealLog,
  };
};
