// pages/api/n8n/onboarding.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Ensure the n8n webhook URL is configured
  const n8nWebhookUrl = process.env.N8N_ONBOARDING_WEBHOOK_URL|| 'http://localhost:5678/webhook/onboard';
  if (!n8nWebhookUrl) {
    console.error('N8N_ONBOARDING_WEBHOOK_URL is not set in environment variables!');
    return res.status(500).json({ message: 'Server configuration error: n8n webhook URL missing.' });
  }

  try {
    console.log('Forwarding request to n8n webhook:', n8nWebhookUrl);
    
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    const result = await response.json();
    if (!response.ok) {
      console.error('Error response from n8n webhook:', result);
      return res.status(response.status).json(result);
    }

    console.log('Successfully forwarded request to n8n webhook');
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error forwarding to n8n webhook:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
