'use client';

import React, { useRef, useState } from 'react';
import { Volume2, VolumeX, CheckCircle, Edit3, Bookmark } from 'lucide-react';
import { WordItem } from '@/types/word';

interface WordCardProps {
  item: WordItem;
  onEdit: (item: WordItem) => void;
  onToggleMastered: (item: WordItem, e: React.MouseEvent) => void;
}

export default function WordCard({ item, onEdit, onToggleMastered }: WordCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // 3D Magnetic Card Tilt Physics
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    // Subtle smooth tilt: +/- 8 degrees
    const rotateX = (-y / (rect.height / 2)) * 8;
    const rotateY = (x / (rect.width / 2)) * 8;

    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  };

  // Siri-like Audio Pronunciation using SpeechSynthesis API
  const handlePronounce = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(item.word);
    utterance.rate = 0.88;
    utterance.pitch = 1.05;

    // Pick a natural English voice if available
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Siri') || v.name.includes('Samantha') || v.name.includes('Natural') || v.name.includes('Google')));
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
      <div
        ref={cardRef}
        className="vocab-card-inner glass-specular-edge"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Top Header Row */}
        <div>
          <div className="card-top">
            <div className="card-title-group">
              <h3 className="card-word">
                {item.word}
              </h3>
              {item.phonetic && <span className="card-phonetic">{item.phonetic}</span>}
            </div>

            <div className="card-top-actions">
              {/* Pronunciation Button */}
              <button
                type="button"
                className="icon-action-btn"
                onClick={handlePronounce}
                title="Listen to pronunciation"
                aria-label={`Pronounce ${item.word}`}
                style={isPlayingAudio ? { color: 'var(--primary)', borderColor: 'var(--primary)', transform: 'scale(1.15)' } : undefined}
              >
                <Volume2 size={16} />
              </button>

              {/* Mastered Status Toggle Button */}
              <button
                type="button"
                className={`icon-action-btn ${item.mastered ? 'active-mastered' : ''}`}
                onClick={(e) => onToggleMastered(item, e)}
                title={item.mastered ? 'Mastered (click to unmark)' : 'Mark as mastered'}
                aria-label="Toggle mastered"
              >
                <CheckCircle size={16} />
              </button>

              {/* Quick Edit Indicator */}
              <button
                type="button"
                className="icon-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(item);
                }}
                title="Edit word & meaning"
                aria-label="Edit word"
              >
                <Edit3 size={15} />
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
                  ? '#f43f5e'
                  : item.difficulty === 'medium'
                  ? '#f59e0b'
                  : '#10b981',
            }}
          >
            {item.difficulty}
          </span>
        </div>
      </div>
    </div>
  );
}
