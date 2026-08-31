import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Secret Manager Client (lazy initialization - only used if process.env.GEMINI_API_KEY is not provided)
let secretManagerClient: SecretManagerServiceClient | null = null;
function getSecretManagerClient(): SecretManagerServiceClient {
  if (!secretManagerClient) {
    secretManagerClient = new SecretManagerServiceClient();
  }
  return secretManagerClient;
}

// In-memory cache for the retrieved Gemini API key
let cachedGeminiApiKey: string | null = null;
let secretFetchInProgress: Promise<string | null> | null = null;

/**
 * Retrieve Gemini API Key securely:
 * 1. Checks in-memory cache first
 * 2. Checks process.env.GEMINI_API_KEY directly (primary for Vercel & local development)
 * 3. Falls back to Google Cloud Secret Manager if GCP credentials exist
 */
async function getGeminiApiKey(): Promise<string | null> {
  if (cachedGeminiApiKey) {
    return cachedGeminiApiKey;
  }

  // 1. Direct environment variable (standard on Vercel and local environments)
  const envKey = process.env.GEMINI_API_KEY?.trim();
  if (envKey && envKey.length > 0 && envKey !== 'your_gemini_api_key_here' && !envKey.startsWith('your_')) {
    cachedGeminiApiKey = envKey;
    return cachedGeminiApiKey;
  }

  // Prevent duplicate concurrent Secret Manager fetches
  if (secretFetchInProgress) {
    return secretFetchInProgress;
  }

  secretFetchInProgress = (async () => {
    // 2. Fallback to Google Cloud Secret Manager only if GCP project is present and not on Vercel
    const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
    const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT;

    if (!isVercel && projectId) {
      try {
        const client = getSecretManagerClient();
        const secretName = process.env.GEMINI_SECRET_NAME || 'gemini-api-key';
        const formattedName = `projects/${projectId}/secrets/${secretName}/versions/latest`;

        const accessPromise = client.accessSecretVersion({ name: formattedName });
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Secret Manager lookup timed out')), 1500)
        );

        const [version] = await Promise.race([accessPromise, timeoutPromise]);
        const secretPayload = version?.payload?.data?.toString();
        if (secretPayload && secretPayload.trim().length > 0) {
          cachedGeminiApiKey = secretPayload.trim();
          return cachedGeminiApiKey;
        }
      } catch (err: any) {
        console.warn('[Security Audit] Secret Manager note:', err?.message || 'Secret Manager unavailable.');
      }
    }

    return null;
  })();

  try {
    const result = await secretFetchInProgress;
    return result;
  } finally {
    secretFetchInProgress = null;
  }
}

// Lazy initialization of GoogleGenAI using the securely fetched secret
let genAIClient: GoogleGenAI | null = null;
async function getGenAI(): Promise<GoogleGenAI | null> {
  const apiKey = await getGeminiApiKey();
  if (!apiKey) {
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build-journal',
        },
      },
    });
  }
  return genAIClient;
}

// Configurable model with validated supported models
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
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

async function generateContentWithFallback(ai: any, options: { contents: any; config?: any }) {
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
      const errMsg = err?.message || String(err);
      console.warn(`Model candidate ${model} notice: ${errMsg.slice(0, 120)}. Trying next candidate...`);
      continue;
    }
  }
  throw lastError || new Error('All Gemini model candidates encountered temporary limits.');
}

// Health check endpoint (never exposes secret values)
app.get(['/api/health', '/health'], async (req, res) => {
  const key = await getGeminiApiKey();
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(key && key.trim().length > 0),
    model: DEFAULT_MODEL,
    timestamp: new Date().toISOString(),
  });
});

