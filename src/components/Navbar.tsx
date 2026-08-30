import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  BarChart3,
  PenSquare,
  Moon,
  Sun,
  ShieldCheck,
  LogOut,
  User,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useJournal } from '../context/JournalContext';

interface NavbarProps {
  activeTab: 'dashboard' | 'entries' | 'insights' | 'editor';
  setActiveTab: (tab: 'dashboard' | 'entries' | 'insights' | 'editor') => void;
  onNewEntry: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onOpenAuth: () => void;
  onOpenFirebaseGuide: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onNewEntry,
  darkMode,
  setDarkMode,
  onOpenAuth,
  onOpenFirebaseGuide,
}) => {
  const { user, signOut, isFirebaseLive } = useAuth();
  const { stats } = useJournal();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-stone-50/90 dark:bg-stone-950/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div
          id="brand-logo-btn"
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 dark:from-amber-600 dark:to-yellow-500 flex items-center justify-center text-white shadow-sm shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif-title font-semibold text-lg text-stone-900 dark:text-stone-100 tracking-tight">
                Gemini Journal
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                AI Vault
              </span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 hidden sm:block">
              Private, AI-reflective journaling
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-stone-200/60 dark:bg-stone-900/60 p-1 rounded-xl border border-stone-200/80 dark:border-stone-800">
          <button
            id="nav-tab-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'dashboard'
                ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            Dashboard
          </button>
          <button
            id="nav-tab-entries"
            onClick={() => setActiveTab('entries')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'entries'
                ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <BookOpen className="w-4 h-4 text-stone-500" />
            Entries
            {stats.totalEntries > 0 && (
              <span className="text-xs px-1.5 py-0.2 rounded-full bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300">
                {stats.totalEntries}
              </span>
            )}
          </button>
          <button
            id="nav-tab-insights"
            onClick={() => setActiveTab('insights')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'insights'
                ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            AI Insights
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* New Entry CTA */}
          <button
            id="nav-new-entry-btn"
            onClick={onNewEntry}
            className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-stone-950 font-medium text-sm flex items-center gap-2 shadow-xs transition-all hover:shadow-sm active:scale-98"
          >
            <PenSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Write Entry</span>
          </button>

          {/* Security / Firebase Status Pill */}
          <button
            id="nav-security-guide-btn"
            onClick={onOpenFirebaseGuide}
            title="View Security & Firebase Isolation details"
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{isFirebaseLive ? 'Firebase Active' : 'Private Vault'}</span>
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            id="theme-toggle-btn"
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
            title={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
            className="flex items-center gap-1.5 p-1 rounded-xl bg-stone-200/80 dark:bg-stone-800/90 border border-stone-300/80 dark:border-stone-700 hover:border-amber-400 dark:hover:border-amber-500 transition-all cursor-pointer select-none"
          >
            <div
              className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all ${
                !darkMode
                  ? 'bg-white text-amber-600 shadow-xs scale-105'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
            </div>
            <div
              className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all ${
                darkMode
                  ? 'bg-stone-900 text-amber-300 shadow-xs scale-105'
                  : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* User Account / Profile */}
          <div className="relative">
            <button
              id="user-profile-menu-btn"
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-stone-200/70 dark:hover:bg-stone-800/80 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-stone-700 to-stone-900 text-white flex items-center justify-center font-medium text-xs">
                {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : <User className="w-4 h-4" />}
              </div>
            </button>

            {/* Profile Dropdown */}
            {profileOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setProfileOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 p-3 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-stone-100 dark:border-stone-800">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm text-stone-900 dark:text-stone-100 truncate">
                        {user?.displayName || 'Journaler'}
                      </p>
                      {user?.isAnonymous && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                          Sandbox
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                      {user?.email || 'No email attached'}
                    </p>
                  </div>

                  <div className="py-2 space-y-1">
                    <div className="px-3 py-1.5 text-xs text-stone-600 dark:text-stone-400 flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-emerald-500" />
                      <span>UID: <code className="text-[11px] font-mono bg-stone-100 dark:bg-stone-800 px-1 rounded">{user?.uid.slice(0, 10)}...</code></span>
                    </div>
                    <button
                      id="menu-open-firebase-guide"
                      onClick={() => {
                        setProfileOpen(false);
                        onOpenFirebaseGuide();
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg flex items-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      Firebase Security & Setup
                    </button>
                    <button
                      id="menu-switch-auth-btn"
                      onClick={() => {
                        setProfileOpen(false);
                        onOpenAuth();
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg flex items-center gap-2"
                    >
                      <User className="w-4 h-4 text-stone-500" />
                      Switch / Connect Account
                    </button>
                  </div>

                  <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
                    <button
                      id="menu-sign-out-btn"
                      onClick={() => {
                        setProfileOpen(false);
                        signOut();
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation bar */}
      <div className="md:hidden flex items-center justify-around px-2 py-2 border-t border-stone-200 dark:border-stone-800 bg-stone-100/80 dark:bg-stone-900/80">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs font-medium ${
            activeTab === 'dashboard'
              ? 'text-amber-700 dark:text-amber-400 bg-stone-200/80 dark:bg-stone-800'
              : 'text-stone-600 dark:text-stone-400'
          }`}
        >
          <Sparkles className="w-4 h-4 mb-0.5" />
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('entries')}
          className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs font-medium ${
            activeTab === 'entries'
              ? 'text-amber-700 dark:text-amber-400 bg-stone-200/80 dark:bg-stone-800'
              : 'text-stone-600 dark:text-stone-400'
          }`}
        >
          <BookOpen className="w-4 h-4 mb-0.5" />
          Entries
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs font-medium ${
            activeTab === 'insights'
              ? 'text-amber-700 dark:text-amber-400 bg-stone-200/80 dark:bg-stone-800'
              : 'text-stone-600 dark:text-stone-400'
          }`}
        >
          <BarChart3 className="w-4 h-4 mb-0.5" />
          Insights
        </button>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="flex flex-col items-center py-1 px-3 rounded-lg text-xs font-medium text-stone-600 dark:text-stone-400"
        >
          {darkMode ? <Sun className="w-4 h-4 mb-0.5 text-amber-400" /> : <Moon className="w-4 h-4 mb-0.5" />}
          <span>{darkMode ? 'Light' : 'Dark'}</span>
        </button>
      </div>
    </header>
  );
};
