'use client';

import React from 'react';
import { Plus, BookOpen, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  totalWords: number;
  masteredWords: number;
  onOpenAddModal: () => void;
}

export default function Header({
  totalWords,
  masteredWords,
  onOpenAddModal,
}: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-bar">
        {/* Brand / Logo */}
        <div className="logo-group">
          <div className="logo-icon-box">
            <BookOpen size={18} />
          </div>
          <div>
            <h1 className="logo-title">VocabForest</h1>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
              <span className="stats-pill">
                {totalWords} Words
              </span>
              <span className="stats-pill">
                <CheckCircle2 size={12} style={{ color: 'var(--secondary)' }} />
                {masteredWords} Mastered
              </span>
            </div>
          </div>
        </div>

        {/* Top-Right Add Word Button */}
        <div className="header-actions">
          <button
            onClick={onOpenAddModal}
            className="btn btn-primary"
            title="Add New Word (N)"
            id="header-add-word-btn"
          >
            <Plus size={16} />
            <span>Add Word</span>
          </button>
        </div>
      </div>
    </header>
  );
}
