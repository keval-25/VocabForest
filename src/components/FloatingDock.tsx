'use client';

import React from 'react';
import { Plus, Shuffle, Search } from 'lucide-react';

interface FloatingDockProps {
  onOpenAddModal: () => void;
  onRandomWord: () => void;
  onFocusSearch: () => void;
}

export default function FloatingDock({
  onOpenAddModal,
  onRandomWord,
  onFocusSearch,
}: FloatingDockProps) {
  return (
    <div className="floating-dock" role="toolbar" aria-label="Quick Actions">
      {/* Quick Search Shortcut */}
      <button
        type="button"
        className="dock-btn"
        onClick={onFocusSearch}
        title="Quick Search (/)"
      >
        <Search size={15} />
        <span>Search</span>
      </button>

      {/* Center Primary Add Word Button */}
      <button
        type="button"
        id="bottom-dock-add-word-btn"
        className="dock-add-btn"
        onClick={onOpenAddModal}
        title="Add Word (N)"
      >
        <Plus size={17} />
        <span>Add Word</span>
      </button>

      {/* Random Word Flashcard Trigger */}
      <button
        type="button"
        className="dock-btn"
        onClick={onRandomWord}
        title="Discover a random word"
      >
        <Shuffle size={15} />
        <span>Random</span>
      </button>
    </div>
  );
}
