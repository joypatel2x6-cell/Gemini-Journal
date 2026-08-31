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
      console.warn(`[analyze] Model ${model} unavailable (${msg.slice(0, 80)}). Trying next...`);
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
    const { title, content, mood, tags } = req.body || {};

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'Journal content is required for analysis.' });
    }

    const ai = getGenAI();

    if (!ai) {
      return res.status(200).json({
        detectedMood: mood || 'thoughtful',
        emotionalTone: 'Reflective and sincere',
        summary: `You took time today to record your thoughts regarding "${title || 'your day'}". Taking time to journal supports mental clarity and self-awareness.`,
        positiveMoments: [
          'Taking dedicated time to pause and document your personal experiences.',
          'Showing self-honesty and openness in your journal reflections.',
        ],
        concernsOrStressors: ['Navigating daily responsibilities and balancing personal energy.'],
        reflectionQuestions: [
          'What is one small kindness you can extend to yourself right now?',
          'What did you learn from today that you would like to carry forward into tomorrow?',
        ],
        recommendedPrompts: [
          'Write about a peaceful place that restores your calm.',
          'What is something unexpected that brought you a moment of clarity this week?',
        ],
        growthOpportunity: 'Cultivating mindfulness through consistent reflection helps ground your day.',
        disclaimer: 'This AI reflection is for personal introspection and self-discovery only, not medical or mental health advice.',
        analyzedAt: new Date().toISOString(),
        _notice: 'GEMINI_API_KEY is not configured on this server.',
      });
    }

    const prompt = `You are a supportive, mindful, empathetic personal journaling companion.
Analyze the following personal journal entry with deep empathy and gentle psychological insight.

Journal Title: ${title || 'Untitled'}
Stated Mood: ${mood || 'Not specified'}
Tags: ${Array.isArray(tags) ? tags.join(', ') : 'None'}
Journal Content:
"""
${content.slice(0, 10000)}
"""

CRITICAL INSTRUCTIONS:
1. Provide a warm, uplifting, and psychologically grounded analysis.
2. Highlight genuine positive moments and things to be grateful for.
3. Gently acknowledge potential stressors, worries, or friction areas without being alarming.
4. Provide 2-3 gentle, curious reflection questions that encourage self-compassion.
5. Provide 2 personalized follow-up prompts for future journaling.
6. ABSOLUTE RULE: Never provide medical, diagnostic, or clinical mental-health advice.`;

    const response = await generateWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction:
          'You are an empathetic, insightful journaling AI assistant. You help people reflect on their daily experiences, celebrate wins, navigate emotional nuances, and foster self-compassion. You NEVER provide medical, psychiatric, or diagnostic advice.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedMood: { type: Type.STRING },
            emotionalTone: { type: Type.STRING },
            summary: { type: Type.STRING },
            positiveMoments: { type: Type.ARRAY, items: { type: Type.STRING } },
            concernsOrStressors: { type: Type.ARRAY, items: { type: Type.STRING } },
            reflectionQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendedPrompts: { type: Type.ARRAY, items: { type: Type.STRING } },
            growthOpportunity: { type: Type.STRING },
          },
          required: [
            'detectedMood', 'emotionalTone', 'summary',
            'positiveMoments', 'concernsOrStressors', 'reflectionQuestions', 'recommendedPrompts',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    parsed.disclaimer = 'This AI reflection is for personal introspection and self-discovery only, not medical or mental health advice.';
    parsed.analyzedAt = new Date().toISOString();
    return res.status(200).json(parsed);
  } catch (error: any) {
    console.error('[analyze] Gemini API error:', error?.message || error);
    const { title, mood } = req.body || {};
    return res.status(200).json({
      detectedMood: mood || 'thoughtful',
      emotionalTone: 'Reflective and sincere',
      summary: `You took time today to record your thoughts regarding "${title || 'your day'}". Taking time to journal supports mental clarity and self-awareness.`,
      positiveMoments: [
        'Taking dedicated time to pause and document your personal experiences.',
        'Showing self-honesty and openness in your journal reflections.',
      ],
      concernsOrStressors: ['Navigating daily responsibilities and balancing personal energy.'],
      reflectionQuestions: [
        'What is one small kindness you can extend to yourself right now?',
        'What did you learn from today that you would like to carry forward into tomorrow?',
      ],
      recommendedPrompts: [
        'Write about a peaceful place that restores your calm.',
        'What is something unexpected that brought you a moment of clarity this week?',
      ],
      growthOpportunity: 'Cultivating mindfulness through consistent reflection helps ground your day.',
      disclaimer: 'This AI reflection is for personal introspection and self-discovery only, not medical or mental health advice.',
      analyzedAt: new Date().toISOString(),
      fallback: true,
      _notice: error?.message || 'Gemini API temporary limit.',
    });
  }
}
