// src/components/dashboard/RecommendationCard.tsx
// This component displays a single personalized recommendation to the user.
// It's designed to be reusable and visually appealing, fitting the pastel theme.

import React from 'react';
import { Box, Heading, Text, Icon, VStack, HStack } from '@chakra-ui/react';
import { FaLightbulb, FaUtensils, FaRunning } from 'react-icons/fa'; // Icons for different recommendation types

// Define the interface for a single recommendation
interface Recommendation {
  id: string;
  userId: string;
  type: 'nutrition' | 'exercise' | 'general'; // Type of recommendation
  title: string;
  content: string;
  createdAt: string; // ISO date string
}

interface RecommendationCardProps {
  recommendation: Recommendation;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendation }) => {
  // Determine icon based on recommendation type
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
      bg="whiteAlpha.700" // Light, slightly transparent background
      boxShadow="md"
      borderColor="brand.200"
      borderWidth={1}
      width="100%"
      _hover={{ boxShadow: 'lg', transform: 'translateY(-2px)' }} // Subtle hover effect
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
