// src/components/auth/OnboardingFlow.tsx
// This component guides new users through an onboarding process to collect
// initial profile data. It utilizes React Hook Form with Zod for validation
// and sends the collected data to the n8n onboarding workflow via an API route.

import React, { useState, useEffect } from 'react';
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
import { useAuth } from '../../hooks/useAuth';
import { useErrorHandling } from '../../hooks/useErrorHandling';
import { triggerOnboarding } from '../../services/n8nWebhooks';
import { supabase } from '../../services/supabase';
import { useRouter } from 'next/router';

// Inline validation schema
const onboardingSchema = z.object({
  fullName: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s-']+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  age: z.number()
    .min(10, 'Age must be at least 10 years')
    .max(120, 'Age must not exceed 120 years'),
  gender: z.enum(['male', 'female', 'other'], {
    required_error: 'Please select one from the given list',
  }),
  profession: z.string()
    .min(2, 'Profession must be at least 2 characters')
    .max(100, 'Profession must not exceed 100 characters'),
  workHours: z.object({
    start: z.string().optional(),
    end: z.string().optional(),
    days: z.array(z.string()).min(1, 'Please select at least one work day')
  }),
  heightCm: z.number()
    .min(50, 'Height must be at least 50 cm')
    .max(250, 'Height must not exceed 250 cm'),
  weightKg: z.number()
    .min(20, 'Weight must be at least 20 kg')
    .max(300, 'Weight must not exceed 300 kg'),
  activityLevel: z.enum([
    'sedentary',
    'lightly_active',
    'moderately_active',
    'very_active',
    'extra_active'
  ], {
    required_error: 'Please select one from the given list',
  }),
  dietaryRestrictions: z.array(z.string())
    .min(1, 'Please select at least one food preference')
    .max(10, 'You can select up to 10 food preferences'),
  allergies: z.array(z.string())
    .max(10, 'You can select up to 10 allergies'),
  customAllergies: z.string()
    .max(200, 'Custom allergies description is too long')
    .optional(),
  medicalConditions: z.array(z.string())
    .min(1, 'Please select at least one option')
    .max(10, 'You can select up to 10 medical conditions'),
  preferredMealTimes: z.object({
    breakfast: z.string().optional(),
    lunch: z.string().optional(),
    dinner: z.string().optional()
  }).optional(),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced'], {
    required_error: 'Please select your fitness level'
  }),
  preferredWorkoutDays: z.array(z.string())
    .min(1, 'Please select at least one preferred workout day')
    .max(7, 'You can select up to 7 days'),
  goal: z.enum([
    'lose_weight',
    'maintain_weight',
    'gain_weight',
    'build_muscle'
  ], {
    required_error: 'Please select one from the given list',
  }),
  targetWeight: z.number()
    .min(20, 'Target weight must be at least 20 kg')
    .max(300, 'Target weight must not exceed 300 kg')
    .optional(),
  targetDate: z.string().optional(),
  weeklyWorkoutGoal: z.number()
    .min(0, 'Weekly workout goal must be at least 0 days')
    .max(7, 'Weekly workout goal cannot exceed 7 days')
    .optional(),
  waterIntakeGoal: z.number()
    .min(0, 'Water intake goal must be at least 0 liters')
    .max(10, 'Water intake goal cannot exceed 10 liters')
    .optional(),
  sleepGoal: z.number()
    .min(4, 'Sleep goal must be at least 4 hours')
    .max(12, 'Sleep goal cannot exceed 12 hours')
    .optional(),
  mealPrepPreference: z.enum(['daily', 'weekly', 'none']).optional(),
}).refine(data => {
  if (data.goal === 'lose_weight' && data.targetWeight) {
    return data.targetWeight < data.weightKg;
  }
  return true;
}, {
  message: 'Target weight must be less than current weight for weight loss goals',
  path: ['targetWeight'],
});

type OnboardingFormInputs = z.infer<typeof onboardingSchema>;

