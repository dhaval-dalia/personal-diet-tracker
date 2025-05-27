// src/components/dashboard/DailyOverview.tsx
// This component provides a summary of the user's daily nutritional intake
// and other relevant fitness metrics. It fetches data from Supabase and
// displays it in a clean, digestible format.

import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
  Progress,
  useTheme,
} from '@chakra-ui/react';
import { useAuth } from '../../hooks/useAuth';
import { useErrorHandling } from '../../hooks/useErrorHandling';
import LoadingSpinner from '../shared/LoadingSpinner';
import { format } from 'date-fns';
import { supabase } from '../../services/supabase';

// Define types for daily nutrition log and user goals
interface DailyNutritionLog {
  date: string; // ISO date string, e.g., '2023-01-01'
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  // Add other aggregated metrics as needed
}

interface UserGoal {
  targetCalories?: number;
  targetProteinRatio?: number; // As a percentage, e.g., 30 for 30%
  targetCarbsRatio?: number;
  targetFatRatio?: number;
  targetWeightKg?: number;
  // Add other goal-related fields
}

const DailyOverview: React.FC = () => {
  const { user, isAuthReady } = useAuth();
  const { handleError } = useErrorHandling();
  const theme = useTheme();

  const [dailyLog, setDailyLog] = useState<DailyNutritionLog | null>(null);
  const [userGoals, setUserGoals] = useState<UserGoal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id || !isAuthReady) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Fetch daily nutrition log for today
        const { data: logData, error: logError } = await supabase
          .from('nutrition_logs')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', today)
          .single(); // Expecting a single row for today

        if (logError && logError.code !== 'PGRST116') { // PGRST116 means "no rows found"
          throw logError;
        }
        setDailyLog(logData || null);

        // Fetch user goals
        const { data: goalData, error: goalError } = await supabase
          .from('user_goals')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (goalError && goalError.code !== 'PGRST116') {
          throw goalError;
        }
        setUserGoals(goalData || null);

      } catch (err) {
        const errorMessage = handleError(err, 'Failed to fetch daily overview data');
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Set up real-time listener for nutrition_logs and user_goals
    // This assumes RLS is configured correctly to allow real-time updates for the current user
    const logSubscription = supabase
      .channel('public:nutrition_logs')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'nutrition_logs',
          filter: `user_id=eq.${user?.id}`, // Filter for current user
        },
        (payload) => {
          // Re-fetch or update state based on payload
          // For simplicity, we'll re-fetch the entire log for today
          if (
            (payload.new && 'date' in payload.new && payload.new.date === today) ||
            (payload.old && 'date' in payload.old && payload.old.date === today)
          ) {
            fetchData();
          }
        }
      )
      .subscribe();

    const goalSubscription = supabase
      .channel('public:user_goals')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_goals',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          fetchData(); // Re-fetch goals on change
        }
      )
      .subscribe();

    return () => {
      // Clean up subscriptions on component unmount
      logSubscription.unsubscribe();
      goalSubscription.unsubscribe();
    };

  }, [user?.id, isAuthReady, handleError, today]); // Dependencies for useEffect

  if (isLoading) {
    return <LoadingSpinner message="Loading daily overview..." />;
  }

  if (error) {
    return (
      <Box textAlign="center" p={8} bg="red.50" borderRadius="lg" color="red.700">
        <Text fontSize="lg">Error: {error}</Text>
        <Text fontSize="md">Could not load your daily overview. Please try again.</Text>
      </Box>
    );
  }

  const currentCalories = dailyLog?.calories || 0;
  const targetCalories = userGoals?.targetCalories || 2000; // Default if no goal set
  const caloriesProgress = (currentCalories / targetCalories) * 100;

  const getMacroProgress = (current: number, targetRatio: number | undefined, totalCalories: number) => {
    if (!targetRatio || totalCalories === 0) return 0;
    // Assuming 4 kcal/g for protein/carbs, 9 kcal/g for fat for target calculation
    const targetGrams = (targetRatio / 100) * totalCalories / (targetRatio === userGoals?.targetFatRatio ? 9 : 4);
    return (current / targetGrams) * 100;
  };

  const proteinProgress = getMacroProgress(dailyLog?.protein || 0, userGoals?.targetProteinRatio, currentCalories);
  const carbsProgress = getMacroProgress(dailyLog?.carbs || 0, userGoals?.targetCarbsRatio, currentCalories);
  const fatProgress = getMacroProgress(dailyLog?.fat || 0, userGoals?.targetFatRatio, currentCalories);


  return (
    <Box
      p={8}
      maxWidth="900px"
      borderWidth={1}
      borderRadius="lg"
      boxShadow="lg"
      bg="whiteAlpha.700"
      borderColor="brand.200"
      mx="auto"
      my={8}
    >
      <VStack gap={6} align="stretch">
        <Heading as="h2" size="xl" textAlign="center" color="text.dark">
          Daily Overview - {format(new Date(), 'EEEE, MMM d, yyyy')}
        </Heading>

        <Divider borderColor="brand.100" />

        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6}>
          <Box p={4} bg="brand.100" borderRadius="md" boxShadow="sm">
            <Text color="text.light" fontSize="sm" fontWeight="medium">Calories Consumed</Text>
            <Text fontSize="3xl" color="accent.600" fontWeight="bold">{currentCalories} kcal</Text>
            <Text color="text.light" fontSize="sm">Target: {targetCalories} kcal</Text>
            <Progress value={caloriesProgress} size="sm" colorScheme={caloriesProgress > 100 ? 'red' : 'teal'} mt={2} borderRadius="md" />
          </Box>

          <Box p={4} bg="brand.100" borderRadius="md" boxShadow="sm">
            <Text color="text.light" fontSize="sm" fontWeight="medium">Protein</Text>
            <Text fontSize="3xl" color="accent.600" fontWeight="bold">{dailyLog?.protein || 0} g</Text>
            <Text color="text.light" fontSize="sm">Target: {userGoals?.targetProteinRatio || '--'}%</Text>
            <Progress value={proteinProgress} size="sm" colorScheme={proteinProgress > 100 ? 'orange' : 'teal'} mt={2} borderRadius="md" />
          </Box>

          <Box p={4} bg="brand.100" borderRadius="md" boxShadow="sm">
            <Text color="text.light" fontSize="sm" fontWeight="medium">Carbohydrates</Text>
            <Text fontSize="3xl" color="accent.600" fontWeight="bold">{dailyLog?.carbs || 0} g</Text>
            <Text color="text.light" fontSize="sm">Target: {userGoals?.targetCarbsRatio || '--'}%</Text>
            <Progress value={carbsProgress} size="sm" colorScheme={carbsProgress > 100 ? 'orange' : 'teal'} mt={2} borderRadius="md" />
          </Box>

          <Box p={4} bg="brand.100" borderRadius="md" boxShadow="sm">
            <Text color="text.light" fontSize="sm" fontWeight="medium">Fats</Text>
            <Text fontSize="3xl" color="accent.600" fontWeight="bold">{dailyLog?.fat || 0} g</Text>
            <Text color="text.light" fontSize="sm">Target: {userGoals?.targetFatRatio || '--'}%</Text>
            <Progress value={fatProgress} size="sm" colorScheme={fatProgress > 100 ? 'orange' : 'teal'} mt={2} borderRadius="md" />
          </Box>
        </SimpleGrid>

        <Divider borderColor="brand.100" />

        <Box>
          <Heading as="h3" size="md" mb={3} color="text.dark">
            Goals Summary
          </Heading>
          {userGoals ? (
            <VStack align="flex-start" gap={2} color="text.dark">
              <Text>
                <Text as="span" fontWeight="semibold">Target Weight:</Text>{' '}
                {userGoals.targetWeightKg ? `${userGoals.targetWeightKg} kg` : 'Not set'}
              </Text>
              <Text>
                <Text as="span" fontWeight="semibold">Target Calories:</Text>{' '}
                {userGoals.targetCalories ? `${userGoals.targetCalories} kcal` : 'Not set'}
              </Text>
              <Text>
                <Text as="span" fontWeight="semibold">Macro Ratios:</Text>{' '}
                {userGoals.targetProteinRatio || '--'}% Protein,{' '}
                {userGoals.targetCarbsRatio || '--'}% Carbs,{' '}
                {userGoals.targetFatRatio || '--'}% Fat
              </Text>
            </VStack>
          ) : (
            <Text color="text.light">No goals set yet. Visit your profile to set them!</Text>
          )}
        </Box>
      </VStack>
    </Box>
  );
};

export default DailyOverview;
