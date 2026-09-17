import React from 'react';

export const BreadIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Loaf slice shape */}
    <path d="M6 10.5C4.3 10.5 3 9.2 3 7.5 3 5.8 4.3 4 7 4c2.5 0 4 1.2 5 2.2C13 5.2 14.5 4 17 4c2.7 0 4 1.8 4 3.5 0 1.7-1.3 3-3 3v8c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2v-8z" />
    <path d="M9.5 10.5h5" strokeDasharray="1 1" strokeOpacity="0.6" />
  </svg>
);
