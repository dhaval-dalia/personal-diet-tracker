// src/components/dashboard/DailyOverview.tsx
import React from 'react';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  Divider,
  Progress,
} from '@chakra-ui/react';
import { format } from 'date-fns';

interface DailyData {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

interface UserGoals {
  targetCalories?: number;
  targetProteinRatio?: number;
  targetCarbsRatio?: number;
  targetFatRatio?: number;
  targetWeightKg?: number;
}

interface DailyOverviewProps {
  data?: DailyData | null;
  goals?: UserGoals | null;
}

const DailyOverview: React.FC<DailyOverviewProps> = ({ data, goals }) => {
  if (!data) {
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
        textAlign="center"
      >
        <Text color="gray.500" fontStyle="italic" fontSize="lg">
          No summary data available for today. Keep logging your meals to see insights!
        </Text>
      </Box>
    );
  }

  const currentCalories = data.calories || 0;
  const targetCalories = goals?.targetCalories || 2000;
  const caloriesProgress = (currentCalories / targetCalories) * 100;

  const getMacroProgress = (current: number, targetRatio: number | undefined, totalCalories: number) => {
    if (!targetRatio || totalCalories === 0) return 0;
    const targetGrams = (targetRatio / 100) * totalCalories / (targetRatio === goals?.targetFatRatio ? 9 : 4);
    return (current / targetGrams) * 100;
  };

  const proteinProgress = getMacroProgress(data.protein || 0, goals?.targetProteinRatio, currentCalories);
  const carbsProgress = getMacroProgress(data.carbs || 0, goals?.targetCarbsRatio, currentCalories);
  const fatProgress = getMacroProgress(data.fat || 0, goals?.targetFatRatio, currentCalories);

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
            <Text fontSize="3xl" color="accent.600" fontWeight="bold">{data.protein || 0} g</Text>
            <Text color="text.light" fontSize="sm">Target: {goals?.targetProteinRatio || '--'}%</Text>
            <Progress value={proteinProgress} size="sm" colorScheme={proteinProgress > 100 ? 'orange' : 'teal'} mt={2} borderRadius="md" />
          </Box>

          <Box p={4} bg="brand.100" borderRadius="md" boxShadow="sm">
            <Text color="text.light" fontSize="sm" fontWeight="medium">Carbohydrates</Text>
            <Text fontSize="3xl" color="accent.600" fontWeight="bold">{data.carbs || 0} g</Text>
            <Text color="text.light" fontSize="sm">Target: {goals?.targetCarbsRatio || '--'}%</Text>
            <Progress value={carbsProgress} size="sm" colorScheme={carbsProgress > 100 ? 'orange' : 'teal'} mt={2} borderRadius="md" />
          </Box>

          <Box p={4} bg="brand.100" borderRadius="md" boxShadow="sm">
            <Text color="text.light" fontSize="sm" fontWeight="medium">Fats</Text>
            <Text fontSize="3xl" color="accent.600" fontWeight="bold">{data.fat || 0} g</Text>
            <Text color="text.light" fontSize="sm">Target: {goals?.targetFatRatio || '--'}%</Text>
            <Progress value={fatProgress} size="sm" colorScheme={fatProgress > 100 ? 'orange' : 'teal'} mt={2} borderRadius="md" />
          </Box>
        </SimpleGrid>

        <Divider borderColor="brand.100" />

        <Box>
          <Heading as="h3" size="md" mb={3} color="text.dark">
            Goals Summary
          </Heading>
          {goals ? (
            <VStack align="flex-start" gap={2} color="text.dark">
              <Text>
                <Text as="span" fontWeight="semibold">Target Weight:</Text>{' '}
                {goals.targetWeightKg ? `${goals.targetWeightKg} kg` : 'Not set'}
              </Text>
              <Text>
                <Text as="span" fontWeight="semibold">Target Calories:</Text>{' '}
                {goals.targetCalories ? `${goals.targetCalories} kcal` : 'Not set'}
              </Text>
              <Text>
                <Text as="span" fontWeight="semibold">Macro Ratios:</Text>{' '}
                {goals.targetProteinRatio || '--'}% Protein,{' '}
                {goals.targetCarbsRatio || '--'}% Carbs,{' '}
                {goals.targetFatRatio || '--'}% Fat
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
