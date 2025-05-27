// src/components/profile/GoalSetting.tsx
// This component allows users to set and update their fitness and nutrition goals.
// It uses React Hook Form with Zod for validation and interacts directly with Supabase
// to manage user goals.

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
  HStack,
  InputGroup,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Divider,
  useTheme,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  InputRightElement,
} from '@chakra-ui/react';
import { goalSettingSchema } from '../../utils/validation';
import { useAuth } from '../../hooks/useAuth';
import { useErrorHandling } from '../../hooks/useErrorHandling';
import { supabase } from '../../services/supabase';
import LoadingSpinner from '../shared/LoadingSpinner';

// Define the type for form data based on the Zod schema
type GoalSettingInputs = z.infer<typeof goalSettingSchema>;

const GoalSetting: React.FC = () => {
  const { user, isAuthReady } = useAuth();
  const { handleError, showToast } = useErrorHandling();
  const theme = useTheme();

  const [isLoadingGoals, setIsLoadingGoals] = useState(true);
  const [isSavingGoals, setIsSavingGoals] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
    reset,
    setValue,
    watch,
  } = useForm<GoalSettingInputs>({
    resolver: zodResolver(goalSettingSchema),
    defaultValues: {
      targetWeightKg: undefined,
      targetCalories: undefined,
      targetProteinRatio: undefined,
      targetCarbsRatio: undefined,
      targetFatRatio: undefined,
    },
  });

  const protein = watch('targetProteinRatio');
  const carbs = watch('targetCarbsRatio');
  const fat = watch('targetFatRatio');
  const macroSum = (protein || 0) + (carbs || 0) + (fat || 0);
  const showMacroSumWarning = macroSum > 0 && macroSum !== 100;

  useEffect(() => {
    const fetchUserGoals = async () => {
      if (!user?.id || !isAuthReady) {
        setIsLoadingGoals(false);
        return;
      }

      setIsLoadingGoals(true);
      try {
        const { data, error } = await supabase
          .from('user_goals')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          reset({
            targetWeightKg: data.targetWeightKg || undefined,
            targetCalories: data.targetCalories || undefined,
            targetProteinRatio: data.targetProteinRatio || undefined,
            targetCarbsRatio: data.targetCarbsRatio || undefined,
            targetFatRatio: data.targetFatRatio || undefined,
          });
        }
      } catch (err) {
        handleError(err, 'Failed to load user goals');
      } finally {
        setIsLoadingGoals(false);
      }
    };

    fetchUserGoals();

    const goalSubscription = supabase
      .channel('public:user_goals')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_goals',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          if (payload.new) {
            reset({
              targetWeightKg: (payload.new as any).targetWeightKg || undefined,
              targetCalories: (payload.new as any).targetCalories || undefined,
              targetProteinRatio: (payload.new as any).targetProteinRatio || undefined,
              targetCarbsRatio: (payload.new as any).targetCarbsRatio || undefined,
              targetFatRatio: (payload.new as any).targetFatRatio || undefined,
            });
            showToast({
              title: 'Goals Updated!',
              description: 'Your goals have been updated in real-time.',
              status: 'info',
            });
          }
        }
      )
      .subscribe();

    return () => {
      goalSubscription.unsubscribe();
    };
  }, [user?.id, isAuthReady, reset, handleError, showToast]);

  const onSubmit = async (data: GoalSettingInputs) => {
    if (!user?.id) {
      handleError('User not authenticated.', 'Authentication Error');
      return;
    }

    setIsSavingGoals(true);
    try {
      const { error } = await supabase
        .from('user_goals')
        .upsert({ user_id: user.id, ...data }, { onConflict: 'user_id' });

      if (error) throw error;

      showToast({
        title: 'Goals Saved!',
        description: 'Your fitness goals have been updated.',
        status: 'success',
      });
      reset(data);
    } catch (err) {
      handleError(err, 'Failed to save goals');
    } finally {
      setIsSavingGoals(false);
    }
  };

  if (isLoadingGoals) {
    return <LoadingSpinner message="Loading your goals..." />;
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
          Set Your Goals
        </Heading>
        <Text fontSize="md" color="text.light" textAlign="center" mb={4}>
          Define your fitness and nutritional targets.
        </Text>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack gap={4}>
            <FormControl id="targetWeightKg" isInvalid={!!errors.targetWeightKg}>
              <FormLabel color="text.dark">Target Weight (kg)</FormLabel>
              <NumberInput
                min={20}
                max={300}
                precision={1}
                step={0.1}
                onChange={(_, valueAsNumber) => setValue('targetWeightKg', valueAsNumber)}
                value={watch('targetWeightKg')}
              >
                <NumberInputField
                  {...register('targetWeightKg', { valueAsNumber: true })}
                  placeholder="e.g., 65.0"
                  borderColor="brand.200"
                  _focus={{ borderColor: 'brand.300', boxShadow: `0 0 0 1px ${theme.colors.brand['300']}` }}
                />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <FormErrorMessage>{errors.targetWeightKg?.message}</FormErrorMessage>
            </FormControl>

            <FormControl id="targetCalories" isInvalid={!!errors.targetCalories}>
              <FormLabel color="text.dark">Target Daily Calories (kcal)</FormLabel>
              <NumberInput
                min={500}
                max={5000}
                step={100}
                onChange={(_, valueAsNumber) => setValue('targetCalories', valueAsNumber)}
                value={watch('targetCalories')}
              >
                <NumberInputField
                  {...register('targetCalories', { valueAsNumber: true })}
                  placeholder="e.g., 2000"
                  borderColor="brand.200"
                  _focus={{ borderColor: 'brand.300', boxShadow: `0 0 0 1px ${theme.colors.brand['300']}` }}
                />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <FormErrorMessage>{errors.targetCalories?.message}</FormErrorMessage>
            </FormControl>

            <Divider my={4} borderColor="brand.100" />

            <Heading as="h3" size="md" color="text.dark">
              Macronutrient Ratios (%)
            </Heading>
            <Text fontSize="sm" color="text.light">
              (Optional) Set your target protein, carbs, and fat percentages. They should sum to 100%.
            </Text>

            <HStack gap={4}>
              <FormControl id="targetProteinRatio" isInvalid={!!errors.targetProteinRatio}>
                <FormLabel color="text.dark">Protein</FormLabel>
                <InputGroup>
                  <>
                    <NumberInput
                      min={0}
                      max={100}
                      step={5}
                      onChange={(_, valueAsNumber) => setValue('targetProteinRatio', valueAsNumber)}
                      value={watch('targetProteinRatio')}
                    >
                      <NumberInputField
                        {...register('targetProteinRatio', { valueAsNumber: true })}
                        placeholder="e.g., 30"
                        borderColor="brand.200"
                        _focus={{ borderColor: 'brand.300', boxShadow: `0 0 0 1px ${theme.colors.brand['300']}` }}
                      />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                    <InputRightElement pointerEvents="none" bg="brand.100" color="text.dark">%</InputRightElement>
                  </>
                </InputGroup>
                <FormErrorMessage>{errors.targetProteinRatio?.message}</FormErrorMessage>
              </FormControl>

              <FormControl id="targetCarbsRatio" isInvalid={!!errors.targetCarbsRatio}>
                <FormLabel color="text.dark">Carbs</FormLabel>
                <InputGroup>
                  <>
                    <NumberInput
                      min={0} max={100} step={5}
                      onChange={(_, valueAsNumber) => setValue('targetCarbsRatio', valueAsNumber)}
                      value={watch('targetCarbsRatio')}
                    >
                      <NumberInputField
                        {...register('targetCarbsRatio', { valueAsNumber: true })}
                        placeholder="e.g., 40"
                        borderColor="brand.200"
                        _focus={{ borderColor: 'brand.300', boxShadow: `0 0 0 1px ${theme.colors.brand['300']}` }}
                      />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                    <InputRightElement pointerEvents="none" bg="brand.100" color="text.dark">%</InputRightElement>
                  </>
                </InputGroup>
                <FormErrorMessage>{errors.targetCarbsRatio?.message}</FormErrorMessage>
              </FormControl>

              <FormControl id="targetFatRatio" isInvalid={!!errors.targetFatRatio}>
                <FormLabel color="text.dark">Fat</FormLabel>
                <InputGroup>
                  <>
                    <NumberInput
                      min={0} max={100} step={5}
                      onChange={(_, valueAsNumber) => setValue('targetFatRatio', valueAsNumber)}
                      value={watch('targetFatRatio')}
                    >
                      <NumberInputField
                        {...register('targetFatRatio', { valueAsNumber: true })}
                        placeholder="e.g., 30"
                        borderColor="brand.200"
                        _focus={{ borderColor: 'brand.300', boxShadow: `0 0 0 1px ${theme.colors.brand['300']}` }}
                      />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                    <InputRightElement pointerEvents="none" bg="brand.100" color="text.dark">%</InputRightElement>
                  </>
                </InputGroup>
                <FormErrorMessage>{errors.targetFatRatio?.message}</FormErrorMessage>
              </FormControl>
            </HStack>
            {showMacroSumWarning && (
              <Text color="orange.500" fontSize="sm" mt={2}>
                Macro ratios sum to {macroSum}%. They should sum to 100% if specified.
              </Text>
            )}
            {errors.root?.message && (
              <Text color="red.500" fontSize="sm">{errors.root.message}</Text>
            )}

            <Button
              type="submit"
              isLoading={isSavingGoals}
              disabled={!isDirty || showMacroSumWarning}
              colorScheme="teal"
              variant="solid"
              width="full"
              mt={4}
              bg="accent.500"
              color="white"
              _hover={{ bg: 'accent.600' }}
            >
              Save Goals
            </Button>
          </Stack>
        </form>
      </Stack>
    </Box>
  );
};

export default GoalSetting;
