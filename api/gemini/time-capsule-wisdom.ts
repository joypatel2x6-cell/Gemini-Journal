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
      console.warn(`[time-capsule-wisdom] Model ${model} unavailable (${msg.slice(0, 80)}). Trying next...`);
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
    const { capsuleEntry, recentContext } = req.body || {};

    if (!capsuleEntry || !capsuleEntry.content) {
      return res.status(400).json({ error: 'Capsule entry data is required.' });
    }

    const ai = getGenAI();

    if (!ai) {
      return res.status(200).json({
        letterFromPast: `When you sealed this time capsule on ${new Date(capsuleEntry.createdAt || Date.now()).toLocaleDateString()}, you were carrying hope, intention, and curiosity for your future self.`,
        growthObserved: 'You continued to show up, navigate everyday changes, and preserve your personal story across time.',
        celebrationMoment: 'Reaching this unlock date is a quiet milestone of consistency and self-connection.',
        forwardAnchor: 'What promise would you like to make to your future self from where you stand today?',
        _notice: 'GEMINI_API_KEY is not configured on this server.',
      });
    }

    const prompt = `You are a warm, perceptive time-capsule archivist and life coach.
The user is now opening a journal entry that was sealed in a Time Capsule in the past:
- Sealed Date: ${capsuleEntry.createdAt ? new Date(capsuleEntry.createdAt).toLocaleDateString() : 'Past Date'}
- Original Title: "${capsuleEntry.title || 'Untitled'}"
- Original Mood: ${capsuleEntry.mood || 'Reflective'}
- Capsule Intention: "${capsuleEntry.timeCapsule?.intention || 'Reflection for the future'}"
- Past Content:
"""
${(capsuleEntry.content || '').slice(0, 4000)}
"""

Recent Journaling Snapshot / Context:
${recentContext ? JSON.stringify(recentContext).slice(0, 1000) : 'Active ongoing journaling journey.'}

Generate a beautiful, profound "Wisdom Bridge" comparing their past headspace with their journey today:
1. letterFromPast: A brief, poetic synthesis honoring what their past self was striving for or feeling.
2. growthObserved: 2-3 compassionate observations about resilience or growth.
3. celebrationMoment: A specific encouragement celebrating how far they have traveled.
4. forwardAnchor: A transformative question to guide their next chapter.`;

    const response = await generateWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction: 'You are an inspiring retrospective biographer and mindfulness companion.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            letterFromPast: { type: Type.STRING },
            growthObserved: { type: Type.STRING },
            celebrationMoment: { type: Type.STRING },
            forwardAnchor: { type: Type.STRING },
          },
          required: ['letterFromPast', 'growthObserved', 'celebrationMoment', 'forwardAnchor'],
        },
      },
    });

    return res.status(200).json(JSON.parse(response.text || '{}'));
  } catch (error: any) {
    console.error('[time-capsule-wisdom] Gemini API error:', error?.message || error);
    const { capsuleEntry } = req.body || {};
    return res.status(200).json({
      letterFromPast: `When you sealed this time capsule on ${new Date(capsuleEntry?.createdAt || Date.now()).toLocaleDateString()}, you were carrying hope, intention, and curiosity for your future self.`,
      growthObserved: 'You continued to show up, navigate everyday changes, and preserve your personal story across time.',
      celebrationMoment: 'Reaching this unlock date is a quiet milestone of consistency, resilience, and self-connection.',
      forwardAnchor: 'What promise or mindful intention would you like to make to your future self from where you stand today?',
      fallback: true,
      _notice: error?.message || 'Gemini service encountered a temporary issue.',
    });
  }
}
