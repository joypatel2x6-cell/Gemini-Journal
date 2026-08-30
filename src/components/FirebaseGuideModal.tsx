import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Lock,
  Database,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Code,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isFirebaseConfigured } from '../firebase/config';

interface FirebaseGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseGuideModal: React.FC<FirebaseGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, saveCustomFirebaseConfig, clearCustomFirebaseConfig } = useAuth();
  const [customConfig, setCustomConfig] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [copiedRules, setCopiedRules] = useState(false);

  if (!isOpen) return null;

  const handleCopyRules = () => {
    navigator.clipboard.writeText(sampleRules);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 2000);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setConfigError(null);
    const success = saveCustomFirebaseConfig(customConfig);
    if (success) {
      setSavedSuccess(true);
    } else {
      setConfigError('Invalid JSON format. Please make sure it has apiKey and projectId.');
    }
  };

  const sampleRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /entries/{entryId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-stone-900 max-w-2xl w-full rounded-3xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 relative">
        <button
          id="close-firebase-guide-btn"
          onClick={onClose}
          className="absolute right-5 top-5 text-stone-400 hover:text-stone-600 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-serif-title font-semibold text-stone-900 dark:text-stone-100">
              Security Architecture & Data Isolation
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Zero-Trust per-user Firestore isolation & Server-side Gemini Secret Protection
            </p>
          </div>
        </div>

        {/* Security Principles Checklist */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-700/60 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-900 dark:text-stone-100">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Strict User-Level Firestore Isolation</span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              All journal entries live under <code className="text-[11px] font-mono bg-stone-200 dark:bg-stone-700 px-1 py-0.5 rounded">/users/&#123;userId&#125;/entries/&#123;entryId&#125;</code>.
              Rules forbid any user from reading or modifying another user's documents.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-700/60 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-900 dark:text-stone-100">
              <KeyRound className="w-4 h-4 text-amber-600" />
              <span>Zero Client Secret Exposure</span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              Gemini AI API calls are strictly handled by the server-side proxy (<code className="text-[11px] font-mono bg-stone-200 dark:bg-stone-700 px-1 py-0.5 rounded">/api/gemini/*</code>).
              No Gemini API keys exist in frontend code.
            </p>
          </div>
        </div>

        {/* Security Rules Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-stone-700 dark:text-stone-300">
            <div className="flex items-center gap-1.5">
              <Code className="w-4 h-4 text-stone-500" />
              <span>Active Security Rules (`firestore.rules`)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyRules}
                className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-[11px] text-stone-700 dark:text-stone-300 flex items-center gap-1 transition-colors"
              >
                {copiedRules ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-600 font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Rules</span>
                  </>
                )}
              </button>
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Enforced
              </span>
            </div>
          </div>
          <pre className="p-3.5 rounded-2xl bg-stone-900 text-stone-200 text-[11px] font-mono leading-relaxed overflow-x-auto border border-stone-800">
            {sampleRules}
          </pre>
        </div>

        {/* Custom Firebase Configuration Connection */}
        <div className="p-5 rounded-2xl bg-stone-100/70 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-500" />
              <span>
                {isFirebaseConfigured ? 'Firebase Project Connected' : 'Connect Custom Firebase Project'}
              </span>
            </div>
            {isFirebaseConfigured && (
              <button
                type="button"
                onClick={clearCustomFirebaseConfig}
                className="text-[11px] text-rose-600 hover:underline"
              >
                Reset to Sandbox
              </button>
            )}
          </div>

          <p className="text-xs text-stone-500 dark:text-stone-400">
            To connect your live Firebase web configuration (with Google Auth and Cloud Firestore enabled), paste your Firebase SDK config object JSON below:
          </p>

          <form onSubmit={handleSaveConfig} className="space-y-2">
            <textarea
              rows={3}
              placeholder='{ "apiKey": "AIza...", "authDomain": "...", "projectId": "...", "storageBucket": "..." }'
              value={customConfig}
              onChange={(e) => setCustomConfig(e.target.value)}
              className="w-full p-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-mono text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {configError && (
              <p className="text-xs text-rose-600 dark:text-rose-400">{configError}</p>
            )}
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-stone-950 text-xs font-medium"
            >
              Save & Apply Firebase Config
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
