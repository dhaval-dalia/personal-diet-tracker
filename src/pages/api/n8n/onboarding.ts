// src/pages/api/n8n/onboarding.ts
// This Next.js API route acts as a secure proxy for the n8n Onboarding Workflow.
// It receives data from the frontend and securely forwards it to the n8n webhook URL.

import type { NextApiRequest, NextApiResponse } from 'next';
import { N8N_WEBHOOK_URLS } from '../../../utils/constants'; // Import n8n webhook URLs

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Ensure the request method is POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Ensure the n8n webhook URL is configured
  const n8nWebhookUrl = N8N_WEBHOOK_URLS.ONBOARDING;
  if (!n8nWebhookUrl) {
    console.error('N8N_ONBOARDING_WEBHOOK_URL is not set in environment variables!');
    return res.status(500).json({ message: 'Server configuration error: n8n webhook URL missing.' });
  }

  try {
    // Optional: Add server-side validation for req.body here
    // For example, validate user data structure before forwarding to n8n
    // const validationResult = yourSchema.safeParse(req.body);
    // if (!validationResult.success) {
    //   return res.status(400).json({ message: 'Invalid input data', errors: validationResult.error.flatten() });
    // }

    // Forward the request to the n8n webhook
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add any n8n webhook authentication headers here if required (e.g., API key)
        // 'X-N8N-API-Key': process.env.N8N_API_KEY,
      },
      body: JSON.stringify(req.body), // Pass the frontend data to n8n
    });

    // Check if the n8n webhook call was successful
    if (!n8nResponse.ok) {
      const errorData = await n8nResponse.text(); // Get raw error response from n8n
      console.error(`Error from n8n onboarding webhook (Status: ${n8nResponse.status}):`, errorData);
      // Re-throw to be caught by the outer catch block
      throw new Error(`n8n onboarding webhook failed with status: ${n8nResponse.status}`);
    }

    // Parse n8n's response and send it back to the client
    const data = await n8nResponse.json();
    return res.status(200).json({ success: true, data });

  } catch (error: any) {
    console.error('API route error for n8n onboarding:', error);
    // Send a generic error message to the client, log detailed error on server
    return res.status(500).json({ message: error.message || 'Internal Server Error during onboarding.' });
  }
}
