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
  const [isAcademicMode, setIsAcademicMode] = useState(true);
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

  const handleAutoFill = async (wordToLookup?: string) => {
    const targetWord = (wordToLookup || word).trim();
    if (!targetWord || targetWord.length < 2) return;

    setIsAutoFilling(true);
    setError(null);

    try {
      const modeParam = isAcademicMode ? 'academic' : 'general';
      const res = await fetch(`/api/lookup?word=${encodeURIComponent(targetWord)}&mode=${modeParam}`);
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
        setTimeout(() => setAutoFillSuccess(false), 4000);
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
      <div className="clean-modal" role="dialog" aria-modal="true">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge">
              {mode === 'add' ? <Plus size={18} /> : <Edit2 size={18} />}
            </div>
            <div>
              <h2 className="modal-title">
                {mode === 'add' ? 'Add Word' : 'Edit Word Details'}
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {mode === 'add'
                  ? 'Enter word to auto-populate definitions and examples'
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
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div
                style={{
                  padding: '9px 13px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: '#fdf2f2',
                  border: '1px solid #f9d5d5',
                  color: '#992828',
                  fontSize: '0.84rem',
                }}
              >
                {error}
              </div>
            )}

            {autoFillSuccess && (
              <div
                style={{
                  padding: '9px 13px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--secondary-subtle)',
                  border: '1px solid var(--secondary-border)',
                  color: 'var(--secondary)',
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Sparkles size={15} />
                <span>
                  {isAcademicMode
                    ? 'Retrieved Oxford academic definitions & IELTS Band 9 context sentence!'
                    : 'Auto-filled word definition, phonetics, and examples!'}
                </span>
              </div>
            )}

            {/* Word & Phonetic Row */}
            <div className="form-row">
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" htmlFor="word-input">
                    Word *
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setIsAcademicMode(!isAcademicMode)}
                      title="Toggle IELTS/GRE Academic Level"
                      style={{
                        fontSize: '0.72rem',
                        padding: '2px 7px',
                        borderRadius: 'var(--radius-full)',
                        background: isAcademicMode ? 'var(--primary-subtle)' : 'var(--bg-canvas)',
                        border: isAcademicMode ? '1px solid var(--primary-border)' : '1px solid var(--border-light)',
                        color: isAcademicMode ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {isAcademicMode ? '🎓 IELTS/GRE' : 'General'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAutoFill()}
                      disabled={isAutoFilling || !word.trim()}
                      style={{
                        fontSize: '0.74rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: isAutoFilling ? 'var(--text-muted)' : 'var(--primary)',
                        fontWeight: 600,
                        background: 'none',
                        border: 'none',
                        cursor: isAutoFilling || !word.trim() ? 'not-allowed' : 'pointer',
                      }}
                      title="Auto-fill definition and examples"
                    >
                      {isAutoFilling ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          <span>Fetching...</span>
                        </>
                      ) : (
                        <>
                          <Wand2 size={12} />
                          <span>Auto-Fill</span>
                        </>
                      )}
                    </button>
                  </div>
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
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        color: 'var(--primary)',
                      }}
                    >
                      <Loader2 size={15} className="animate-spin" />
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
                placeholder="gre, ielts, academic, philosophy"
                className="form-input"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>

            {/* Mastered Checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <input
                id="mastered-checkbox"
                type="checkbox"
                checked={mastered}
                onChange={(e) => setMastered(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <label htmlFor="mastered-checkbox" style={{ fontSize: '0.86rem', cursor: 'pointer', userSelect: 'none' }}>
                I have mastered this word
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            {mode === 'edit' && onDelete ? (
              showDeleteConfirm ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', color: '#992828', fontWeight: 600 }}>Sure?</span>
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
                  <Trash2 size={14} />
                  <span>Delete Word</span>
                </button>
              )
            ) : (
              <div />
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                disabled={isSubmitting || isAutoFilling}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting || isAutoFilling}
              >
                {isSubmitting ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Check size={16} />
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
