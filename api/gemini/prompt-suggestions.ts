import { GoogleGenAI, Type } from '@google/genai';

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
      const response = await ai.models.generateContent({ model, contents: options.contents, config: options.config });
      if (response && (response.text || response.candidates)) {
        return response;
      }
    } catch (err: any) {
      lastError = err;
      const msg = err?.message || String(err);
      console.warn(`[prompt-suggestions] Model ${model} unavailable (${msg.slice(0, 80)}). Trying next...`);
      continue;
    }
  }
  throw lastError || new Error('All Gemini model candidates failed.');
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { currentMood, recentTags, theme } = req.body || {};
    const ai = getGenAI();

    if (!ai) {
      return res.status(200).json({
        prompts: [
          { title: 'Present Moment Awareness', prompt: 'What are three sensory details you notice right now in your space?', category: 'mindfulness' },
          { title: 'Unsung Strengths', prompt: 'Think back to a challenge from this past week. What personal quality helped you handle it?', category: 'growth' },
          { title: 'Quiet Gratitude', prompt: 'Who is someone whose presence made your day a little lighter recently, and why?', category: 'gratitude' },
          { title: 'Letting Go', prompt: 'What is one expectation or worry you are ready to set down before the day ends?', category: 'release' },
        ],
        _notice: 'GEMINI_API_KEY is not configured on this server.',
      });
    }

    const promptText = `Generate 4 creative, inspiring, and diverse personal journaling prompts tailored for a user who is feeling "${currentMood || 'reflective'}" and interested in themes like: ${theme || (recentTags?.length ? recentTags.join(', ') : 'daily growth, emotional balance, gratitude, clarity')}.
Make the prompts deeply evocative, warm, and inviting.`;

    const response = await generateWithFallback(ai, {
      contents: promptText,
      config: {
        systemInstruction: 'You are a master creative writing and journaling mentor who crafts resonant, compassionate prompts.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prompts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  prompt: { type: Type.STRING },
                  category: { type: Type.STRING },
                },
                required: ['title', 'prompt', 'category'],
              },
            },
          },
          required: ['prompts'],
        },
      },
    });

    return res.status(200).json(JSON.parse(response.text || '{}'));
  } catch (error: any) {
    console.error('[prompt-suggestions] Gemini API error:', error?.message || error);
    return res.status(200).json({
      prompts: [
        { title: 'Present Moment Awareness', prompt: 'What are three sensory details you notice right now in your space?', category: 'mindfulness' },
        { title: 'Unsung Strengths', prompt: 'Think back to a challenge from this past week. What personal quality helped you handle it?', category: 'growth' },
        { title: 'Quiet Gratitude', prompt: 'Who is someone whose presence made your day a little lighter recently, and why?', category: 'gratitude' },
        { title: 'Letting Go', prompt: 'What is one expectation or worry you are ready to set down before the day ends?', category: 'release' },
      ],
      fallback: true,
      _notice: error?.message || 'Gemini API temporary limit.',
    });
  }
}
