// src/pages/api/n8n/meal-log.ts
// This Next.js API route acts as a secure proxy for the n8n Meal Logging Workflow.
// It receives meal data from the frontend and securely forwards it to the n8n webhook URL.

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Create a service role client for server-side operations
const supabaseAdmin = createClient(
  'https://mhqtlftcuefoaqzmvlpq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ocXRsZnRjdWVmb2Fxem12bHBxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODA5MjgzNSwiZXhwIjoyMDYzNjY4ODM1fQ.WF3tNivX-0kZ0Ua9F0EleC0FZyAxucodLCYc7_m5-uQ',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Ensure the request method is POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Ensure the n8n webhook URL is configured
  const n8nWebhookUrl = process.env.N8N_MEAL_LOGGING_WEBHOOK_URL || 'http://localhost:5678/webhook/log-meal';
  if (!n8nWebhookUrl) {
    console.error('N8N_MEAL_LOGGING_WEBHOOK_URL is not set in environment variables!');
    return res.status(500).json({ message: 'Server configuration error: n8n webhook URL missing.' });
  }

  try {
    const { userId, mealData } = req.body;

    // Validate required fields
    if (!userId || !mealData) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        details: {
          userId: !userId,
          mealData: !mealData
        }
      });
    }

    // Verify user exists in Supabase
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userError || !userData) {
      console.error('User verification failed:', userError);
      return res.status(401).json({ message: 'Invalid user' });
    }

    // Forward the request to the n8n webhook
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': userId,
      },
      body: JSON.stringify({ userId, mealData }),
    });

    // Check if the n8n webhook call was successful
    if (!n8nResponse.ok) {
      const errorData = await n8nResponse.text();
      console.error(`Error from n8n meal logging webhook (Status: ${n8nResponse.status}):`, errorData);
      throw new Error(`n8n meal logging webhook failed with status: ${n8nResponse.status}`);
    }

    // Parse n8n's response and send it back to the client
    const data = await n8nResponse.json();
    return res.status(200).json({ success: true, data });

  } catch (error: any) {
    console.error('API route error for n8n meal logging:', error);
    return res.status(500).json({ 
      message: error.message || 'Internal Server Error during meal logging.',
      error: error.toString()
    });
  }
}
