export type JournalMood =
  | 'joyful'
  | 'calm'
  | 'grateful'
  | 'thoughtful'
  | 'energized'
  | 'anxious'
  | 'melancholic'
  | 'frustrated'
  | 'neutral';

export interface MoodMeta {
  id: JournalMood;
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  score: number; // 1 to 5 for analytics
}

export interface AIAnalysis {
  detectedMood: string;
  emotionalTone: string;
  summary: string;
  positiveMoments: string[];
  concernsOrStressors: string[];
  reflectionQuestions: string[];
  recommendedPrompts: string[];
  growthOpportunity?: string;
  disclaimer: string;
  analyzedAt: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  mood: JournalMood;
  tags: string[];
  wordCount: number;
  readingTimeMinutes: number;
  aiAnalysis?: AIAnalysis;
  isFavorite?: boolean;
  timeCapsule?: TimeCapsuleData;
  entryDate: string; // YYYY-MM-DD
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous?: boolean;
  providerId?: string;
}

export interface JournalStats {
  totalEntries: number;
  currentStreak: number;
  longestStreak: number;
  totalWords: number;
  averageWordsPerEntry: number;
  mostFrequentMood: JournalMood | null;
  moodDistribution: Record<JournalMood, number>;
  entriesThisMonth: number;
  lastJournaledDate: string | null;
}

export interface InsightsReport {
  period: 'week' | 'month' | 'all';
  summary: string;
  emotionalEvolution: string;
  positivePatterns: string[];
  recurringThemes: string[];
  growthReflections: string[];
  gentleAffirmation: string;
  generatedAt: string;
}

export interface PerspectiveLens {
  id: 'stoic' | 'compassion' | 'future_self' | 'growth_scientist';
  title: string;
  subtitle: string;
  reframe: string;
  actionableAnchor: string;
  reflectionQuestion: string;
}

export interface PerspectiveShiftResult {
  originalThought: string;
  coreEmotionIdentified: string;
  lenses: PerspectiveLens[];
  groundingAffirmation: string;
}

export interface TimeCapsuleData {
  unlockDate: string; // YYYY-MM-DD
  sealedAt: number;
  intention?: string;
  isOpened?: boolean;
}
