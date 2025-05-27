// src/hooks/useAuth.ts
// This custom hook manages user authentication state using Supabase.
// It provides functions for signing up, logging in, logging out,
// and accessing the current user session. It also handles loading states
// and errors.

import { useState, useEffect, useContext, createContext, ReactNode, JSX } from 'react';
import { supabase } from '../services/supabase';
import { Session, User } from '@supabase/supabase-js';
import { loginSchema, signupSchema } from '../utils/validation';
import { z } from 'zod';
import { useErrorHandling } from './useErrorHandling';
import { triggerOnboarding } from '../services/n8nWebhooks';


interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (data: z.infer<typeof loginSchema>) => Promise<{ user: User | null; error: Error | null }>;
  signUp: (data: z.infer<typeof signupSchema>) => Promise<{ user: User | null; error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  isAuthReady: boolean;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider = ({ children }: AuthProviderProps): JSX.Element => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const { handleError } = useErrorHandling();

  useEffect(() => {
    console.log('AuthProvider useEffect triggered.');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        setUser(session?.user || null);
        setIsLoading(false);
        setIsAuthReady(true);
        console.log('isAuthReady set to true.');
      }
    );

    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('Initial session check:', session);
        if (error) throw error;
        setSession(session);
        setUser(session?.user || null);
      } catch (error) {
        handleError(error, 'Failed to get initial session.');
        setUser(null);
      } finally {
        setIsLoading(false);
        setIsAuthReady(true);
        console.log('isAuthReady set to true after initial session check.');
      }
    };

    getInitialSession();

    return () => {
      console.log('Auth listener cleanup.');
      subscription?.unsubscribe();
    };
  }, [handleError]);

  const signIn = async (data: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    try {
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) throw error;
      return { user, error: null };
    } catch (error) {
      handleError(error);
      return { user: null, error: error as Error };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (data: z.infer<typeof signupSchema>) => {
    setIsLoading(true);
    try {
      const { data: { user }, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });
      if (error) throw error;

      if (user) {
        await triggerOnboarding({
          userId: user.id,
          email: user.email,
        });
      }

      return { user, error: null };
    } catch (error) {
      handleError(error);
      return { user: null, error: error as Error };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      handleError(error);
      return { error: error as Error };
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    session,
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    isAuthReady,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    console.warn('useAuth must be used within an AuthProvider - check your component hierarchy');
    return {
      session: null,
      user: null,
      isLoading: false,
      signIn: async () => ({ user: null, error: new Error('Auth not initialized') }),
      signUp: async () => ({ user: null, error: new Error('Auth not initialized') }),
      signOut: async () => ({ error: new Error('Auth not initialized') }),
      isAuthReady: false
    };
  }
  return context;
};

export { AuthProvider, useAuth };