// 1. Analyze Journal Entry
app.post(['/api/gemini/analyze', '/gemini/analyze'], async (req, res) => {
  try {
    const { title, content, mood, tags } = req.body || {};

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'Journal content is required for analysis.' });
    }

    const ai = await getGenAI();

    // If Gemini key is not configured, return an intelligent fallback reflection
    if (!ai) {
      return res.json({
        detectedMood: mood || 'thoughtful',
        emotionalTone: 'Reflective and sincere',
        summary: `You took time today to record your thoughts regarding "${title || 'your day'}". Taking time to journal supports mental clarity, self-awareness, and emotional calm.`,
        positiveMoments: [
          'Taking dedicated time to pause and document your personal experiences.',
          'Showing self-honesty and openness in your journal reflections.',
        ],
        concernsOrStressors: [
          'Navigating daily responsibilities and balancing personal energy.',
        ],
        reflectionQuestions: [
          'What is one small kindness you can extend to yourself right now?',
          'What did you learn from today that you would like to carry forward into tomorrow?',
        ],
        recommendedPrompts: [
          'Write about a peaceful place or memory that restores your calm.',
          'What is something unexpected that brought you a moment of clarity this week?',
        ],
        growthOpportunity: 'Cultivating mindfulness through consistent reflection helps ground your day.',
        disclaimer: 'This AI reflection is for personal introspection and self-discovery only, not medical or mental health advice.',
        analyzedAt: new Date().toISOString(),
      });
    }

    const promptText = `You are a warm, empathetic, and psychologically grounded mindfulness journal companion.
Analyze the following personal journal entry:
Title: "${title || 'Untitled'}"
User-tagged Mood: ${mood || 'Not specified'}
Tags: ${tags && tags.length ? tags.join(', ') : 'None'}
Content:
"""
${content.slice(0, 5000)}
"""

Please provide a supportive, structured psychological and emotional reflection in JSON:
- detectedMood: Specific primary emotion or nuanced headspace detected
- emotionalTone: 2-4 word descriptor of the tone
- summary: 2-3 sentence empathetic synthesis of what they experienced or expressed
- positiveMoments: Array of 1-3 strengths, bright spots, or acts of resilience
- concernsOrStressors: Array of 1-2 underlying tensions, questions, or worries observed
- reflectionQuestions: Array of 2 gentle, thought-provoking questions to deepen their self-inquiry
- recommendedPrompts: Array of 2 follow-up prompts related to this entry
- growthOpportunity: 1 constructive, encouraging thought on emotional growth or self-care
- disclaimer: Include: "This AI reflection is for personal introspection and self-discovery only, not medical or mental health advice."`;

    const response = await generateContentWithFallback(ai, {
      contents: promptText,
      config: {
        systemInstruction: 'You are an insightful, gentle, and emotionally intelligent journaling mentor. You never judge, diagnose, or prescribe medical treatments.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedMood: { type: Type.STRING },
            emotionalTone: { type: Type.STRING },
            summary: { type: Type.STRING },
            positiveMoments: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            concernsOrStressors: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            reflectionQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            recommendedPrompts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            growthOpportunity: { type: Type.STRING },
            disclaimer: { type: Type.STRING },
          },
          required: [
            'detectedMood',
            'emotionalTone',
            'summary',
            'positiveMoments',
            'concernsOrStressors',
            'reflectionQuestions',
            'recommendedPrompts',
            'growthOpportunity',
            'disclaimer',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    parsed.analyzedAt = new Date().toISOString();
    res.json(parsed);
  } catch (error: any) {
    console.error('Error analyzing journal entry with Gemini:', error);
    const { title, mood } = req.body || {};
    res.json({
      detectedMood: mood || 'thoughtful',
      emotionalTone: 'Reflective and sincere',
      summary: `You took time today to record your thoughts regarding "${title || 'your day'}". Taking time to journal supports mental clarity, self-awareness, and emotional calm.`,
      positiveMoments: [
        'Taking dedicated time to pause and document your personal experiences.',
        'Showing self-honesty and openness in your journal reflections.',
      ],
      concernsOrStressors: [
        'Navigating everyday responsibilities and balancing personal energy.',
      ],
      reflectionQuestions: [
        'What is one small kindness you can extend to yourself right now?',
        'What did you learn from today that you would like to carry forward into tomorrow?',
      ],
      recommendedPrompts: [
        'Write about a peaceful place or memory that restores your calm.',
        'What is something unexpected that brought you a moment of clarity this week?',
      ],
      growthOpportunity: 'Cultivating mindfulness through consistent reflection helps ground your day.',
      disclaimer: 'This AI reflection is for personal introspection and self-discovery only, not medical or mental health advice.',
      analyzedAt: new Date().toISOString(),
      fallback: true,
    });
  }
});

