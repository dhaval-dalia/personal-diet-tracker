// src/App.tsx
// This is the main application component that orchestrates all other components.
// It sets up the Chakra UI provider, the Supabase authentication provider,
// and manages the overall application flow based on user authentication and
// onboarding status. It also includes a basic navigation system.

import React, { useState, useEffect } from 'react';
import { ChakraProvider, Box, Flex, VStack, HStack, Button, Text, Spacer, Link as ChakraLink } from '@chakra-ui/react';
import theme from './theme'; // Import your custom Chakra UI theme
import { AuthProvider, useAuth } from './hooks/useAuth'; // Auth context and hook
import ErrorBoundary from './components/shared/ErrorBoundary'; // Error Boundary for robust error handling
import LoadingSpinner from './components/shared/LoadingSpinner'; // Loading spinner for initial load

// Import core application components
import LoginForm from './components/auth/LoginForm';
import OnboardingFlow from './components/auth/OnboardingFlow';
import MealLogger from './components/meal-logging/MealLogger';
import DailyOverview from './components/dashboard/DailyOverview';
import NutritionChart from './components/dashboard/NutritionChart';
import ProgressTracker from './components/dashboard/ProgressTracker';
import RecommendationCard from './components/dashboard/RecommendationCard'; // Individual card
import UserProfile from './components/profile/UserProfile';
import GoalSetting from './components/profile/GoalSetting';
import Preferences from './components/profile/Preferences';

// Supabase import for checking onboarding status
import { supabase } from './services/supabase';
import { useErrorHandling } from './hooks/useErrorHandling';

// Define the different views/pages in the application
type AppView = 'login' | 'signup' | 'onboarding' | 'dashboard' | 'log-meal' | 'profile' | 'goals' | 'preferences';

