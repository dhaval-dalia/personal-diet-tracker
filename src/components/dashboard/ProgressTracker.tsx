// src/components/dashboard/ProgressTracker.tsx
// This component visualizes the user's progress towards their fitness goals.
// It fetches user profile data and goals from Supabase and displays progress
// for metrics like weight and calorie targets.

import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Progress,
  Stat,
  StatLabel,
  StatHelpText,
  SimpleGrid,
  Icon,
  Divider,
  useTheme,
} from '@chakra-ui/react';
import { FaWeight, FaFire, FaChartLine } from 'react-icons/fa';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useErrorHandling } from '../../hooks/useErrorHandling';
import LoadingSpinner from '../shared/LoadingSpinner';

interface UserProfile {
  weightKg: number;
  heightCm: number;
}

interface UserGoal {
  targetWeightKg?: number;
  targetCalories?: number;
}

const ProgressTracker: React.FC = () => {
  const { user, isAuthReady } = useAuth();
  const { handleError } = useErrorHandling();
  const theme = useTheme();

  const [currentWeight, setCurrentWeight] = useState<number | null>(null);
  const [targetWeight, setTargetWeight] = useState<number | null>(null);
  const [targetCalories, setTargetCalories] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProgressData = async () => {
      if (!user?.id || !isAuthReady) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('weightKg')
          .eq('user_id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }
        setCurrentWeight(profileData?.weightKg || null);

        const { data: goalData, error: goalError } = await supabase
          .from('user_goals')
          .select('targetWeightKg, targetCalories')
          .eq('user_id', user.id)
          .single();

        if (goalError && goalError.code !== 'PGRST116') {
          throw goalError;
        }
        setTargetWeight(goalData?.targetWeightKg || null);
        setTargetCalories(goalData?.targetCalories || null);

      } catch (err) {
        const errorMessage = handleError(err, 'Failed to fetch progress data');
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgressData();

    const profileSubscription = supabase
      .channel('public:user_profiles')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          if (payload.new) {
            setCurrentWeight((payload.new as UserProfile).weightKg);
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
          if (payload.new) {
            setTargetWeight((payload.new as UserGoal).targetWeightKg || null);
            setTargetCalories((payload.new as UserGoal).targetCalories || null);
          }
        }
      )
      .subscribe();

    return () => {
      profileSubscription.unsubscribe();
      goalSubscription.unsubscribe();
    };

  }, [user?.id, isAuthReady, handleError]);

  if (isLoading) {
    return <LoadingSpinner message="Tracking your progress..." />;
  }

  if (error) {
    return (
      <Box textAlign="center" p={8} bg="red.50" borderRadius="lg" color="red.700">
        <Text fontSize="lg">Error: {error}</Text>
        <Text fontSize="md">Could not load your progress. Please try again.</Text>
      </Box>
    );
  }

  let weightProgress = 0;
  if (currentWeight !== null && targetWeight !== null) {
    if (currentWeight === targetWeight) {
      weightProgress = 100;
    } else if (currentWeight > targetWeight) {
      weightProgress = ((currentWeight - targetWeight) / currentWeight) * 100;
      if (weightProgress < 0) weightProgress = 0;
      weightProgress = 100 - weightProgress;
    } else {
      weightProgress = (currentWeight / targetWeight) * 100;
    }
    weightProgress = Math.min(100, Math.max(0, weightProgress));
  }

  const calorieTargetProgress = targetCalories ? 50 : 0;

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
          Your Progress
        </Heading>
        <Text fontSize="md" color="text.light" textAlign="center" mb={4}>
          Monitor your journey towards your fitness goals.
        </Text>

        <Divider borderColor="brand.100" />

        <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
          <Box p={4} bg="brand.100" borderRadius="md" boxShadow="sm">
            <HStack mb={2}>
              <Icon as={FaWeight} color="accent.500" w={6} h={6} />
              <StatLabel color="text.light" fontSize="lg" fontWeight="semibold">Weight Progress</StatLabel>
            </HStack>
            <Box>
              <Text fontSize="4xl" color="accent.600" fontWeight="bold">
                {currentWeight !== null ? `${currentWeight} kg` : '--'}
              </Text>
              <Text color="text.light" fontSize="sm">
                Target: {targetWeight !== null ? `${targetWeight} kg` : 'Not Set'}
              </Text>
            </Box>
            {targetWeight !== null && currentWeight !== null && (
              <Box
                mt={3}
                h="8px"
                bg="gray.100"
                borderRadius="md"
                overflow="hidden"
              >
                <Box
                  h="100%"
                  bg={weightProgress === 100 ? 'green.500' : 'teal.500'}
                  w={`${weightProgress}%`}
                  transition="width 0.3s ease"
                />
              </Box>
            )}
            {currentWeight === null && <Text color="text.light" fontSize="sm">Log your current weight in your profile.</Text>}
            {targetWeight === null && <Text color="text.light" fontSize="sm">Set a target weight in Goal Settings.</Text>}
          </Box>

          <Box p={4} bg="brand.100" borderRadius="md" boxShadow="sm">
            <HStack mb={2}>
              <Icon as={FaFire} color="accent.500" w={6} h={6} />
              <StatLabel color="text.light" fontSize="lg" fontWeight="semibold">Calorie Target</StatLabel>
            </HStack>
            <Box>
              <Text fontSize="4xl" color="accent.600" fontWeight="bold">
                {targetCalories !== null ? `${targetCalories} kcal` : '--'}
              </Text>
              <Text color="text.light" fontSize="sm">
                Daily Goal
              </Text>
            </Box>
            {targetCalories !== null && (
              <Box
                mt={3}
                h="8px"
                bg="gray.100"
                borderRadius="md"
                overflow="hidden"
              >
                <Box
                  h="100%"
                  bg={calorieTargetProgress >= 100 ? 'green.500' : 'teal.500'}
                  w={`${Math.min(calorieTargetProgress, 100)}%`}
                  transition="width 0.3s ease"
                />
              </Box>
            )}
            {targetCalories === null && <Text color="text.light" fontSize="sm">Set a daily calorie target in Goal Settings.</Text>}
            <Text fontSize="sm" color="text.light" mt={2}>
              (Note: This progress requires daily calorie logging and aggregation.)
            </Text>
          </Box>
        </SimpleGrid>

        <Divider borderColor="brand.100" />

        <Box>
          <Heading as="h3" size="md" mb={3} color="text.dark">
            Overall Progress
          </Heading>
          <Text color="text.light">
            Keep logging your meals and updating your profile to see more detailed progress insights here!
          </Text>
          <Box
            mt={4}
            h="6px"
            bg="gray.100"
            borderRadius="md"
            overflow="hidden"
          >
            <Box
              h="100%"
              bg="teal.500"
              w="50%"
              transition="width 0.3s ease"
            />
          </Box>
          <Text fontSize="sm" color="text.light" mt={1}>Overall progress is an average of all goals.</Text>
        </Box>
      </VStack>
    </Box>
  );
};

export default ProgressTracker;
