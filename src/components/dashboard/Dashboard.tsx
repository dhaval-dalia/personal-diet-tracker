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
  SlideFade,
  useToast
} from '@chakra-ui/react';
import { FaRobot, FaTimes } from 'react-icons/fa';
import DailyOverview from './DailyOverview';
import NutritionChart from './NutritionChart';
import ProgressTracker from './ProgressTracker';
import RecommendationCard from './RecommendationCard';
import ProfileCompletionCheck from './ProfileCompletionCheck';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabase';
import { useRouter } from 'next/router';

interface ChatMessage {
  text: string;
  isBot: boolean;
  metadata?: Record<string, any>;
  created_at?: string;
}

const ChatBot: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();
  const toast = useToast();

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !user?.id) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsProcessing(true);

    try {
      // Save user message to Supabase
      const { error: saveError } = await supabase
        .from('chat_interactions')
        .insert([{
          user_id: user.id,
          message: userMessage,
          is_bot: false,
          created_at: new Date().toISOString(),
          metadata: {}
        }]);

      if (saveError) throw new Error('Failed to save user message');

      // Add user message to UI
      const newMessages = [...messages, { 
        text: userMessage, 
        isBot: false,
        created_at: new Date().toISOString()
      }];
      setMessages(newMessages);

      // Send to n8n webhook
      const webhookData = {
        event_type: 'chat_message',
        payload: {
          user_id: user.id,
          message: userMessage,
          created_at: new Date().toISOString(),
          context: {
            platform: 'web',
            source: 'chat-widget',
            version: '1.0'
          }
        }
      };

      const response = await fetch(process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || '', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_N8N_API_KEY}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(webhookData)
      });

      if (!response.ok) {
        throw new Error('Failed to get response from assistant');
      }

      const data = await response.json();
      
      // Validate response data structure
      if (!data.message || typeof data.message !== 'string') {
        throw new Error('Invalid response format from assistant');
      }

      // Save bot response to Supabase
      const { error: botSaveError } = await supabase
        .from('chat_interactions')
        .insert([{
          user_id: user.id,
          message: data.message,
          is_bot: true,
          created_at: new Date().toISOString(),
          metadata: data.metadata || {},
          response: {
            message: data.message,
            metadata: data.metadata || {},
            timestamp: new Date().toISOString()
          }
        }]);

      if (botSaveError) throw new Error('Failed to save bot response');

      // Add bot response to UI
      setMessages([...newMessages, { 
        text: data.message, 
        isBot: true,
        created_at: new Date().toISOString(),
        metadata: data.metadata
      }]);

    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: 'Error',
        description: 'Failed to process message. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setMessages([...messages, { 
        text: 'Sorry, I encountered an error. Please try again.', 
        isBot: true,
        created_at: new Date().toISOString()
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
      zIndex={1000}
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
                {msg.metadata && Object.keys(msg.metadata).length > 0 && (
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    {JSON.stringify(msg.metadata)}
                  </Text>
                )}
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

const Dashboard: React.FC = () => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const { isOpen, onToggle } = useDisclosure();
  const router = useRouter();

  const handleNavigate = (view: string) => {
    router.push(`/${view}`);
  };

  return (
    <VStack spacing={8} align="stretch" w="full" maxW="1200px" mx="auto" p={4}>
      {isOpen && <ChatBot onClose={onToggle} />}

      <ProfileCompletionCheck onNavigate={handleNavigate} />
      
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
              onClick={() => handleNavigate('log-meal')}
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

      <DailyOverview onNavigate={handleNavigate} />
      <NutritionChart onNavigate={handleNavigate} />
      <ProgressTracker />
      <RecommendationCard />
    </VStack>
  );
};

export default Dashboard;
