// src/utils/validation.ts
// This file defines Zod schemas for various data structures used in the application.
// Zod provides a powerful, TypeScript-first way to declare validation schemas,
// which can then be used with React Hook Form for client-side validation.

import { z } from 'zod';

// --- Auth Schemas ---

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const signupSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  confirmPassword: z.string().min(6, 'Confirm Password is required'),
}).refine((data: { password: string; confirmPassword: string }) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'], // Path to the field that caused the error
});

// --- Onboarding Schemas ---

export const onboardingSchema = z.object({
  fullName: z.string().min(1, 'Full Name is required'),
  age: z.number().min(10, 'Age must be at least 10').max(120, 'Age seems too high').int('Age must be an integer'),
  gender: z.enum(['male', 'female', 'other'], { message: 'Please select a gender' }),
  heightCm: z.number().min(50, 'Height must be at least 50 cm').max(250, 'Height seems too high').int('Height must be an integer'),
  weightKg: z.number().min(20, 'Weight must be at least 20 kg').max(300, 'Weight seems too high'),
  activityLevel: z.enum(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active'], { message: 'Please select an activity level' }),
  goal: z.enum(['lose_weight', 'maintain_weight', 'gain_weight', 'build_muscle'], { message: 'Please select a goal' }),
});

// --- Meal Logging Schemas ---

export const foodItemSchema = z.object({
  name: z.string().min(1, 'Food name is required'),
  calories: z.number().min(0, 'Calories cannot be negative'),
  protein: z.number().min(0, 'Protein cannot be negative'),
  carbs: z.number().min(0, 'Carbs cannot be negative'),
  fat: z.number().min(0, 'Fat cannot be negative'),
  quantity: z.number().min(0.1, 'Quantity must be greater than 0'), // Quantity of this specific food item
  unit: z.string().min(1, 'Unit is required (e.g., g, ml, piece)'),
  barcode: z.string().optional(), // Optional for manual entry
});

export const mealLogSchema = z.object({
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'other'], { message: 'Please select a meal type' }),
  mealDate: z.string().min(1, 'Meal date is required'), // Consider using z.date() if using a date picker that returns Date objects
  mealTime: z.string().min(1, 'Meal time is required'), // e.g., "HH:MM"
  foodItems: z.array(foodItemSchema).min(1, 'At least one food item is required for a meal'),
  notes: z.string().optional(),
});

// --- User Profile & Goal Setting Schemas ---

export const userProfileSchema = z.object({
  fullName: z.string().min(1, 'Full Name is required'),
  age: z.number().min(10, 'Age must be at least 10').max(120, 'Age seems too high').int('Age must be an integer'),
  gender: z.enum(['male', 'female', 'other'], { message: 'Please select a gender' }),
  heightCm: z.number().min(50, 'Height must be at least 50 cm').max(250, 'Height seems too high').int('Height must be an integer'),
  weightKg: z.number().min(20, 'Weight must be at least 20 kg').max(300, 'Weight seems too high'),
  activityLevel: z.enum(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active'], { message: 'Please select an activity level' }),
});

export const goalSettingSchema = z.object({
  targetWeightKg: z.number().min(20, 'Target weight must be at least 20 kg').max(300, 'Target weight seems too high').optional(),
  targetCalories: z.number().min(500, 'Target calories must be at least 500').max(5000, 'Target calories seems too high').optional(),
  targetProteinRatio: z.number().min(0).max(100).optional(), // Percentage
  targetCarbsRatio: z.number().min(0).max(100).optional(),
  targetFatRatio: z.number().min(0).max(100).optional(),
}).refine((data: { targetProteinRatio?: number; targetCarbsRatio?: number; targetFatRatio?: number }) => {
  const totalRatio = (data.targetProteinRatio || 0) + (data.targetCarbsRatio || 0) + (data.targetFatRatio || 0);
  if (totalRatio > 0 && totalRatio !== 100) {
    return false; // Ratios must sum to 100 if any are provided
  }
  return true;
}, {
  message: 'Protein, Carbs, and Fat ratios must sum to 100 if specified.',
  path: ['targetProteinRatio'], // Error can be shown on any of these fields
});

export const preferencesSchema = z.object({
  receiveNotifications: z.boolean().optional(),
  notificationFrequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
  themePreference: z.enum(['light', 'dark', 'system']).optional(),
});
