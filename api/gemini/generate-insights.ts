import { GoogleGenAI, Type } from '@google/genai';

const CANDIDATE_MODELS = Array.from(
  new Set(
    [
      process.env.GEMINI_MODEL,
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
    ].filter(Boolean) as string[]
  )
);

function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
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
      console.warn(`[generate-insights] Model ${model} unavailable (${msg.slice(0, 80)}). Trying next...`);
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
    const { entries, period = 'all' } = req.body || {};

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: 'At least one journal entry is needed to generate insights.' });
    }

    const ai = getGenAI();

    if (!ai) {
      return res.status(200).json({
        period,
        summary: `Across your recent journal entries, you've shown consistent self-awareness and intentional reflection.`,
        emotionalEvolution: `Your emotional trajectory shows resilience, with mindful pauses helping to ground your perspective.`,
        positivePatterns: [
          'Regularly celebrating small daily victories and mindful moments.',
          'Willingness to explore emotional complexity honestly.',
          'Finding clarity through expressive writing.',
        ],
        recurringThemes: [
          'Personal growth & intentional habits',
          'Balancing productivity with restorative rest',
          'Cultivating deeper daily appreciation',
        ],
        growthReflections: [
          'Notice how pausing to write transforms sudden stress into actionable clarity.',
          'Continue honoring both high-energy days and quiet introspective periods.',
        ],
        gentleAffirmation: 'Your commitment to self-reflection is a powerful foundation for personal clarity and peace.',
        generatedAt: new Date().toISOString(),
        _notice: 'GEMINI_API_KEY is not configured on this server.',
      });
    }

    const entriesSummary = entries.slice(0, 20).map((e: any) => ({
      date: e.entryDate || new Date(e.createdAt || Date.now()).toISOString().split('T')[0],
      title: e.title,
      mood: e.mood,
      tags: e.tags,
      wordCount: e.wordCount,
      snippet: (e.content || '').slice(0, 300),
    }));

    const promptText = `Analyze this collection of ${entries.length} recent journal entries for period "${period}".
Synthesize the user's emotional evolution, recurring positive themes, resilience patterns, and growth opportunities.

Entries Data:
${JSON.stringify(entriesSummary, null, 2)}

Provide a deeply encouraging, insightful, and constructive personal report. NEVER offer clinical diagnosis.`;

    const response = await generateWithFallback(ai, {
      contents: promptText,
      config: {
        systemInstruction: 'You are a warm, perceptive personal reflection coach analyzing longitudinal journaling trends to help the user recognize their resilience, themes, and self-growth.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            emotionalEvolution: { type: Type.STRING },
            positivePatterns: { type: Type.ARRAY, items: { type: Type.STRING } },
            recurringThemes: { type: Type.ARRAY, items: { type: Type.STRING } },
            growthReflections: { type: Type.ARRAY, items: { type: Type.STRING } },
            gentleAffirmation: { type: Type.STRING },
          },
          required: ['summary', 'emotionalEvolution', 'positivePatterns', 'recurringThemes', 'growthReflections', 'gentleAffirmation'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    parsed.period = period;
    parsed.generatedAt = new Date().toISOString();
    return res.status(200).json(parsed);
  } catch (error: any) {
    console.error('[generate-insights] Gemini API error:', error?.message || error);
    const { period = 'all' } = req.body || {};
    return res.status(200).json({
      period,
      summary: `Across your journal entries, you've maintained consistent self-awareness and mindful introspection. Your writing demonstrates resilience and an active dedication to self-care and mental clarity.`,
      emotionalEvolution: `Your reflections capture natural emotional ebbs and flows, with a steady trajectory toward grounding and inner perspective.`,
      positivePatterns: [
        'Engaging in regular expressive writing to navigate feelings.',
        'Honoring personal boundaries and intentional reflections.',
        'Celebrating daily moments of clarity and accomplishment.',
      ],
      recurringThemes: [
        'Mindfulness & Emotional Balance',
        'Personal Growth & Meaningful Reflection',
        'Gratitude & Daily Presence',
      ],
      growthReflections: [
        'Notice how taking a moment to write restores calm during demanding days.',
        'Continue embracing both high-energy days and quiet introspective periods.',
      ],
      gentleAffirmation: 'Your reflective practice is a powerful anchor for long-term clarity and emotional well-being.',
      generatedAt: new Date().toISOString(),
      fallback: true,
      _notice: error?.message || 'Gemini service encountered a temporary issue.',
    });
  }
}
