'use client';

import React, { useState } from 'react';
import { Volume2, CheckCircle, Edit3 } from 'lucide-react';
import { WordItem } from '@/types/word';

interface WordCardProps {
  item: WordItem;
  onEdit: (item: WordItem) => void;
  onToggleMastered: (item: WordItem, e: React.MouseEvent) => void;
}

export default function WordCard({ item, onEdit, onToggleMastered }: WordCardProps) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Audio Pronunciation using SpeechSynthesis API
  const handlePronounce = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(item.word);
    utterance.rate = 0.88;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Google') || v.name.includes('Siri'))
    );
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
  };

  const posClass = `pos-${item.partOfSpeech.toLowerCase()}`;

  return (
    <div
      className="vocab-card"
      onClick={() => onEdit(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onEdit(item);
        }
      }}
      title="Click to edit word details"
    >
      <div>
        {/* Card Header */}
        <div className="card-top">
          <div className="card-title-group">
            <h3 className="card-word">{item.word}</h3>
            {item.phonetic && <span className="card-phonetic">{item.phonetic}</span>}
          </div>

          <div className="card-top-actions">
            {/* Audio Button */}
            <button
              type="button"
              className="icon-action-btn"
              onClick={handlePronounce}
              title="Listen to pronunciation"
              aria-label={`Pronounce ${item.word}`}
              style={isPlayingAudio ? { color: 'var(--primary)', borderColor: 'var(--primary)' } : undefined}
            >
              <Volume2 size={15} />
            </button>

            {/* Mastered Toggle */}
            <button
              type="button"
              className={`icon-action-btn ${item.mastered ? 'active-mastered' : ''}`}
              onClick={(e) => onToggleMastered(item, e)}
              title={item.mastered ? 'Mastered (click to unmark)' : 'Mark as mastered'}
              aria-label="Toggle mastered"
            >
              <CheckCircle size={15} />
            </button>

            {/* Edit Button */}
            <button
              type="button"
              className="icon-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item);
              }}
              title="Edit word details"
              aria-label="Edit word"
            >
              <Edit3 size={14} />
            </button>
          </div>
        </div>

        {/* Part of Speech Pill */}
        <span className={`pos-pill ${posClass}`}>
          {item.partOfSpeech}
        </span>

        {/* Meaning */}
        <p className="card-meaning">{item.meaning}</p>

        {/* Example Sentence */}
        {item.example && (
          <p className="card-example">"{item.example}"</p>
        )}
      </div>

      {/* Card Footer: Tags & Difficulty */}
      <div className="card-bottom">
        <div className="card-tags">
          {item.tags.map((tag, idx) => (
            <span key={idx} className="card-tag">
              #{tag}
            </span>
          ))}
        </div>

        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            color:
              item.difficulty === 'hard'
                ? '#992828'
                : item.difficulty === 'medium'
                ? '#8a4824'
                : '#3b5a45',
          }}
        >
          {item.difficulty}
        </span>
      </div>
    </div>
  );
}
