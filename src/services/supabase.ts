          // src/services/supabase.ts
// This file initializes the Supabase client using environment variables.
// It provides the main Supabase client instance for interacting with the database
// and authentication services throughout the application.

import { createClient } from '@supabase/supabase-js';

// Ensure environment variables are loaded and available.
// In a Next.js environment, NEXT_PUBLIC_ variables are automatically exposed to the client.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create and export the Supabase client instance.
// This client is used for all client-side interactions with Supabase,
// including authentication and data fetching/mutations, respecting RLS policies.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Optional: For server-side Supabase client (e.g., in Next.js API routes)
// This client would use the SUPABASE_SERVICE_ROLE_KEY and bypass RLS,
// thus it must ONLY be used in secure server environments.
export const createServerClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }

  return createClient(supabaseUrl, serviceRoleKey);
};
