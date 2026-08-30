import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowLeft,
  Trash2,
  Heart,
  Save,
  Clock,
  Tag,
  Plus,
  X,
  Calendar,
  AlertCircle,
  HelpCircle,
  Check,
  Smile,
  Lightbulb,
  ShieldAlert,
  Loader2,
  BookMarked,
  Share2,
  MessageSquareHeart,
  Compass,
  Hourglass,
  Lock,
  Unlock,
} from 'lucide-react';
import { useJournal } from '../context/JournalContext';
import { MOODS_LIST, SUGGESTED_TAGS, getMoodMeta } from '../constants/moods';
import { JournalEntry, JournalMood, AIAnalysis, TimeCapsuleData } from '../types';
import { BrainstormChatModal } from './BrainstormChatModal';
import { PerspectiveShiftModal } from './PerspectiveShiftModal';
import { TimeCapsuleModal } from './TimeCapsuleModal';

interface JournalEditorProps {
  entryId: string | null; // null for new entry
  initialMood?: JournalMood;
  initialPrompt?: string;
  onBack: () => void;
  onSaved: (id: string) => void;
}

export const JournalEditor: React.FC<JournalEditorProps> = ({
  entryId,
  initialMood,
  initialPrompt,
  onBack,
  onSaved,
}) => {
  const { entries, createEntry, updateEntry, deleteEntry, analyzeEntryWithAI, fetchPromptSuggestions } =
    useJournal();

  const currentEntry = entries.find((e) => e.id === entryId);

  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [mood, setMood] = useState<JournalMood>(initialMood || 'thoughtful');
  const [tags, setTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState<string>('');
  const [entryDate, setEntryDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [timeCapsule, setTimeCapsule] = useState<TimeCapsuleData | undefined>(undefined);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | undefined>(undefined);

  // States for actions
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showPromptModal, setShowPromptModal] = useState<boolean>(false);
  const [showBrainstormChat, setShowBrainstormChat] = useState<boolean>(false);
  const [showPerspectiveModal, setShowPerspectiveModal] = useState<boolean>(false);
  const [showTimeCapsuleModal, setShowTimeCapsuleModal] = useState<boolean>(false);
  const [promptsLoading, setPromptsLoading] = useState<boolean>(false);
  const [promptList, setPromptList] = useState<any[]>([]);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<boolean>(false);

  // Initialize or load entry data
  useEffect(() => {
    if (currentEntry) {
      setTitle(currentEntry.title || '');
      setContent(currentEntry.content || '');
      setMood(currentEntry.mood || 'thoughtful');
      setTags(currentEntry.tags || []);
      setEntryDate(
        currentEntry.entryDate ||
          new Date(currentEntry.createdAt).toISOString().split('T')[0]
      );
      setIsFavorite(Boolean(currentEntry.isFavorite));
      setTimeCapsule(currentEntry.timeCapsule);
      setAiAnalysis(currentEntry.aiAnalysis);
    } else {
      // New entry
      setTitle('');
      setContent(initialPrompt ? `> Prompt: ${initialPrompt}\n\n` : '');
      setMood(initialMood || 'thoughtful');
      setTags(initialPrompt ? ['prompt-reflection'] : []);
      setEntryDate(new Date().toISOString().split('T')[0]);
      setIsFavorite(false);
      setTimeCapsule(undefined);
      setAiAnalysis(undefined);
    }
  }, [entryId, currentEntry, initialMood, initialPrompt]);

  // Word count & Read time
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(words / 200));

  // Add tag
  const addTag = (tagToAdd: string) => {
    const cleaned = tagToAdd.trim().toLowerCase().replace(/^#/, '');
    if (cleaned && !tags.includes(cleaned) && tags.length < 15) {
      setTags([...tags, cleaned]);
      setCustomTagInput('');
    }
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Save handler
  const handleSave = async () => {
    if (!content.trim()) {
      setAnalysisError('Please write something in your journal entry before saving.');
      return;
    }

    setIsSaving(true);
    try {
      if (entryId) {
        await updateEntry(entryId, {
          title: title.trim() || 'Untitled Reflection',
          content: content.trim(),
          mood,
          tags,
          entryDate,
          isFavorite,
          timeCapsule,
          aiAnalysis,
        });
        setSaveSuccessNotice(true);
        setTimeout(() => setSaveSuccessNotice(false), 3000);
      } else {
        const newId = await createEntry({
          title: title.trim() || 'Untitled Reflection',
          content: content.trim(),
          mood,
          tags,
          entryDate,
          isFavorite,
          timeCapsule,
          aiAnalysis,
        });
        setSaveSuccessNotice(true);
        onSaved(newId);
      }
    } catch (err: any) {
      console.error('Save failed:', err);
      setAnalysisError('Failed to save entry. Please check your connection.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete handler
  const handleDelete = async () => {
    if (!entryId) return;
    try {
      await deleteEntry(entryId);
      onBack();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // AI Analysis Trigger
  const handleAnalyzeWithAI = async () => {
    if (!content.trim() || words < 5) {
      setAnalysisError('Please write at least a few sentences before analyzing.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const result = await analyzeEntryWithAI(content, title, mood, tags);
      setAiAnalysis(result);

      // Auto-save the analysis if already existing entry
      if (entryId) {
        await updateEntry(entryId, { aiAnalysis: result });
      }
    } catch (err: any) {
      console.error('AI Analysis failed:', err);
      setAnalysisError(err.message || 'Gemini reflection is unavailable right now.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Fetch prompts
  const handleOpenPromptGenerator = async () => {
    setShowPromptModal(true);
    setPromptsLoading(true);
    try {
      const prompts = await fetchPromptSuggestions(mood, tags);
      setPromptList(prompts);
    } catch (err) {
      console.error('Prompt fetching failed:', err);
    } finally {
      setPromptsLoading(false);
    }
  };

  const handleApplyPrompt = (promptText: string) => {
    if (!content.trim()) {
      setContent(`> Prompt: ${promptText}\n\n`);
    } else {
      setContent(content + `\n\n> Prompt: ${promptText}\n\n`);
    }
    setShowPromptModal(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Top Bar: Back & Action CTAs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-3">
          <button
            id="editor-back-btn"
            onClick={onBack}
            className="p-2 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-serif-title font-semibold text-stone-900 dark:text-stone-50">
              {entryId ? 'Edit Journal Entry' : 'New Journal Entry'}
            </h1>
            <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
              <span>{words} words</span>
              <span>·</span>
              <span>{readTime} min read</span>
              {saveSuccessNotice && (
                <>
                  <span>·</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Saved to private vault
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Cognitive Perspective Shifter Trigger */}
          <button
            id="editor-perspective-btn"
            onClick={() => setShowPerspectiveModal(true)}
            className="px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/60 font-medium text-xs flex items-center gap-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors shadow-2xs"
          >
            <Compass className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">Perspective Shift</span>
          </button>

          {/* Time Capsule Trigger */}
          <button
            id="editor-time-capsule-btn"
            onClick={() => setShowTimeCapsuleModal(true)}
            className={`px-3 py-2 rounded-xl border font-medium text-xs flex items-center gap-1.5 transition-colors shadow-2xs ${
              timeCapsule
                ? 'bg-amber-500 text-white border-amber-600 dark:bg-amber-500 dark:text-stone-950'
                : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-amber-50 dark:hover:bg-amber-950/40'
            }`}
          >
            {timeCapsule ? (
              <Lock className="w-3.5 h-3.5" />
            ) : (
              <Hourglass className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span className="hidden md:inline">
              {timeCapsule ? `Capsule: ${timeCapsule.unlockDate}` : 'Time Capsule'}
            </span>
          </button>

          {/* Multi-turn AI Brainstorming Trigger */}
          <button
            id="editor-brainstorm-btn"
            onClick={() => setShowBrainstormChat(true)}
            className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 hover:from-amber-500/20 hover:to-yellow-500/20 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/60 font-medium text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <MessageSquareHeart className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Brainstorm Partner</span>
          </button>

          {/* Prompt Generator Trigger */}
          <button
            id="editor-inspire-btn"
            onClick={handleOpenPromptGenerator}
            className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 font-medium text-xs flex items-center gap-1.5 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">AI Prompts</span>
          </button>

          {/* Favorite Toggle */}
          <button
            id="editor-favorite-btn"
            onClick={() => setIsFavorite(!isFavorite)}
            className={`p-2 rounded-xl border transition-colors ${
              isFavorite
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-500'
                : 'border-stone-200 dark:border-stone-800 text-stone-400 hover:text-stone-600'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500' : ''}`} />
          </button>

          {/* Delete Button (if editing existing) */}
          {entryId && (
            <button
              id="editor-delete-trigger-btn"
              onClick={() => setShowDeleteModal(true)}
              className="p-2 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Save Button */}
          <button
            id="editor-save-btn"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-stone-950 font-medium text-xs flex items-center gap-2 shadow-xs transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? 'Saving...' : 'Save Entry'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Layout (Editor & Gemini Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 8 Cols: Writing Canvas */}
        <div className="lg:col-span-8 space-y-6">
          {/* Metadata Row: Date & Mood */}
          <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Date selector */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-stone-400" />
                <input
                  id="entry-date-input"
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-1.5 text-xs text-stone-800 dark:text-stone-200 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              {/* Selected mood preview badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-500 dark:text-stone-400">Current Mood:</span>
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 ${getMoodMeta(
                    mood
                  ).bgColor} ${getMoodMeta(mood).textColor} ${getMoodMeta(mood).borderColor}`}
                >
                  <span>{getMoodMeta(mood).emoji}</span>
                  <span>{getMoodMeta(mood).label}</span>
                </span>
              </div>
            </div>

            {/* Mood Picker Horizontal Strip */}
            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-2">
                Select your emotional climate:
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5">
                {MOODS_LIST.map((m) => {
                  const active = mood === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      id={`mood-select-${m.id}`}
                      onClick={() => setMood(m.id)}
                      className={`p-2 rounded-xl flex flex-col items-center gap-1 border transition-all text-center ${
                        active
                          ? `${m.bgColor} ${m.borderColor} ring-2 ring-amber-400/50 scale-102`
                          : 'bg-stone-50 dark:bg-stone-800/40 border-stone-200/60 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800'
                      }`}
                    >
                      <span className="text-lg">{m.emoji}</span>
                      <span className="text-[10px] font-medium text-stone-700 dark:text-stone-300 truncate w-full">
                        {m.label.split('&')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Title & Canvas */}
          <div className="bg-white dark:bg-stone-900 p-6 sm:p-8 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
            {/* Title */}
            <input
              id="entry-title-input"
              type="text"
              placeholder="Title your thoughts..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-2xl sm:text-3xl font-serif-title font-semibold text-stone-900 dark:text-stone-50 placeholder-stone-400 dark:placeholder-stone-600 bg-transparent border-none focus:outline-none"
            />

            <hr className="border-stone-100 dark:border-stone-800" />

            {/* Content Textarea */}
            <textarea
              id="entry-content-textarea"
              placeholder="What happened today? How did you feel? What gave you joy or caused you to pause? Let your thoughts flow naturally..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={16}
              className="w-full text-base sm:text-lg text-stone-800 dark:text-stone-200 placeholder-stone-400 dark:placeholder-stone-600 bg-transparent border-none focus:outline-none resize-none leading-relaxed font-normal"
            />

            {/* Tags section */}
            <div className="pt-4 border-t border-stone-100 dark:border-stone-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-stone-600 dark:text-stone-400">
                <Tag className="w-3.5 h-3.5" />
                <span>Tags & Themes:</span>
              </div>

              {/* Tag Badges */}
              <div className="flex flex-wrap items-center gap-1.5">
                {(tags || []).map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-900/80"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => removeTag(t)}
                      className="text-amber-700 hover:text-rose-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {/* Custom Tag Input */}
                <div className="inline-flex items-center gap-1">
                  <input
                    id="custom-tag-input"
                    type="text"
                    placeholder="Add tag..."
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        addTag(customTagInput);
                      }
                    }}
                    className="w-24 px-2 py-1 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  {customTagInput && (
                    <button
                      type="button"
                      onClick={() => addTag(customTagInput)}
                      className="p-1 text-xs text-amber-700 dark:text-amber-400 hover:text-amber-900"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Quick suggestions */}
              <div className="flex flex-wrap items-center gap-1 pt-1">
                <span className="text-[11px] text-stone-400">Suggestions:</span>
                {SUGGESTED_TAGS.filter((t) => !(tags || []).includes(t))
                  .slice(0, 6)
                  .map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => addTag(tag)}
                      className="text-[11px] px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                    >
                      +{tag}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Gemini AI Reflection Companion Panel */}
        <div className="lg:col-span-4 space-y-6">
          {/* AI Companion Card */}
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-white shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif-title font-semibold text-sm text-stone-900 dark:text-stone-100">
                    Gemini AI Companion
                  </h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    Empathetic Reflection & Clarity
                  </p>
                </div>
              </div>
            </div>

            {/* Trigger Button */}
            <button
              id="editor-analyze-ai-btn"
              onClick={handleAnalyzeWithAI}
              disabled={isAnalyzing || words < 5}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-700 hover:to-yellow-600 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50 active:scale-98"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gemini is reflecting on your words...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{aiAnalysis ? 'Re-Analyze with Gemini' : 'Reflect with Gemini AI'}</span>
                </>
              )}
            </button>

            {analysisError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{analysisError}</span>
              </div>
            )}

            {/* Analysis Results View */}
            {aiAnalysis ? (
              <div className="space-y-4 pt-2 animate-in fade-in">
                {/* Detected Nuance */}
                <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60">
                  <div className="text-[11px] uppercase font-semibold text-amber-700 dark:text-amber-400 mb-1">
                    Detected Tone
                  </div>
                  <div className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                    {aiAnalysis.detectedMood}
                  </div>
                  <div className="text-xs text-stone-500 dark:text-stone-400 italic">
                    "{aiAnalysis.emotionalTone}"
                  </div>
                </div>

                {/* Summary */}
                <div>
                  <div className="text-xs font-semibold text-stone-900 dark:text-stone-100 mb-1 flex items-center gap-1.5">
                    <BookMarked className="w-3.5 h-3.5 text-amber-600" />
                    Summary & Takeaway
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
                    {aiAnalysis.summary}
                  </p>
                </div>

                {/* Positive Moments */}
                {Array.isArray(aiAnalysis.positiveMoments) && aiAnalysis.positiveMoments.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 mb-1.5 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Positive Moments & Strengths
                    </div>
                    <ul className="space-y-1.5">
                      {(aiAnalysis.positiveMoments || []).map((item, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-stone-700 dark:text-stone-300 bg-emerald-50/60 dark:bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-200/50 dark:border-emerald-900/40 flex items-start gap-2"
                        >
                          <span className="text-emerald-600 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Concerns / Stress Areas */}
                {Array.isArray(aiAnalysis.concernsOrStressors) && aiAnalysis.concernsOrStressors.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-orange-800 dark:text-orange-300 mb-1.5 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-orange-600" />
                      Gentle Observations / Stress Areas
                    </div>
                    <ul className="space-y-1.5">
                      {(aiAnalysis.concernsOrStressors || []).map((item, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-stone-700 dark:text-stone-300 bg-orange-50/60 dark:bg-orange-950/20 p-2.5 rounded-xl border border-orange-200/50 dark:border-orange-900/40 flex items-start gap-2"
                        >
                          <span className="text-orange-600 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Reflection Questions */}
                {Array.isArray(aiAnalysis.reflectionQuestions) && aiAnalysis.reflectionQuestions.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-indigo-800 dark:text-indigo-300 mb-1.5 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                      Reflection Inquiries
                    </div>
                    <ul className="space-y-2">
                      {(aiAnalysis.reflectionQuestions || []).map((q, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-stone-700 dark:text-stone-300 bg-indigo-50/60 dark:bg-indigo-950/20 p-2.5 rounded-xl border border-indigo-200/50 dark:border-indigo-900/40 italic flex items-start justify-between gap-2"
                        >
                          <span>"{q}"</span>
                          <button
                            type="button"
                            title="Insert inquiry into journal body"
                            onClick={() => setContent(content + `\n\n*Reflection: ${q}*\n`)}
                            className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
                          >
                            + Insert
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommended Follow-up Prompts */}
                {Array.isArray(aiAnalysis.recommendedPrompts) && aiAnalysis.recommendedPrompts.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-purple-800 dark:text-purple-300 mb-1.5 flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-purple-600" />
                      Next Journaling Prompts
                    </div>
                    <ul className="space-y-1.5">
                      {(aiAnalysis.recommendedPrompts || []).map((p, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-stone-700 dark:text-stone-300 bg-purple-50/60 dark:bg-purple-950/20 p-2 rounded-xl border border-purple-200/50 dark:border-purple-900/40 flex items-center justify-between gap-2"
                        >
                          <span className="truncate">{p}</span>
                          <button
                            type="button"
                            onClick={() => handleApplyPrompt(p)}
                            className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold hover:underline shrink-0"
                          >
                            Use
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Medical Safety Disclaimer */}
                <div className="pt-2 border-t border-stone-200/80 dark:border-stone-800 text-[10px] text-stone-400 leading-relaxed italic flex items-start gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                  <span>{aiAnalysis.disclaimer}</span>
                </div>
              </div>
            ) : (
              /* Placeholder before reflection */
              <div className="text-center py-6 px-4 bg-stone-50/70 dark:bg-stone-800/40 rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 text-xs text-stone-500 dark:text-stone-400 space-y-2">
                <Sparkles className="w-6 h-6 text-amber-500/80 mx-auto" />
                <p>
                  Write your thoughts in the editor, then click <strong>Reflect with Gemini AI</strong> to receive compassionate insights, positive moments, and deep reflection questions.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 max-w-sm w-full rounded-3xl p-6 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-serif-title font-semibold text-lg text-stone-900 dark:text-stone-100">
                Delete this entry?
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                This will permanently remove this journal reflection from your private storage. This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                id="cancel-delete-modal-btn"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-modal-btn"
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium shadow-xs"
              >
                Delete Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prompt Generator Modal */}
      {showPromptModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 max-w-lg w-full rounded-3xl p-6 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                <h3 className="font-serif-title font-semibold text-base text-stone-900 dark:text-stone-100">
                  Gemini Inspiration Prompts
                </h3>
              </div>
              <button
                id="close-prompt-modal-btn"
                onClick={() => setShowPromptModal(false)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {promptsLoading ? (
              <div className="py-12 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
                <p className="text-xs text-stone-500">Gemini is curating mindful prompts for your mood...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(promptList || []).map((p, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60 hover:border-amber-300 dark:hover:border-amber-800 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                        {p.title}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-semibold">
                        {p.category}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed italic">
                      "{p.prompt}"
                    </p>
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => handleApplyPrompt(p.prompt)}
                        className="px-3 py-1 rounded-lg bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950 text-xs font-medium"
                      >
                        Insert into Journal →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Multi-turn AI Brainstorming & Reflection Modal */}
      <BrainstormChatModal
        isOpen={showBrainstormChat}
        onClose={() => setShowBrainstormChat(false)}
        onInsertToJournal={(snippet) => {
          if (!content.trim()) {
            setContent(snippet);
          } else {
            setContent((prev) => `${prev}\n\n${snippet}`);
          }
        }}
        context={{
          currentEntryTitle: title,
          currentEntryContent: content,
          mood,
          tags,
        }}
      />

      {/* Cognitive Perspective Shifter Modal */}
      <PerspectiveShiftModal
        isOpen={showPerspectiveModal}
        onClose={() => setShowPerspectiveModal(false)}
        initialThought={content ? content.slice(0, 300) : ''}
        context={{
          currentEntryTitle: title,
          mood,
        }}
        onInsertToJournal={(snippet) => {
          if (!content.trim()) {
            setContent(snippet);
          } else {
            setContent((prev) => `${prev}\n\n${snippet}`);
          }
        }}
      />

      {/* Time Capsule Modal */}
      <TimeCapsuleModal
        isOpen={showTimeCapsuleModal}
        onClose={() => setShowTimeCapsuleModal(false)}
        entry={{
          id: entryId || undefined,
          title,
          content,
          mood,
          timeCapsule,
          createdAt: currentEntry?.createdAt || Date.now(),
        }}
        onSealCapsule={(capsuleData) => {
          setTimeCapsule(capsuleData);
          setSaveSuccessNotice(true);
        }}
        onUnlockCapsule={() => {
          if (timeCapsule) {
            setTimeCapsule({ ...timeCapsule, isOpened: true });
          }
        }}
      />
    </div>
  );
};
