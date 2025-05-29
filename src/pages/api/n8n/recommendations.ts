// src/pages/api/n8n/recommendations.ts
// This Next.js API route acts as a secure proxy for the n8n Recommendations Workflow.
// It receives a request from the frontend (e.g., for user recommendations)
// and securely forwards it to the n8n webhook URL.

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Ensure the request method is POST (or GET, depending on your n8n webhook setup)
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Ensure the n8n webhook URL is configured
  const n8nWebhookUrl = process.env.N8N_RECOMMENDATIONS_WEBHOOK_URL || 'http://localhost:5678/webhook/recommendations';
  if (!n8nWebhookUrl) {
    console.error('N8N_RECOMMENDATIONS_WEBHOOK_URL is not set in environment variables!');
    return res.status(500).json({ message: 'Server configuration error: n8n webhook URL missing.' });
  }

  try {
    // Optional: Add server-side validation for req.body here
    // For example, validate the userId or any other parameters
    // const { userId } = req.body;
    // if (!userId) {
    //   return res.status(400).json({ message: 'User ID is required.' });
    // }

    // Forward the request to the n8n webhook
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST', // Use POST as it triggers a backend process
      headers: {
        'Content-Type': 'application/json',
        // Add any n8n webhook authentication headers here if required (e.g., API key)
        // 'X-N8N-API-Key': process.env.N8N_API_KEY,
      },
      body: JSON.stringify(req.body), // Pass the frontend data (e.g., { userId: '...' }) to n8n
    });

    // Check if the n8n webhook call was successful
    if (!n8nResponse.ok) {
      const errorData = await n8nResponse.text(); // Get raw error response from n8n
      console.error(`Error from n8n recommendations webhook (Status: ${n8nResponse.status}):`, errorData);
      // Re-throw to be caught by the outer catch block
      throw new Error(`n8n recommendations webhook failed with status: ${n8nResponse.status}`);
    }

    // Parse n8n's response and send it back to the client
    const data = await n8nResponse.json();
    return res.status(200).json({ success: true, data });

  } catch (error: any) {
    console.error('API route error for n8n recommendations:', error);
    // Send a generic error message to the client, log detailed error on server
    return res.status(500).json({ message: error.message || 'Internal Server Error during recommendations request.' });
  }
}
