// src/services/n8nWebhooks.ts
// This file defines functions to interact with n8n workflows via Next.js API routes.
// It acts as an abstraction layer, preventing direct exposure of n8n webhook URLs
// to the client-side and ensuring all calls are proxied through a secure backend route.

import { supabase } from './supabase';

interface MealLogData {
  userId: string;
  mealType: string;
  mealDate: string;
  mealTime: string;
  foodItems: Array<{
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    quantity: number;
    unit: string;
    barcode?: string;
  }>;
  notes?: string;
  timestamp: string;
}

interface ChatMessageData {
  userId: string;
  message: string;
  timestamp: string;
  response?: string;
  context: {
    platform: string;
    source: string;
  };
}

interface OnboardingData {
  userId: string;
  timestamp: string;
  context: {
    platform: string;
    source: string;
  };
}

interface RecommendationRequest {
  userId: string;
  timestamp: string;
  context: {
    platform: string;
    source: string;
  };
}

/**
 * Logs a meal by sending meal data to the /api/n8n/meal-log Next.js API route.
 * This route then forwards the data to the n8n Meal Logging Workflow.
 * @param mealData - The data for the meal to be logged.
 * @returns A promise that resolves with the response data from the n8n workflow.
 * @throws An error if the API call fails.
 */
export const logMeal = async (mealData: MealLogData) => {
  try {
    console.log('Sending meal data to n8n:', mealData);

    // First, try to save directly to Supabase
    const { data: mealLogData, error: mealLogError } = await supabase
      .from('meal_logs')
      .insert([{
        user_id: mealData.userId,
        meal_type: mealData.mealType,
        meal_date: mealData.mealDate,
        meal_time: mealData.mealTime,
        notes: mealData.notes,
        created_at: mealData.timestamp
      }])
      .select()
      .single();

    if (mealLogError) {
      console.error('Error saving meal log:', mealLogError);
      throw mealLogError;
    }

    console.log('Meal log saved:', mealLogData);

    // Then save food items
    const foodItems = mealData.foodItems.map(item => ({
      meal_log_id: mealLogData.id,
      name: item.name,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      quantity: item.quantity,
      unit: item.unit,
      barcode: item.barcode
    }));

    const { error: foodItemsError } = await supabase
      .from('meal_food_items')
      .insert(foodItems);

    if (foodItemsError) {
      console.error('Error saving food items:', foodItemsError);
      throw foodItemsError;
    }

    // If direct database save is successful, also trigger n8n workflow
    const response = await fetch('/api/n8n/meal-log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mealData),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error('n8n webhook error:', errorBody);
      throw new Error(errorBody.message || 'Failed to log meal via n8n.');
    }

    return response.json();
  } catch (error: any) {
    console.error('Error in logMeal service:', error);
    throw error;
  }
};

export const processChatMessage = async (data: ChatMessageData) => {
  try {
    // First save to database directly
    const { error: chatError } = await supabase
      .from('chat_interactions')
      .insert([
        {
          user_id: data.userId,
          message: data.message,
          response: data.response,
          confirmed: true,
        },
      ]);

    if (chatError) {
      console.error('Error saving chat interaction:', chatError);
      throw new Error('Failed to save chat interaction');
    }

    // Then trigger n8n workflow
    const response = await fetch('/api/n8n/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('n8n webhook error:', responseData);
      throw new Error(responseData.error || responseData.details || 'Failed to process chat message');
    }

    return responseData;
  } catch (error: any) {
    console.error('Error in processChatMessage service:', error);
    throw error;
  }
};

/**
 * Triggers the onboarding workflow for a new user
 * @param data - The onboarding data containing user ID and context
 * @returns A promise that resolves with the response data from the n8n workflow
 * @throws An error if the API call fails
 */
export const triggerOnboarding = async (data: OnboardingData) => {
  try {
    const response = await fetch('/api/n8n/onboarding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('n8n onboarding webhook error:', responseData);
      throw new Error(responseData.error || responseData.details || 'Failed to trigger onboarding');
    }

    return responseData;
  } catch (error: any) {
    console.error('Error in triggerOnboarding service:', error);
    throw error;
  }
};

export const requestRecommendations = async (userId: string) => {
  try {
    const response = await fetch('/api/n8n/recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        timestamp: new Date().toISOString(),
        context: {
          platform: 'web',
          source: 'recommendations-widget'
        }
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || responseData.details || 'Failed to fetch recommendations');
    }

    return responseData;
  } catch (error: any) {
    console.error('Error in requestRecommendations service:', error);
    throw error;
  }
};

export const requestAIRecommendations = async (data: RecommendationRequest) => {
  try {
    const response = await fetch('/api/n8n/ai-recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || responseData.details || 'Failed to fetch AI recommendations');
    }

    return responseData;
  } catch (error: any) {
    console.error('Error in requestAIRecommendations service:', error);
    throw error;
  }
};