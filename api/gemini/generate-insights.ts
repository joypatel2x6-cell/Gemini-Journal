import { GoogleGenAI, Type } from '@google/genai';

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
      return await ai.models.generateContent({ model, contents: options.contents, config: options.config });
    } catch (err: any) {
      lastError = err;
      const msg = err?.message || String(err);
      if (
        msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('404') || msg.includes('503') ||
        msg.includes('quota') || msg.includes('not found')
      ) {
        console.warn(`[generate-insights] Model ${model} unavailable, trying next...`);
        continue;
      }
      throw err;
    }
  }
  throw lastError || new Error('All Gemini model candidates failed.');
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { entries, period = 'all' } = req.body;

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
      date: e.entryDate || new Date(e.createdAt).toISOString().split('T')[0],
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
    return res.status(500).json({
      error: 'Failed to generate insights.',
      details: error?.message || 'Unknown error.',
    });
  }
}
