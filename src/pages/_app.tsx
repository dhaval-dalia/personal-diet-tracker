// src/pages/_app.tsx
// This is the custom App component for Next.js.
// It wraps the entire application with ChakraProvider for UI theming
// and AuthProvider for managing user authentication state globally.
// This ensures that all components have access to the theme and auth context.

import type { AppProps } from 'next/app';
import { ChakraProvider } from '@chakra-ui/react';
import theme from '../theme'; // Your custom Chakra UI theme
import { AuthProvider } from '../hooks/useAuth'; // Your AuthProvider
import ErrorBoundary from '../components/shared/ErrorBoundary'; // Your ErrorBoundary
import AppCon from '../App'; // The main AppContent component from src/App.tsx

import '../styles/globals.css'; // Import global CSS, including Tailwind base

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <ChakraProvider theme={theme}>
        <AuthProvider>
          {/*
            The AppCon component (from src/App.tsx) now handles the
            conditional rendering of login, onboarding, and main app views.
            We pass Component and pageProps to it if it needs to render
            specific Next.js page content within its structure,
            though in this setup, AppCon manages the routing internally.
          */}
          <AppCon />
        </AuthProvider>
      </ChakraProvider>
    </ErrorBoundary>
  );
}

export default MyApp;
