import React from 'react';
import { DJProfile } from '../types/dj';

interface DJAvatarProps {
  dj: DJProfile;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isSpotlight?: boolean;
}

export const DJAvatar: React.FC<DJAvatarProps> = ({ dj, size = 'md', isSpotlight = false }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-24 h-24 text-xl',
  }[size];

  // Derive initials
  const initials = dj.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div
      className={`relative rounded-xl flex items-center justify-center font-bold font-mono-numbers shrink-0 select-none overflow-hidden transition-all duration-300 ${sizeClasses} ${
        isSpotlight ? 'ring-2 shadow-lg' : 'ring-1 ring-white/10'
      }`}
      style={{
        backgroundColor: '#12141c',
        borderColor: dj.accentColor,
        boxShadow: isSpotlight ? `0 0 20px ${dj.accentColor}50` : undefined,
      }}
    >
      {/* Background Graphic Pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" stroke={dj.accentColor} strokeWidth="1" strokeDasharray="3 3" />
        <circle cx="50" cy="50" r="28" fill="none" stroke={dj.accentColor} strokeWidth="2" opacity="0.6" />
        <circle cx="50" cy="50" r="10" fill={dj.accentColor} opacity="0.3" />
      </svg>

      {/* Headphones Icon Overlay */}
      <svg
        className="absolute top-1 right-1 opacity-40 text-neutral-300"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
      </svg>

      {/* DJ Initials */}
      <span className="relative z-10 text-neutral-100 tracking-wider" style={{ textShadow: `0 0 10px ${dj.accentColor}` }}>
        {initials}
      </span>

      {/* Active turn indicator bar */}
      {isSpotlight && (
        <span
          className="absolute bottom-0 inset-x-0 h-1 transition-all"
          style={{ backgroundColor: dj.accentColor }}
        />
      )}
    </div>
  );
};
