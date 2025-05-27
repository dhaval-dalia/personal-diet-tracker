// src/components/profile/UserProfile.tsx
// This component displays and allows users to edit their profile information.
// It uses React Hook Form with Zod for validation and interacts directly with Supabase
// to fetch and update user profile data.

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  Input,
  Stack,
  Heading,
  Text,
  Select,
  useTheme,
  FormControl,
  FormLabel,
  FormErrorMessage,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';
import { userProfileSchema } from '../../utils/validation';
import { useAuth } from '../../hooks/useAuth';
import { useErrorHandling } from '../../hooks/useErrorHandling';
import { supabase } from '../../services/supabase';
import LoadingSpinner from '../shared/LoadingSpinner';

type UserProfileInputs = z.infer<typeof userProfileSchema>;

const UserProfile: React.FC = () => {
  const { user, isAuthReady } = useAuth();
  const { handleError, showToast } = useErrorHandling();
  const theme = useTheme();

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
    reset,
    setValue,
    watch,
  } = useForm<UserProfileInputs>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      fullName: '',
      age: undefined,
      gender: undefined,
      heightCm: undefined,
      weightKg: undefined,
      activityLevel: undefined,
    },
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id || !isAuthReady) {
        setIsLoadingProfile(false);
        return;
      }

      setIsLoadingProfile(true);
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          reset({
            fullName: data.fullName || '',
            age: data.age || undefined,
            gender: data.gender || undefined,
            heightCm: data.heightCm || undefined,
            weightKg: data.weightKg || undefined,
            activityLevel: data.activityLevel || undefined,
          });
        }
      } catch (err) {
        handleError(err, 'Failed to load user profile');
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchUserProfile();

    const profileSubscription = supabase
      .channel('public:user_profiles')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_profiles',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          if (payload.new) {
            reset({
              fullName: (payload.new as any).fullName || '',
              age: (payload.new as any).age || undefined,
              gender: (payload.new as any).gender || undefined,
              heightCm: (payload.new as any).heightCm || undefined,
              weightKg: (payload.new as any).weightKg || undefined,
              activityLevel: (payload.new as any).activityLevel || undefined,
            });
            showToast({
              title: 'Profile Updated!',
              description: 'Your profile has been updated in real-time.',
              status: 'info',
            });
          }
        }
      )
      .subscribe();

    return () => {
      profileSubscription.unsubscribe();
    };
  }, [user?.id, isAuthReady, reset, handleError, showToast]);

  const onSubmit = async (data: UserProfileInputs) => {
    if (!user?.id) {
      handleError('User not authenticated.', 'Authentication Error');
      return;
    }

    setIsSavingProfile(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({ user_id: user.id, ...data }, { onConflict: 'user_id' });

      if (error) throw error;

      showToast({
        title: 'Profile Saved!',
        description: 'Your profile information has been updated.',
        status: 'success',
      });
      reset(data);
    } catch (err) {
      handleError(err, 'Failed to save profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (isLoadingProfile) {
    return <LoadingSpinner message="Loading your profile..." />;
  }

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
      <Stack gap={6}>
        <Heading as="h2" size="xl" textAlign="center" color="text.dark">
          Your Profile
        </Heading>
        <Text fontSize="md" color="text.light" textAlign="center" mb={4}>
          Manage your personal details and fitness metrics.
        </Text>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack gap={4}>
            <FormControl id="fullName" isInvalid={!!errors.fullName}>
              <FormLabel color="text.dark">Full Name</FormLabel>
              <Input
                {...register('fullName')}
                placeholder="John Doe"
                borderColor="brand.200"
                _focus={{ borderColor: 'brand.300', boxShadow: `0 0 0 1px ${theme.colors.brand['300']}` }}
              />
              <FormErrorMessage>{errors.fullName?.message}</FormErrorMessage>
            </FormControl>

            <FormControl id="age" isInvalid={!!errors.age}>
              <FormLabel color="text.dark">Age</FormLabel>
              <NumberInput
                min={10}
                max={120}
                onChange={(_, valueAsNumber) => setValue('age', valueAsNumber)}
                defaultValue={watch('age')}
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
              <FormErrorMessage>{errors.age?.message}</FormErrorMessage>
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
              <FormErrorMessage>{errors.gender?.message}</FormErrorMessage>
            </FormControl>

            <FormControl id="heightCm" isInvalid={!!errors.heightCm}>
              <FormLabel color="text.dark">Height (cm)</FormLabel>
              <NumberInput
                min={50}
                max={250}
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
              <FormErrorMessage>{errors.heightCm?.message}</FormErrorMessage>
            </FormControl>

            <FormControl id="weightKg" isInvalid={!!errors.weightKg}>
              <FormLabel color="text.dark">Current Weight (kg)</FormLabel>
              <NumberInput
                min={20}
                max={300}
                precision={1}
                step={0.1}
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

            <Button
              type="submit"
              isLoading={isSavingProfile}
              disabled={!isDirty} // Disable if no changes
              colorScheme="teal"
              variant="solid"
              width="full"
              mt={4}
              bg="accent.500"
              color="white"
              _hover={{ bg: 'accent.600' }}
            >
              Save Profile
            </Button>
          </Stack>
        </form>
      </Stack>
    </Box>
  );
};

export default UserProfile;
