// src/hooks/useMealLogging.ts
// This custom hook encapsulates the logic for logging meals,
// managing state related to meal entry, and interacting with the
// n8n meal logging workflow via the n8nWebhooks service.

import { useState, useCallback } from 'react';
import { useErrorHandling } from './useErrorHandling';
import { logMeal } from '../services/n8nWebhooks';
import { mealLogSchema, foodItemSchema } from '../utils/validation';
import { z } from 'zod';

// Define types for meal and food items based on Zod schemas
export type MealLogData = z.infer<typeof mealLogSchema>;
export type FoodItemData = z.infer<typeof foodItemSchema>;

export const useMealLogging = () => {
  const [isLogging, setIsLogging] = useState(false);
  const [logSuccess, setLogSuccess] = useState(false);
  const { handleError } = useErrorHandling();

  /**
   * Submits meal data to the n8n meal logging workflow.
   * @param mealData - The complete meal log data.
   */
  const submitMealLog = useCallback(async (mealData: MealLogData) => {
    setIsLogging(true);
    setLogSuccess(false);
    try {
      // Validate data against the schema before sending
      mealLogSchema.parse(mealData);

      // Call the n8n webhook service to log the meal
      const response = await logMeal(mealData);
      console.log('Meal logged successfully:', response);
      setLogSuccess(true);
      return response;
    } catch (error) {
      handleError(error);
      setLogSuccess(false);
      throw error; // Re-throw to allow component to handle if needed
    } finally {
      setIsLogging(false);
    }
  }, [handleError]);

  return {
    isLogging,
    logSuccess,
    submitMealLog,
  };
};