// 2. Generate Personalized Prompts
app.post(['/api/gemini/prompt-suggestions', '/gemini/prompt-suggestions'], async (req, res) => {
  try {
    const { currentMood, recentTags, theme } = req.body || {};
    const ai = await getGenAI();

    if (!ai) {
      return res.json({
        prompts: [
          {
            title: 'Present Moment Awareness',
            prompt: 'What are three sensory details (sounds, sights, sensations) you notice right now in your space?',
            category: 'mindfulness',
          },
          {
            title: 'Unsung Strengths',
            prompt: 'Think back to a challenge from this past week. What personal quality helped you handle it?',
            category: 'growth',
          },
          {
            title: 'Quiet Gratitude',
            prompt: 'Who is someone whose presence made your day a little lighter recently, and why?',
            category: 'gratitude',
          },
          {
            title: 'Letting Go',
            prompt: 'What is one expectation or worry you are ready to set down before the day ends?',
            category: 'release',
          },
        ],
      });
    }

    const promptText = `Generate 4 creative, inspiring, and diverse personal journaling prompts tailored for a user who is feeling "${currentMood || 'reflective'}" and interested in themes like: ${theme || (recentTags?.length ? recentTags.join(', ') : 'daily growth, emotional balance, gratitude, clarity')}.
Make the prompts deeply evocative, warm, and inviting.`;

    const response = await generateContentWithFallback(ai, {
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
                  title: { type: Type.STRING, description: 'Short evocative title (3-5 words)' },
                  prompt: { type: Type.STRING, description: 'The question or reflective writing invitation' },
                  category: { type: Type.STRING, description: 'Category (e.g. mindfulness, gratitude, resilience, creativity, relationships)' },
                },
                required: ['title', 'prompt', 'category'],
              },
            },
          },
          required: ['prompts'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error generating prompts with Gemini:', error);
    res.json({
      prompts: [
        {
          title: 'Present Moment Awareness',
          prompt: 'What are three sensory details (sounds, sights, sensations) you notice right now in your space?',
          category: 'mindfulness',
        },
        {
          title: 'Unsung Strengths',
          prompt: 'Think back to a challenge from this past week. What personal quality helped you handle it?',
          category: 'growth',
        },
        {
          title: 'Quiet Gratitude',
          prompt: 'Who is someone whose presence made your day a little lighter recently, and why?',
          category: 'gratitude',
        },
        {
          title: 'Letting Go',
          prompt: 'What is one expectation or worry you are ready to set down before the day ends?',
          category: 'release',
        },
      ],
      fallback: true,
    });
  }
});

// 3. Generate Holistic Insights & Multi-Entry Trends
app.post(['/api/gemini/generate-insights', '/gemini/generate-insights'], async (req, res) => {
  try {
    const { entries, period = 'all' } = req.body || {};

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: 'At least one journal entry is needed to generate insights.' });
    }

    const ai = await getGenAI();

    if (!ai) {
      return res.json({
        period,
        summary: `Across your recent journal entries, you've shown consistent self-awareness and intentional reflection. Your journaling reflects a steady balance between acknowledging challenges and finding moments of calm and gratitude.`,
        emotionalEvolution: `Your emotional trajectory shows resilience, with mindful pauses helping to ground your perspective during busier days.`,
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
      });
    }

    const entriesSummary = entries.slice(0, 20).map((e: any) => ({
      date: e.entryDate || (e.createdAt ? new Date(e.createdAt).toISOString().split('T')[0] : 'Recent'),
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

    const response = await generateContentWithFallback(ai, {
      contents: promptText,
      config: {
        systemInstruction: 'You are a warm, perceptive personal reflection coach analyzing longitudinal journaling trends to help the user recognize their resilience, themes, and self-growth.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: 'A comprehensive 3-4 sentence overview of the user journaling journey during this period.',
            },
            emotionalEvolution: {
              type: Type.STRING,
              description: 'How their mood and emotional mindset progressed or adapted over time.',
            },
            positivePatterns: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3-4 constructive strengths, habits, or bright spots observed.',
            },
            recurringThemes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3-4 core life themes or topics frequently explored in their writing.',
            },
            growthReflections: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2-3 thoughtful observations on areas for continued self-care or personal growth.',
            },
            gentleAffirmation: {
              type: Type.STRING,
              description: 'An uplifting, grounded concluding affirmation.',
            },
          },
          required: [
            'summary',
            'emotionalEvolution',
            'positivePatterns',
            'recurringThemes',
            'growthReflections',
            'gentleAffirmation',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    parsed.period = period;
    parsed.generatedAt = new Date().toISOString();
    res.json(parsed);
  } catch (error: any) {
    console.error('Error generating holistic insights with Gemini:', error);
    const { period = 'all' } = req.body || {};
    res.json({
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
    });
  }
});

