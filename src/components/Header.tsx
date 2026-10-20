'use client';

import React from 'react';
import { Plus, BookOpen } from 'lucide-react';

interface HeaderProps {
  totalWords: number;
  masteredWords: number;
  onOpenAddModal: () => void;
  isMongo?: boolean;
}

export default function Header({
  totalWords,
  masteredWords,
  onOpenAddModal,
  isMongo = false,
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h1 className="logo-title">VocabForest</h1>
              {isMongo && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.68rem',
                    padding: '2px 7px',
                    borderRadius: '999px',
                    backgroundColor: '#edf5ee',
                    color: '#285e35',
                    fontWeight: 600,
                    border: '1px solid #d3e7d7',
                  }}
                  title="Connected to MongoDB Cloud Database"
                >
                  <span
                    style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      backgroundColor: '#2f8544',
                    }}
                  />
                  Cloud DB
                </span>
              )}
            </div>
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
