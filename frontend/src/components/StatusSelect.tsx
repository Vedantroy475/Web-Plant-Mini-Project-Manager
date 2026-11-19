'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronsUpDown, Check } from 'lucide-react';
import { TaskStatus } from '@/store/slices/taskSlice';

interface StatusOption {
  value: TaskStatus;
  label: string;
  dotColor: string;
  ringColor: string;
  activeBg: string;
  textColor: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  {
    value: 'todo',
    label: 'To Do',
    dotColor: 'bg-slate-500',
    ringColor: 'ring-slate-500/20',
    activeBg: 'bg-slate-100/80',
    textColor: 'text-slate-700',
  },
  {
    value: 'in-progress',
    label: 'In Progress',
    dotColor: 'bg-amber-500',
    ringColor: 'ring-amber-500/20',
    activeBg: 'bg-amber-50',
    textColor: 'text-amber-800',
  },
  {
    value: 'done',
    label: 'Done',
    dotColor: 'bg-emerald-500',
    ringColor: 'ring-emerald-500/20',
    activeBg: 'bg-emerald-50',
    textColor: 'text-emerald-800',
  },
];

interface StatusSelectProps {
  value: TaskStatus;
  onChange: (value: TaskStatus) => void;
  size?: 'sm' | 'md';
  align?: 'left' | 'right';
}

export default function StatusSelect({
  value,
  onChange,
  size = 'md',
  align = 'left',
}: StatusSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption =
    STATUS_OPTIONS.find((opt) => opt.value === value) || STATUS_OPTIONS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleSelect = (newValue: TaskStatus) => {
    onChange(newValue);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative inline-block w-full">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border bg-white font-medium text-slate-800 shadow-2xs transition-all duration-150 ${
          size === 'sm' ? 'h-9 px-3 text-xs' : 'h-10 px-3.5 text-sm'
        } ${
          isOpen
            ? 'border-blue-600 ring-3 ring-blue-500/15'
            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
        }`}
      >
        <span className="flex items-center gap-2.5 truncate">
          <span
            className={`h-2 w-2 shrink-0 rounded-full ring-4 ${selectedOption.dotColor} ${selectedOption.ringColor}`}
          />
          <span className="truncate">{selectedOption.label}</span>
        </span>
        <ChevronsUpDown
          className={`h-4 w-4 shrink-0 transition-colors ${
            isOpen ? 'text-blue-600' : 'text-slate-400'
          }`}
        />
      </button>

      {/* Smooth Animated Dropdown Panel */}
      <div
        role="listbox"
        className={`absolute z-50 mt-1.5 min-w-[168px] w-full rounded-xl border border-slate-200/90 bg-white p-1.5 shadow-xl ring-1 ring-slate-900/5 transition-all duration-200 ease-out ${
          align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'
        } ${
          isOpen
            ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none -translate-y-2 scale-95 opacity-0'
        }`}
      >
        {STATUS_OPTIONS.map((option) => {
          const isSelected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => handleSelect(option.value)}
              className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors ${
                isSelected
                  ? `${option.activeBg} ${option.textColor} font-semibold`
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span className={`h-2 w-2 rounded-full ${option.dotColor}`} />
                <span>{option.label}</span>
              </span>
              {isSelected && <Check className="h-3.5 w-3.5 text-blue-600" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}