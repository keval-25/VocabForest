'use client';

import React from 'react';
import { Plus, BookOpen } from 'lucide-react';

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
        {/* Brand & Inline Stats */}
        <div className="logo-group">
          <div className="logo-icon-box">
            <BookOpen size={16} />
          </div>
          <div className="logo-text-wrapper">
            <h1 className="logo-title">VocabForest</h1>
            <span className="header-stats-text">
              {totalWords} {totalWords === 1 ? 'word' : 'words'} · {masteredWords} mastered
            </span>
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
            <Plus size={15} />
            <span>Add Word</span>
          </button>
        </div>
      </div>
    </header>
  );
}
