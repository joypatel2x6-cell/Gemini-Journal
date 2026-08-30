import React, { useState } from 'react';
import {
  Sparkles,
  BarChart3,
  TrendingUp,
  Flame,
  BookOpen,
  Calendar,
  Layers,
  Heart,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Lightbulb,
  Loader2,
  RefreshCw,
  Tag,
  PenSquare,
  Smile,
  ShieldCheck,
} from 'lucide-react';
import { useJournal } from '../context/JournalContext';
import { MOODS_LIST, getMoodMeta } from '../constants/moods';
import { InsightsReport, JournalMood } from '../types';

interface AIInsightsViewProps {
  onWriteWithPrompt: (prompt: string, mood?: JournalMood) => void;
}

export const AIInsightsView: React.FC<AIInsightsViewProps> = ({
  onWriteWithPrompt,
}) => {
  const { entries, stats, generateLongitudinalInsights, fetchPromptSuggestions } =
    useJournal();

  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('all');
  const [report, setReport] = useState<InsightsReport | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Custom Prompt Generator state
  const [promptCategory, setPromptCategory] = useState<string>('Mindfulness & Presence');
  const [generatedPrompts, setGeneratedPrompts] = useState<any[]>([]);
  const [promptsLoading, setPromptsLoading] = useState<boolean>(false);

  // Generate Longitudinal Report
  const handleGenerateReport = async () => {
    if (entries.length === 0) {
      setGenerateError('Write a few journal entries first so Gemini has material to reflect upon.');
      return;
    }

    setIsGenerating(true);
    setGenerateError(null);
    try {
      const res = await generateLongitudinalInsights(period);
      setReport(res);
    } catch (err: any) {
      console.error('Insights report failed:', err);
      setGenerateError(err.message || 'Failed to synthesize insights with Gemini.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate Prompts Workshop
  const handleGenerateCustomPrompts = async (category: string) => {
    setPromptCategory(category);
    setPromptsLoading(true);
    try {
      const result = await fetchPromptSuggestions(undefined, undefined, category);
      setGeneratedPrompts(result);
    } catch (err) {
      console.error('Prompt workshop failed:', err);
    } finally {
      setPromptsLoading(false);
    }
  };

  // Tag frequency
  const tagCounts: Record<string, number> = {};
  entries.forEach((e) => {
    e.tags?.forEach((t) => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });
  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Gemini Cognitive Synthesis
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif-title font-semibold text-stone-900 dark:text-stone-50 tracking-tight">
            AI Emotional & Mental Insights
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            Longitudinal pattern recognition, emotional climate trends, and mindful reflections
          </p>
        </div>

        {/* Controls & Generate Report CTA */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Period selector */}
          <div className="flex items-center bg-stone-200/70 dark:bg-stone-800/80 p-1 rounded-xl border border-stone-200 dark:border-stone-700">
            <button
              onClick={() => setPeriod('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                period === 'week'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                period === 'month'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setPeriod('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                period === 'all'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              All Time
            </button>
          </div>

          <button
            id="generate-insights-btn"
            onClick={handleGenerateReport}
            disabled={isGenerating || entries.length === 0}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-700 text-white font-medium text-xs flex items-center gap-2 shadow-xs transition-all disabled:opacity-50 active:scale-98"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Synthesizing with Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Synthesis Report</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Top Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Total Entries</span>
            <BookOpen className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-serif-title font-semibold text-stone-900 dark:text-stone-100">
            {stats.totalEntries}
          </div>
          <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
            {stats.entriesThisMonth} written this month
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Current Streak</span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-serif-title font-semibold text-stone-900 dark:text-stone-100">
            {stats.currentStreak} {stats.currentStreak === 1 ? 'day' : 'days'}
          </div>
          <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
            Best streak: {stats.longestStreak} days
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Total Volume</span>
            <PenSquare className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-serif-title font-semibold text-stone-900 dark:text-stone-100">
            {stats.totalWords.toLocaleString()}
          </div>
          <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
            Avg {stats.averageWordsPerEntry} words/entry
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Dominant Mood</span>
            <Smile className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-serif-title font-semibold text-stone-900 dark:text-stone-100 truncate">
            {stats.mostFrequentMood
              ? `${getMoodMeta(stats.mostFrequentMood).emoji} ${
                  getMoodMeta(stats.mostFrequentMood).label.split('&')[0]
                }`
              : 'None yet'}
          </div>
          <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
            Across recorded entries
          </div>
        </div>
      </div>

      {/* Generated AI Longitudinal Report Section */}
      {generateError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{generateError}</span>
        </div>
      )}

      {report ? (
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-amber-200/80 dark:border-amber-900/60 shadow-md space-y-6 animate-in fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-serif-title font-semibold text-lg text-stone-900 dark:text-stone-100">
                  Gemini Synthesis: {report.period === 'week' ? 'Past 7 Days' : report.period === 'month' ? 'This Month' : 'All-Time Journey'}
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Generated {new Date(report.generatedAt || Date.now()).toLocaleDateString()}
                </p>
              </div>
            </div>

            <button
              onClick={handleGenerateReport}
              className="p-2 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Regenerate
            </button>
          </div>

          {/* Executive Summary */}
          <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-2">
            <div className="text-xs uppercase font-semibold tracking-wider text-amber-800 dark:text-amber-300">
              Executive Mental Landscape
            </div>
            <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-serif-title">
              "{report.summary}"
            </p>
            {report.emotionalEvolution && (
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed pt-1 border-t border-amber-200/40 dark:border-amber-900/30">
                <strong>Emotional Evolution:</strong> {report.emotionalEvolution}
              </p>
            )}
          </div>

          {/* 3 Pillars: Themes, Positives, Growth Areas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Themes */}
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60 space-y-2">
              <div className="text-xs font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-500" />
                Dominant Life Themes
              </div>
              <ul className="space-y-1 text-xs text-stone-600 dark:text-stone-300">
                {(report.recurringThemes || []).map((t, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-indigo-500 font-bold">•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recurring Positive Moments */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/40 space-y-2">
              <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Positive Patterns & Strengths
              </div>
              <ul className="space-y-1 text-xs text-stone-600 dark:text-stone-300">
                {(report.positivePatterns || []).map((p, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Growth & Reflections */}
            <div className="p-4 rounded-2xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-900/40 space-y-2">
              <div className="text-xs font-semibold text-orange-800 dark:text-orange-300 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                Growth & Reflection Areas
              </div>
              <ul className="space-y-1 text-xs text-stone-600 dark:text-stone-300">
                {(report.growthReflections || []).map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-orange-600 font-bold">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Affirmation */}
          {report.gentleAffirmation && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 border border-amber-200 dark:border-amber-800 text-center">
              <span className="text-xs font-serif-title font-medium text-amber-900 dark:text-amber-200 italic">
                "{report.gentleAffirmation}"
              </span>
            </div>
          )}
        </div>
      ) : (
        /* Inviting Banner if no report generated yet */
        <div className="bg-gradient-to-br from-amber-50 via-stone-50 to-stone-100 dark:from-stone-900 dark:via-stone-900 dark:to-stone-950 rounded-3xl p-6 sm:p-8 border border-amber-200/80 dark:border-stone-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center mx-auto shadow-xs">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="font-serif-title font-semibold text-lg text-stone-900 dark:text-stone-100">
              Synthesize your journaling journey
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Gemini reads across all your journal entries to uncover hidden emotional patterns, identify compounding positive rituals, and offer coaching reflections.
            </p>
          </div>
          <button
            onClick={handleGenerateReport}
            disabled={isGenerating || entries.length === 0}
            className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-stone-950 font-medium text-xs shadow-xs"
          >
            {isGenerating ? 'Synthesizing...' : 'Generate AI Synthesis Report'}
          </button>
        </div>
      )}

      {/* Mood Distribution & Tag Frequency Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Mood Breakdown */}
        <div className="lg:col-span-7 bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smile className="w-4 h-4 text-amber-500" />
              <h3 className="font-serif-title font-semibold text-sm text-stone-900 dark:text-stone-100">
                Emotional Landscape Distribution
              </h3>
            </div>
            <span className="text-xs text-stone-400">{entries.length} entries total</span>
          </div>

          <div className="space-y-3 pt-2">
            {MOODS_LIST.map((m) => {
              const count = stats.moodDistribution[m.id] || 0;
              const pct = entries.length > 0 ? Math.round((count / entries.length) * 100) : 0;
              return (
                <div key={m.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-medium text-stone-700 dark:text-stone-300">
                      <span>{m.emoji}</span>
                      <span>{m.label}</span>
                    </span>
                    <span className="text-stone-500">
                      {count} ({pct}%)
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 5 Cols: Frequent Tags Cloud */}
        <div className="lg:col-span-5 bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-amber-500" />
            <h3 className="font-serif-title font-semibold text-sm text-stone-900 dark:text-stone-100">
              Recurring Topics & Themes
            </h3>
          </div>

          {sortedTags.length === 0 ? (
            <p className="text-xs text-stone-400 py-6 text-center">
              Add tags (like #mindfulness, #career, #nature) to your journal entries to see topics visualized here.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 pt-2">
              {sortedTags.map(([tag, count]) => (
                <button
                  key={tag}
                  onClick={() => handleGenerateCustomPrompts(tag)}
                  title={`Generate AI prompts for #${tag}`}
                  className="px-3 py-1.5 rounded-xl text-xs bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200/60 dark:border-stone-700/60 flex items-center gap-1.5 hover:bg-amber-100 dark:hover:bg-amber-950/80 hover:text-amber-900 dark:hover:text-amber-300 transition-colors cursor-pointer"
                >
                  <span className="font-medium">#{tag}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-400">
                    {count}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Interactive Gemini Prompt Workshop */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="font-serif-title font-semibold text-base text-stone-900 dark:text-stone-100">
                Gemini Prompt Workshop
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Curate custom prompts focused on specific areas of your life
              </p>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          {[
            'Mindfulness & Presence',
            'Career & Ambition',
            'Gratitude & Small Joys',
            'Overcoming Anxiety & Stress',
            'Relationships & Connection',
            'Creative Flow & Inspiration',
          ].map((cat) => (
            <button
              key={cat}
              onClick={() => handleGenerateCustomPrompts(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors ${
                promptCategory === cat && generatedPrompts.length > 0
                  ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-900 text-amber-900 dark:text-amber-300 ring-2 ring-amber-400/40'
                  : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results */}
        {promptsLoading ? (
          <div className="py-8 text-center space-y-2">
            <Loader2 className="w-6 h-6 text-amber-500 animate-spin mx-auto" />
            <p className="text-xs text-stone-500">Gemini is tailoring prompts for {promptCategory}...</p>
          </div>
        ) : (generatedPrompts || []).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {(generatedPrompts || []).map((p, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-700/60 flex flex-col justify-between gap-3 hover:border-amber-300 transition-colors"
              >
                <div>
                  <div className="text-xs font-semibold text-stone-900 dark:text-stone-100 mb-1">
                    {p.title}
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300 italic leading-relaxed">
                    "{p.prompt}"
                  </p>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => onWriteWithPrompt(p.prompt)}
                    className="px-3 py-1.5 rounded-lg bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950 text-xs font-medium"
                  >
                    Write on this prompt →
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-stone-400 text-center py-2">
            Click any category above to generate thoughtful reflection prompts tailored to that theme.
          </p>
        )}
      </div>
    </div>
  );
};
