'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

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
        <div key={t.id} className="toast-pill">
          {t.type === 'success' && <CheckCircle2 size={16} style={{ color: 'var(--secondary)' }} />}
          {t.type === 'error' && <AlertCircle size={16} style={{ color: '#992828' }} />}
          {t.type === 'info' && <Info size={16} style={{ color: 'var(--primary)' }} />}
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}
