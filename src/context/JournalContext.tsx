import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { useAuth } from './AuthContext';
import { JournalEntry, JournalMood, JournalStats, AIAnalysis, InsightsReport } from '../types';
import { SAMPLE_JOURNAL_ENTRIES } from '../constants/initialData';

interface JournalContextType {
  entries: JournalEntry[];
  loading: boolean;
  activeEntryId: string | null;
  setActiveEntryId: (id: string | null) => void;
  createEntry: (
    entryData: Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'wordCount' | 'readingTimeMinutes'>
  ) => Promise<string>;
  updateEntry: (id: string, updates: Partial<JournalEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  analyzeEntryWithAI: (
    content: string,
    title?: string,
    mood?: string,
    tags?: string[]
  ) => Promise<AIAnalysis>;
  fetchPromptSuggestions: (
    currentMood?: string,
    recentTags?: string[],
    theme?: string
  ) => Promise<any[]>;
  generateLongitudinalInsights: (period?: 'week' | 'month' | 'all') => Promise<InsightsReport>;
  stats: JournalStats;
  todayEntry: JournalEntry | undefined;
}

const JournalContext = createContext<JournalContextType | undefined>(undefined);

function calculateWordsAndReadTime(content: string): { wordCount: number; readingTimeMinutes: number } {
  const words = content.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
  return { wordCount, readingTimeMinutes };
}

export const JournalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);

  // Sync entries with Firestore or LocalStorage
  useEffect(() => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }

    if (isFirebaseConfigured && db && !user.isAnonymous) {
      setLoading(true);
      const collectionPath = `users/${user.uid}/entries`;
      const q = query(collection(db, collectionPath), orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fetchedEntries: JournalEntry[] = [];
          snapshot.forEach((docSnapshot) => {
            fetchedEntries.push(docSnapshot.data() as JournalEntry);
          });
          setEntries(fetchedEntries);
          setLoading(false);
        },
        (error) => {
          console.warn('Firestore onSnapshot listener notice:', error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } else {
      // Local sandbox / demo persistence
      const storageKey = `pgj_entries_${user.uid}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setEntries(parsed);
        } catch (e) {
          setEntries(SAMPLE_JOURNAL_ENTRIES);
          localStorage.setItem(storageKey, JSON.stringify(SAMPLE_JOURNAL_ENTRIES));
        }
      } else {
        // Seed initial rich sample entries for demo
        const initial = SAMPLE_JOURNAL_ENTRIES.map((e) => ({
          ...e,
          userId: user.uid,
        }));
        setEntries(initial);
        localStorage.setItem(storageKey, JSON.stringify(initial));
      }
      setLoading(false);
    }
  }, [user]);

  // Helper to persist local updates
  const persistLocally = (updated: JournalEntry[]) => {
    if (!user) return;
    const storageKey = `pgj_entries_${user.uid}`;
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setEntries(updated);
  };

  const createEntry = async (
    entryData: Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'wordCount' | 'readingTimeMinutes'>
  ): Promise<string> => {
    if (!user) throw new Error('User must be authenticated to create journal entries');

    const id = 'entry_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const { wordCount, readingTimeMinutes } = calculateWordsAndReadTime(entryData.content);
    const now = Date.now();

    const newEntry: JournalEntry = {
      ...entryData,
      id,
      userId: user.uid,
      wordCount,
      readingTimeMinutes,
      createdAt: now,
      updatedAt: now,
    };

    if (isFirebaseConfigured && db && !user.isAnonymous) {
      const docPath = `users/${user.uid}/entries/${id}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'entries', id), newEntry);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, docPath);
      }
    } else {
      const updated = [newEntry, ...entries];
      persistLocally(updated);
    }

    return id;
  };

  const updateEntry = async (id: string, updates: Partial<JournalEntry>): Promise<void> => {
    if (!user) throw new Error('User must be authenticated to update journal entries');

    const existingEntry = entries.find((e) => e.id === id);
    if (!existingEntry) throw new Error('Journal entry not found');

    let wordMeta = {};
    if (typeof updates.content === 'string') {
      wordMeta = calculateWordsAndReadTime(updates.content);
    }

    const mergedEntry: JournalEntry = {
      ...existingEntry,
      ...updates,
      ...wordMeta,
      updatedAt: Date.now(),
    };

    if (isFirebaseConfigured && db && !user.isAnonymous) {
      const docPath = `users/${user.uid}/entries/${id}`;
      try {
        await updateDoc(doc(db, 'users', user.uid, 'entries', id), {
          ...updates,
          ...wordMeta,
          updatedAt: Date.now(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, docPath);
      }
    } else {
      const updated = entries.map((e) => (e.id === id ? mergedEntry : e));
      persistLocally(updated);
    }
  };

  const deleteEntry = async (id: string): Promise<void> => {
    if (!user) throw new Error('User must be authenticated to delete journal entries');

    if (isFirebaseConfigured && db && !user.isAnonymous) {
      const docPath = `users/${user.uid}/entries/${id}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'entries', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, docPath);
      }
    } else {
      const updated = entries.filter((e) => e.id !== id);
      persistLocally(updated);
    }

    if (activeEntryId === id) {
      setActiveEntryId(null);
    }
  };

  const toggleFavorite = async (id: string): Promise<void> => {
    const target = entries.find((e) => e.id === id);
    if (!target) return;
    await updateEntry(id, { isFavorite: !target.isFavorite });
  };

  // Gemini AI Analysis call to server
  const analyzeEntryWithAI = async (
    content: string,
    title?: string,
    mood?: string,
    tags?: string[]
  ): Promise<AIAnalysis> => {
    const res = await fetch('/api/gemini/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, mood, tags }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok && !data?.summary) {
      throw new Error(data?.error || 'AI analysis request failed.');
    }

    return data as AIAnalysis;
  };

  // Gemini AI Prompt suggestions call to server
  const fetchPromptSuggestions = async (
    currentMood?: string,
    recentTags?: string[],
    theme?: string
  ): Promise<any[]> => {
    const res = await fetch('/api/gemini/prompt-suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentMood, recentTags, theme }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok && !data?.prompts) {
      throw new Error(data?.error || 'Prompt suggestion request failed.');
    }

    return data.prompts || [];
  };

  // Gemini AI Longitudinal Insights
  const generateLongitudinalInsights = async (
    period: 'week' | 'month' | 'all' = 'all'
  ): Promise<InsightsReport> => {
    const res = await fetch('/api/gemini/generate-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries, period }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok && !data?.summary) {
      throw new Error(data?.error || 'Insights generation failed.');
    }

    return data as InsightsReport;
  };

  // Statistics calculation (streaks, words, mood counts)
  const stats: JournalStats = useMemo(() => {
    if (entries.length === 0) {
      return {
        totalEntries: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalWords: 0,
        averageWordsPerEntry: 0,
        mostFrequentMood: null,
        moodDistribution: {
          joyful: 0,
          grateful: 0,
          calm: 0,
          energized: 0,
          thoughtful: 0,
          neutral: 0,
          anxious: 0,
          frustrated: 0,
          melancholic: 0,
        },
        entriesThisMonth: 0,
        lastJournaledDate: null,
      };
    }

    let totalWords = 0;
    const moodDistribution: Record<JournalMood, number> = {
      joyful: 0,
      grateful: 0,
      calm: 0,
      energized: 0,
      thoughtful: 0,
      neutral: 0,
      anxious: 0,
      frustrated: 0,
      melancholic: 0,
    };

    const uniqueDatesSet = new Set<string>();
    const currentMonthKey = new Date().toISOString().slice(0, 7); // YYYY-MM
    let entriesThisMonth = 0;

    entries.forEach((e) => {
      totalWords += e.wordCount || 0;
      if (e.mood && moodDistribution[e.mood] !== undefined) {
        moodDistribution[e.mood]++;
      }
      if (e.entryDate) {
        uniqueDatesSet.add(e.entryDate);
        if (e.entryDate.startsWith(currentMonthKey)) {
          entriesThisMonth++;
        }
      }
    });

    // Determine most frequent mood
    let mostFrequentMood: JournalMood | null = null;
    let maxMoodCount = 0;
    (Object.keys(moodDistribution) as JournalMood[]).forEach((m) => {
      if (moodDistribution[m] > maxMoodCount) {
        maxMoodCount = moodDistribution[m];
        mostFrequentMood = m;
      }
    });

    // Calculate streaks
    const sortedUniqueDates = Array.from(uniqueDatesSet).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Check if user journaled today or yesterday to start current streak count
    const hasToday = uniqueDatesSet.has(todayStr);
    const hasYesterday = uniqueDatesSet.has(yesterdayStr);

    if (sortedUniqueDates.length > 0) {
      if (hasToday || hasYesterday) {
        let checkDate = new Date(hasToday ? todayStr : yesterdayStr);
        while (true) {
          const dateString = checkDate.toISOString().split('T')[0];
          if (uniqueDatesSet.has(dateString)) {
            currentStreak++;
            checkDate = new Date(checkDate.getTime() - 86400000);
          } else {
            break;
          }
        }
      }

      // Calculate longest streak
      if (sortedUniqueDates.length > 0) {
        let prevDate = new Date(sortedUniqueDates[0]);
        tempStreak = 1;
        longestStreak = 1;

        for (let i = 1; i < sortedUniqueDates.length; i++) {
          const currDate = new Date(sortedUniqueDates[i]);
          const diffDays = Math.round(
            (prevDate.getTime() - currDate.getTime()) / (1000 * 3600 * 24)
          );

          if (diffDays === 1) {
            tempStreak++;
            if (tempStreak > longestStreak) {
              longestStreak = tempStreak;
            }
          } else if (diffDays > 1) {
            tempStreak = 1;
          }
          prevDate = currDate;
        }
      }
    }

    return {
      totalEntries: entries.length,
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
      totalWords,
      averageWordsPerEntry: Math.round(totalWords / entries.length),
      mostFrequentMood,
      moodDistribution,
      entriesThisMonth,
      lastJournaledDate: sortedUniqueDates[0] || null,
    };
  }, [entries]);

  // Today's entry
  const todayEntry = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return entries.find((e) => e.entryDate === todayStr);
  }, [entries]);

  return (
    <JournalContext.Provider
      value={{
        entries,
        loading,
        activeEntryId,
        setActiveEntryId,
        createEntry,
        updateEntry,
        deleteEntry,
        toggleFavorite,
        analyzeEntryWithAI,
        fetchPromptSuggestions,
        generateLongitudinalInsights,
        stats,
        todayEntry,
      }}
    >
      {children}
    </JournalContext.Provider>
  );
};

export const useJournal = () => {
  const context = useContext(JournalContext);
  if (!context) {
    throw new Error('useJournal must be used within a JournalProvider');
  }
  return context;
};
