import React from 'react';

const EmptyState = ({ message = 'No data found for current filters.' }) => (
  <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
    <svg
      width="80"
      height="80"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      style={{ opacity: 0.3, marginBottom: 16 }}
    >
      <path d="M21 21H3V3" />
      <path d="m9 9 3-3 3 3" />
      <path d="M12 6v8" />
    </svg>
    <p style={{ fontSize: 15, fontWeight: 500 }}>{message}</p>
  </div>
);

export default EmptyState;
