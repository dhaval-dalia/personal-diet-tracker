// src/components/dashboard/ProgressTracker.tsx
import React from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Icon,
  Divider,
} from '@chakra-ui/react';
import { FaWeight, FaFire } from 'react-icons/fa';

interface ProgressData {
  currentWeight?: number | null;
  targetWeight?: number | null;
  targetCalories?: number | null;
}

interface ProgressTrackerProps {
  data?: ProgressData | null;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ data }) => {
  const currentWeight = data?.currentWeight;
  const targetWeight = data?.targetWeight;
  const targetCalories = data?.targetCalories;

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