interface OnboardingFlowProps {
  onOnboardingComplete?: () => void;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onOnboardingComplete }) => {
  const { user } = useAuth();
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
    trigger,
  } = useForm<OnboardingFormInputs>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      dietaryRestrictions: [],
      allergies: [],
      medicalConditions: [],
      preferredMealTimes: {},
      preferredWorkoutDays: [],
      workHours: {
        start: '',
        end: '',
        days: []
      },
      weeklyWorkoutGoal: 3,
      waterIntakeGoal: 2,
      sleepGoal: 8,
      mealPrepPreference: 'daily'
    },
  });

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    const subscription = watch((formData) => {
      localStorage.setItem('onboardingFormData', JSON.stringify(formData));
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // Restore form data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('onboardingFormData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        Object.entries(parsedData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            setValue(key as keyof OnboardingFormInputs, value as any);
          }
        });
      } catch (error) {
        console.error('Error restoring form data:', error);
      }
    }
  }, [setValue]);

  // Save current step to localStorage
  useEffect(() => {
    localStorage.setItem('onboardingStep', step.toString());
  }, [step]);

  // Restore step on component mount
  useEffect(() => {
    const savedStep = localStorage.getItem('onboardingStep');
    if (savedStep) {
      setStep(parseInt(savedStep, 10));
    }
  }, []);

  const calculateAverageWorkHours = (workHours: any) => {
    if (!workHours.days || workHours.days.length === 0) return 0;
    
    const start = new Date(`2000-01-01T${workHours.start}`);
    const end = new Date(`2000-01-01T${workHours.end}`);
    const hoursPerDay = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return Math.round(hoursPerDay * workHours.days.length / 7);
  };

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
      // Log the user ID and data being saved
      console.log('Current user:', user);
      console.log('Form data to be saved:', data);

      // Save all data to user_profiles table
      const profileData = {
        user_id: user.id,
        full_name: data.fullName,
        age: data.age,
        gender: data.gender,
        profession: data.profession,
        work_hours: calculateAverageWorkHours(data.workHours),
        height_cm: data.heightCm,
        weight_kg: data.weightKg,
        activity_level: data.activityLevel,
        dietary_restrictions: data.dietaryRestrictions || [],
        allergies: data.allergies || [],
        custom_allergies: data.customAllergies || null,
        medical_conditions: data.medicalConditions || [],
        preferred_meal_times: data.preferredMealTimes || {},
        fitness_level: (data.fitnessLevel || 'beginner') as 'beginner' | 'intermediate' | 'advanced',
        preferred_workout_days: data.preferredWorkoutDays || [],
        goal_type: data.goal,
        target_weight: data.targetWeight || null,
        target_date: data.targetDate || null,
        weekly_workout_goal: data.weeklyWorkoutGoal || 3,
        water_intake_goal: data.waterIntakeGoal || 2,
        sleep_goal: data.sleepGoal || 8,
        meal_prep_preference: data.mealPrepPreference || 'daily',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Attempting to save profile data:', profileData);
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert([profileData], {
          onConflict: 'user_id'
        });

      if (profileError) {
        console.error('Profile save error:', profileError);
        throw new Error(`Failed to save profile: ${profileError.message}`);
      }
      console.log('Profile saved successfully');

      // Trigger onboarding workflow
      console.log('Triggering onboarding workflow...');
      await triggerOnboarding({
        userId: user.id,
        timestamp: new Date().toISOString(),
        context: {
          platform: 'web',
          source: 'onboarding-flow'
        }
      });

      // Clear localStorage after successful submission
      localStorage.removeItem('onboardingFormData');
      localStorage.removeItem('onboardingStep');

      toast({
        title: 'Success',
        description: 'Your profile has been set up successfully! Redirecting to dashboard...',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Reset form and redirect
      reset();
      
      // Add a small delay to allow the success message to be seen
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (error) {
      console.error('Error in onboarding submission:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save your profile. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateCurrentStep = async () => {
    const currentStepFields = {
      1: ['fullName', 'age', 'gender', 'heightCm', 'weightKg', 'activityLevel'] as const,
      2: ['dietaryRestrictions', 'allergies', 'medicalConditions', 'preferredMealTimes', 'fitnessLevel', 'preferredWorkoutDays'] as const,
      3: ['goal', 'targetWeight', 'targetDate', 'weeklyWorkoutGoal', 'waterIntakeGoal', 'sleepGoal', 'mealPrepPreference'] as const
    };

    const fieldsToValidate = currentStepFields[step as keyof typeof currentStepFields];
    const result = await trigger(fieldsToValidate);
    return result;
  };

  const handleNextStep = async () => {
    const isValid = await validateCurrentStep();
    if (isValid) {
      setStep(step + 1);
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
                <Input 
                  {...register('fullName')} 
                  placeholder="Enter your full name"
                />
                <FormErrorMessage>{errors.fullName?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.age}>
                <FormLabel>Age</FormLabel>
                <NumberInput min={10} max={120}>
                  <NumberInputField 
                    {...register('age', { valueAsNumber: true })} 
                    placeholder="Enter your age"
                  />
                </NumberInput>
                <FormErrorMessage>{errors.age?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.gender}>
                <FormLabel>Gender</FormLabel>
                <Select {...register('gender')}>
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </Select>
                <FormErrorMessage>{errors.gender?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.profession}>
                <FormLabel>Profession</FormLabel>
                <Input 
                  {...register('profession')} 
                  placeholder="Enter your profession"
                />
                <FormErrorMessage>{errors.profession?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.workHours}>
                <FormLabel>Work Hours</FormLabel>
                <VStack spacing={2}>
                  <HStack>
                    <Text>Start Time:</Text>
                    <Input 
                      type="time" 
                      {...register('workHours.start')}
                      onChange={(e) => {
                        setValue('workHours.start', e.target.value);
                        trigger('workHours');
                      }}
                    />
                  </HStack>
                  <HStack>
                    <Text>End Time:</Text>
                    <Input 
                      type="time" 
                      {...register('workHours.end')}
                      onChange={(e) => {
                        setValue('workHours.end', e.target.value);
                        trigger('workHours');
                      }}
                    />
                  </HStack>
                  <FormLabel>Work Days</FormLabel>
                  <CheckboxGroup 
                    onChange={(values: string[]) => {
                      setValue('workHours.days', values);
                      trigger('workHours');
                    }}
                  >
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
                </VStack>
                <FormErrorMessage>{errors.workHours?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.heightCm}>
                <FormLabel>Height (cm)</FormLabel>
                <NumberInput min={50} max={250}>
                  <NumberInputField 
                    {...register('heightCm', { valueAsNumber: true })} 
                    placeholder="Enter your height"
                  />
                </NumberInput>
                <FormErrorMessage>{errors.heightCm?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.weightKg}>
                <FormLabel>Weight (kg)</FormLabel>
                <NumberInput min={20} max={300}>
                  <NumberInputField 
                    {...register('weightKg', { valueAsNumber: true })} 
                    placeholder="Enter your weight"
                  />
                </NumberInput>
                <FormErrorMessage>{errors.weightKg?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.activityLevel}>
                <FormLabel>Activity Level</FormLabel>
                <Select {...register('activityLevel')}>
                  <option value="">Select activity level</option>
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
              <FormControl isInvalid={!!errors.dietaryRestrictions}>
                <FormLabel>Food Type Preferences</FormLabel>
                <CheckboxGroup 
                  onChange={(values: string[]) => {
                    setValue('dietaryRestrictions', values);
                    trigger('dietaryRestrictions');
                  }}
                  defaultValue={watch('dietaryRestrictions')}
                >
                  <Stack>
                    <Checkbox value="vegetarian">Vegetarian</Checkbox>
                    <Checkbox value="non_vegetarian">Non-Vegetarian</Checkbox>
                    <Checkbox value="vegan">Vegan</Checkbox>
                    <Checkbox value="eggetarian">Eggetarian</Checkbox>
                    <Checkbox value="pescatarian">Pescatarian</Checkbox>
                    <Checkbox value="gluten_free">Gluten-Free</Checkbox>
                    <Checkbox value="dairy_free">Dairy-Free</Checkbox>
                    <Checkbox value="halal">Halal</Checkbox>
                    <Checkbox value="kosher">Kosher</Checkbox>
                  </Stack>
                </CheckboxGroup>
                <FormErrorMessage>{errors.dietaryRestrictions?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.allergies}>
                <FormLabel>I am allergic to</FormLabel>
                <CheckboxGroup 
                  onChange={(values: string[]) => {
                    setValue('allergies', values);
                    trigger('allergies');
                  }}
                  defaultValue={watch('allergies')}
                >
                  <Stack>
                    <Checkbox value="nuts">Nuts</Checkbox>
                    <Checkbox value="shellfish">Shellfish</Checkbox>
                    <Checkbox value="dairy">Dairy</Checkbox>
                    <Checkbox value="eggs">Eggs</Checkbox>
                    <Checkbox value="soy">Soy</Checkbox>
                    <Checkbox value="wheat">Wheat</Checkbox>
                    <Checkbox value="fish">Fish</Checkbox>
                    <Checkbox value="sesame">Sesame</Checkbox>
                    <Checkbox value="peanuts">Peanuts</Checkbox>
                  </Stack>
                </CheckboxGroup>
                <FormErrorMessage>{errors.allergies?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.customAllergies}>
                <FormLabel>Other Allergies</FormLabel>
                <Input
                  placeholder="I am allergic to..."
                  {...register('customAllergies')}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value && !value.startsWith('I am allergic to')) {
                      setValue('customAllergies', `I am allergic to ${value}`);
                    }
                    trigger('customAllergies');
                  }}
                />
                <FormErrorMessage>{errors.customAllergies?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.medicalConditions}>
                <FormLabel>Medical Conditions</FormLabel>
                <CheckboxGroup 
                  onChange={(values: string[]) => {
                    setValue('medicalConditions', values);
                    trigger('medicalConditions');
                  }}
                  defaultValue={watch('medicalConditions')}
                >
                  <Stack>
                    <Checkbox value="fit_and_fine">I am fit and fine</Checkbox>
                    <Checkbox value="diabetes">Diabetes</Checkbox>
                    <Checkbox value="hypertension">Hypertension</Checkbox>
                    <Checkbox value="heart_disease">Heart Disease</Checkbox>
                    <Checkbox value="thyroid">Thyroid Issues</Checkbox>
                  </Stack>
                </CheckboxGroup>
                <FormErrorMessage>{errors.medicalConditions?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.preferredMealTimes}>
                <FormLabel>Preferred Meal Times</FormLabel>
                <VStack spacing={2}>
                  <HStack>
                    <Text>Breakfast:</Text>
                    <Input 
                      type="time" 
                      onChange={(e) => {
                        setValue('preferredMealTimes.breakfast', e.target.value);
                        trigger('preferredMealTimes');
                      }}
                      defaultValue={watch('preferredMealTimes.breakfast')}
                    />
                  </HStack>
                  <HStack>
                    <Text>Lunch:</Text>
                    <Input 
                      type="time" 
                      onChange={(e) => {
                        setValue('preferredMealTimes.lunch', e.target.value);
                        trigger('preferredMealTimes');
                      }}
                      defaultValue={watch('preferredMealTimes.lunch')}
                    />
                  </HStack>
                  <HStack>
                    <Text>Dinner:</Text>
                    <Input 
                      type="time" 
                      onChange={(e) => {
                        setValue('preferredMealTimes.dinner', e.target.value);
                        trigger('preferredMealTimes');
                      }}
                      defaultValue={watch('preferredMealTimes.dinner')}
                    />
                  </HStack>
                </VStack>
                <FormErrorMessage>{errors.preferredMealTimes?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.fitnessLevel}>
                <FormLabel>Fitness Level</FormLabel>
                <Select 
                  {...register('fitnessLevel')}
                  onChange={(e) => {
                    setValue('fitnessLevel', e.target.value as 'beginner' | 'intermediate' | 'advanced');
                    trigger('fitnessLevel');
                  }}
                >
                  <option value="">Select fitness level</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </Select>
                <FormErrorMessage>{errors.fitnessLevel?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.preferredWorkoutDays}>
                <FormLabel>Preferred Workout Days</FormLabel>
                <CheckboxGroup 
                  onChange={(values: string[]) => {
                    setValue('preferredWorkoutDays', values);
                    trigger('preferredWorkoutDays');
                  }}
                  defaultValue={watch('preferredWorkoutDays')}
                >
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
                <FormErrorMessage>{errors.preferredWorkoutDays?.message}</FormErrorMessage>
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
              <Button onClick={handleNextStep}>
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
