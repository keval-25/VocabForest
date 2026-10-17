'use client';

import React from 'react';
import { Sparkles, Plus, Palette, BookOpen, CheckCircle2 } from 'lucide-react';
import { ThemePreset } from '@/types/word';

interface HeaderProps {
  totalWords: number;
  masteredWords: number;
  currentTheme: ThemePreset;
  onThemeChange: (theme: ThemePreset) => void;
  onOpenAddModal: () => void;
}

const THEME_OPTIONS: { id: ThemePreset; name: string; color: string }[] = [
  { id: 'manus-midnight', name: 'Midnight', color: '#3b82f6' },
  { id: 'quartz-light', name: 'Quartz Light', color: '#f8fafc' },
  { id: 'emerald-aurora', name: 'Emerald', color: '#10b981' },
  { id: 'cyberpunk-neon', name: 'Cyberpunk', color: '#ec4899' },
  { id: 'sunset-ember', name: 'Sunset', color: '#f97316' },
];

export default function Header({
  totalWords,
  masteredWords,
  currentTheme,
  onThemeChange,
  onOpenAddModal,
}: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-glass-bar glass-specular-edge">
        {/* Brand / Logo */}
        <div className="logo-group">
          <div className="logo-icon-box">
            <BookOpen size={20} />
          </div>
          <div>
            <h1 className="logo-title">VocabForest</h1>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
              <span className="stats-pill">
                <Sparkles size={12} style={{ color: 'var(--primary)' }} />
                {totalWords} Words
              </span>
              <span className="stats-pill">
                <CheckCircle2 size={12} style={{ color: '#10b981' }} />
                {masteredWords} Mastered
              </span>
            </div>
          </div>
        </div>

        {/* Actions on Top Right */}
        <div className="header-actions">
          {/* Theme Selector Dropdown */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', display: 'none' }}>Theme</span>
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.06)', padding: '4px', borderRadius: 'var(--radius-full)', border: '1px solid var(--glass-border)' }}>
              {THEME_OPTIONS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onThemeChange(t.id)}
                  title={`Switch to ${t.name}`}
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    backgroundColor: t.color,
                    border: currentTheme === t.id ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.2)',
                    transform: currentTheme === t.id ? 'scale(1.15)' : 'scale(1)',
                    boxShadow: currentTheme === t.id ? `0 0 10px ${t.color}` : 'none',
                    transition: 'all 0.2s ease',
                  }}
                  aria-label={t.name}
                />
              ))}
            </div>
          </div>

          {/* Top-Right Add Word Button */}
          <button
            onClick={onOpenAddModal}
            className="glass-btn glass-btn-primary"
            title="Add New Word (N)"
            id="header-add-word-btn"
          >
            <Plus size={18} />
            <span>Add Word</span>
          </button>
        </div>
      </div>
    </header>
  );
}
