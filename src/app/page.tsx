'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Search, Plus, ArrowUpDown, BookOpen, Loader2 } from 'lucide-react';
import AmbientBackground from '@/components/AmbientBackground';
import Header from '@/components/Header';
import WordCard from '@/components/WordCard';
import FloatingDock from '@/components/FloatingDock';
import WordModal from '@/components/WordModal';
import Toast, { ToastMessage } from '@/components/Toast';
import { WordItem, WordInput, PartOfSpeech } from '@/types/word';

export default function Home() {
  const [words, setWords] = useState<WordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPos, setSelectedPos] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [activeWord, setActiveWord] = useState<WordItem | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Toast Helper
  const showToast = useCallback((text: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastMessage = { id, text, type };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  // Fetch words from backend local JSON DB
  const fetchWords = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/words', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setWords(data.data);
      }
    } catch (err) {
      console.error('Failed to load words:', err);
      showToast('Could not load vocabulary from database', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        openAddModal();
      } else if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Modal open helpers
  const openAddModal = () => {
    setActiveWord(null);
    setModalMode('add');
    setIsModalOpen(true);
  };

  const openEditModal = (item: WordItem) => {
    setActiveWord(item);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  // CRUD Operations
  const handleSaveWord = async (data: WordInput, id?: string) => {
    if (modalMode === 'add') {
      const res = await fetch('/api/words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to add word');
      }

      setWords((prev) => [result.data, ...prev]);
      showToast(`Added "${result.data.word}" to your lexicon`, 'success');
    } else if (modalMode === 'edit' && id) {
      const res = await fetch(`/api/words/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update word');
      }

      setWords((prev) => prev.map((w) => (w.id === id ? result.data : w)));
      showToast(`Updated "${result.data.word}"`, 'success');
    }
  };

  const handleDeleteWord = async (id: string) => {
    const wordToDelete = words.find((w) => w.id === id);
    const res = await fetch(`/api/words/${id}`, {
      method: 'DELETE',
    });
    const result = await res.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to delete word');
    }

    setWords((prev) => prev.filter((w) => w.id !== id));
    showToast(`Removed "${wordToDelete?.word || 'Word'}"`, 'info');
  };

  const handleToggleMastered = async (item: WordItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedStatus = !item.mastered;

    setWords((prev) =>
      prev.map((w) => (w.id === item.id ? { ...w, mastered: updatedStatus } : w))
    );

    try {
      const res = await fetch(`/api/words/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mastered: updatedStatus }),
      });
      const result = await res.json();
      if (!result.success) throw new Error();

      showToast(
        updatedStatus ? `Marked "${item.word}" as mastered` : `Unmarked "${item.word}"`,
        'success'
      );
    } catch {
      setWords((prev) =>
        prev.map((w) => (w.id === item.id ? { ...w, mastered: !updatedStatus } : w))
      );
      showToast('Could not update status', 'error');
    }
  };

  // Random word discover
  const handleRandomWord = () => {
    if (words.length === 0) return;
    const randomIndex = Math.floor(Math.random() * words.length);
    openEditModal(words[randomIndex]);
    showToast(`Viewing: ${words[randomIndex].word}`, 'info');
  };

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    words.forEach((w) => w.tags.forEach((t) => set.add(t.toLowerCase())));
    return Array.from(set);
  }, [words]);

  // Client-side filtering & sorting
  const filteredWords = useMemo(() => {
    let result = [...words];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (w) =>
          w.word.toLowerCase().includes(q) ||
          w.meaning.toLowerCase().includes(q) ||
          w.example.toLowerCase().includes(q) ||
          w.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (selectedPos !== 'all') {
      result = result.filter((w) => w.partOfSpeech.toLowerCase() === selectedPos);
    }

    if (selectedTag !== 'all') {
      result = result.filter((w) =>
        w.tags.map((t) => t.toLowerCase()).includes(selectedTag)
      );
    }

    if (sortBy === 'az') {
      result.sort((a, b) => a.word.localeCompare(b.word));
    } else if (sortBy === 'za') {
      result.sort((a, b) => b.word.localeCompare(a.word));
    } else if (sortBy === 'difficulty') {
      const rank: Record<string, number> = { hard: 3, medium: 2, easy: 1 };
      result.sort((a, b) => (rank[b.difficulty] || 0) - (rank[a.difficulty] || 0));
    } else {
      result.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return result;
  }, [words, searchQuery, selectedPos, selectedTag, sortBy]);

  const masteredCount = words.filter((w) => w.mastered).length;

  return (
    <>
      <AmbientBackground />
      <Toast toasts={toasts} />

      {/* Top Navigation Bar */}
      <Header
        totalWords={words.length}
        masteredWords={masteredCount}
        onOpenAddModal={openAddModal}
      />

      <main className="main-content">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-badge">
            <span>Vocabulary & Lexicon Builder</span>
          </div>
          <h1 className="hero-title">
            Grow your mind's VocabForest
          </h1>
          <p className="hero-sub">
            A quiet, distraction-free space to record words, authoritative definitions,
            and high-level IELTS & GRE academic usage.
          </p>
        </section>

        {/* Filter and Search Bar */}
        <section className="filter-bar" aria-label="Search and filters">
          {/* Search Input */}
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search words, meanings, or tags... (Press / to focus)"
              className="clean-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="search-input"
            />
          </div>

          {/* Part of Speech Filter Pills */}
          <div className="filter-pills-row">
            <button
              type="button"
              className={`filter-pill ${selectedPos === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedPos('all')}
            >
              All Types
            </button>
            {(['noun', 'verb', 'adjective', 'adverb', 'idiom'] as PartOfSpeech[]).map((pos) => (
              <button
                key={pos}
                type="button"
                className={`filter-pill ${selectedPos === pos ? 'active' : ''}`}
                onClick={() => setSelectedPos(pos)}
              >
                {pos.charAt(0).toUpperCase() + pos.slice(1)}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowUpDown size={15} style={{ color: 'var(--text-muted)' }} />
            <select
              className="clean-input"
              style={{ width: 'auto', padding: '7px 14px', fontSize: '0.84rem' }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort words"
            >
              <option value="newest">Recently Added</option>
              <option value="az">Alphabetical (A → Z)</option>
              <option value="za">Alphabetical (Z → A)</option>
              <option value="difficulty">Difficulty (Hard first)</option>
            </select>
          </div>
        </section>

        {/* Tags Quick Filter */}
        {allTags.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexWrap: 'wrap',
              marginBottom: '24px',
              padding: '0 2px',
            }}
          >
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              TAGS:
            </span>
            <button
              type="button"
              className={`filter-pill ${selectedTag === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedTag('all')}
              style={{ padding: '3px 9px', fontSize: '0.74rem' }}
            >
              #all
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`filter-pill ${selectedTag === tag ? 'active' : ''}`}
                onClick={() => setSelectedTag(tag)}
                style={{ padding: '3px 9px', fontSize: '0.74rem' }}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* Word Cards Grid */}
        {loading ? (
          <div className="empty-state">
            <div className="empty-icon-circle">
              <Loader2 size={24} className="animate-spin" />
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '6px' }}>Loading vocabulary...</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Retrieving words from your local database.
            </p>
          </div>
        ) : filteredWords.length > 0 ? (
          <div className="cards-grid">
            {filteredWords.map((word) => (
              <WordCard
                key={word.id}
                item={word}
                onEdit={openEditModal}
                onToggleMastered={handleToggleMastered}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon-circle">
              <BookOpen size={24} />
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '6px' }}>No words found</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '18px' }}>
              {searchQuery || selectedPos !== 'all' || selectedTag !== 'all'
                ? 'Try clearing your search query or filters.'
                : 'Start expanding your personal lexicon.'}
            </p>
            <button
              onClick={openAddModal}
              className="btn btn-primary"
            >
              <Plus size={15} />
              <span>Add Your First Word</span>
            </button>
          </div>
        )}
      </main>

      {/* Floating Bottom Action Dock */}
      <FloatingDock
        onOpenAddModal={openAddModal}
        onRandomWord={handleRandomWord}
        onFocusSearch={() => searchInputRef.current?.focus()}
      />

      {/* Add / Edit Clean Modal */}
      <WordModal
        isOpen={isModalOpen}
        mode={modalMode}
        initialData={activeWord}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveWord}
        onDelete={handleDeleteWord}
      />
    </>
  );
}
