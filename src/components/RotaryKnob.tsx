import React, { useState, useRef, useEffect } from 'react';

interface RotaryKnobProps {
  label: string;
  value: number; // e.g. -24 to +6, or -100 to +100
  min: number;
  max: number;
  defaultValue?: number;
  unit?: string;
  onChange: (val: number) => void;
  color?: string;
  size?: 'sm' | 'md';
}

export const RotaryKnob: React.FC<RotaryKnobProps> = ({
  label,
  value,
  min,
  max,
  defaultValue = 0,
  unit = '',
  onChange,
  color = '#f59e0b',
  size = 'md',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const startValRef = useRef(value);

  // Map value to angle (-135 deg to +135 deg)
  const percent = (value - min) / (max - min);
  const angle = -135 + percent * 270;

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    startYRef.current = e.clientY;
    startValRef.current = value;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaY = startYRef.current - e.clientY;
    const range = max - min;
    const stepPerPixel = range / 120; // 120px drag covers full range
    const newVal = Math.max(min, Math.min(max, startValRef.current + deltaY * stepPerPixel));
    onChange(Math.round(newVal * 10) / 10);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  const handleDoubleClick = () => {
    onChange(defaultValue);
  };

  const knobSizeClass = size === 'sm' ? 'w-9 h-9' : 'w-11 h-11';

  return (
    <div className="flex flex-col items-center select-none group">
      <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 mb-1 group-hover:text-neutral-200 transition-colors">
        {label}
      </span>

      <div
        className={`relative ${knobSizeClass} rounded-full bg-gradient-to-b from-neutral-700 via-neutral-800 to-neutral-900 border border-neutral-700 shadow-md cursor-ns-resize flex items-center justify-center transition-transform active:scale-95`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        title="Drag up/down to adjust · Double click to reset"
      >
        {/* Outer radial tick ring */}
        <div className="absolute inset-0.5 rounded-full border border-dashed border-white/10 pointer-events-none" />

        {/* Center rotating core with marker indicator */}
        <div
          className="w-full h-full rounded-full flex items-center justify-center"
          style={{ transform: `rotate(${angle}deg)` }}
        >
          {/* Top Notch Pointer */}
          <div
            className="w-1 h-3 rounded-full absolute top-1 shadow-sm transition-colors"
            style={{ backgroundColor: color }}
          />
        </div>

        {/* Center metallic cap */}
        <div className="absolute w-4 h-4 rounded-full bg-gradient-to-tr from-neutral-900 to-neutral-700 shadow-inner pointer-events-none" />
      </div>

      <span className="text-[10px] font-mono-numbers text-neutral-400 mt-1">
        {value > 0 && '+'}{value}
        {unit}
      </span>
    </div>
  );
};
