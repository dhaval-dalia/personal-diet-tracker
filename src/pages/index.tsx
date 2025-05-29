// src/pages/index.tsx
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Box, Text } from '@chakra-ui/react';
import AppCon from '../App';
import LoginForm from '@/components/auth/LoginForm';
import SignUpForm from '@/components/auth/SignUpForm';

const HomePage: React.FC = () => {
  const { user, isAuthReady } = useAuth();
  const [showSignUp, setShowSignUp] = useState(false);

  // If user is authenticated, show the main app
  if (user) {
    return <AppCon />;
  }

  // If auth is not ready, show loading
  if (!isAuthReady) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Text>Loading...</Text>
      </Box>
    );
  }

  // Show authentication forms
  return (
    <Box minHeight="100vh" bg="gray.50" py={8}>
      {showSignUp ? (
        <SignUpForm 
          onSuccess={() => {
            // Optionally switch to login after successful signup
            setShowSignUp(false);
          }}
          onSwitchToLogin={() => setShowSignUp(false)}
        />
      ) : (
        <LoginForm 
          onSuccess={() => {
            // User will be automatically redirected when auth state changes
          }}
          onSwitchToSignUp={() => setShowSignUp(true)}
        />
      )}
    </Box>
  );
};

export default HomePage;
