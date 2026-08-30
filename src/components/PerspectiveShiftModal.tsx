import React, { useState } from 'react';
import {
  Compass,
  X,
  Sparkles,
  Loader2,
  ArrowDownToLine,
  Copy,
  Check,
  ShieldCheck,
  Scale,
  HeartHandshake,
  Hourglass,
  FlaskConical,
  Lightbulb,
} from 'lucide-react';
import { PerspectiveShiftResult, PerspectiveLens } from '../types';

interface PerspectiveShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToJournal?: (text: string) => void;
  initialThought?: string;
  context?: {
    currentEntryTitle?: string;
    mood?: string;
  };
}

const LENS_ICONS: Record<string, React.ReactNode> = {
  stoic: <Scale className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
  compassion: <HeartHandshake className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
  future_self: <Hourglass className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
  growth_scientist: <FlaskConical className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
};

const LENS_COLORS: Record<string, { badgeBg: string; border: string; accent: string }> = {
  stoic: {
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-900/60',
    accent: 'text-indigo-600 dark:text-indigo-400',
  },
  compassion: {
    badgeBg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-900/60',
    accent: 'text-rose-600 dark:text-rose-400',
  },
  future_self: {
    badgeBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-900/60',
    accent: 'text-amber-600 dark:text-amber-400',
  },
  growth_scientist: {
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-900/60',
    accent: 'text-emerald-600 dark:text-emerald-400',
  },
};

const PRESET_THOUGHTS = [
  "I feel like I'm falling behind compared to where I expected to be.",
  "I made a mistake in an important conversation and can't stop replaying it.",
  "I am overwhelmed with too many obligations and feel drained.",
  "I'm terrified of putting my creative work out there and facing criticism.",
];

