// src/components/dashboard/ProgressTracker.tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Icon,
  Divider,
  Spinner,
  Center
} from '@chakra-ui/react';
import { FaWeight, FaFire } from 'react-icons/fa';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';

interface ProgressData {
  current_weight?: number | null;
  target_weight?: number | null;
  target_calories?: number | null;
}

const ProgressTracker: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<ProgressData | null>(null);

  useEffect(() => {
    const fetchProgressData = async () => {
      if (!user?.id) return;

      try {
        // Fetch user profile for current weight
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('weight_kg')
          .eq('user_id', user.id)
          .single();

        if (profileError) throw profileError;

        // Fetch user goals
        const { data: goalsData, error: goalsError } = await supabase
          .from('user_goals')
          .select('target_weight_kg, target_calories')
          .eq('user_id', user.id)
          .single();

        if (goalsError) throw goalsError;

        setData({
          current_weight: profileData?.weight_kg,
          target_weight: goalsData?.target_weight_kg,
          target_calories: goalsData?.target_calories
        });
      } catch (error) {
        console.error('Error fetching progress data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgressData();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('progress_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          fetchProgressData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_goals',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          fetchProgressData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  if (isLoading) {
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
        <Center h="200px">
          <Spinner size="xl" color="accent.500" />
        </Center>
      </Box>
    );
  }

  const currentWeight = data?.current_weight;
  const targetWeight = data?.target_weight;
  const targetCalories = data?.target_calories;

  let weightProgress = 0;
  if (currentWeight !== null && targetWeight !== null && currentWeight && targetWeight) {
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
              <Text color="text.light" fontSize="lg" fontWeight="semibold">Weight Progress</Text>
            </HStack>
            <Box>
              <Text fontSize="4xl" color="accent.600" fontWeight="bold">
                {currentWeight !== null && currentWeight ? `${currentWeight} kg` : '--'}
              </Text>
              <Text color="text.light" fontSize="sm">
                Target: {targetWeight !== null && targetWeight ? `${targetWeight} kg` : 'Not Set'}
              </Text>
            </Box>
            {targetWeight !== null && currentWeight !== null && targetWeight && currentWeight && (
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
            {!currentWeight && <Text color="text.light" fontSize="sm">Log your current weight in your profile.</Text>}
            {!targetWeight && <Text color="text.light" fontSize="sm">Set a target weight in Goal Settings.</Text>}
          </Box>

          <Box p={4} bg="brand.100" borderRadius="md" boxShadow="sm">
            <HStack mb={2}>
              <Icon as={FaFire} color="accent.500" w={6} h={6} />
              <Text color="text.light" fontSize="lg" fontWeight="semibold">Calorie Target</Text>
            </HStack>
            <Box>
              <Text fontSize="4xl" color="accent.600" fontWeight="bold">
                {targetCalories !== null && targetCalories ? `${targetCalories} kcal` : '--'}
              </Text>
              <Text color="text.light" fontSize="sm">
                Daily Goal
              </Text>
            </Box>
            {targetCalories !== null && targetCalories && (
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
            {!targetCalories && <Text color="text.light" fontSize="sm">Set a daily calorie target in Goal Settings.</Text>}
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
