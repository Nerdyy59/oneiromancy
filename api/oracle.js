// /api/oracle.js — Vercel serverless function
// Holds the Anthropic API key server-side and forwards the oracle request.
// The browser never sees the key.

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server is missing its API key configuration.' });
  }

  try {
    // Vercel parses JSON bodies automatically; fall back if it's a string.
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { system, messages } = body;

    if (!system || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Malformed request.' });
    }

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        system,
        messages,
      }),
    });

    const data = await upstream.json();

    // Pass through Anthropic's status so the app's friendly error handling still works
    // (e.g. 429 -> "the oracle is receiving many seekers").
    return res.status(upstream.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'The oracle chamber could not be reached.' });
  }
}
