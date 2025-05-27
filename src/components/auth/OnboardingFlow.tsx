// src/components/auth/OnboardingFlow.tsx
// This component guides new users through an onboarding process to collect
// initial profile data. It utilizes React Hook Form with Zod for validation
// and sends the collected data to the n8n onboarding workflow via an API route.

import React from 'react';
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
} from '@chakra-ui/react';
import { onboardingSchema } from '../../utils/validation';
import { useAuth } from '../../hooks/useAuth';
import { useErrorHandling } from '../../hooks/useErrorHandling';
import { triggerOnboarding } from '../../services/n8nWebhooks'; // Import the n8n trigger

// Define the type for form data based on the Zod schema
type OnboardingFormInputs = z.infer<typeof onboardingSchema>;

interface OnboardingFlowProps {
  onOnboardingComplete?: () => void; // Callback for successful onboarding
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onOnboardingComplete }) => {
  const { user } = useAuth(); // Get the current authenticated user
  const { handleError, showToast } = useErrorHandling();
  const theme = useTheme();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<OnboardingFormInputs>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      fullName: '',
      age: undefined, // Use undefined for number inputs initially
      gender: undefined,
      heightCm: undefined,
      weightKg: undefined,
      activityLevel: undefined,
      goal: undefined,
    },
  });

  /**
   * Handles the form submission for onboarding.
   * @param data - The validated form data.
   */
  const onSubmit = async (data: OnboardingFormInputs) => {
    if (!user?.id) {
      handleError('User not authenticated for onboarding.', 'Authentication Error');
      return;
    }

    try {
      // Combine form data with user ID
      const onboardingData = {
        userId: user.id,
        email: user.email, // Include email for n8n workflow if needed
        ...data,
      };

      // Send data to the n8n onboarding workflow via the API route
      await triggerOnboarding(onboardingData);

      showToast({
        title: 'Onboarding Complete!',
        description: 'Your profile has been set up successfully.',
        status: 'success',
      });
      reset(); // Clear form fields
      onOnboardingComplete?.(); // Call completion callback
    } catch (error) {
      handleError(error, 'Onboarding failed');
    }
  };

  return (
    <Box
      p={8}
      maxWidth="600px"
      borderWidth={1}
      borderRadius="lg"
      boxShadow="lg"
      bg="whiteAlpha.700"
      borderColor="brand.200"
      mx="auto"
      my={8}
    >
      <Stack spacing={6}>
        <Heading as="h2" size="xl" textAlign="center" color="text.dark">
          Tell Us About Yourself
        </Heading>
        <Text fontSize="md" color="text.light" textAlign="center" mb={4}>
          Let's get some basic information to personalize your fitness journey.
        </Text>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={4}>
            <FormControl id="fullName" isInvalid={!!errors.fullName}>
              <FormLabel color="text.dark">Full Name</FormLabel>
              <Input
                {...register('fullName')}
                placeholder="John Doe"
                borderColor="brand.200"
                _focus={{ borderColor: 'brand.300', boxShadow: `0 0 0 1px ${theme.colors.brand['300']}` }}
              />
              <FormErrorMessage>{errors.fullName && errors.fullName.message}</FormErrorMessage>
            </FormControl>

            <FormControl id="age" isInvalid={!!errors.age}>
              <FormLabel color="text.dark">Age</FormLabel>
              <NumberInput
                min={10} max={120}
                onChange={(_, valueAsNumber) => setValue('age', valueAsNumber)}
                value={watch('age')}
              >
                <NumberInputField
                  {...register('age', { valueAsNumber: true })}
                  placeholder="e.g., 30"
                  borderColor="brand.200"
                  _focus={{ borderColor: 'brand.300', boxShadow: `0 0 0 1px ${theme.colors.brand['300']}` }}
                />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <FormErrorMessage>{errors.age && errors.age.message}</FormErrorMessage>
            </FormControl>

            <FormControl id="gender" isInvalid={!!errors.gender}>
              <FormLabel color="text.dark">Gender</FormLabel>
              <Select
                placeholder="Select gender"
                {...register('gender')}
                borderColor="brand.200"
                _focus={{ borderColor: 'brand.300', boxShadow: `0 0 0 1px ${theme.colors.brand['300']}` }}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>
              <FormErrorMessage>{errors.gender && errors.gender.message}</FormErrorMessage>
            </FormControl>

            <FormControl id="heightCm" isInvalid={!!errors.heightCm}>
              <FormLabel color="text.dark">Height (cm)</FormLabel>
              <NumberInput
                min={50} max={250}
                onChange={(_, valueAsNumber) => setValue('heightCm', valueAsNumber)}
                value={watch('heightCm')}
              >
                <NumberInputField
                  {...register('heightCm', { valueAsNumber: true })}
                  placeholder="e.g., 170"
                  borderColor="brand.200"
                  _focus={{ borderColor: 'brand.300', boxShadow: `0 0 0 1px ${theme.colors.brand['300']}` }}
                />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <FormErrorMessage>{errors.heightCm && errors.heightCm.message}</FormErrorMessage>
            </FormControl>

            <FormControl id="weightKg" isInvalid={!!errors.weightKg}>
              <FormLabel color="text.dark">Current Weight (kg)</FormLabel>
              <NumberInput
                min={20} max={300} precision={1} step={0.1}
                onChange={(_, valueAsNumber) => setValue('weightKg', valueAsNumber)}
                value={watch('weightKg')}
              >
                <NumberInputField
                  {...register('weightKg', { valueAsNumber: true })}
                  placeholder="e.g., 70.5"
                  borderColor="brand.200"
                  _focus={{ borderColor: 'brand.300', boxShadow: `0 0 0 1px ${theme.colors.brand['300']}` }}
                />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <FormErrorMessage>{errors.weightKg && errors.weightKg.message}</FormErrorMessage>
            </FormControl>

            <FormControl id="activityLevel" isInvalid={!!errors.activityLevel}>
              <FormLabel color="text.dark">Activity Level</FormLabel>
              <Select
                placeholder="Select activity level"
                {...register('activityLevel')}
                borderColor="brand.200"
                _focus={{ borderColor: 'brand.300', boxShadow: `0 0 0 1px ${theme.colors.brand['300']}` }}
              >
                <option value="sedentary">Sedentary (little or no exercise)</option>
                <option value="lightly_active">Lightly Active (light exercise/sports 1-3 days/week)</option>
                <option value="moderately_active">Moderately Active (moderate exercise/sports 3-5 days/week)</option>
                <option value="very_active">Very Active (hard exercise/sports 6-7 days/week)</option>
                <option value="extra_active">Extra Active (very hard exercise/physical job)</option>
              </Select>
              <FormErrorMessage>{errors.activityLevel && errors.activityLevel.message}</FormErrorMessage>
            </FormControl>

            <FormControl id="goal" isInvalid={!!errors.goal}>
              <FormLabel color="text.dark">Your Goal</FormLabel>
              <Select
                placeholder="Select your primary goal"
                {...register('goal')}
                borderColor="brand.200"
                _focus={{ borderColor: 'brand.300', boxShadow: `0 0 0 1px ${theme.colors.brand['300']}` }}
              >
                <option value="lose_weight">Lose Weight</option>
                <option value="maintain_weight">Maintain Weight</option>
                <option value="gain_weight">Gain Weight</option>
                <option value="build_muscle">Build Muscle</option>
              </Select>
              <FormErrorMessage>{errors.goal && errors.goal.message}</FormErrorMessage>
            </FormControl>

            <Button
              type="submit"
              isLoading={isSubmitting}
              colorScheme="teal"
              variant="solid"
              width="full"
              mt={4}
              bg="accent.100"
              color="text.dark"
              _hover={{ bg: 'accent.200' }}
            >
              Complete Onboarding
            </Button>
          </Stack>
        </form>
      </Stack>
    </Box>
  );
};

export default OnboardingFlow;
