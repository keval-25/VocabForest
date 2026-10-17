'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Edit2, Trash2, Check, Sparkles, Loader2, Wand2 } from 'lucide-react';
import { WordItem, WordInput, PartOfSpeech, DifficultyLevel } from '@/types/word';

interface WordModalProps {
  isOpen: boolean;
  mode: 'add' | 'edit';
  initialData?: WordItem | null;
  onClose: () => void;
  onSave: (data: WordInput, id?: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const PART_OF_SPEECH_OPTIONS: PartOfSpeech[] = [
  'noun',
  'verb',
  'adjective',
  'adverb',
  'idiom',
  'phrase',
  'interjection',
  'other',
];

const DIFFICULTY_OPTIONS: { value: DifficultyLevel; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

export default function WordModal({
  isOpen,
  mode,
  initialData,
  onClose,
  onSave,
  onDelete,
}: WordModalProps) {
  const [word, setWord] = useState('');
  const [phonetic, setPhonetic] = useState('');
  const [partOfSpeech, setPartOfSpeech] = useState<PartOfSpeech>('noun');
  const [meaning, setMeaning] = useState('');
  const [example, setExample] = useState('');
  const [tags, setTags] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [mastered, setMastered] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [autoFillSuccess, setAutoFillSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const wordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        setWord(initialData.word);
        setPhonetic(initialData.phonetic || '');
        setPartOfSpeech(initialData.partOfSpeech || 'noun');
        setMeaning(initialData.meaning || '');
        setExample(initialData.example || '');
        setTags(initialData.tags ? initialData.tags.join(', ') : '');
        setDifficulty(initialData.difficulty || 'medium');
        setMastered(!!initialData.mastered);
      } else {
        // Reset for new word
        setWord('');
        setPhonetic('');
        setPartOfSpeech('noun');
        setMeaning('');
        setExample('');
        setTags('');
        setDifficulty('medium');
        setMastered(false);
      }
      setError(null);
      setAutoFillSuccess(false);
      setShowDeleteConfirm(false);

      // Focus input
      setTimeout(() => {
        wordInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, mode, initialData]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Auto-Fill function that looks up word meaning, phonetic, POS, example, and tags
  const handleAutoFill = async (wordToLookup?: string) => {
    const targetWord = (wordToLookup || word).trim();
    if (!targetWord || targetWord.length < 2) return;

    setIsAutoFilling(true);
    setError(null);

    try {
      const res = await fetch(`/api/lookup?word=${encodeURIComponent(targetWord)}`);
      const result = await res.json();

      if (result.success && result.data) {
        const d = result.data;
        if (d.word) setWord(d.word);
        if (d.phonetic) setPhonetic(d.phonetic);
        if (d.partOfSpeech) setPartOfSpeech(d.partOfSpeech);
        if (d.meaning) setMeaning(d.meaning);
        if (d.example) setExample(d.example);
        if (d.tags) setTags(d.tags);
        if (d.difficulty) setDifficulty(d.difficulty);

        setAutoFillSuccess(true);
        setTimeout(() => setAutoFillSuccess(false), 4500);
      } else {
        setError(result.error || 'Could not find automatic definition. You can fill it in manually.');
      }
    } catch {
      setError('Network error while looking up word definition.');
    } finally {
      setIsAutoFilling(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!word.trim()) {
      setError('Please provide a word.');
      return;
    }

    if (!meaning.trim()) {
      setError('Please provide a definition/meaning.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: WordInput = {
        word: word.trim(),
        phonetic: phonetic.trim(),
        partOfSpeech,
        meaning: meaning.trim(),
        example: example.trim(),
        tags: tags,
        difficulty,
        mastered,
      };

      await onSave(payload, initialData?.id);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData || !onDelete) return;
    setIsSubmitting(true);
    try {
      await onDelete(initialData.id);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete word.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="glass-modal glass-specular-edge" role="dialog" aria-modal="true">
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge">
              {mode === 'add' ? <Plus size={20} /> : <Edit2 size={20} />}
            </div>
            <div>
              <h2 className="modal-title">
                {mode === 'add' ? 'Add New Word' : 'Edit Word Details'}
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                {mode === 'add'
                  ? 'Type a word to auto-fill definitions, examples, and phonetics'
                  : `Updating: ${initialData?.word}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(244, 63, 94, 0.15)',
                  border: '1px solid rgba(244, 63, 94, 0.35)',
                  color: '#fda4af',
                  fontSize: '0.85rem',
                }}
              >
                {error}
              </div>
            )}

            {/* Auto-fill banner alert */}
            {autoFillSuccess && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  color: '#6ee7b7',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  animation: 'fadeIn 0.25s ease-out',
                }}
              >
                <Sparkles size={16} style={{ color: '#34d399' }} />
                <span>Auto-filled definitions, examples, phonetics, and tags! You can still edit them below.</span>
              </div>
            )}

            {/* Word & Phonetic Row with Auto-Fill button */}
            <div className="form-row">
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" htmlFor="word-input">
                    Word *
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAutoFill()}
                    disabled={isAutoFilling || !word.trim()}
                    style={{
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: isAutoFilling ? 'var(--text-tertiary)' : 'var(--primary)',
                      fontWeight: 600,
                      background: 'none',
                      border: 'none',
                      cursor: isAutoFilling || !word.trim() ? 'not-allowed' : 'pointer',
                      opacity: !word.trim() ? 0.6 : 1,
                    }}
                    title="Auto-fill definition, phonetics, and examples"
                  >
                    {isAutoFilling ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        <span>Fetching...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 size={12} />
                        <span>Auto-Fill ✨</span>
                      </>
                    )}
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    id="word-input"
                    ref={wordInputRef}
                    type="text"
                    required
                    placeholder="Type a word, e.g. Ephemeral"
                    className="form-input"
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    onBlur={() => {
                      // If user enters word and meaning is empty, auto-trigger lookup
                      if (word.trim().length >= 3 && !meaning.trim() && !isAutoFilling) {
                        handleAutoFill(word);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAutoFill();
                      }
                    }}
                  />
                  {isAutoFilling && (
                    <div
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.78rem',
                        color: 'var(--primary)',
                      }}
                    >
                      <Loader2 size={16} className="animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="phonetic-input">
                  Phonetic Pronunciation
                </label>
                <input
                  id="phonetic-input"
                  type="text"
                  placeholder="e.g. /ɪˈfem.ər.əl/"
                  className="form-input"
                  value={phonetic}
                  onChange={(e) => setPhonetic(e.target.value)}
                />
              </div>
            </div>

            {/* Part of Speech & Difficulty Row */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="pos-select">
                  Part of Speech
                </label>
                <select
                  id="pos-select"
                  className="form-select"
                  value={partOfSpeech}
                  onChange={(e) => setPartOfSpeech(e.target.value as PartOfSpeech)}
                >
                  {PART_OF_SPEECH_OPTIONS.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos.charAt(0).toUpperCase() + pos.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="diff-select">
                  Difficulty Level
                </label>
                <select
                  id="diff-select"
                  className="form-select"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                >
                  {DIFFICULTY_OPTIONS.map((diff) => (
                    <option key={diff.value} value={diff.value}>
                      {diff.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Meaning Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="meaning-input">
                Meaning / Definition *
              </label>
              <textarea
                id="meaning-input"
                required
                rows={3}
                placeholder="Definition will automatically appear here once you type the word..."
                className="form-textarea"
                value={meaning}
                onChange={(e) => setMeaning(e.target.value)}
              />
            </div>

            {/* Example Sentence Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="example-input">
                Example Sentence
              </label>
              <textarea
                id="example-input"
                rows={2}
                placeholder="Example sentence with the word..."
                className="form-textarea"
                value={example}
                onChange={(e) => setExample(e.target.value)}
              />
            </div>

            {/* Tags Input */}
            <div className="form-group">
              <label className="form-label" htmlFor="tags-input">
                Tags (comma separated)
              </label>
              <input
                id="tags-input"
                type="text"
                placeholder="gre, daily, philosophy, nature"
                className="form-input"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>

            {/* Mastered Checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
              <input
                id="mastered-checkbox"
                type="checkbox"
                checked={mastered}
                onChange={(e) => setMastered(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <label htmlFor="mastered-checkbox" style={{ fontSize: '0.88rem', cursor: 'pointer', userSelect: 'none' }}>
                I have mastered this word
              </label>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer">
            {mode === 'edit' && onDelete ? (
              showDeleteConfirm ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', color: '#f43f5e', fontWeight: 600 }}>Sure?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="delete-action-btn"
                    disabled={isSubmitting}
                  >
                    Confirm Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="delete-action-btn"
                >
                  <Trash2 size={15} />
                  <span>Delete Word</span>
                </button>
              )
            ) : (
              <div />
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={onClose}
                className="glass-btn"
                disabled={isSubmitting || isAutoFilling}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="glass-btn glass-btn-primary"
                disabled={isSubmitting || isAutoFilling}
              >
                {isSubmitting ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Check size={18} />
                    <span>{mode === 'add' ? 'Save Word' : 'Save Changes'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
