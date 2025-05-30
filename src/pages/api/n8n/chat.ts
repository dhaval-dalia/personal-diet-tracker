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
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('Processing chat message:', { user_id, message, created_at, context });

    // Save the chat interaction
    const { data: chatData, error: chatError } = await supabase
      .from('chat_interactions')
      .insert([
        {
          user_id,
          message,
          created_at: created_at || new Date().toISOString(),
          metadata: context || {},
          is_bot: false
        }
      ])
      .select()
      .single();

    if (chatError) {
      console.error('Supabase error:', chatError);
      return res.status(500).json({ 
        error: 'Failed to save chat interaction',
        details: chatError.message
      });
    }

    // Return a JSON response
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({
      success: true,
      message: 'Message received and processed',
      data: chatData
    });

  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 