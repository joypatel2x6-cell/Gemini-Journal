import { JournalMood, MoodMeta } from '../types';

export const MOODS_LIST: MoodMeta[] = [
  {
    id: 'joyful',
    label: 'Joyful & Uplifted',
    emoji: '☀️',
    color: '#f59e0b',
    bgColor: 'bg-amber-100 dark:bg-amber-950/60',
    textColor: 'text-amber-800 dark:text-amber-300',
    borderColor: 'border-amber-300 dark:border-amber-800',
    score: 5,
  },
  {
    id: 'grateful',
    label: 'Grateful & Content',
    emoji: '🌿',
    color: '#10b981',
    bgColor: 'bg-emerald-100 dark:bg-emerald-950/60',
    textColor: 'text-emerald-800 dark:text-emerald-300',
    borderColor: 'border-emerald-300 dark:border-emerald-800',
    score: 5,
  },
  {
    id: 'calm',
    label: 'Calm & Peaceful',
    emoji: '🌊',
    color: '#06b6d4',
    bgColor: 'bg-cyan-100 dark:bg-cyan-950/60',
    textColor: 'text-cyan-800 dark:text-cyan-300',
    borderColor: 'border-cyan-300 dark:border-cyan-800',
    score: 4,
  },
  {
    id: 'energized',
    label: 'Energized & Inspired',
    emoji: '⚡',
    color: '#8b5cf6',
    bgColor: 'bg-purple-100 dark:bg-purple-950/60',
    textColor: 'text-purple-800 dark:text-purple-300',
    borderColor: 'border-purple-300 dark:border-purple-800',
    score: 4,
  },
  {
    id: 'thoughtful',
    label: 'Thoughtful & Reflective',
    emoji: '🌙',
    color: '#6366f1',
    bgColor: 'bg-indigo-100 dark:bg-indigo-950/60',
    textColor: 'text-indigo-800 dark:text-indigo-300',
    borderColor: 'border-indigo-300 dark:border-indigo-800',
    score: 3,
  },
  {
    id: 'neutral',
    label: 'Neutral & Steady',
    emoji: '☁️',
    color: '#78716c',
    bgColor: 'bg-stone-100 dark:bg-stone-900',
    textColor: 'text-stone-700 dark:text-stone-300',
    borderColor: 'border-stone-300 dark:border-stone-700',
    score: 3,
  },
  {
    id: 'anxious',
    label: 'Anxious & Overwhelmed',
    emoji: '🌪️',
    color: '#f97316',
    bgColor: 'bg-orange-100 dark:bg-orange-950/60',
    textColor: 'text-orange-800 dark:text-orange-300',
    borderColor: 'border-orange-300 dark:border-orange-800',
    score: 2,
  },
  {
    id: 'frustrated',
    label: 'Frustrated & Irritated',
    emoji: '🔥',
    color: '#ef4444',
    bgColor: 'bg-rose-100 dark:bg-rose-950/60',
    textColor: 'text-rose-800 dark:text-rose-300',
    borderColor: 'border-rose-300 dark:border-rose-800',
    score: 2,
  },
  {
    id: 'melancholic',
    label: 'Melancholic & Down',
    emoji: '🌧️',
    color: '#3b82f6',
    bgColor: 'bg-blue-100 dark:bg-blue-950/60',
    textColor: 'text-blue-800 dark:text-blue-300',
    borderColor: 'border-blue-300 dark:border-blue-800',
    score: 1,
  },
];

export const MOOD_MAP = new Map<JournalMood, MoodMeta>(
  MOODS_LIST.map((m) => [m.id, m])
);

export function getMoodMeta(mood: JournalMood): MoodMeta {
  return (
    MOOD_MAP.get(mood) || {
      id: 'neutral',
      label: 'Neutral',
      emoji: '☁️',
      color: '#78716c',
      bgColor: 'bg-stone-100 dark:bg-stone-900',
      textColor: 'text-stone-700 dark:text-stone-300',
      borderColor: 'border-stone-300 dark:border-stone-700',
      score: 3,
    }
  );
}

export const SUGGESTED_TAGS = [
  'gratitude',
  'mindfulness',
  'career',
  'personal-growth',
  'health',
  'relationships',
  'creativity',
  'family',
  'nature',
  'challenges',
  'celebration',
  'dreams',
  'learning',
  'daily-routine',
];
