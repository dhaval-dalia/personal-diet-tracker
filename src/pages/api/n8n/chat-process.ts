import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../services/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, message, timestamp } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: {
          userId: !userId,
          message: !message
        }
      });
    }

    // Fetch user profile data for context
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      // Continue without profile data
    }

    // TODO: Replace with actual n8n webhook URL
    const n8nWebhookUrl = process.env.N8N_CHAT_WEBHOOK_URL || 'http://localhost:5678/webhook/chat-process';

    // Send request to n8n
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        message,
        timestamp,
        userProfile: profileData || null,
        // Add any additional context needed for n8n
        context: {
          platform: 'web',
          source: 'chat-widget'
        }
      }),
    });

    if (!n8nResponse.ok) {
      throw new Error(`n8n webhook failed: ${n8nResponse.statusText}`);
    }

    const botResponse = await n8nResponse.json();

    // For now, return a temporary response until n8n is set up
    return res.status(200).json({
      message: "I'm your fitness assistant. I'll help you track your nutrition and fitness goals. What would you like to know?",
      metadata: {
        type: 'greeting',
        confidence: 1.0,
        suggestedActions: [
          'View today\'s nutrition summary',
          'Log a meal',
          'Check progress towards goals',
          'Get workout recommendations'
        ]
      }
    });

  } catch (error) {
    console.error('Error in chat-process:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
