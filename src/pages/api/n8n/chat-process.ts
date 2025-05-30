import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../services/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user_id, message, created_at, context } = req.body;

    if (!user_id || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: {
          user_id: !user_id,
          message: !message
        }
      });
    }

    // Fetch user profile data for context
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user_id)
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
        user_id,
        message,
        created_at: created_at || new Date().toISOString(),
        userProfile: profileData || null,
        context: context || {
          platform: 'web',
          source: 'chat-widget'
        }
      }),
    });

    if (!n8nResponse.ok) {
      const errorData = await n8nResponse.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `n8n webhook failed: ${n8nResponse.statusText}`);
    }

    const botResponse = await n8nResponse.json();
    
    // Save bot response to database
    const { error: saveError } = await supabase
      .from('chat_interactions')
      .insert([
        {
          user_id,
          message: botResponse.message || botResponse.response,
          created_at: new Date().toISOString(),
          metadata: { ...context, is_bot: true },
          is_bot: true
        }
      ]);

    if (saveError) {
      console.error('Error saving bot response:', saveError);
      // Continue even if save fails
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(botResponse);

  } catch (error: any) {
    console.error('Error in chat process endpoint:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
