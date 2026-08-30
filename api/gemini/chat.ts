import { GoogleGenAI } from '@google/genai';

// Valid Gemini model list in priority order
const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
].filter(Boolean) as string[];

function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
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
      return response;
    } catch (err: any) {
      lastError = err;
      const msg = err?.message || String(err);
      if (
        msg.includes('429') ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('404') ||
        msg.includes('503') ||
        msg.includes('quota') ||
        msg.includes('not found')
      ) {
        console.warn(`[chat] Model ${model} unavailable (${msg.slice(0, 80)}), trying next...`);
        continue;
      }
      throw err;
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
    const { messages, context } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required.' });
    }

    const ai = getGenAI();

    // Graceful fallback if no API key is configured
    if (!ai) {
      console.warn('[chat] GEMINI_API_KEY is not set. Returning placeholder response.');
      return res.status(200).json({
        reply: "I'm here to support your reflection. What thoughts or experiences would you like to explore today?",
        _notice: 'GEMINI_API_KEY is not configured on this server.',
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
    return res.status(500).json({
      error: 'Gemini API request failed.',
      details: error?.message || 'Unknown error. Check server logs.',
    });
  }
}
