// src/components/dashboard/RecommendationCard.tsx
import React from 'react';
import { Box, Heading, Text, Icon, VStack, HStack } from '@chakra-ui/react';
import { FaLightbulb, FaUtensils, FaRunning } from 'react-icons/fa';

interface Recommendation {
  id: string;
  userId: string;
  type: 'nutrition' | 'exercise' | 'general';
  title: string;
  content: string;
  createdAt: string;
}

interface RecommendationCardProps {
  recommendation?: Recommendation | null;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendation }) => {
  if (!recommendation) {
    return (
      <Box
        p={6}
        borderRadius="lg"
        bg="whiteAlpha.700"
        boxShadow="md"
        borderColor="brand.200"
        borderWidth={1}
        width="100%"
        textAlign="center"
      >
        <Text color="gray.500" fontStyle="italic">
          No recommendations available yet. Keep logging your meals and activities to get personalized suggestions!
        </Text>
      </Box>
    );
  }

  const getIcon = (type: Recommendation['type']) => {
    switch (type) {
      case 'nutrition':
        return FaUtensils;
      case 'exercise':
        return FaRunning;
      case 'general':
      default:
        return FaLightbulb;
    }
  };

  const IconComponent = getIcon(recommendation.type);

  return (
    <Box
      p={6}
      borderRadius="lg"
      bg="whiteAlpha.700"
      boxShadow="md"
      borderColor="brand.200"
      borderWidth={1}
      width="100%"
      _hover={{ boxShadow: 'lg', transform: 'translateY(-2px)' }}
      transition="all 0.2s ease-in-out"
    >
      <VStack align="flex-start" gap={3}>
        <HStack>
          <Icon as={IconComponent} w={6} h={6} color="accent.500" />
          <Heading as="h4" size="md" color="text.dark">
            {recommendation.title}
          </Heading>
        </HStack>
        <Text fontSize="sm" color="text.light">
          {recommendation.content}
        </Text>
        <Text fontSize="xs" color="gray.500" alignSelf="flex-end">
          Generated: {new Date(recommendation.createdAt).toLocaleDateString()}
        </Text>
      </VStack>
    </Box>
  );
};

export default RecommendationCard;
