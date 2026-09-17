import React from 'react';

export const DiyWorkshopIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Artist Palette */}
    <path d="M12 21a9 9 0 1 0-9-9c0 1.488.36 2.89 1 4.127a3.5 3.5 0 0 0 3.182 2.053c.966 0 1.838-.553 2.182-1.42a2.5 2.5 0 0 1 2.318-1.58H14a3 3 0 0 1 3 3c0 1.657-1.343 2.82-3 2.82h-2z" />
    {/* Paint spots */}
    <circle cx="7.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="7.5" r="1" fill="currentColor" stroke="none" />
    <circle cx="16.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
    {/* Brush stroke accent */}
    <path d="M15.5 15.5l3.5 3.5" strokeWidth="2" />
    <path d="M18 14l2 2" />
  </svg>
);
