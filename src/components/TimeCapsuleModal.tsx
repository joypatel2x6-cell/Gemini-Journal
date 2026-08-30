import React, { useState } from 'react';
import {
  Hourglass,
  Lock,
  Unlock,
  Sparkles,
  X,
  Calendar,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  Heart,
  Compass,
} from 'lucide-react';
import { JournalEntry, TimeCapsuleData } from '../types';

interface TimeCapsuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: Partial<JournalEntry>;
  onSealCapsule?: (data: TimeCapsuleData) => void;
  onUnlockCapsule?: () => void;
}

const PRESET_DURATIONS = [
  { label: '1 Week', days: 7 },
  { label: '1 Month', days: 30 },
  { label: '3 Months', days: 90 },
  { label: '6 Months', days: 180 },
  { label: '1 Year', days: 365 },
];

const INTENTIONS = [
  'Reflect on how much I have grown',
  'Open when I need a reminder of what truly matters',
  'Check in on my career goals and creative projects',
  'Re-read when I overcome this current challenge',
  'A gentle gift of gratitude to my future self',
];

export const TimeCapsuleModal: React.FC<TimeCapsuleModalProps> = ({
  isOpen,
  onClose,
  entry,
  onSealCapsule,
  onUnlockCapsule,
}) => {
  // Compute default unlock date (30 days from now)
  const defaultUnlock = new Date();
  defaultUnlock.setDate(defaultUnlock.getDate() + 30);
  const defaultUnlockStr = defaultUnlock.toISOString().split('T')[0];

  const isAlreadyCapsule = Boolean(entry.timeCapsule);
  const [unlockDate, setUnlockDate] = useState<string>(
    entry.timeCapsule?.unlockDate || defaultUnlockStr
  );
  const [intention, setIntention] = useState<string>(
    entry.timeCapsule?.intention || 'Reflect on how much I have grown'
  );

  const [wisdomLoading, setWisdomLoading] = useState(false);
  const [wisdomResult, setWisdomResult] = useState<any | null>(null);
  const [wisdomError, setWisdomError] = useState<string | null>(null);

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const isUnlockDateReached = entry.timeCapsule?.unlockDate
    ? entry.timeCapsule.unlockDate <= todayStr
    : false;

  const handlePresetSelect = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setUnlockDate(d.toISOString().split('T')[0]);
  };

  const handleSeal = () => {
    if (!onSealCapsule) return;
    onSealCapsule({
      unlockDate,
      sealedAt: Date.now(),
      intention,
      isOpened: false,
    });
    onClose();
  };

  const handleGenerateWisdomBridge = async () => {
    setWisdomLoading(true);
    setWisdomError(null);

    try {
      const res = await fetch('/api/gemini/time-capsule-wisdom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          capsuleEntry: entry,
          recentContext: {
            currentDate: todayStr,
            daysSinceSealed: entry.timeCapsule?.sealedAt
              ? Math.floor((Date.now() - entry.timeCapsule.sealedAt) / (1000 * 60 * 60 * 24))
              : 30,
          },
        }),
      });

      const data = await res.json().catch(() => null);

      if (data && (data.letterFromPast || data.growthObserved)) {
        setWisdomResult(data);
      } else {
        throw new Error(data?.error || 'Failed to generate wisdom bridge.');
      }
    } catch (err: any) {
      console.error('Time capsule wisdom error:', err);
      setWisdomError(err?.message || 'Error generating wisdom reflection.');
    } finally {
      setWisdomLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="time-capsule-modal"
        className="w-full max-w-2xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-gradient-to-r from-amber-50/80 via-stone-50/80 to-purple-50/80 dark:from-stone-900 dark:to-stone-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-purple-600 text-white flex items-center justify-center shadow-xs">
              <Hourglass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif-title font-semibold text-stone-900 dark:text-stone-100 text-base">
                  {isAlreadyCapsule ? 'Time Capsule & Wisdom Bridge' : 'Seal a Time Capsule'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60">
                  Future-Self Reflection
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Preserve thoughts for a future moment and receive AI growth retrospectives
              </p>
            </div>
          </div>

          <button
            id="close-capsule-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* If Not Sealed Yet: Setup Screen */}
          {!isAlreadyCapsule && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300/60 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-center gap-3">
                <Lock className="w-5 h-5 text-amber-600 shrink-0" />
                <span>
                  Seal this journal entry as a private message to your future self. Set an unlock date when you would like to revisit your mindset and celebrate how far you have come.
                </span>
              </div>

              {/* Unlock Date Picker */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                  Select Unlock Date
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      id="capsule-unlock-date-input"
                      type="date"
                      min={todayStr}
                      value={unlockDate}
                      onChange={(e) => setUnlockDate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Duration Presets */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {PRESET_DURATIONS.map((preset) => (
                    <button
                      key={preset.days}
                      type="button"
                      onClick={() => handlePresetSelect(preset.days)}
                      className="text-xs px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-amber-950/60 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 transition-colors"
                    >
                      +{preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Capsule Intention */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                  Intention / Theme for Opening
                </label>
                <input
                  type="text"
                  value={intention}
                  onChange={(e) => setIntention(e.target.value)}
                  placeholder="e.g. To see how my mindset changed, or after completing this milestone..."
                  className="w-full px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />

                <div className="space-y-1 pt-1">
                  <span className="text-[11px] text-stone-400 font-medium">Suggestions:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {INTENTIONS.map((int, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setIntention(int)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700/80 text-left"
                      >
                        {int}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Seal Button */}
              <div className="pt-4">
                <button
                  id="confirm-seal-capsule-btn"
                  onClick={handleSeal}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
                >
                  <Lock className="w-4 h-4" />
                  <span>Seal Time Capsule until {new Date(unlockDate).toLocaleDateString()}</span>
                </button>
              </div>
            </div>
          )}

          {/* If Already Sealed: View Status & AI Wisdom Bridge */}
          {isAlreadyCapsule && (
            <div className="space-y-6">
              {/* Sealed Status Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50/80 via-stone-50/80 to-purple-50/80 dark:from-stone-800 dark:to-stone-800/90 border border-amber-200/80 dark:border-stone-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isUnlockDateReached ? (
                      <Unlock className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Lock className="w-5 h-5 text-amber-600" />
                    )}
                    <span className="font-semibold text-stone-900 dark:text-stone-100 text-sm">
                      {isUnlockDateReached ? 'Time Capsule Ready to Open!' : 'Time Capsule Sealed'}
                    </span>
                  </div>

                  <span className="text-xs px-2.5 py-1 rounded-full bg-white dark:bg-stone-700 font-medium text-stone-600 dark:text-stone-300 shadow-2xs border border-stone-200 dark:border-stone-600">
                    Unlock: {new Date(entry.timeCapsule!.unlockDate).toLocaleDateString()}
                  </span>
                </div>

                <div className="text-xs text-stone-600 dark:text-stone-400 space-y-1">
                  <div>
                    <span className="font-medium text-stone-800 dark:text-stone-200">Intention:</span>{' '}
                    {entry.timeCapsule!.intention || 'Personal growth & reflection'}
                  </div>
                  <div>
                    <span className="font-medium text-stone-800 dark:text-stone-200">Sealed on:</span>{' '}
                    {new Date(entry.timeCapsule!.sealedAt || Date.now()).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Wisdom Bridge AI Button */}
              <div className="space-y-3">
                <button
                  id="generate-wisdom-bridge-btn"
                  onClick={handleGenerateWisdomBridge}
                  disabled={wisdomLoading}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-600 hover:from-purple-700 hover:to-amber-700 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 disabled:opacity-50"
                >
                  {wisdomLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>{wisdomLoading ? 'Synthesizing Wisdom Bridge...' : 'Ask Gemini for Wisdom Bridge Retrospective'}</span>
                </button>
                <p className="text-[11px] text-center text-stone-400">
                  Gemini compares your past mindset with your journey today to highlight resilience and insights
                </p>
              </div>

              {wisdomError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs border border-rose-200 dark:border-rose-900/60">
                  {wisdomError}
                </div>
              )}

              {/* Wisdom Bridge Output */}
              {wisdomResult && (
                <div className="p-5 rounded-2xl bg-white dark:bg-stone-800/90 border border-purple-200 dark:border-purple-900/50 shadow-md space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 font-serif-title font-semibold text-sm">
                    <Compass className="w-4 h-4" />
                    <span>Gemini Wisdom Bridge Report</span>
                  </div>

                  <div className="space-y-3 text-xs leading-relaxed text-stone-700 dark:text-stone-300">
                    <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40">
                      <span className="font-semibold text-purple-900 dark:text-purple-300 block mb-1">
                        💌 Message from Past Self:
                      </span>
                      <p className="italic">"{wisdomResult.letterFromPast}"</p>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40">
                      <span className="font-semibold text-amber-900 dark:text-amber-300 block mb-1">
                        🌱 Growth & Resilience Observed:
                      </span>
                      <p>{wisdomResult.growthObserved}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                      <span className="font-semibold text-emerald-900 dark:text-emerald-300 block mb-1">
                        🎉 Milestone to Celebrate:
                      </span>
                      <p>{wisdomResult.celebrationMoment}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
                      <span className="font-semibold text-indigo-900 dark:text-indigo-300 block mb-1">
                        ⚓ Forward-Looking Anchor Question:
                      </span>
                      <p className="font-medium text-indigo-950 dark:text-indigo-200">
                        {wisdomResult.forwardAnchor}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Unseal action if open date reached */}
              {isUnlockDateReached && onUnlockCapsule && (
                <div className="pt-2">
                  <button
                    onClick={onUnlockCapsule}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark Time Capsule as Unsealed & Preserved</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 flex items-center justify-between text-xs text-stone-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Private client isolation · Stored securely in Firestore</span>
          </span>
          <span>Time Capsule Studio</span>
        </div>
      </div>
    </div>
  );
};
