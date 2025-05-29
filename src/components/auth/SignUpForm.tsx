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
  FormControl,
  FormLabel,
  FormErrorMessage,
  Alert,
  AlertIcon,
  Select,
  HStack,
} from '@chakra-ui/react';
import { useAuth } from '../../hooks/useAuth';
import { useErrorHandling } from '../../hooks/useErrorHandling';
import { countryCodes, getPhoneNumberError } from '../../utils/phoneValidation';

const signupSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignUpFormInputs = z.infer<typeof signupSchema>;

interface SignUpFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const [selectedCountry, setSelectedCountry] = useState('US');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
    clearErrors,
    watch,
  } = useForm<SignUpFormInputs>({
    resolver: zodResolver(signupSchema),
  });

  const { signUp } = useAuth();
  const { handleError, showToast } = useErrorHandling();
  const phoneValue = watch('phone');

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCountry(e.target.value);
    if (phoneValue) {
      const error = getPhoneNumberError(phoneValue, e.target.value);
      if (error) {
        setError('phone', { type: 'manual', message: error });
      } else {
        clearErrors('phone');
      }
    }
  };

  const onSubmit = async (data: SignUpFormInputs) => {
    try {
      clearErrors();
      
      console.log('Starting signup process for:', data.email);

      const { user, error } = await signUp({
        email: data.email,
        password: data.password
      });

      if (error) {
        console.error('Supabase signup error:', error);
        
        const errorMessage = error.message || '';
        
        if (errorMessage.includes('User already registered') || 
            errorMessage.includes('already registered') ||
            errorMessage.includes('already been registered') ||
            errorMessage.includes('email already exists')) {
          setError('email', {
            type: 'server',
            message: 'This email is already registered. Please sign in instead.'
          });
          return;
        }

        if (errorMessage.includes('Password should be at least') || 
            (errorMessage.includes('password') && errorMessage.includes('weak'))) {
          setError('password', {
            type: 'server',
            message: 'Password is too weak. Please choose a stronger password.'
          });
          return;
        }

        if (errorMessage.includes('Invalid email')) {
          setError('email', {
            type: 'server',
            message: 'Please enter a valid email address.'
          });
          return;
        }

        if (errorMessage.includes('Invalid phone')) {
          setError('phone', {
            type: 'server',
            message: 'Please enter a valid phone number.'
          });
          return;
        }

        if (errorMessage.includes('Email rate limit exceeded')) {
          setError('email', {
            type: 'server',
            message: 'Too many signup attempts. Please try again later.'
          });
          return;
        }

        setError('email', {
          type: 'server',
          message: errorMessage || 'Signup failed. Please try again.'
        });
        return;
      }

      if (user) {
        console.log('Signup successful:', user.id);

        showToast({
          title: 'Account Created Successfully!',
          description: user.email_confirmed_at 
            ? 'You can now sign in to your account.'
            : 'Please check your email and click the verification link to activate your account.',
          status: 'success',
          duration: 8000,
        });

        reset();
        onSuccess?.();
      }
    } catch (error) {
      console.error('Unexpected signup error:', error);
      setError('email', {
        type: 'server',
        message: 'An unexpected error occurred. Please try again.'
      });
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
      <VStack spacing={6}>
        <Heading as="h2" size="xl" textAlign="center" color="text.dark">
          Create Account
        </Heading>
        <Text fontSize="md" color="text.light" textAlign="center">
          Join us to start your fitness journey.
        </Text>

        <Box as="form" onSubmit={handleSubmit(onSubmit)} width="100%">
          <VStack spacing={4}>
            {/* Name Fields Row */}
            <Box display="flex" gap={4} width="100%">
              <FormControl isInvalid={!!errors.firstName} flex={1}>
                <FormLabel color="text.dark">First Name</FormLabel>
                <Input
                  type="text"
                  {...register('firstName')}
                  placeholder="Enter your first name"
                  borderColor={errors.firstName ? 'red.500' : 'brand.200'}
                  _focus={{ 
                    borderColor: errors.firstName ? 'red.500' : 'brand.300', 
                    boxShadow: errors.firstName 
                      ? '0 0 0 1px var(--chakra-colors-red-500)' 
                      : '0 0 0 1px var(--chakra-colors-brand-300)' 
                  }}
                />
                {errors.firstName && (
                  <FormErrorMessage mt={1}>
                    <Text fontSize="sm" color="red.500">{errors.firstName.message}</Text>
                  </FormErrorMessage>
                )}
              </FormControl>

              <FormControl isInvalid={!!errors.lastName} flex={1}>
                <FormLabel color="text.dark">Last Name</FormLabel>
                <Input
                  type="text"
                  {...register('lastName')}
                  placeholder="Enter your last name"
                  borderColor={errors.lastName ? 'red.500' : 'brand.200'}
                  _focus={{ 
                    borderColor: errors.lastName ? 'red.500' : 'brand.300', 
                    boxShadow: errors.lastName 
                      ? '0 0 0 1px var(--chakra-colors-red-500)' 
                      : '0 0 0 1px var(--chakra-colors-brand-300)' 
                  }}
                />
                {errors.lastName && (
                  <FormErrorMessage mt={1}>
                    <Text fontSize="sm" color="red.500">{errors.lastName.message}</Text>
                  </FormErrorMessage>
                )}
              </FormControl>
            </Box>

            <FormControl isInvalid={!!errors.email}>
              <FormLabel color="text.dark">Email address</FormLabel>
              <Input
                type="email"
                {...register('email')}
                placeholder="Enter your email"
                borderColor={errors.email ? 'red.500' : 'brand.200'}
                _focus={{ 
                  borderColor: errors.email ? 'red.500' : 'brand.300', 
                  boxShadow: errors.email 
                    ? '0 0 0 1px var(--chakra-colors-red-500)' 
                    : '0 0 0 1px var(--chakra-colors-brand-300)' 
                }}
              />
              {errors.email && (
                <FormErrorMessage mt={2}>
                  <Alert status="error" size="sm" borderRadius="md">
                    <AlertIcon boxSize="16px" />
                    <Text fontSize="sm">{errors.email.message}</Text>
                  </Alert>
                </FormErrorMessage>
              )}
            </FormControl>

            <FormControl isInvalid={!!errors.phone}>
              <FormLabel color="text.dark">Phone Number</FormLabel>
              <Input
                type="tel"
                {...register('phone')}
                placeholder="Enter your phone number (e.g., +1234567890)"
                borderColor={errors.phone ? 'red.500' : 'brand.200'}
                _focus={{ 
                  borderColor: errors.phone ? 'red.500' : 'brand.300', 
                  boxShadow: errors.phone 
                    ? '0 0 0 1px var(--chakra-colors-red-500)' 
                    : '0 0 0 1px var(--chakra-colors-brand-300)' 
                }}
              />
              {errors.phone && (
                <FormErrorMessage mt={2}>
                  <Alert status="error" size="sm" borderRadius="md">
                    <AlertIcon boxSize="16px" />
                    <Text fontSize="sm">{errors.phone.message}</Text>
                  </Alert>
                </FormErrorMessage>
              )}
            </FormControl>

            <FormControl isInvalid={!!errors.password}>
              <FormLabel color="text.dark">Password</FormLabel>
              <Input
                type="password"
                {...register('password')}
                placeholder="Enter your password (min 6 characters)"
                borderColor={errors.password ? 'red.500' : 'brand.200'}
                _focus={{ 
                  borderColor: errors.password ? 'red.500' : 'brand.300', 
                  boxShadow: errors.password 
                    ? '0 0 0 1px var(--chakra-colors-red-500)' 
                    : '0 0 0 1px var(--chakra-colors-brand-300)' 
                }}
              />
              {errors.password && (
                <FormErrorMessage mt={2}>
                  <Alert status="error" size="sm" borderRadius="md">
                    <AlertIcon boxSize="16px" />
                    <Text fontSize="sm">{errors.password.message}</Text>
                  </Alert>
                </FormErrorMessage>
              )}
            </FormControl>

            <FormControl isInvalid={!!errors.confirmPassword}>
              <FormLabel color="text.dark">Confirm Password</FormLabel>
              <Input
                type="password"
                {...register('confirmPassword')}
                placeholder="Confirm your password"
                borderColor={errors.confirmPassword ? 'red.500' : 'brand.200'}
                _focus={{ 
                  borderColor: errors.confirmPassword ? 'red.500' : 'brand.300', 
                  boxShadow: errors.confirmPassword 
                    ? '0 0 0 1px var(--chakra-colors-red-500)' 
                    : '0 0 0 1px var(--chakra-colors-brand-300)' 
                }}
              />
              {errors.confirmPassword && (
                <FormErrorMessage mt={2}>
                  <Alert status="error" size="sm" borderRadius="md">
                    <AlertIcon boxSize="16px" />
                    <Text fontSize="sm">{errors.confirmPassword.message}</Text>
                  </Alert>
                </FormErrorMessage>
              )}
            </FormControl>

            <Button
              type="submit"
              isLoading={isSubmitting}
              loadingText="Creating Account..."
              colorScheme="teal"
              variant="solid"
              width="100%"
              mt={4}
              bg="accent.100"
              color="text.dark"
              _hover={{ bg: 'accent.200' }}
              _disabled={{ opacity: 0.6, cursor: 'not-allowed' }}
            >
              Sign Up
            </Button>
          </VStack>
        </Box>

        <Text textAlign="center" color="text.light">
          Already have an account?{' '}
          <Link 
            onClick={onSwitchToLogin} 
            color="accent.500" 
            fontWeight="bold"
            cursor="pointer"
            _hover={{ textDecoration: 'underline' }}
          >
            Sign In
          </Link>
        </Text>
      </VStack>
    </Box>
  );
};

export default SignUpForm;
