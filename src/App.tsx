import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { JournalProvider } from './context/JournalContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { JournalEditor } from './components/JournalEditor';
import { EntriesList } from './components/EntriesList';
import { AIInsightsView } from './components/AIInsightsView';
import { AuthModal } from './components/AuthModal';
import { FirebaseGuideModal } from './components/FirebaseGuideModal';
import { JournalMood } from './types';
import { Sparkles, ShieldCheck, Heart, Lock } from 'lucide-react';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'entries' | 'insights' | 'editor'>('dashboard');
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editorInitialMood, setEditorInitialMood] = useState<JournalMood | undefined>(undefined);
  const [editorInitialPrompt, setEditorInitialPrompt] = useState<string | undefined>(undefined);

  // Dark mode state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('pgj_dark_mode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Modal states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isFirebaseGuideModalOpen, setIsFirebaseGuideModalOpen] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('pgj_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('pgj_dark_mode', 'false');
    }
  }, [darkMode]);

  // Handlers for switching views
  const handleStartNewEntry = (initialMood?: JournalMood, initialPrompt?: string) => {
    setEditingEntryId(null);
    setEditorInitialMood(initialMood);
    setEditorInitialPrompt(initialPrompt);
    setActiveTab('editor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditEntry = (id: string) => {
    setEditingEntryId(id);
    setEditorInitialMood(undefined);
    setEditorInitialPrompt(undefined);
    setActiveTab('editor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-stone-100/60 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans transition-colors">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab !== 'editor') {
            setEditingEntryId(null);
          }
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNewEntry={() => handleStartNewEntry()}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenFirebaseGuide={() => setIsFirebaseGuideModalOpen(true)}
      />

      {/* Main App Content Views */}
      <main className="flex-1 pb-16">
        {activeTab === 'dashboard' && (
          <Dashboard
            onWriteNewEntry={handleStartNewEntry}
            onViewEntry={handleEditEntry}
            onViewAllEntries={() => setActiveTab('entries')}
            onViewInsights={() => setActiveTab('insights')}
            onOpenFirebaseGuide={() => setIsFirebaseGuideModalOpen(true)}
          />
        )}

        {activeTab === 'entries' && (
          <EntriesList
            onSelectEntry={handleEditEntry}
            onNewEntry={() => handleStartNewEntry()}
          />
        )}

        {activeTab === 'insights' && (
          <AIInsightsView
            onWriteWithPrompt={(prompt, mood) => handleStartNewEntry(mood, prompt)}
          />
        )}

        {activeTab === 'editor' && (
          <JournalEditor
            entryId={editingEntryId}
            initialMood={editorInitialMood}
            initialPrompt={editorInitialPrompt}
            onBack={() => setActiveTab('dashboard')}
            onSaved={(newId) => {
              setEditingEntryId(newId);
            }}
          />
        )}
      </main>

      {/* App Footer */}
      <footer className="border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 py-6 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-2">
            <span className="font-serif-title font-medium text-stone-700 dark:text-stone-300">
              Personal Gemini Journal
            </span>
            <span>·</span>
            <span>Zero-Trust AI Self-Reflection</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsFirebaseGuideModalOpen(true)}
              className="hover:text-stone-800 dark:hover:text-stone-200 flex items-center gap-1 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Security Architecture
            </button>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-500" />
              End-to-End User Isolation
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <FirebaseGuideModal
        isOpen={isFirebaseGuideModalOpen}
        onClose={() => setIsFirebaseGuideModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <JournalProvider>
        <AppContent />
      </JournalProvider>
    </AuthProvider>
  );
}