export const PerspectiveShiftModal: React.FC<PerspectiveShiftModalProps> = ({
  isOpen,
  onClose,
  onInsertToJournal,
  initialThought = '',
  context,
}) => {
  const [thoughtInput, setThoughtInput] = useState(initialThought);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PerspectiveShiftResult | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'stoic' | 'compassion' | 'future_self' | 'growth_scientist'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerateShifts = async (overrideThought?: string) => {
    const text = (overrideThought || thoughtInput).trim();
    if (!text) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/gemini/perspective-shift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thought: text,
          context,
        }),
      });

      const data: PerspectiveShiftResult = await res.json().catch(() => null as any);

      if (data && data.lenses && Array.isArray(data.lenses)) {
        setResult(data);
      } else {
        throw new Error('Could not generate perspective shifts at this time.');
      }
    } catch (err: any) {
      console.error('Perspective shift error:', err);
      setError(err?.message || 'Failed to shift perspective.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInsertAll = () => {
    if (!result || !onInsertToJournal) return;
    const formatted = `### Cognitive Perspective Shift
> "${result.originalThought}"

*Core Emotion:* ${result.coreEmotionIdentified}
*Affirmation:* ${result.groundingAffirmation}

${result.lenses
  .map(
    (l) => `#### ${l.title} (${l.subtitle})
${l.reframe}
- **Anchor:** ${l.actionableAnchor}
- **Reflection:** ${l.reflectionQuestion}`
  )
  .join('\n\n')}`;

    onInsertToJournal(formatted);
    onClose();
  };

  const handleInsertSingle = (lens: PerspectiveLens) => {
    if (!onInsertToJournal) return;
    const formatted = `#### ${lens.title} (${lens.subtitle})
${lens.reframe}

- **Micro Anchor:** ${lens.actionableAnchor}
- **Journal Inquiry:** ${lens.reflectionQuestion}`;

    onInsertToJournal(formatted);
  };

  const displayedLenses =
    result && activeTab === 'all'
      ? result.lenses
      : result?.lenses.filter((l) => l.id === activeTab) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="perspective-shift-modal"
        className="w-full max-w-3xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-gradient-to-r from-indigo-50/70 via-stone-50/70 to-rose-50/70 dark:from-stone-900 dark:to-stone-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-rose-500 to-amber-500 text-white flex items-center justify-center shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif-title font-semibold text-stone-900 dark:text-stone-100 text-base">
                  Gemini Cognitive Perspective Shifter
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/60">
                  4 Transformative Lenses
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Transform worries, inner-critic traps, and dilemmas through philosophical & mindful angles
              </p>
            </div>
          </div>

          <button
            id="close-perspective-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Input Box */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
              Enter a thought, worry, or dilemma to reframe:
            </label>
            <div className="flex gap-2">
              <textarea
                id="perspective-thought-input"
                rows={2}
                value={thoughtInput}
                onChange={(e) => setThoughtInput(e.target.value)}
                placeholder="e.g., 'I made a mistake in my meeting and worry everyone thinks I'm incompetent' or 'I feel so stuck in my daily routine'..."
                className="flex-1 px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
              />
              <button
                id="generate-perspective-btn"
                onClick={() => handleGenerateShifts()}
                disabled={loading || !thoughtInput.trim()}
                className="px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-40 shrink-0"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{loading ? 'Reframing...' : 'Shift View'}</span>
              </button>
            </div>

            {/* Quick Starters */}
            {!result && (
              <div className="pt-2">
                <span className="text-[11px] text-stone-400 font-medium mr-2">Try an example:</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {PRESET_THOUGHTS.map((t, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setThoughtInput(t);
                        handleGenerateShifts(t);
                      }}
                      className="text-xs px-2.5 py-1 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:border-indigo-300 transition-all text-left truncate max-w-xs"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs border border-rose-200 dark:border-rose-900/60">
              {error}
            </div>
          )}

          {/* Results Display */}
          {result && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Summary Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-rose-50/80 dark:from-indigo-950/30 dark:to-rose-950/30 border border-indigo-100 dark:border-indigo-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-300 uppercase tracking-wide">
                      Identified Core Emotion:
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white dark:bg-stone-800 text-indigo-700 dark:text-indigo-300 shadow-2xs border border-indigo-200 dark:border-indigo-800">
                      {result.coreEmotionIdentified}
                    </span>
                  </div>
                  <p className="text-xs text-stone-700 dark:text-stone-300 italic">
                    "{result.groundingAffirmation}"
                  </p>
                </div>

                {onInsertToJournal && (
                  <button
                    onClick={handleInsertAll}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors self-start sm:self-auto shrink-0 shadow-2xs"
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5" />
                    <span>Insert All to Draft</span>
                  </button>
                )}
              </div>

              {/* Lens Tabs Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {(
                  [
                    { id: 'all', label: 'All 4 Lenses' },
                    { id: 'stoic', label: '🏛️ Stoic' },
                    { id: 'compassion', label: '💚 Self-Compassion' },
                    { id: 'future_self', label: '⏳ 5-Year Horizon' },
                    { id: 'growth_scientist', label: '🔬 Growth Scientist' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-xs'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Lenses Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedLenses.map((lens) => {
                  const colors = LENS_COLORS[lens.id] || LENS_COLORS.stoic;
                  const icon = LENS_ICONS[lens.id] || <Sparkles className="w-5 h-5" />;

                  return (
                    <div
                      key={lens.id}
                      className={`p-5 rounded-2xl bg-white dark:bg-stone-800/90 border ${colors.border} shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all`}
                    >
                      {/* Lens Top Bar */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-stone-100 dark:bg-stone-700/60">
                              {icon}
                            </div>
                            <div>
                              <h4 className="font-serif-title font-semibold text-stone-900 dark:text-stone-100 text-sm">
                                {lens.title}
                              </h4>
                              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${colors.badgeBg}`}>
                                {lens.subtitle}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                handleCopy(
                                  lens.id,
                                  `${lens.title} (${lens.subtitle})\n${lens.reframe}\n\nAnchor: ${lens.actionableAnchor}\nInquiry: ${lens.reflectionQuestion}`
                                )
                              }
                              title="Copy lens"
                              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                            >
                              {copiedId === lens.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            {onInsertToJournal && (
                              <button
                                onClick={() => handleInsertSingle(lens)}
                                title="Insert into journal"
                                className="p-1.5 rounded-lg text-stone-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                              >
                                <ArrowDownToLine className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Reframe statement */}
                        <p className="text-stone-700 dark:text-stone-300 text-xs sm:text-sm leading-relaxed pt-1">
                          {lens.reframe}
                        </p>
                      </div>

                      {/* Action & Inquiry */}
                      <div className="pt-2 border-t border-stone-100 dark:border-stone-700/60 space-y-2 text-xs">
                        <div className="flex items-start gap-2 text-stone-600 dark:text-stone-400">
                          <span className="font-semibold text-stone-800 dark:text-stone-200 shrink-0">
                            ⚓ Micro-Anchor:
                          </span>
                          <span>{lens.actionableAnchor}</span>
                        </div>
                        <div className="flex items-start gap-2 text-stone-600 dark:text-stone-400">
                          <span className="font-semibold text-stone-800 dark:text-stone-200 shrink-0">
                            💭 Inquiry:
                          </span>
                          <span className="italic">{lens.reflectionQuestion}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 flex items-center justify-between text-xs text-stone-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Server-side private Gemini processing · Safe introspective reframing</span>
          </span>
          <span>Cognitive Psychology & Stoic Lenses</span>
        </div>
      </div>
    </div>
  );
};
