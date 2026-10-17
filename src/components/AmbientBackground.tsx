'use client';

import React from 'react';

export default function AmbientBackground() {
  return (
    <div className="bg-ambient-container" aria-hidden="true">
      <div className="bg-ambient-blob bg-blob-1" />
      <div className="bg-ambient-blob bg-blob-2" />
      <div className="bg-ambient-blob bg-blob-3" />
      <div className="bg-grid-overlay" />
    </div>
  );
}
