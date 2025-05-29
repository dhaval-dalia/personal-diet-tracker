import React, { useState } from 'react';
import {
  VStack,
  Box,
  Button,
  Text,
  useColorModeValue,
  Flex,
  IconButton,
  Input,
  Avatar,
  useDisclosure,
  SlideFade
} from '@chakra-ui/react';
import { FaRobot, FaTimes } from 'react-icons/fa';
import DailyOverview from './DailyOverview';
import NutritionChart from './NutritionChart';
import ProgressTracker from './ProgressTracker';
import RecommendationCard from './RecommendationCard';
import ProfileCompletionCheck from './ProfileCompletionCheck';
import { useAuth } from '../../hooks/useAuth';

interface DashboardProps {
  onNavigate: (view: string) => void;
}

const ChatBot: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [messages, setMessages] = useState<Array<{ text: string; isBot: boolean }>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Add user message
    const newMessages = [...messages, { text: inputMessage, isBot: false }];
    setMessages(newMessages);
    setInputMessage('');
    setIsProcessing(true);

    try {
      // Send to n8n webhook
      const response = await fetch('/api/n8n/chat-process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.id}`
        },
        body: JSON.stringify({
          message: inputMessage,
          userId: user?.id
        })
      });

      const data = await response.json();
      
      // Add bot response
      setMessages([...newMessages, { text: data.recommendation, isBot: true }]);
      
      // If confirmed, save to Supabase
      if (data.confirmed) {
        await fetch('/api/save-chat-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user?.id,
            data: data.processedData
          })
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages([...newMessages, { 
        text: 'Sorry, I encountered an error. Please try again.', 
        isBot: true 
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Box
      position="fixed"
      bottom="20"
      right="8"
      width="350px"
      bg="white"
      borderRadius="lg"
      boxShadow="xl"
      borderWidth="1px"
      borderColor="gray.200"
    >
      <Flex
        p={4}
        bg="teal.500"
        color="white"
        borderTopRadius="lg"
        alignItems="center"
        justifyContent="space-between"
      >
        <Flex alignItems="center">
          <Avatar icon={<FaRobot />} size="sm" mr={2} />
          <Text fontWeight="bold">Nutrition Assistant</Text>
        </Flex>
        <IconButton
          icon={<FaTimes />}
          aria-label="Close chatbot"
          variant="ghost"
          size="sm"
          onClick={onClose}
        />
      </Flex>

      <Box h="400px" p={4} overflowY="auto">
        <VStack spacing={3} align="stretch">
          {messages.map((msg, index) => (
            <SlideFade key={index} in={true} offsetY="20px">
              <Box
                alignSelf={msg.isBot ? 'flex-start' : 'flex-end'}
                bg={msg.isBot ? 'gray.100' : 'teal.100'}
                p={3}
                borderRadius="lg"
                maxWidth="80%"
              >
                <Text fontSize="sm" color="gray.800">
                  {msg.text}
                </Text>
              </Box>
            </SlideFade>
          ))}
          {isProcessing && (
            <Box
              alignSelf="flex-start"
              bg="gray.100"
              p={3}
              borderRadius="lg"
              maxWidth="80%"
            >
              <Text fontSize="sm" color="gray.800">
                Analyzing...
              </Text>
            </Box>
          )}
        </VStack>
      </Box>

      <Flex p={4} borderTopWidth="1px">
        <Input
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type your food or exercise..."
          size="sm"
          mr={2}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <Button
          colorScheme="teal"
          size="sm"
          onClick={handleSendMessage}
          isLoading={isProcessing}
        >
          Send
        </Button>
      </Flex>
    </Box>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const { isOpen, onToggle } = useDisclosure();

  return (
    <VStack spacing={8} align="stretch" w="full" maxW="1200px" mx="auto" p={4}>
      {isOpen && <ChatBot onClose={onToggle} />}

      <ProfileCompletionCheck onNavigate={onNavigate} />
      
      <Box
        p={6}
        borderRadius="lg"
        bg={bgColor}
        boxShadow="lg"
        borderColor="brand.200"
        borderWidth={1}
      >
        <VStack spacing={4}>
          <Text fontSize="2xl" fontWeight="bold" color={textColor}>
            Welcome to Your Fitness Dashboard
          </Text>
          <Text color="text.light" textAlign="center">
            Track your progress and stay on top of your fitness goals
          </Text>
          <Flex gap={4}>
            <Button
              onClick={() => onNavigate('log-meal')}
              colorScheme="teal"
              variant="solid"
              bg="accent.500"
              color="white"
              _hover={{ bg: 'accent.600' }}
              size="lg"
            >
              Log Your First Meal
            </Button>
            <Button
              onClick={onToggle}
              leftIcon={<FaRobot />}
              colorScheme="blue"
              variant="outline"
              size="lg"
            >
              Chat with Nutrition Bot
            </Button>
          </Flex>
        </VStack>
      </Box>

      <DailyOverview />
      <NutritionChart />
      <ProgressTracker />
      <RecommendationCard />
    </VStack>
  );
};

export default Dashboard;
