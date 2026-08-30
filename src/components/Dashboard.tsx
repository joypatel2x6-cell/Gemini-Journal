import React, { useState } from 'react';
import {
  Sparkles,
  Flame,
  Calendar,
  PenSquare,
  BookOpen,
  ArrowRight,
  Heart,
  TrendingUp,
  Clock,
  CheckCircle,
  Lightbulb,
  Compass,
  Smile,
  ChevronRight,
  Shield,
  Layers,
  MessageSquareHeart,
  Hourglass,
  Lock,
  Unlock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useJournal } from '../context/JournalContext';
import { MOODS_LIST, getMoodMeta } from '../constants/moods';
import { JournalEntry, JournalMood } from '../types';
import { BrainstormChatModal } from './BrainstormChatModal';
import { PerspectiveShiftModal } from './PerspectiveShiftModal';
import { TimeCapsuleModal } from './TimeCapsuleModal';

interface DashboardProps {
  onWriteNewEntry: (initialMood?: JournalMood, initialPrompt?: string) => void;
  onViewEntry: (id: string) => void;
  onViewAllEntries: () => void;
  onViewInsights: () => void;
  onOpenFirebaseGuide: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onWriteNewEntry,
  onViewEntry,
  onViewAllEntries,
  onViewInsights,
  onOpenFirebaseGuide,
}) => {
  const { user } = useAuth();
  const { entries, stats, todayEntry, toggleFavorite, updateEntry } = useJournal();
  const [selectedQuickMood, setSelectedQuickMood] = useState<JournalMood | null>(null);
  const [showBrainstormModal, setShowBrainstormModal] = useState<boolean>(false);
  const [showPerspectiveModal, setShowPerspectiveModal] = useState<boolean>(false);
  const [selectedCapsuleEntry, setSelectedCapsuleEntry] = useState<JournalEntry | null>(null);

  // Filter time capsule entries
  const timeCapsules = entries.filter((e) => Boolean(e.timeCapsule));

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Recent entries (top 3)
  const recentEntries = entries.slice(0, 3);

  // Last 7 days visual strip
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - 86400000 * (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = d.getDate();
    const entryForDay = entries.find((e) => e.entryDate === dateStr);
    return {
      dateStr,
      dayName,
      dayNum,
      entry: entryForDay,
      isToday: i === 6,
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Top Welcome & Streak Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-stone-200 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Mindful Reflection Sanctuary
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif-title font-semibold text-stone-900 dark:text-stone-50 tracking-tight">
            {getGreeting()}, {user?.displayName || 'Journaler'}
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
            {' · '}
            <span className="text-stone-600 dark:text-stone-300">
              {todayEntry ? 'Today’s thoughts recorded' : 'Your page is waiting today'}
            </span>
          </p>
        </div>

        {/* Action Button & Streak Tag */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-900/60 shadow-xs">
            <Flame className="w-5 h-5 text-amber-500 animate-pulse" />
            <div>
              <div className="text-xs font-semibold text-amber-900 dark:text-amber-300 leading-tight">
                {stats.currentStreak} {stats.currentStreak === 1 ? 'Day' : 'Days'}
              </div>
              <div className="text-[10px] text-amber-700 dark:text-amber-400 leading-none">
                Streak ({stats.longestStreak} best)
              </div>
            </div>
          </div>

          <button
            id="dash-perspective-btn"
            onClick={() => setShowPerspectiveModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 font-medium text-xs sm:text-sm flex items-center gap-2 transition-colors shadow-2xs"
          >
            <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">Perspective Shift</span>
          </button>

          <button
            id="dash-brainstorm-btn"
            onClick={() => setShowBrainstormModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-amber-100/70 hover:bg-amber-200/70 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300/80 dark:border-amber-800/80 font-medium text-xs sm:text-sm flex items-center gap-2 transition-colors shadow-2xs"
          >
            <MessageSquareHeart className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Brainstorm</span>
          </button>

          <button
            id="dash-write-entry-btn"
            onClick={() => onWriteNewEntry()}
            className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-stone-950 font-medium text-sm flex items-center gap-2 shadow-xs transition-all hover:shadow-md active:scale-98"
          >
            <PenSquare className="w-4 h-4" />
            <span>{todayEntry ? 'Add New Entry' : 'Write Today’s Entry'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Today's Status Card & Quick Mood Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Today's Entry or Prompt Invitation */}
        <div className="lg:col-span-7 space-y-6">
          {todayEntry ? (
            /* Today's Entry Card */
            <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200/80 dark:border-stone-800 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-full pointer-events-none" />

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Today's Reflection Complete
                  </span>
                  {todayEntry.aiAnalysis && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      Gemini Analyzed
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                  <Clock className="w-3.5 h-3.5" />
                  {todayEntry.wordCount} words · {todayEntry.readingTimeMinutes} min read
                </div>
              </div>

              <h2 className="text-xl font-serif-title font-semibold text-stone-900 dark:text-stone-100 mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                {todayEntry.title || 'Today’s Journal Entry'}
              </h2>

              <p className="text-sm text-stone-600 dark:text-stone-300 line-clamp-3 leading-relaxed mb-4">
                {todayEntry.content}
              </p>

              {/* Mood and Tags */}
              <div className="flex flex-wrap items-center gap-2 mb-5">
                {todayEntry.mood && (
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 ${getMoodMeta(
                      todayEntry.mood
                    ).bgColor} ${getMoodMeta(todayEntry.mood).textColor} ${
                      getMoodMeta(todayEntry.mood).borderColor
                    }`}
                  >
                    <span>{getMoodMeta(todayEntry.mood).emoji}</span>
                    <span>{getMoodMeta(todayEntry.mood).label}</span>
                  </span>
                )}
                {todayEntry.tags?.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-md text-xs bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* AI Reflection Highlights if present */}
              {todayEntry.aiAnalysis && (
                <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 mb-4 text-xs text-amber-900 dark:text-amber-200">
                  <div className="font-semibold flex items-center gap-1.5 mb-1 text-amber-800 dark:text-amber-300">
                    <Sparkles className="w-3.5 h-3.5" />
                    Gemini AI Reflection Takeaway
                  </div>
                  <p className="italic text-stone-700 dark:text-stone-300">
                    "{todayEntry.aiAnalysis.summary}"
                  </p>
                </div>
              )}

              {/* Action Link */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800/80">
                <button
                  id="view-today-entry-btn"
                  onClick={() => onViewEntry(todayEntry.id)}
                  className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 flex items-center gap-1.5 group-hover:translate-x-0.5 transition-transform"
                >
                  View full entry & reflections
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  id="edit-today-entry-btn"
                  onClick={() => onViewEntry(todayEntry.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors"
                >
                  Edit Entry
                </button>
              </div>
            </div>
          ) : (
            /* No Entry Today - Inviting Card */
            <div className="bg-gradient-to-br from-amber-50 via-stone-50 to-stone-100 dark:from-stone-900 dark:via-stone-900 dark:to-stone-950 rounded-3xl p-6 sm:p-8 border border-amber-200/60 dark:border-stone-800 shadow-sm relative overflow-hidden">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900 mb-3">
                  <Compass className="w-3.5 h-3.5" />
                  Daily Reflection Prompt
                </div>
                <h2 className="text-xl sm:text-2xl font-serif-title font-semibold text-stone-900 dark:text-stone-100 tracking-tight mb-2">
                  "What is one quiet truth or feeling that has been asking for your attention today?"
                </h2>
                <p className="text-sm text-stone-600 dark:text-stone-400 mb-6 leading-relaxed">
                  Take five minutes to untangle your thoughts. Write freely without judgment, and let Gemini provide gentle clarity, positive moments, and deep insights.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    id="dash-start-today-btn"
                    onClick={() =>
                      onWriteNewEntry(
                        'thoughtful',
                        'What is one quiet truth or feeling that has been asking for your attention today?'
                      )
                    }
                    className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-stone-950 font-medium text-sm flex items-center gap-2 shadow-sm transition-all hover:shadow-md"
                  >
                    <PenSquare className="w-4 h-4" />
                    Write on this prompt
                  </button>
                  <button
                    id="dash-blank-entry-btn"
                    onClick={() => onWriteNewEntry()}
                    className="px-4 py-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 font-medium text-sm transition-colors"
                  >
                    Start blank page
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Mood Check-In Widget */}
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200/80 dark:border-stone-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Smile className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  Quick Mood Check-in
                </h3>
              </div>
              <span className="text-xs text-stone-500 dark:text-stone-400">
                How is your energy right now?
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {MOODS_LIST.slice(0, 5).map((mood) => {
                const isSelected = selectedQuickMood === mood.id;
                return (
                  <button
                    key={mood.id}
                    id={`quick-mood-${mood.id}`}
                    onClick={() => setSelectedQuickMood(mood.id)}
                    className={`p-2.5 rounded-2xl flex flex-col items-center gap-1 transition-all text-center border ${
                      isSelected
                        ? `${mood.bgColor} ${mood.borderColor} ring-2 ring-amber-400/50 scale-102`
                        : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200/60 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800'
                    }`}
                  >
                    <span className="text-xl">{mood.emoji}</span>
                    <span className="text-xs font-medium text-stone-700 dark:text-stone-300 truncate w-full">
                      {mood.label.split('&')[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedQuickMood && (
              <div className="mt-4 p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200 animate-in fade-in">
                <span>
                  Feeling <strong>{getMoodMeta(selectedQuickMood).label}</strong>? Capture why while it's fresh.
                </span>
                <button
                  onClick={() => onWriteNewEntry(selectedQuickMood)}
                  className="px-3 py-1.5 rounded-lg bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950 font-medium whitespace-nowrap"
                >
                  Write Entry →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right 5 Columns: Stats & 7-Day Mood Landscape */}
        <div className="lg:col-span-5 space-y-6">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Total Entries</span>
                <BookOpen className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-serif-title font-semibold text-stone-900 dark:text-stone-50">
                {stats.totalEntries}
              </div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                {stats.entriesThisMonth} recorded this month
              </div>
            </div>

            <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Words Written</span>
                <PenSquare className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-serif-title font-semibold text-stone-900 dark:text-stone-50">
                {stats.totalWords.toLocaleString()}
              </div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                ~{stats.averageWordsPerEntry} words/entry avg
              </div>
            </div>
          </div>

          {/* Past 7 Days Strip */}
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200/80 dark:border-stone-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  7-Day Mood Landscape
                </h3>
              </div>
              <button
                onClick={onViewInsights}
                className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline"
              >
                Deep Insights →
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center">
              {last7Days.map((day) => {
                const moodMeta = day.entry?.mood ? getMoodMeta(day.entry.mood) : null;
                return (
                  <div
                    key={day.dateStr}
                    onClick={() => {
                      if (day.entry) onViewEntry(day.entry.id);
                      else onWriteNewEntry();
                    }}
                    className={`p-2 rounded-2xl flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                      day.isToday
                        ? 'ring-2 ring-amber-500/60 bg-amber-50/50 dark:bg-amber-950/30'
                        : 'hover:bg-stone-100 dark:hover:bg-stone-800'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-semibold text-stone-500 dark:text-stone-400">
                      {day.dayName}
                    </span>
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-medium transition-transform ${
                        moodMeta
                          ? `${moodMeta.bgColor} border ${moodMeta.borderColor} shadow-xs scale-105`
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-400'
                      }`}
                    >
                      {moodMeta ? moodMeta.emoji : day.dayNum}
                    </div>
                    <span className="text-[10px] text-stone-500 truncate w-full">
                      {moodMeta ? moodMeta.label.split('&')[0] : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Privacy & Zero-Trust Security Card */}
          <div className="bg-stone-100/80 dark:bg-stone-900/60 rounded-3xl p-5 border border-stone-200 dark:border-stone-800">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div className="text-xs text-stone-600 dark:text-stone-300 space-y-1">
                <div className="font-semibold text-stone-900 dark:text-stone-100">
                  Zero-Trust Data Isolation
                </div>
                <p className="leading-relaxed">
                  Your journal entries are isolated under your Firebase UID with strict security rules. Gemini AI processing occurs server-side with zero client secret exposure.
                </p>
                <button
                  id="dash-learn-security-btn"
                  onClick={onOpenFirebaseGuide}
                  className="font-medium text-emerald-700 dark:text-emerald-400 hover:underline pt-1 inline-block"
                >
                  View Security Architecture & Rules →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Entries Section */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-serif-title font-semibold text-stone-900 dark:text-stone-100">
              Recent Journal Entries
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Your latest personal reflections and AI observations
            </p>
          </div>
          {entries.length > 3 && (
            <button
              id="dash-view-all-entries-btn"
              onClick={onViewAllEntries}
              className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              View all ({entries.length})
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {recentEntries.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-12 text-center border border-dashed border-stone-300 dark:border-stone-800">
            <BookOpen className="w-12 h-12 text-stone-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 mb-1">
              Your journal is empty
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto mb-5">
              Start your self-reflection journey today. Write about how you feel, what you noticed, or what you're grateful for.
            </p>
            <button
              onClick={() => onWriteNewEntry()}
              className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950 font-medium text-xs shadow-xs"
            >
              Write your first entry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {recentEntries.map((entry) => {
              const moodMeta = getMoodMeta(entry.mood);
              return (
                <div
                  key={entry.id}
                  id={`recent-entry-card-${entry.id}`}
                  onClick={() => onViewEntry(entry.id)}
                  className="bg-white dark:bg-stone-900 rounded-3xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-xs hover:shadow-md hover:border-amber-300 dark:hover:border-amber-800/80 transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    {/* Entry Header */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 ${moodMeta.bgColor} ${moodMeta.textColor} ${moodMeta.borderColor}`}
                      >
                        <span>{moodMeta.emoji}</span>
                        <span>{moodMeta.label.split('&')[0]}</span>
                      </span>

                      <div className="flex items-center gap-1">
                        {entry.aiAnalysis && (
                          <span
                            title="AI Analyzed"
                            className="p-1 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(entry.id);
                          }}
                          className="p-1 text-stone-400 hover:text-rose-500 transition-colors"
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${
                              entry.isFavorite
                                ? 'fill-rose-500 text-rose-500'
                                : 'text-stone-400'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-serif-title font-semibold text-stone-900 dark:text-stone-100 text-base mb-2 line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {entry.title || 'Untitled Entry'}
                    </h3>

                    <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-3 leading-relaxed mb-4">
                      {entry.content}
                    </p>
                  </div>

                  <div>
                    {/* Tags */}
                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {entry.tags.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-[10px] text-stone-600 dark:text-stone-400"
                          >
                            #{t}
                          </span>
                        ))}
                        {entry.tags.length > 2 && (
                          <span className="text-[10px] text-stone-400 self-center">
                            +{entry.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Footer Date & Word count */}
                    <div className="flex items-center justify-between text-[11px] text-stone-400 pt-3 border-t border-stone-100 dark:border-stone-800/80">
                      <span>{entry.entryDate}</span>
                      <span>{entry.wordCount} words</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Time Capsules Section (if any exist or prompt to create) */}
      {timeCapsules.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                <Hourglass className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-serif-title font-semibold text-stone-900 dark:text-stone-100">
                  Mindful Time Capsules
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Letters sealed for your future self with Gemini Wisdom Bridge retrospectives
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {timeCapsules.map((capsule) => {
              const todayStr = new Date().toISOString().split('T')[0];
              const isUnlocked = capsule.timeCapsule?.unlockDate
                ? capsule.timeCapsule.unlockDate <= todayStr
                : false;

              return (
                <div
                  key={capsule.id}
                  id={`time-capsule-card-${capsule.id}`}
                  onClick={() => setSelectedCapsuleEntry(capsule)}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                    isUnlocked
                      ? 'bg-gradient-to-br from-amber-500/10 via-emerald-500/10 to-purple-500/10 border-amber-300 dark:border-amber-700 shadow-sm hover:shadow-md'
                      : 'bg-white dark:bg-stone-900 border-stone-200/80 dark:border-stone-800 shadow-xs hover:border-amber-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 ${
                          isUnlocked
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                        }`}
                      >
                        {isUnlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        <span>{isUnlocked ? 'Unlocked & Ready' : `Unlocks ${capsule.timeCapsule?.unlockDate}`}</span>
                      </span>

                      <span className="text-[10px] text-stone-400">
                        Sealed {new Date(capsule.timeCapsule?.sealedAt || capsule.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="font-serif-title font-semibold text-stone-900 dark:text-stone-100 text-sm mb-1">
                      {capsule.title || 'Untitled Capsule'}
                    </h4>

                    <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 italic">
                      "{capsule.timeCapsule?.intention || 'Reflection for the future'}"
                    </p>
                  </div>

                  <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isUnlocked ? 'Open Wisdom Bridge' : 'Inspect Capsule'}</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-stone-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Multi-turn AI Brainstorming & Reflection Modal */}
      <BrainstormChatModal
        isOpen={showBrainstormModal}
        onClose={() => setShowBrainstormModal(false)}
        onInsertToJournal={(snippet) => {
          setShowBrainstormModal(false);
          onWriteNewEntry('thoughtful', snippet);
        }}
      />

      {/* Cognitive Perspective Shifter Modal */}
      <PerspectiveShiftModal
        isOpen={showPerspectiveModal}
        onClose={() => setShowPerspectiveModal(false)}
        onInsertToJournal={(snippet) => {
          setShowPerspectiveModal(false);
          onWriteNewEntry('thoughtful', snippet);
        }}
      />

      {/* Time Capsule Modal */}
      {selectedCapsuleEntry && (
        <TimeCapsuleModal
          isOpen={Boolean(selectedCapsuleEntry)}
          onClose={() => setSelectedCapsuleEntry(null)}
          entry={selectedCapsuleEntry}
          onUnlockCapsule={async () => {
            if (selectedCapsuleEntry.timeCapsule) {
              await updateEntry(selectedCapsuleEntry.id, {
                timeCapsule: {
                  ...selectedCapsuleEntry.timeCapsule,
                  isOpened: true,
                },
              });
              setSelectedCapsuleEntry(null);
            }
          }}
        />
      )}
    </div>
  );
};
