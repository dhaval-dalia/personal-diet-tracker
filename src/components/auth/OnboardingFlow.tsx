// src/components/auth/OnboardingFlow.tsx
// This component guides new users through an onboarding process to collect
// initial profile data. It utilizes React Hook Form with Zod for validation
// and sends the collected data to the n8n onboarding workflow via an API route.

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Heading,
  Text,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  FormErrorMessage,
  useTheme,
  VStack,
  HStack,
  Checkbox,
  CheckboxGroup,
  StackDirection,
  useToast,
} from '@chakra-ui/react';
import { onboardingSchema } from '../../utils/validation';
import { useAuth } from '../../hooks/useAuth';
import { useErrorHandling } from '../../hooks/useErrorHandling';
import { triggerOnboarding } from '../../services/n8nWebhooks'; // Import the n8n trigger
import { supabase } from '../../services/supabase';
import { useRouter } from 'next/router';

// Define the type for form data based on the Zod schema
type OnboardingFormInputs = z.infer<typeof onboardingSchema>;

interface OnboardingFlowProps {
  onOnboardingComplete?: () => void; // Callback for successful onboarding
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onOnboardingComplete }) => {
  const { user } = useAuth(); // Get the current authenticated user
  const { handleError, showToast } = useErrorHandling();
  const theme = useTheme();
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
    reset,
    setValue,
  } = useForm<OnboardingFormInputs>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      dietaryRestrictions: [],
      allergies: [],
      medicalConditions: [],
      preferredMealTimes: {},
      preferredWorkoutDays: [],
      weeklyWorkoutGoal: 3,
      waterIntakeGoal: 2,
      sleepGoal: 8,
      mealPrepPreference: 'daily'
    },
  });

  /**
   * Handles the form submission for onboarding.
   * @param data - The validated form data.
   */
  const onSubmit = async (data: OnboardingFormInputs) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to complete onboarding',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Store user profile data
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          full_name: data.fullName,
          age: data.age,
          gender: data.gender,
          height_cm: data.heightCm,
          weight_kg: data.weightKg,
          activity_level: data.activityLevel,
          dietary_restrictions: data.dietaryRestrictions,
          allergies: data.allergies,
          medical_conditions: data.medicalConditions,
          preferred_meal_times: data.preferredMealTimes,
          fitness_level: data.fitnessLevel,
          preferred_workout_days: data.preferredWorkoutDays,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

      // Store user goals
      const { error: goalsError } = await supabase
        .from('user_goals')
        .upsert({
          user_id: user.id,
          goal_type: data.goal,
          target_weight: data.targetWeight,
          target_date: data.targetDate,
          weekly_workout_goal: data.weeklyWorkoutGoal,
          water_intake_goal: data.waterIntakeGoal,
          sleep_goal: data.sleepGoal,
          meal_prep_preference: data.mealPrepPreference,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (goalsError) throw goalsError;

      // Initialize user preferences
      const { error: preferencesError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (preferencesError) throw preferencesError;

      // Trigger n8n workflow with onboarding data
      await triggerOnboarding({
        userId: user.id,
        ...data
      });

      toast({
        title: 'Success',
        description: 'Your profile has been set up successfully!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      reset();
      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your profile. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box maxW="600px" mx="auto" p={6}>
      <VStack spacing={8} align="stretch">
        <Heading size="lg" textAlign="center">
          {step === 1 ? 'Basic Information' : 
           step === 2 ? 'Health & Preferences' : 
           'Goals & Targets'}
        </Heading>

        <form onSubmit={handleSubmit(onSubmit)}>
          {step === 1 && (
            <VStack spacing={4}>
              <FormControl isInvalid={!!errors.fullName}>
                <FormLabel>Full Name</FormLabel>
                <Input {...register('fullName')} />
                <FormErrorMessage>{errors.fullName?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.age}>
                <FormLabel>Age</FormLabel>
                <NumberInput min={10} max={120}>
                  <NumberInputField {...register('age', { valueAsNumber: true })} />
                </NumberInput>
                <FormErrorMessage>{errors.age?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.gender}>
                <FormLabel>Gender</FormLabel>
                <Select {...register('gender')}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </Select>
                <FormErrorMessage>{errors.gender?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.heightCm}>
                <FormLabel>Height (cm)</FormLabel>
                <NumberInput min={50} max={250}>
                  <NumberInputField {...register('heightCm', { valueAsNumber: true })} />
                </NumberInput>
                <FormErrorMessage>{errors.heightCm?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.weightKg}>
                <FormLabel>Weight (kg)</FormLabel>
                <NumberInput min={20} max={300}>
                  <NumberInputField {...register('weightKg', { valueAsNumber: true })} />
                </NumberInput>
                <FormErrorMessage>{errors.weightKg?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.activityLevel}>
                <FormLabel>Activity Level</FormLabel>
                <Select {...register('activityLevel')}>
                  <option value="sedentary">Sedentary</option>
                  <option value="lightly_active">Lightly Active</option>
                  <option value="moderately_active">Moderately Active</option>
                  <option value="very_active">Very Active</option>
                  <option value="extra_active">Extra Active</option>
                </Select>
                <FormErrorMessage>{errors.activityLevel?.message}</FormErrorMessage>
              </FormControl>
            </VStack>
          )}

          {step === 2 && (
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Dietary Restrictions</FormLabel>
                <CheckboxGroup onChange={(values: string[]) => setValue('dietaryRestrictions', values)}>
                  <Stack>
                    <Checkbox value="vegetarian">Vegetarian</Checkbox>
                    <Checkbox value="vegan">Vegan</Checkbox>
                    <Checkbox value="gluten_free">Gluten-Free</Checkbox>
                    <Checkbox value="dairy_free">Dairy-Free</Checkbox>
                    <Checkbox value="halal">Halal</Checkbox>
                    <Checkbox value="kosher">Kosher</Checkbox>
                  </Stack>
                </CheckboxGroup>
              </FormControl>

              <FormControl>
                <FormLabel>Allergies</FormLabel>
                <CheckboxGroup onChange={(values: string[]) => setValue('allergies', values)}>
                  <Stack>
                    <Checkbox value="nuts">Nuts</Checkbox>
                    <Checkbox value="shellfish">Shellfish</Checkbox>
                    <Checkbox value="dairy">Dairy</Checkbox>
                    <Checkbox value="eggs">Eggs</Checkbox>
                    <Checkbox value="soy">Soy</Checkbox>
                    <Checkbox value="wheat">Wheat</Checkbox>
                  </Stack>
                </CheckboxGroup>
              </FormControl>

              <FormControl>
                <FormLabel>Medical Conditions</FormLabel>
                <CheckboxGroup onChange={(values: string[]) => setValue('medicalConditions', values)}>
                  <Stack>
                    <Checkbox value="diabetes">Diabetes</Checkbox>
                    <Checkbox value="hypertension">Hypertension</Checkbox>
                    <Checkbox value="heart_disease">Heart Disease</Checkbox>
                    <Checkbox value="thyroid">Thyroid Issues</Checkbox>
                  </Stack>
                </CheckboxGroup>
              </FormControl>

              <FormControl>
                <FormLabel>Preferred Meal Times</FormLabel>
                <VStack spacing={2}>
                  <HStack>
                    <Text>Breakfast:</Text>
                    <Input type="time" onChange={(e) => setValue('preferredMealTimes.breakfast', e.target.value)} />
                  </HStack>
                  <HStack>
                    <Text>Lunch:</Text>
                    <Input type="time" onChange={(e) => setValue('preferredMealTimes.lunch', e.target.value)} />
                  </HStack>
                  <HStack>
                    <Text>Dinner:</Text>
                    <Input type="time" onChange={(e) => setValue('preferredMealTimes.dinner', e.target.value)} />
                  </HStack>
                </VStack>
              </FormControl>

              <FormControl>
                <FormLabel>Fitness Level</FormLabel>
                <Select {...register('fitnessLevel')}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Preferred Workout Days</FormLabel>
                <CheckboxGroup onChange={(values: string[]) => setValue('preferredWorkoutDays', values)}>
                  <Stack direction="row" wrap="wrap">
                    <Checkbox value="monday">Mon</Checkbox>
                    <Checkbox value="tuesday">Tue</Checkbox>
                    <Checkbox value="wednesday">Wed</Checkbox>
                    <Checkbox value="thursday">Thu</Checkbox>
                    <Checkbox value="friday">Fri</Checkbox>
                    <Checkbox value="saturday">Sat</Checkbox>
                    <Checkbox value="sunday">Sun</Checkbox>
                  </Stack>
                </CheckboxGroup>
              </FormControl>
            </VStack>
          )}

          {step === 3 && (
            <VStack spacing={4}>
              <FormControl isInvalid={!!errors.goal}>
                <FormLabel>Primary Goal</FormLabel>
                <Select {...register('goal')}>
                  <option value="lose_weight">Lose Weight</option>
                  <option value="maintain_weight">Maintain Weight</option>
                  <option value="gain_weight">Gain Weight</option>
                  <option value="build_muscle">Build Muscle</option>
                </Select>
                <FormErrorMessage>{errors.goal?.message}</FormErrorMessage>
              </FormControl>

              {watch('goal') === 'lose_weight' && (
                <>
                  <FormControl>
                    <FormLabel>Target Weight (kg)</FormLabel>
                    <NumberInput min={20} max={300}>
                      <NumberInputField {...register('targetWeight', { valueAsNumber: true })} />
                    </NumberInput>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Target Date</FormLabel>
                    <Input type="date" {...register('targetDate')} />
                  </FormControl>
                </>
              )}

              <FormControl>
                <FormLabel>Weekly Workout Goal (days)</FormLabel>
                <NumberInput min={0} max={7}>
                  <NumberInputField {...register('weeklyWorkoutGoal', { valueAsNumber: true })} />
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>Daily Water Intake Goal (liters)</FormLabel>
                <NumberInput min={0} max={10} step={0.5}>
                  <NumberInputField {...register('waterIntakeGoal', { valueAsNumber: true })} />
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>Sleep Goal (hours)</FormLabel>
                <NumberInput min={4} max={12}>
                  <NumberInputField {...register('sleepGoal', { valueAsNumber: true })} />
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>Meal Prep Preference</FormLabel>
                <Select {...register('mealPrepPreference')}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="none">No Meal Prep</option>
                </Select>
              </FormControl>
            </VStack>
          )}

          <HStack justify="space-between" mt={8}>
            {step > 1 && (
              <Button onClick={() => setStep(step - 1)}>
                Previous
              </Button>
            )}
            {step < 3 ? (
              <Button onClick={() => setStep(step + 1)}>
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                colorScheme="blue"
                isLoading={isSubmitting}
                loadingText="Saving..."
              >
                Complete Setup
              </Button>
            )}
          </HStack>
        </form>
      </VStack>
    </Box>
  );
};

export default OnboardingFlow;
