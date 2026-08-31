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
      console.warn(`[perspective-shift] Model ${model} unavailable (${msg.slice(0, 80)}). Trying next...`);
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
    const { thought, context } = req.body || {};

    if (!thought || typeof thought !== 'string' || thought.trim().length === 0) {
      return res.status(400).json({ error: 'A thought or situation is required for perspective shifting.' });
    }

    const ai = getGenAI();

    if (!ai) {
      return res.status(200).json({
        originalThought: thought,
        coreEmotionIdentified: 'Tension / Reflection',
        groundingAffirmation: 'You have the resilience to hold difficult thoughts with kindness.',
        lenses: [
          {
            id: 'stoic',
            title: 'The Stoic Lens',
            subtitle: 'Dichotomy of Control',
            reframe: `Separate what is in your power right now from what lies in the external world. You cannot control outcomes or other people, but you can control your present integrity, effort, and response.`,
            actionableAnchor: 'Identify 1 small action that is 100% within your personal control today.',
            reflectionQuestion: 'What energy can you reclaim by releasing what you cannot force?',
          },
          {
            id: 'compassion',
            title: 'Self-Compassion Lens',
            subtitle: 'The Loving Inner Friend',
            reframe: `If your dearest friend came to you carrying this exact burden, you would speak to them with warmth, patience, and understanding—not harsh judgment. Extend that exact same grace to yourself.`,
            actionableAnchor: 'Place a gentle hand over your chest, breathe deeply, and validate your effort.',
            reflectionQuestion: 'How would you soothe someone you love dearly who felt this way?',
          },
          {
            id: 'future_self',
            title: '5-Year Future Horizon',
            subtitle: 'Long-Term Horizon',
            reframe: `Five years from now, this current obstacle will likely be a small footnote in a much richer, deeper chapter of your life.`,
            actionableAnchor: 'Zoom out from this single day and see the wider horizon of your ongoing story.',
            reflectionQuestion: 'What will your future 80-year-old self thank you for learning through this?',
          },
          {
            id: 'growth_scientist',
            title: 'Growth Scientist Lens',
            subtitle: 'Neutral Curiosity & Data',
            reframe: `Strip away self-criticism and treat this situation as a neutral laboratory experiment. What data is this experience giving you about your boundaries, values, or natural preferences?`,
            actionableAnchor: 'Treat the discomfort as valuable feedback rather than a personal failure.',
            reflectionQuestion: 'What is one concrete insight you can extract from this experiment?',
          },
        ],
        _notice: 'GEMINI_API_KEY is not configured on this server.',
      });
    }

    const prompt = `You are a master cognitive reframing and mindfulness mentor.
Analyze the following thought, worry, or dilemma from the user:
"""
${thought.slice(0, 3000)}
"""
${context?.mood ? `User's current mood: ${context.mood}` : ''}
${context?.currentEntryTitle ? `Draft Title: "${context.currentEntryTitle}"` : ''}

Generate 4 deeply distinct, transformative cognitive reframing lenses to help the user unstick their mind:
1. "stoic": Stoic philosophy lens (dichotomy of control, amor fati, external vs internal).
2. "compassion": Deep self-compassion lens (inner friend, soothing self-criticism, universal humanity).
3. "future_self": 5-Year horizon lens (zooming out, temporal perspective, this is a season).
4. "growth_scientist": Growth mindset / curious scientist lens (neutral data, experimental mindset, valuable feedback).

For each lens provide:
- id: ("stoic" | "compassion" | "future_self" | "growth_scientist")
- title: A poetic, inspiring title
- subtitle: A 2-4 word concept description
- reframe: A 2-3 sentence transformative philosophical perspective
- actionableAnchor: One tangible micro-action or mental anchor
- reflectionQuestion: One deep, gentle reflection question to journal on

Also identify the core underlying emotion and craft a short grounding affirmation.
NEVER provide medical or psychiatric diagnosis.`;

    const response = await generateWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction: 'You are an empathetic, philosophical, and psychological journaling mentor specializing in cognitive reframing and mindfulness.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            originalThought: { type: Type.STRING },
            coreEmotionIdentified: { type: Type.STRING },
            groundingAffirmation: { type: Type.STRING },
            lenses: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  subtitle: { type: Type.STRING },
                  reframe: { type: Type.STRING },
                  actionableAnchor: { type: Type.STRING },
                  reflectionQuestion: { type: Type.STRING },
                },
                required: ['id', 'title', 'subtitle', 'reframe', 'actionableAnchor', 'reflectionQuestion'],
              },
            },
          },
          required: ['originalThought', 'coreEmotionIdentified', 'groundingAffirmation', 'lenses'],
        },
      },
    });

    return res.status(200).json(JSON.parse(response.text || '{}'));
  } catch (error: any) {
    console.error('[perspective-shift] Gemini API error:', error?.message || error);
    const thought = typeof req.body?.thought === 'string' ? req.body.thought : 'your thoughts';
    return res.status(200).json({
      originalThought: thought,
      coreEmotionIdentified: 'Inner Dialogue / Reflection',
      groundingAffirmation: 'You have the resilience and wisdom to observe your thoughts without being overwhelmed by them.',
      lenses: [
        {
          id: 'stoic',
          title: 'The Stoic Lens',
          subtitle: 'Dichotomy of Control',
          reframe: `Separate what is within your direct agency right now from what belongs to external circumstances. When you release what you cannot force, you reclaim your focus and inner calm.`,
          actionableAnchor: 'Identify 1 small action that is 100% within your personal control today.',
          reflectionQuestion: 'What energy can you reclaim by releasing what you cannot force?',
        },
        {
          id: 'compassion',
          title: 'Self-Compassion Lens',
          subtitle: 'The Loving Inner Friend',
          reframe: `If your dearest friend came to you with this exact thought, you would meet them with gentleness, patience, and understanding. Offer yourself that same compassionate grace.`,
          actionableAnchor: 'Place a hand over your heart, breathe in slowly, and validate your journey.',
          reflectionQuestion: 'How would you soothe someone you love dearly who felt this way?',
        },
        {
          id: 'future_self',
          title: '5-Year Future Horizon',
          subtitle: 'Long-Term Horizon',
          reframe: `Looking back five years from now, this current obstacle will be a brief footnote in a much richer, deeper chapter of your life. This is a moment of refining, not your final destination.`,
          actionableAnchor: 'Zoom out from this single day and see the wider horizon of your journey.',
          reflectionQuestion: 'What will your future self thank you for learning through this?',
        },
        {
          id: 'growth_scientist',
          title: 'Growth Scientist Lens',
          subtitle: 'Neutral Curiosity & Data',
          reframe: `Look at this situation without judgment, like a curious scientist observing a laboratory experiment. What valuable data does this experience reveal about your priorities and boundaries?`,
          actionableAnchor: 'Treat discomfort as neutral feedback rather than a personal failure.',
          reflectionQuestion: 'What is one concrete insight you can extract from this experience?',
        },
      ],
      fallback: true,
      _notice: error?.message || 'Gemini service encountered a temporary issue.',
    });
  }
}