// Main Application Component
const AppCon: React.FC = () => {
  const { user, isLoading, isAuthReady, signOut } = useAuth();
  const { handleError } = useErrorHandling();

  // State to manage the current view of the application
  const [currentView, setCurrentView] = useState<AppView>('login');
  // State to track if user has completed onboarding
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  // State to manage loading specific to onboarding status check
  const [isLoadingOnboardingStatus, setIsLoadingOnboardingStatus] = useState(true);

  // Effect to determine the initial view based on authentication and onboarding status
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!isAuthReady || isLoading) {
        // Wait until auth state is confirmed and not loading
        return;
      }

      setIsLoadingOnboardingStatus(true);
      if (user) {
        try {
          // Check if user has a profile entry (indicating onboarding completion)
          const { data, error } = await supabase
            .from('user_profiles')
            .select('user_id')
            .eq('user_id', user.id)
            .single();

          if (error && error.code !== 'PGRST116') { // PGRST116 means "no rows found"
            throw error;
          }

          if (data) {
            setIsOnboardingComplete(true);
            setCurrentView('dashboard'); // Go to dashboard if logged in and onboarded
          } else {
            setIsOnboardingComplete(false);
            setCurrentView('onboarding'); // Go to onboarding if logged in but not onboarded
          }
        } catch (err) {
          handleError(err, 'Failed to check onboarding status');
          setCurrentView('login'); // Fallback to login on error
        } finally {
          setIsLoadingOnboardingStatus(false);
        }
      } else {
        // If not authenticated, show login form
        setCurrentView('login');
        setIsLoadingOnboardingStatus(false);
      }
    };

    checkOnboardingStatus();
  }, [user, isLoading, isAuthReady, handleError]);

  // Handle successful login: transition to onboarding or dashboard
  const handleLoginSuccess = () => {
    // Re-check onboarding status after login to ensure correct redirection
    setIsLoadingOnboardingStatus(true); // Trigger re-check
  };

  // Handle successful signup: transition to onboarding
  const handleSignUpSuccess = () => {
    setCurrentView('onboarding');
  };

  // Handle onboarding completion: transition to dashboard
  const handleOnboardingComplete = () => {
    setIsOnboardingComplete(true);
    setCurrentView('dashboard');
  };

  // Render content based on current view
  const renderContent = () => {
    if (isLoading || isLoadingOnboardingStatus) {
      return <LoadingSpinner message="Initializing application..." />;
    }

    if (!user) {
      // Not authenticated
      if (currentView === 'signup') {
        return <LoginForm onSuccess={handleLoginSuccess} onSwitchToSignUp={() => setCurrentView('login')} />; // Reusing LoginForm for signup for now, but you'd have a separate SignUpForm
      }
      return <LoginForm onSuccess={handleLoginSuccess} onSwitchToSignUp={() => setCurrentView('signup')} />;
    }

    if (!isOnboardingComplete) {
      // Authenticated but not onboarded
      return <OnboardingFlow onOnboardingComplete={handleOnboardingComplete} />;
    }

    // Authenticated and onboarded - main application views
    switch (currentView) {
      case 'dashboard':
        return (
          <VStack spacing={8} align="stretch">
            <DailyOverview />
            {/* Example data for NutritionChart - replace with actual fetched data */}
            <NutritionChart data={[
              { date: 'Mon', calories: 1800, protein: 80, carbs: 200, fat: 60 },
              { date: 'Tue', calories: 2200, protein: 100, carbs: 250, fat: 70 },
              { date: 'Wed', calories: 1950, protein: 90, carbs: 210, fat: 65 },
              { date: 'Thu', calories: 2100, protein: 95, carbs: 230, fat: 68 },
              { date: 'Fri', calories: 2300, protein: 110, carbs: 260, fat: 75 },
              { date: 'Sat', calories: 2500, protein: 120, carbs: 280, fat: 80 },
              { date: 'Sun', calories: 2000, protein: 85, carbs: 220, fat: 62 },
            ]} />
            <ProgressTracker />
            {/* RecommendationCard would be rendered within a list, fetching data from useRecommendations */}
            <Box p={6} borderRadius="lg" bg="whiteAlpha.700" boxShadow="lg" borderColor="brand.200" borderWidth={1}>
              <Text fontSize="lg" fontWeight="bold" mb={4} color="text.dark">
                Recommendations (Example)
              </Text>
              <RecommendationCard
                recommendation={{
                  id: 'rec1', userId: user.id, type: 'nutrition', title: 'Increase Fiber Intake',
                  content: 'Aim for more whole grains, fruits, and vegetables to boost your fiber intake for better digestion.',
                  createdAt: new Date().toISOString(),
                }}
              />
            </Box>
          </VStack>
        );
      case 'log-meal':
        return <MealLogger />;
      case 'profile':
        return <UserProfile />;
      case 'goals':
        return <GoalSetting />;
      case 'preferences':
        return <Preferences />;
      default:
        return <Text>Page not found.</Text>;
    }
  };

  return (
    <Flex direction="column" minH="100vh">
      {/* Navbar/Header */}
      {user && isOnboardingComplete && (
        <Box bg="brand.700" py={4} px={8} boxShadow="md">
          <HStack spacing={8} justifyContent="space-between" alignItems="center">
            <Text fontSize="2xl" fontWeight="bold" color="white">
              Fitness Tracker
            </Text>
            <HStack spacing={6}>
              <ChakraLink onClick={() => setCurrentView('dashboard')} color="whiteAlpha.800" _hover={{ color: 'white' }}>
                Dashboard
              </ChakraLink>
              <ChakraLink onClick={() => setCurrentView('log-meal')} color="whiteAlpha.800" _hover={{ color: 'white' }}>
                Log Meal
              </ChakraLink>
              <ChakraLink onClick={() => setCurrentView('profile')} color="whiteAlpha.800" _hover={{ color: 'white' }}>
                Profile
              </ChakraLink>
              <ChakraLink onClick={() => setCurrentView('goals')} color="whiteAlpha.800" _hover={{ color: 'white' }}>
                Goals
              </ChakraLink>
              <ChakraLink onClick={() => setCurrentView('preferences')} color="whiteAlpha.800" _hover={{ color: 'white' }}>
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

      {/* Main Content Area */}
      <Box flex="1" p={8} bg="brand.50"> {/* Use light pastel background */}
        {renderContent()}
      </Box>

      {/* Footer */}
      <Box bg="brand.900" py={4} px={8} textAlign="center" color="whiteAlpha.600" fontSize="sm">
        <Text>&copy; {new Date().getFullYear()} Personal Fitness Tracker. All rights reserved.</Text>
      </Box>
    </Flex>
  );
};

// Root App component wrapped with providers
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ChakraProvider theme={theme}>
        <AuthProvider>
          <AppCon />
        </AuthProvider>
      </ChakraProvider>
    </ErrorBoundary>
  );
};

export default App;
