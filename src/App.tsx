// src/App.tsx
// This is the main application component that orchestrates all other components.
// It sets up the Chakra UI provider, the Supabase authentication provider,
// and manages the overall application flow based on user authentication and
// onboarding status. It also includes a basic navigation system.

// src/App.tsx

import React, { useState, useEffect } from 'react';
import {
  ChakraProvider,
  Box,
  Flex,
  VStack,
  HStack,
  Button,
  Text,
  Spacer,
  Link as ChakraLink
} from '@chakra-ui/react';
import theme from './theme';
import { AuthProvider, useAuth } from './hooks/useAuth';
import ErrorBoundary from './components/shared/ErrorBoundary';
import LoadingSpinner from './components/shared/LoadingSpinner';

import LoginForm from './components/auth/LoginForm';
import OnboardingFlow from './components/auth/OnboardingFlow';
import MealLogger from './components/meal-logging/MealLogger';
import DailyOverview from './components/dashboard/DailyOverview';
import NutritionChart from './components/dashboard/NutritionChart';
import ProgressTracker from './components/dashboard/ProgressTracker';
import RecommendationCard from './components/dashboard/RecommendationCard';
import UserProfile from './components/profile/UserProfile';
import GoalSetting from './components/profile/GoalSetting';
import Preferences from './components/profile/Preferences';

import { supabase } from './services/supabase';
import { useErrorHandling } from './hooks/useErrorHandling';

type AppView =
  | 'login'
  | 'signup'
  | 'onboarding'
  | 'dashboard'
  | 'log-meal'
  | 'profile'
  | 'goals'
  | 'preferences';

