import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../services/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, userMessage, botResponse } = req.body;

    // Log the incoming request data
    console.log('Received request data:', {
      userId,
      userMessage,
      botResponse
    });

    if (!userId || !userMessage || !botResponse) {
      console.error('Missing required fields:', { userId, userMessage, botResponse });
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: {
          userId: !userId,
          userMessage: !userMessage,
          botResponse: !botResponse
        }
      });
    }

    // Prepare the messages with proper metadata
    const userMessageData = {
      user_id: userId,
      message: userMessage.message || '',
      is_bot: false,
      created_at: userMessage.created_at || new Date().toISOString(),
      metadata: userMessage.metadata || {}
    };

    const botMessageData = {
      user_id: userId,
      message: botResponse.message || '',
      is_bot: true,
      created_at: botResponse.created_at || new Date().toISOString(),
      metadata: botResponse.metadata || {}
    };

    // Log the prepared data
    console.log('Prepared data for insertion:', {
      userMessageData,
      botMessageData
    });

    // Save the chat interaction to Supabase
    const { data, error } = await supabase
      .from('chat_interactions')
      .insert([userMessageData, botMessageData])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ 
        error: 'Database error',
        details: error,
        message: error.message
      });
    }

    // Log successful insertion
    console.log('Successfully saved chat data:', data);

    return res.status(200).json({ 
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Unexpected error in save-chat-data:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
} 