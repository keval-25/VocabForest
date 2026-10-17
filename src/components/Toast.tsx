'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'error';
  text: string;
}

interface ToastProps {
  toasts: ToastMessage[];
}

export default function Toast({ toasts }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="ios-toast-pill glass-specular-edge">
          {t.type === 'success' && <CheckCircle2 size={18} style={{ color: '#10b981' }} />}
          {t.type === 'error' && <AlertCircle size={18} style={{ color: '#f43f5e' }} />}
          {t.type === 'info' && <Sparkles size={18} style={{ color: 'var(--primary)' }} />}
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}
