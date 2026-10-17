'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Edit2, Trash2, Check, Sparkles, BookOpen } from 'lucide-react';
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
                  ? 'Expand your vocabulary with definitions and examples'
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

            {/* Word & Phonetic Row */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="word-input">
                  Word *
                </label>
                <input
                  id="word-input"
                  ref={wordInputRef}
                  type="text"
                  required
                  placeholder="e.g. Ephemeral"
                  className="form-input"
                  value={word}
                  onChange={(e) => setWord(e.target.value)}
                />
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
                placeholder="Explain what the word means with clarity..."
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
                placeholder="Use the word in a memorable sentence..."
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
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="glass-btn glass-btn-primary"
                disabled={isSubmitting}
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
