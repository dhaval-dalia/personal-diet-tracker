// src/components/auth/LoginForm.tsx
// This component provides the user login form. It uses React Hook Form for
// form management and Zod for validation, ensuring data integrity.
// It integrates with the `useAuth` hook for authentication logic and
// `useErrorHandling` for displaying toast notifications.

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  Input,
  VStack,
  Heading,
  Text,
  Link,
  useToast,
} from '@chakra-ui/react';
import { loginSchema } from '../../utils/validation';
import { useAuth } from '../../hooks/useAuth';
import { useErrorHandling } from '../../hooks/useErrorHandling';

type LoginFormInputs = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToSignUp?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onSwitchToSignUp }) => {
  const [loginAttempts, setLoginAttempts] = useState(0);
  const toast = useToast();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'abc@xyz.com',
      password: 'pass@123',
    },
  });

  const { signIn } = useAuth();
  const { handleError, showToast } = useErrorHandling();

  const onSubmit = async (data: LoginFormInputs) => {
    try {
      // Check for test credentials
      if (data.email === 'abc@xyz.com' && data.password === 'pass@123') {
        showToast({
          title: 'Login Successful!',
          description: 'Welcome to your dashboard.',
          status: 'success',
        });
        reset();
        onSuccess?.();
        return;
      }

      const { user, error } = await signIn(data);

      if (error) {
        setLoginAttempts(prev => prev + 1);
        throw error;
      }

      if (user) {
        showToast({
          title: 'Login Successful!',
          description: `Welcome back, ${user.email}.`,
          status: 'success',
        });
        reset();
        onSuccess?.();
      }
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <Box
      p={8}
      maxWidth="500px"
      borderWidth={1}
      borderRadius="lg"
      boxShadow="lg"
      bg="whiteAlpha.700"
      borderColor="brand.200"
      mx="auto"
      my={8}
    >
      <VStack gap={4}>
        <Heading as="h2" size="xl" textAlign="center" color="text.dark">
          Welcome Back!
        </Heading>
        <Text fontSize="md" color="text.light" textAlign="center" mb={4}>
          Sign in to track your fitness journey.
        </Text>

        <form onSubmit={handleSubmit(onSubmit)}>
          <VStack gap={4}>
            <Box>
              <Text as="label" color="text.dark" mb={2} display="block">
                Email address
              </Text>
              <Input
                type="email"
                {...register('email')}
                placeholder="Enter your email"
                borderColor={errors.email ? 'red.500' : 'brand.200'}
                _focus={{ borderColor: 'brand.300', boxShadow: '0 0 0 1px var(--chakra-colors-brand-300)' }}
              />
              {errors.email && (
                <Text color="red.500" fontSize="sm" mt={1}>
                  {errors.email.message}
                </Text>
              )}
              {loginAttempts > 0 && (
                <Text color="red.500" fontSize="sm" mt={1}>
                  Username or password needs to be checked
                </Text>
              )}
            </Box>

            <Box>
              <Text as="label" color="text.dark" mb={2} display="block">
                Password
              </Text>
              <Input
                type="password"
                {...register('password')}
                placeholder="Enter your password"
                borderColor={errors.password ? 'red.500' : 'brand.200'}
                _focus={{ borderColor: 'brand.300', boxShadow: '0 0 0 1px var(--chakra-colors-brand-300)' }}
              />
              {errors.password && (
                <Text color="red.500" fontSize="sm" mt={1}>
                  {errors.password.message}
                </Text>
              )}
              {loginAttempts >= 3 && (
                <Text fontSize="sm" mt={1}>
                  <Link color="accent.500" onClick={() => toast({
                    title: "Password Reset",
                    description: "Under development",
                    status: "info",
                    duration: 3000,
                    isClosable: true,
                  })}>
                    Can't remember? Change it here
                  </Link>
                </Text>
              )}
            </Box>

            <Button
              type="submit"
              isLoading={isSubmitting}
              colorScheme="teal"
              variant="solid"
              width="full"
              mt={4}
              bg="accent.100"
              color="text.dark"
              _hover={{ bg: 'accent.200' }}
            >
              Sign In
            </Button>
          </VStack>
        </form>

        <Text textAlign="center" mt={6} color="text.light">
          Don't have an account?{' '}
          <Link onClick={onSwitchToSignUp} color="accent.500" fontWeight="bold">
            Sign Up
          </Link>
        </Text>
      </VStack>
    </Box>
  );
};

export default LoginForm;
