import { JournalEntry } from '../types';

export const SAMPLE_JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: 'sample-entry-1',
    userId: 'demo_user_gemini_journaler',
    title: 'Morning stillness, coffee, and quiet breakthroughs',
    content: `Woke up early before the alarm today. The morning air was crisp, and the sun was just breaking through the blinds, casting warm amber lines across the desk. Made a pour-over coffee and sat on the balcony for twenty uninterrupted minutes.

I noticed that when I don't check notifications the moment I open my eyes, my nervous system feels remarkably steady. Managed to finish reading chapter 4 of the book on creative focus, and wrote out my priorities for the day without feeling rushed. 

Gratitude for small rituals that anchor the start of the day. Looking forward to making progress on the design system project later.`,
    mood: 'grateful',
    tags: ['gratitude', 'mindfulness', 'daily-routine', 'creativity'],
    wordCount: 112,
    readingTimeMinutes: 1,
    entryDate: new Date(Date.now() - 86400000 * 0).toISOString().split('T')[0], // Today
    isFavorite: true,
    createdAt: Date.now() - 86400000 * 0 - 3600000 * 4,
    updatedAt: Date.now() - 86400000 * 0 - 3600000 * 4,
    aiAnalysis: {
      detectedMood: 'Grateful & Centered',
      emotionalTone: 'Serene, grounded, and present',
      summary: 'You began your morning with deliberate stillness, prioritizing mindful rituals over early screen time. This intentional pause fostered a calm nervous system and positive momentum for creative focus.',
      positiveMoments: [
        'Resisted checking morning notifications in favor of mental spaciousness.',
        'Savoring a quiet 20-minute coffee ritual on the balcony.',
        'Proactively structuring daily priorities with calm clarity.',
      ],
      concernsOrStressors: [
        'A subtle background awareness of upcoming deadlines on the design system project.',
      ],
      reflectionQuestions: [
        'How can you protect this early morning boundary even on busier workdays?',
        'What physical sensations in your body signaled that your nervous system was feeling grounded?',
      ],
      recommendedPrompts: [
        'Write about one ritual in your life that never fails to bring you back to center.',
        'What would your ideal evening wind-down look like to complement this calm morning?',
      ],
      growthOpportunity: 'Setting boundaries around digital inputs in the morning yields compounding mental clarity throughout your day.',
      disclaimer: 'This AI reflection is for personal introspection and self-discovery only, not medical or mental health advice.',
      analyzedAt: new Date(Date.now() - 86400000 * 0 - 3600000 * 4).toISOString(),
    },
  },
  {
    id: 'sample-entry-2',
    userId: 'demo_user_gemini_journaler',
    title: 'Navigating unexpected friction in the team sync',
    content: `Today had its fair share of bumps. During our afternoon architecture sync, there was some tense disagreement on how we should partition the data schema. For a moment I felt my chest tighten and defensive thoughts started bubbling up.

Instead of reacting immediately, I took three deep breaths and asked a clarifying question to understand where Sarah was coming from. Turns out her concern was purely about data isolation and privacy regulations, which we both agree is critical.

We ended up diagramming a cleaner approach that satisfies both scalability and zero-trust security. Proud of myself for not letting frustration dictate the conversation, though I feel a bit drained this evening. Going to take a warm shower and read fiction tonight.`,
    mood: 'thoughtful',
    tags: ['career', 'challenges', 'mindfulness', 'personal-growth'],
    wordCount: 133,
    readingTimeMinutes: 1,
    entryDate: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0], // Yesterday
    isFavorite: false,
    createdAt: Date.now() - 86400000 * 1 - 3600000 * 6,
    updatedAt: Date.now() - 86400000 * 1 - 3600000 * 6,
    aiAnalysis: {
      detectedMood: 'Reflective & Resilient',
      emotionalTone: 'Mature, self-aware, and constructive',
      summary: 'You encountered professional tension during an architecture meeting but successfully de-escalated your defensive impulse by practicing deep breathing and empathetic inquiry.',
      positiveMoments: [
        'Recognized physical signs of tension (tight chest) and chose conscious breathing.',
        'Shifted from defensive reaction to curious collaboration by asking clarifying questions.',
        'Identified shared core values around data privacy and zero-trust security.',
      ],
      concernsOrStressors: [
        'Emotional exhaustion and depleted cognitive energy from workplace interpersonal tension.',
      ],
      reflectionQuestions: [
        'What allowed you to choose curiosity over defensiveness in that heated moment?',
        'How does acknowledging your post-conflict fatigue help you practice self-compassion?',
      ],
      recommendedPrompts: [
        'Describe a time in the past where staying calm transformed a difficult conversation.',
        'What are 3 ways you can nourish your mental energy when interpersonal friction arises?',
      ],
      growthOpportunity: 'Transforming friction into collaborative alignment is a trademark of emotional intelligence and leadership.',
      disclaimer: 'This AI reflection is for personal introspection and self-discovery only, not medical or mental health advice.',
      analyzedAt: new Date(Date.now() - 86400000 * 1 - 3600000 * 6).toISOString(),
    },
  },
  {
    id: 'sample-entry-3',
    userId: 'demo_user_gemini_journaler',
    title: 'Sunset run along the canal and feeling energized',
    content: `Laced up my running shoes around 6:30 PM. The sky was an incredible gradient of dusky violet and peach. Set a relaxed 5K pace along the water. 

There is something almost magical about the rhythm of breathing in sync with your footsteps. Left my phone in my pocket and just listened to the sound of the wind through the willow trees. Felt a sudden surge of optimism for where life is heading. 

Came back, drank a large glass of lemon ice water, and spent 15 minutes stretching. My mind feels completely untangled.`,
    mood: 'energized',
    tags: ['health', 'nature', 'mindfulness', 'celebration'],
    wordCount: 98,
    readingTimeMinutes: 1,
    entryDate: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0], // 2 days ago
    isFavorite: true,
    createdAt: Date.now() - 86400000 * 2 - 3600000 * 3,
    updatedAt: Date.now() - 86400000 * 2 - 3600000 * 3,
    aiAnalysis: {
      detectedMood: 'Energized & Joyful',
      emotionalTone: 'Exuberant, vivid, and revitalized',
      summary: 'A sunset run in nature provided a profound mental reset, creating space for physical vitality, mental clarity, and an uplifting sense of optimism.',
      positiveMoments: [
        'Immersed in sensory nature without digital distractions.',
        'Physical vitality and rhythmic runner flow creating mood elevation.',
        'Proactive post-run self-care with hydration and mindful stretching.',
      ],
      concernsOrStressors: [],
      reflectionQuestions: [
        'How does physical movement specifically unlock optimism in your thought patterns?',
        'What other outdoor activities bring you this vivid sense of freedom?',
      ],
      recommendedPrompts: [
        'Capture in detail a moment from today where you felt completely in tune with your surroundings.',
        'Write a letter to your future self about the feeling of optimism you experienced this evening.',
      ],
      growthOpportunity: 'Physical movement in natural settings acts as an immediate cognitive reset for mental well-being.',
      disclaimer: 'This AI reflection is for personal introspection and self-discovery only, not medical or mental health advice.',
      analyzedAt: new Date(Date.now() - 86400000 * 2 - 3600000 * 3).toISOString(),
    },
  },
  {
    id: 'sample-entry-4',
    userId: 'demo_user_gemini_journaler',
    title: 'Rainy afternoon reflections on family and gratitude',
    content: `Soft rain drumming against the window all afternoon. Called Mom during lunch and we talked for nearly an hour about old memories, cooking recipes, and how fast the seasons are changing. 

It made me realize how quickly time moves and how important it is to prioritize the people who truly matter. Sometimes I get so wrapped up in day-to-day work tasks that I forget to reach out. Making a promise to myself to make these calls a weekly constant.`,
    mood: 'joyful',
    tags: ['family', 'relationships', 'gratitude', 'mindfulness'],
    wordCount: 86,
    readingTimeMinutes: 1,
    entryDate: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0], // 3 days ago
    isFavorite: false,
    createdAt: Date.now() - 86400000 * 3 - 3600000 * 5,
    updatedAt: Date.now() - 86400000 * 3 - 3600000 * 5,
  },
  {
    id: 'sample-entry-5',
    userId: 'demo_user_gemini_journaler',
    title: 'Feeling overwhelmed by simultaneous commitments',
    content: `Too many plates spinning at once. Between project deliverables, preparing for upcoming presentations, and trying to maintain a consistent gym schedule, I felt scattered from morning until late afternoon.

I noticed I kept switching tabs every 3 minutes without actually making deep progress on anything. Took a step back, closed all tabs except one document, set a 25-minute Pomodoro timer, and finally knocked out the core report.

Reminding myself: you don't have to finish everything today. Quality over frantic multitasking.`,
    mood: 'anxious',
    tags: ['challenges', 'career', 'health', 'personal-growth'],
    wordCount: 89,
    readingTimeMinutes: 1,
    entryDate: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0], // 4 days ago
    isFavorite: false,
    createdAt: Date.now() - 86400000 * 4 - 3600000 * 8,
    updatedAt: Date.now() - 86400000 * 4 - 3600000 * 8,
  },
];