const AppCon: React.FC = () => {
  const { user, isLoading, isAuthReady, signOut } = useAuth();
  const { handleError } = useErrorHandling();

  const [currentView, setCurrentView] = useState<AppView>('login');
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [isLoadingOnboardingStatus, setIsLoadingOnboardingStatus] = useState(true);
  const [userGoals, setUserGoals] = useState<any>(null);

  // Fetch user goals when user changes
  useEffect(() => {
    const fetchUserGoals = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('user_goals')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching goals:', error);
          return;
        }

        if (data) {
          setUserGoals(data);
        }
      } catch (err) {
        console.error('Error in fetchUserGoals:', err);
      }
    };

    fetchUserGoals();

    // Subscribe to real-time updates
    const goalsSubscription = supabase
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
          console.log('Goals updated in App:', payload);
          if (payload.new) {
            setUserGoals(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      goalsSubscription.unsubscribe();
    };
  }, [user?.id]);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!isAuthReady || isLoading) return;

      setIsLoadingOnboardingStatus(true);

      if (user) {
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('user_id')
            .eq('user_id', user.id)
            .single();

          if (error && error.code !== 'PGRST116') throw error;

          if (data) {
            setIsOnboardingComplete(true);
          } else {
            setIsOnboardingComplete(false); // Allow fallback
          }

          setCurrentView('dashboard'); // Always go to dashboard
        } catch (err) {
          handleError(err, 'Failed to check onboarding status');
          setCurrentView('login');
        } finally {
          setIsLoadingOnboardingStatus(false);
        }
      } else {
        setCurrentView('login');
        setIsLoadingOnboardingStatus(false);
      }
    };

    checkOnboardingStatus();
  }, [user, isLoading, isAuthReady, handleError]);

  const handleLoginSuccess = () => {
    setIsLoadingOnboardingStatus(true); // Triggers re-check
  };

  const handleSignUpSuccess = () => {
    setCurrentView('onboarding');
  };

  const handleOnboardingComplete = () => {
    setIsOnboardingComplete(true);
    setCurrentView('dashboard');
  };

  const handleNavigate = (view: string) => {
    setCurrentView(view as AppView);
  };

  const renderContent = () => {
    if (isLoading || isLoadingOnboardingStatus) {
      return <LoadingSpinner message="Initializing application..." />;
    }

    if (!user) {
      return (
        <LoginForm
          onSuccess={handleLoginSuccess}
          onSwitchToSignUp={() => setCurrentView(currentView === 'signup' ? 'login' : 'signup')}
        />
      );
    }

    if (!isOnboardingComplete && currentView === 'onboarding') {
      return <OnboardingFlow onOnboardingComplete={handleOnboardingComplete} />;
    }

    switch (currentView) {
      case 'dashboard':
        return (
          <VStack spacing={8} align="stretch" maxW="1200px" mx="auto" px={4}>
            {!isOnboardingComplete && (
              <Box
                p={4}
                bg="yellow.100"
                borderRadius="md"
                border="1px solid"
                borderColor="yellow.400"
              >
                <Text fontWeight="semibold">
                  Please{' '}
                  <ChakraLink
                    color="blue.600"
                    onClick={() => setCurrentView('onboarding')}
                    cursor="pointer"
                  >
                    complete your profile
                  </ChakraLink>{' '}
                  to get personalized recommendations.
                </Text>
              </Box>
            )}

            <DailyOverview
              onNavigate={handleNavigate}
            />
            
            <NutritionChart onNavigate={handleNavigate} />
            <ProgressTracker />

            <Box
              p={6}
              borderRadius="lg"
              bg="whiteAlpha.700"
              boxShadow="lg"
              borderColor="brand.200"
              borderWidth={1}
            >
              <Text fontSize="lg" fontWeight="bold" mb={4}>
                Recommendations
              </Text>
              {isOnboardingComplete ? (
                <RecommendationCard
                  recommendation={{
                    id: 'rec1',
                    userId: user.id,
                    type: 'nutrition',
                    title: 'Increase Fiber Intake',
                    content:
                      'Aim for more whole grains, fruits, and vegetables to boost your fiber intake.',
                    createdAt: new Date().toISOString()
                  }}
                />
              ) : (
                <Text color="gray.500">Complete your profile to get personalized recommendations.</Text>
              )}
            </Box>
          </VStack>
        );
      case 'log-meal':
        return <MealLogger />;
      case 'profile':
        return <UserProfile />;
      case 'goals':
        return <GoalSetting onViewChange={setCurrentView} />;
      case 'preferences':
        return <Preferences />;
      default:
        return <Text>Page not found.</Text>;
    }
  };

  return (
    <Flex direction="column" minH="100vh">
      {user && (
        <Box bg="brand.700" py={4} px={8} boxShadow="md">
          <HStack spacing={8} justifyContent="space-between" alignItems="center">
            <Text fontSize="2xl" fontWeight="bold" color="white">
              Fitness Tracker
            </Text>
            <HStack spacing={6}>
              <ChakraLink onClick={() => setCurrentView('dashboard')} color="whiteAlpha.800">
                Dashboard
              </ChakraLink>
              <ChakraLink onClick={() => setCurrentView('log-meal')} color="whiteAlpha.800">
                Log Meal
              </ChakraLink>
              <ChakraLink onClick={() => setCurrentView('profile')} color="whiteAlpha.800">
                Profile
              </ChakraLink>
              <ChakraLink onClick={() => setCurrentView('goals')} color="whiteAlpha.800">
                Goals
              </ChakraLink>
              <ChakraLink onClick={() => setCurrentView('preferences')} color="whiteAlpha.800">
                Preferences
              </ChakraLink>
            </HStack>
            <HStack>
              <Text color="whiteAlpha.700" fontSize="sm">
                Logged in as: {user.email}
              </Text>
              <Button
                onClick={signOut}
                size="sm"
                colorScheme="red"
                variant="outline"
                borderColor="red.300"
                color="red.100"
                _hover={{ bg: 'red.600', color: 'white' }}
              >
                Logout
              </Button>
            </HStack>
          </HStack>
        </Box>
      )}

      <Box flex="1" p={8} bg="brand.50">
        {renderContent()}
      </Box>

      <Box bg="brand.900" py={4} px={8} textAlign="center" color="whiteAlpha.600" fontSize="sm">
        <Text>&copy; {new Date().getFullYear()} Personal Fitness Tracker. All rights reserved.</Text>
      </Box>
    </Flex>
  );
};

const App: React.FC = () => (
  <ErrorBoundary>
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <AppCon />
      </AuthProvider>
    </ChakraProvider>
  </ErrorBoundary>
);

export default App;