// 4. Multi-turn AI Brainstorming & Journaling Conversation
app.post(['/api/gemini/chat', '/gemini/chat'], async (req, res) => {
  try {
    const { messages, context } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required for conversation.' });
    }

    const ai = await getGenAI();
    if (!ai) {
      return res.json({
        reply: "I'm listening and here to support your reflection. What thoughts or experiences would you like to explore together today?",
      });
    }

    // Format multi-turn conversation messages ensuring proper user/model sequencing
    const rawContents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: (m.content || '').trim() }],
    })).filter((item: any) => item.parts[0].text.length > 0);

    // Gemini requires the conversation to start with 'user'
    while (rawContents.length > 0 && rawContents[0].role === 'model') {
      rawContents.shift();
    }

    if (rawContents.length === 0) {
      return res.json({
        reply: "I'm here with you. What would you like to brainstorm or reflect on today?",
      });
    }

    // Merge consecutive turns with the same role
    const contents: any[] = [];
    for (const turn of rawContents) {
      if (contents.length > 0 && contents[contents.length - 1].role === turn.role) {
        contents[contents.length - 1].parts[0].text += '\n\n' + turn.parts[0].text;
      } else {
        contents.push(turn);
      }
    }

    let systemInstruction = `You are a supportive, mindful, and insightful personal journaling companion and creative brainstorming partner.
You help the user explore their emotions, brainstorm what to write about, reflect on meaningful moments, answer their curiosities, navigate complex feelings, and find clarity.
Keep responses conversational, warm, reflective, and concise (1-3 paragraphs). Ask gentle open-ended questions when appropriate.
ABSOLUTE RULE: Never provide medical, diagnostic, or clinical psychiatric advice.`;

    if (context) {
      if (context.mood) systemInstruction += `\nUser's current mood: ${context.mood}.`;
      if (context.currentEntryTitle) systemInstruction += `\nWorking Draft Title: "${context.currentEntryTitle}".`;
      if (context.currentEntryContent) systemInstruction += `\nWorking Draft Excerpt: "${context.currentEntryContent.slice(0, 1000)}".`;
    }

    const response = await generateContentWithFallback(ai, {
      contents,
      config: {
        systemInstruction,
      },
    });

    res.json({
      reply: response.text || 'I hear you. What aspects of this feel most important to reflect on right now?',
    });
  } catch (error: any) {
    console.error('Error in multi-turn Gemini chat:', error);
    res.json({
      reply: `I received your thought: "${(req.body?.messages?.slice(-1)[0]?.content || '').slice(0, 60)}...". How does reflecting on this connect to how you're feeling right now?`,
      fallback: true,
    });
  }
});

// 5. Gemini Cognitive Perspective Shifter (Multi-Lens Cognitive Reframe)
app.post(['/api/gemini/perspective-shift', '/gemini/perspective-shift'], async (req, res) => {
  try {
    const { thought, context } = req.body || {};

    if (!thought || typeof thought !== 'string' || thought.trim().length === 0) {
      return res.status(400).json({ error: 'A thought or situation is required for perspective shifting.' });
    }

    const ai = await getGenAI();
    if (!ai) {
      return res.json({
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
            reframe: `Five years from now, this current obstacle will likely be a small footnote in a much richer, deeper chapter of your life. It is a moment of refining, not a permanent definition of who you are.`,
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

    const response = await generateContentWithFallback(ai, {
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

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in perspective shift:', error);
    const thought = typeof req.body?.thought === 'string' ? req.body.thought : 'your thoughts';
    res.json({
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
    });
  }
});

// 6. Gemini Time Capsule Wisdom Bridge
app.post(['/api/gemini/time-capsule-wisdom', '/gemini/time-capsule-wisdom'], async (req, res) => {
  try {
    const { capsuleEntry, recentContext } = req.body || {};

    if (!capsuleEntry || !capsuleEntry.content) {
      return res.status(400).json({ error: 'Capsule entry data is required.' });
    }

    const ai = await getGenAI();
    if (!ai) {
      return res.json({
        letterFromPast: `When you sealed this time capsule on ${new Date(capsuleEntry.createdAt || Date.now()).toLocaleDateString()}, you were carrying hope, intention, and curiosity for your future self.`,
        growthObserved: 'You continued to show up, navigate everyday changes, and preserve your personal story across time.',
        celebrationMoment: 'Reaching this unlock date is a quiet milestone of consistency, resilience, and self-connection.',
        forwardAnchor: 'What promise or mindful intention would you like to make to your future self from where you stand today?',
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

    const response = await generateContentWithFallback(ai, {
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

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in time capsule wisdom:', error);
    const { capsuleEntry } = req.body || {};
    res.json({
      letterFromPast: `When you sealed this time capsule on ${new Date(capsuleEntry?.createdAt || Date.now()).toLocaleDateString()}, you were carrying hope, intention, and curiosity for your future self.`,
      growthObserved: 'You continued to show up, navigate everyday changes, and preserve your personal story across time.',
      celebrationMoment: 'Reaching this unlock date is a quiet milestone of consistency, resilience, and self-connection.',
      forwardAnchor: 'What promise or mindful intention would you like to make to your future self from where you stand today?',
      fallback: true,
    });
  }
});

// Catch-all JSON 404 for unhandled API requests
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` });
});

// Global JSON Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled API Error:', err);
  if (!res.headersSent) {
    res.status(err?.status || 500).json({
      error: err?.message || 'Internal server error occurred.',
    });
  }
});

// Vite middleware & Static serving for standalone Node / Cloud Run execution
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Personal Gemini Journal server running at http://0.0.0.0:${PORT}`);
  });
}

// Export Express app for Vercel Serverless Function execution
export default app;
export { app };

// Only call app.listen() when running in standalone Node/container mode, NOT in Vercel serverless functions
const isVercelServerless = Boolean(process.env.VERCEL || process.env.VERCEL_ENV || process.env.AWS_LAMBDA_FUNCTION_NAME);
if (!isVercelServerless) {
  startServer();
}
