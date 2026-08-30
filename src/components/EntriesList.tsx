import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Calendar,
  Sparkles,
  Heart,
  Tag,
  Grid,
  List,
  PenSquare,
  Clock,
  X,
  ChevronRight,
  BookOpen,
  SlidersHorizontal,
  Download,
  FileText,
  Code,
  Hourglass,
  Lock,
} from 'lucide-react';
import { useJournal } from '../context/JournalContext';
import { MOODS_LIST, getMoodMeta } from '../constants/moods';
import { JournalEntry, JournalMood } from '../types';

interface EntriesListProps {
  onSelectEntry: (id: string) => void;
  onNewEntry: () => void;
}

export const EntriesList: React.FC<EntriesListProps> = ({
  onSelectEntry,
  onNewEntry,
}) => {
  const { entries, toggleFavorite } = useJournal();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMood, setSelectedMood] = useState<JournalMood | 'all'>('all');
  const [selectedTag, setSelectedTag] = useState<string | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => {
      e.tags?.forEach((t) => set.add(t));
    });
    return Array.from(set).sort();
  }, [entries]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0];
    const monthPrefix = now.toISOString().slice(0, 7);

    return entries.filter((e) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = e.title?.toLowerCase().includes(q);
        const matchesContent = e.content?.toLowerCase().includes(q);
        const matchesTags = e.tags?.some((t) => t.toLowerCase().includes(q));
        const matchesAi = e.aiAnalysis?.summary?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesContent && !matchesTags && !matchesAi) {
          return false;
        }
      }

      // Mood
      if (selectedMood !== 'all' && e.mood !== selectedMood) {
        return false;
      }

      // Tag
      if (selectedTag !== 'all' && (!e.tags || !e.tags.includes(selectedTag))) {
        return false;
      }

      // Date
      if (dateFilter === 'today' && e.entryDate !== todayStr) {
        return false;
      }
      if (dateFilter === 'week' && (!e.entryDate || e.entryDate < weekAgo)) {
        return false;
      }
      if (dateFilter === 'month' && (!e.entryDate || !e.entryDate.startsWith(monthPrefix))) {
        return false;
      }

      // Favorites
      if (favoritesOnly && !e.isFavorite) {
        return false;
      }

      return true;
    });
  }, [entries, searchQuery, selectedMood, selectedTag, dateFilter, favoritesOnly]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedMood !== 'all' ||
    selectedTag !== 'all' ||
    dateFilter !== 'all' ||
    favoritesOnly;

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedMood('all');
    setSelectedTag('all');
    setDateFilter('all');
    setFavoritesOnly(false);
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(entries, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gemini-journal-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleExportMarkdown = () => {
    let md = `# Personal Gemini Journal Archive\n\nGenerated on ${new Date().toLocaleDateString()}\n\n---\n\n`;
    entries.forEach((e) => {
      md += `## ${e.title || 'Untitled Entry'}\n`;
      md += `**Date:** ${e.entryDate} | **Mood:** ${e.mood} | **Word Count:** ${e.wordCount}\n`;
      if (e.tags && e.tags.length > 0) {
        md += `**Tags:** ${e.tags.map((t) => `#${t}`).join(' ')}\n`;
      }
      md += `\n${e.content}\n\n`;
      if (e.aiAnalysis) {
        md += `> **Gemini AI Reflection:**\n`;
        if (e.aiAnalysis.summary) md += `> *Summary:* ${e.aiAnalysis.summary}\n`;
        if (e.aiAnalysis.mindfulAdvice) md += `> *Mindful Advice:* ${e.aiAnalysis.mindfulAdvice}\n`;
        md += `\n`;
      }
      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gemini-journal-archive-${new Date().toISOString().split('T')[0]}.md`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-300">
      {/* Header & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif-title font-semibold text-stone-900 dark:text-stone-50 tracking-tight">
            Journal Entries
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            {filteredEntries.length} of {entries.length}{' '}
            {entries.length === 1 ? 'reflection' : 'reflections'} matching filters
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Export button */}
          <div className="relative">
            <button
              id="entries-export-btn"
              onClick={() => setShowExportMenu(!showExportMenu)}
              title="Export & Download Journals"
              className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium text-xs flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-stone-800 rounded-2xl p-2 border border-stone-200 dark:border-stone-700 shadow-xl z-20 space-y-1">
                <button
                  onClick={handleExportMarkdown}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-stone-700 dark:text-stone-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-900 dark:hover:text-amber-300 flex items-center gap-2 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                  <span>Markdown Archive (.md)</span>
                </button>
                <button
                  onClick={handleExportJSON}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-stone-700 dark:text-stone-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-900 dark:hover:text-amber-300 flex items-center gap-2 transition-colors"
                >
                  <Code className="w-3.5 h-3.5 text-amber-600" />
                  <span>Raw JSON Backup (.json)</span>
                </button>
              </div>
            )}
          </div>

          {/* View mode toggle */}
          <div className="flex items-center bg-stone-200/60 dark:bg-stone-800/60 p-1 rounded-xl border border-stone-200 dark:border-stone-700">
            <button
              id="view-grid-btn"
              onClick={() => setViewMode('grid')}
              title="Card Grid"
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              id="view-timeline-btn"
              onClick={() => setViewMode('timeline')}
              title="Editorial Timeline"
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'timeline'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            id="entries-new-btn"
            onClick={onNewEntry}
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-stone-950 font-medium text-xs flex items-center gap-1.5 shadow-xs"
          >
            <PenSquare className="w-4 h-4" />
            <span>New Entry</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            id="entries-search-input"
            type="text"
            placeholder="Search keywords, thoughts, topics, or AI reflection takeaways..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-2.5 bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-2xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            {/* Mood Dropdown */}
            <select
              id="filter-mood-select"
              value={selectedMood}
              onChange={(e) => setSelectedMood(e.target.value as any)}
              className="bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-1.5 text-xs text-stone-700 dark:text-stone-300 font-medium focus:outline-none"
            >
              <option value="all">All Moods</option>
              {MOODS_LIST.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.emoji} {m.label}
                </option>
              ))}
            </select>

            {/* Tag Filter */}
            {(allTags || []).length > 0 && (
              <select
                id="filter-tag-select"
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-1.5 text-xs text-stone-700 dark:text-stone-300 font-medium focus:outline-none"
              >
                <option value="all">All Tags</option>
                {(allTags || []).map((t) => (
                  <option key={t} value={t}>
                    #{t}
                  </option>
                ))}
              </select>
            )}

            {/* Date Preset */}
            <select
              id="filter-date-select"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-1.5 text-xs text-stone-700 dark:text-stone-300 font-medium focus:outline-none"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Past 7 Days</option>
              <option value="month">This Month</option>
            </select>

            {/* Favorites Toggle */}
            <button
              id="filter-favorites-toggle"
              onClick={() => setFavoritesOnly(!favoritesOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                favoritesOnly
                  ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400'
                  : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${favoritesOnly ? 'fill-rose-500' : ''}`} />
              <span>Favorites Only</span>
            </button>
          </div>

          {hasActiveFilters && (
            <button
              id="filter-clear-all-btn"
              onClick={clearAllFilters}
              className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Entries List / Grid */}
      {filteredEntries.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-12 text-center border border-dashed border-stone-300 dark:border-stone-800 space-y-3">
          <BookOpen className="w-10 h-10 text-stone-400 mx-auto" />
          <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
            No matching journal entries found
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
            {hasActiveFilters
              ? 'Try relaxing your filters or search keywords.'
              : 'You have not recorded any journal entries yet.'}
          </p>
          {hasActiveFilters ? (
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-medium"
            >
              Clear all filters
            </button>
          ) : (
            <button
              onClick={onNewEntry}
              className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950 text-xs font-medium shadow-xs"
            >
              Write your first entry
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEntries.map((entry) => {
            const moodMeta = getMoodMeta(entry.mood);
            return (
              <div
                key={entry.id}
                id={`entry-grid-card-${entry.id}`}
                onClick={() => onSelectEntry(entry.id)}
                className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200/80 dark:border-stone-800 shadow-xs hover:shadow-md hover:border-amber-300 dark:hover:border-amber-800/80 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 ${moodMeta.bgColor} ${moodMeta.textColor} ${moodMeta.borderColor}`}
                    >
                      <span>{moodMeta.emoji}</span>
                      <span>{moodMeta.label.split('&')[0]}</span>
                    </span>

                    <div className="flex items-center gap-1">
                      {entry.timeCapsule && (
                        <span
                          title={`Time Capsule: Unlocks ${entry.timeCapsule.unlockDate}`}
                          className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-semibold flex items-center gap-1 border border-amber-200 dark:border-amber-900/60"
                        >
                          <Hourglass className="w-3 h-3" />
                          <span>Capsule</span>
                        </span>
                      )}
                      {entry.aiAnalysis && (
                        <span
                          title="Gemini AI Analyzed"
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
                            entry.isFavorite ? 'fill-rose-500 text-rose-500' : ''
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-serif-title font-semibold text-stone-900 dark:text-stone-100 text-lg mb-2 line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {entry.title || 'Untitled Entry'}
                  </h3>

                  <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-3 leading-relaxed mb-4">
                    {entry.content}
                  </p>

                  {/* AI Snippet if available */}
                  {entry.aiAnalysis?.summary && (
                    <div className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 text-[11px] text-amber-900 dark:text-amber-200 mb-4 line-clamp-2 italic">
                      "{entry.aiAnalysis.summary}"
                    </div>
                  )}
                </div>

                <div>
                  {/* Tags */}
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {entry.tags.map((t) => (
                        <span
                          key={t}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTag(t);
                          }}
                          className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-[10px] text-stone-600 dark:text-stone-400 hover:bg-amber-100 dark:hover:bg-amber-950/80 transition-colors"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer Meta */}
                  <div className="flex items-center justify-between text-[11px] text-stone-400 pt-3 border-t border-stone-100 dark:border-stone-800/80">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {entry.entryDate}
                    </span>
                    <span>{entry.wordCount} words</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* EDITORIAL TIMELINE VIEW */
        <div className="space-y-4">
          {filteredEntries.map((entry) => {
            const moodMeta = getMoodMeta(entry.mood);
            return (
              <div
                key={entry.id}
                id={`entry-timeline-row-${entry.id}`}
                onClick={() => onSelectEntry(entry.id)}
                className="bg-white dark:bg-stone-900 rounded-3xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-xs hover:border-amber-300 dark:hover:border-amber-800/80 transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 ${moodMeta.bgColor} border ${moodMeta.borderColor}`}
                  >
                    {moodMeta.emoji}
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-stone-400">
                        {entry.entryDate}
                      </span>
                      <span className="text-xs text-stone-400">·</span>
                      <span className="text-xs text-stone-500">{entry.wordCount} words</span>
                      {entry.timeCapsule && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-[10px] font-semibold text-amber-800 dark:text-amber-300">
                          <Hourglass className="w-2.5 h-2.5" /> Capsule ({entry.timeCapsule.unlockDate})
                        </span>
                      )}
                      {entry.aiAnalysis && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-[10px] font-semibold text-amber-800 dark:text-amber-300">
                          <Sparkles className="w-2.5 h-2.5" /> AI
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif-title font-semibold text-base text-stone-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {entry.title || 'Untitled Entry'}
                    </h3>

                    <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-1">
                      {entry.content}
                    </p>

                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {entry.tags.map((t) => (
                          <span
                            key={t}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTag(t);
                            }}
                            className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-[10px] text-stone-600 dark:text-stone-400 hover:bg-amber-100 dark:hover:bg-amber-950/80 transition-colors"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(entry.id);
                    }}
                    className="p-1.5 text-stone-400 hover:text-rose-500 transition-colors"
                  >
                    <Heart
                      className={`w-4 h-4 ${entry.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`}
                    />
                  </button>
                  <ChevronRight className="w-5 h-5 text-stone-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
