import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../services/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, message, timestamp, context } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('Processing chat message:', { userId, message, timestamp, context });

    // Save the chat interaction
    const { data: chatData, error: chatError } = await supabase
      .from('chat_interactions')
      .insert([
        {
          user_id: userId,
          message: message,
          created_at: timestamp || new Date().toISOString(),
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
    return res.status(200).json({
      success: true,
      message: 'Message received and processed',
      data: chatData
    });

  } catch (error) {
    console.error('Error in chat endpoint:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 