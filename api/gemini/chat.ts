import { GoogleGenAI } from '@google/genai';

// Valid Gemini model list in priority order
const CANDIDATE_MODELS = Array.from(
  new Set(
    [
      process.env.GEMINI_MODEL,
      'gemini-3.6-flash',
      'gemini-3.1-flash-lite',
    ].filter(Boolean) as string[]
  )
);

function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.startsWith('your_') || apiKey.includes('placeholder')) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

async function generateWithFallback(ai: GoogleGenAI, options: { contents: any; config?: any }) {
  let lastError: any = null;
  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: options.contents,
        config: options.config,
      });
      if (response && (response.text || response.candidates)) {
        return response;
      }
    } catch (err: any) {
      lastError = err;
      const msg = err?.message || String(err);
      console.warn(`[chat] Model ${model} unavailable (${msg.slice(0, 80)}). Trying next...`);
      continue;
    }
  }
  throw lastError || new Error('All Gemini model candidates failed.');
}

export default async function handler(req: any, res: any) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { messages, context } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required.' });
    }

    const ai = getGenAI();

    // Graceful fallback if no valid API key is configured
    if (!ai) {
      console.warn('[chat] GEMINI_API_KEY is not set or is set to placeholder.');
      return res.status(200).json({
        reply: "Welcome! To activate live Gemini responses, please set your GEMINI_API_KEY in Vercel (Project Settings → Environment Variables). What thoughts would you like to explore today?",
        _notice: 'GEMINI_API_KEY is not configured or is set to placeholder.',
      });
    }

    // Map messages to Gemini multi-turn format
    const rawContents = messages
      .map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
        parts: [{ text: (m.content || '').trim() }],
      }))
      .filter((item: any) => item.parts[0].text.length > 0);

    // Gemini requires conversation to start with 'user' role
    while (rawContents.length > 0 && rawContents[0].role === 'model') {
      rawContents.shift();
    }

    if (rawContents.length === 0) {
      return res.status(200).json({
        reply: "I'm here with you. What would you like to brainstorm or reflect on today?",
      });
    }

    // Merge consecutive same-role turns (Gemini requirement)
    const contents: any[] = [];
    for (const turn of rawContents) {
      if (contents.length > 0 && contents[contents.length - 1].role === turn.role) {
        contents[contents.length - 1].parts[0].text += '\n\n' + turn.parts[0].text;
      } else {
        contents.push(turn);
      }
    }

    // Build system instruction
    let systemInstruction = `You are a supportive, mindful, and insightful personal journaling companion and creative brainstorming partner.
You help the user explore their emotions, brainstorm what to write about, reflect on meaningful moments, answer their curiosities, navigate complex feelings, and find clarity.
Keep responses conversational, warm, reflective, and concise (1-3 paragraphs). Ask gentle open-ended questions when appropriate.
ABSOLUTE RULE: Never provide medical, diagnostic, or clinical psychiatric advice.`;

    if (context) {
      if (context.mood) systemInstruction += `\nUser's current mood: ${context.mood}.`;
      if (context.currentEntryTitle) systemInstruction += `\nWorking Draft Title: "${context.currentEntryTitle}".`;
      if (context.currentEntryContent) {
        systemInstruction += `\nWorking Draft Excerpt: "${String(context.currentEntryContent).slice(0, 1000)}".`;
      }
    }

    const response = await generateWithFallback(ai, {
      contents,
      config: { systemInstruction },
    });

    return res.status(200).json({
      reply: response.text || "I hear you. What aspects of this feel most important to reflect on right now?",
    });
  } catch (error: any) {
    console.error('[chat] Gemini API error:', error?.message || error);
    const rawErr = error?.message || String(error);
    const isKeyError = rawErr.includes('API_KEY_INVALID') || rawErr.includes('API key not valid') || rawErr.includes('INVALID_ARGUMENT');
    const lastUserContent = Array.isArray(req.body?.messages)
      ? req.body.messages.filter((m: any) => m.role === 'user').slice(-1)[0]?.content
      : '';
    const snippet = lastUserContent ? `"${lastUserContent.slice(0, 50)}..."` : 'your thought';

    let notice = 'Gemini API call encountered an issue.';
    if (isKeyError) {
      notice = 'Your GEMINI_API_KEY in Vercel appears to be invalid or expired. Please update Vercel Settings → Environment Variables with a key from https://aistudio.google.com/app/apikey.';
    }

    return res.status(200).json({
      reply: `I received ${snippet}. [Note: ${notice}] What aspect of this situation feels most important to reflect on right now?`,
      fallback: true,
      _notice: rawErr,
    });
  }
}
