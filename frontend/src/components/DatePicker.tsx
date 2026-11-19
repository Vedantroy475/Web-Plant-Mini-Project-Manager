'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface DatePickerProps {
  value: string; // 'YYYY-MM-DD' or ''
  onChange: (value: string) => void;
  placeholder?: string;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function parseLocalYMD(ymd: string): Date | null {
  if (!ymd) return null;
  const parts = ymd.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function formatToYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(ymd: string): string {
  const d = parseLocalYMD(ymd);
  if (!d) return '';
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
}

export default function DatePicker({
  value,
  onChange,
  placeholder = 'mm/dd/yyyy',
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showMonthGrid, setShowMonthGrid] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDate = useMemo(() => parseLocalYMD(value), [value]);
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const [viewYear, setViewYear] = useState<number>(
    () => (selectedDate || today).getFullYear()
  );
  const [viewMonth, setViewMonth] = useState<number>(
    () => (selectedDate || today).getMonth()
  );

  useEffect(() => {
    if (selectedDate) {
      setViewYear(selectedDate.getFullYear());
      setViewMonth(selectedDate.getMonth());
    }
  }, [selectedDate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setShowMonthGrid(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setShowMonthGrid(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells: { date: Date; inCurrentMonth: boolean }[] = [];

    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      cells.push({
        date: new Date(viewYear, viewMonth - 1, daysInPrevMonth - i),
        inCurrentMonth: false,
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({
        date: new Date(viewYear, viewMonth, day),
        inCurrentMonth: true,
      });
    }

    const remainder = cells.length % 7;
    if (remainder !== 0) {
      const needed = 7 - remainder;
      for (let day = 1; day <= needed; day++) {
        cells.push({
          date: new Date(viewYear, viewMonth + 1, day),
          inCurrentMonth: false,
        });
      }
    }

    return cells;
  }, [viewYear, viewMonth]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDate = (date: Date) => {
    onChange(formatToYMD(date));
    setIsOpen(false);
    setShowMonthGrid(false);
  };

  const handleToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    onChange(formatToYMD(today));
    setIsOpen(false);
    setShowMonthGrid(false);
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
    setShowMonthGrid(false);
  };

  const isSameDay = (a: Date | null, b: Date) =>
    !!a &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-xl border bg-white px-3.5 text-sm shadow-2xs transition-all duration-150 ${
          isOpen
            ? 'border-blue-600 ring-3 ring-blue-500/15'
            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
        }`}
      >
        <span className="flex items-center gap-2.5 truncate">
          <CalendarIcon className="h-4 w-4 shrink-0 text-blue-600" />
          <span
            className={`tabular-nums ${
              value ? 'font-medium text-slate-800' : 'text-slate-400'
            }`}
          >
            {value ? formatDisplayDate(value) : placeholder}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-600' : 'text-slate-400'
          }`}
        />
      </button>

      {/* Floating Stitch-Style Calendar Card */}
      <div
        className={`absolute right-0 z-50 mt-2 w-[284px] origin-top-right rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xl ring-1 ring-slate-900/5 transition-all duration-200 ease-out ${
          isOpen
            ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none -translate-y-2 scale-95 opacity-0'
        }`}
      >
        {/* Top Bar: Month/Year Switcher + Prev/Next Month Arrows */}
        <div className="mb-3.5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowMonthGrid((prev) => !prev)}
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-sm font-bold text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <span>
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 text-slate-500 transition-transform duration-150 ${
                showMonthGrid ? 'rotate-180' : ''
              }`}
            />
          </button>

          {!showMonthGrid && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                title="Previous Month"
                className="cursor-pointer rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                title="Next Month"
                className="cursor-pointer rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {showMonthGrid ? (
          /* Quick Month & Year Selector */
          <div className="space-y-3 py-1">
            <div className="flex items-center justify-between px-1">
              <button
                type="button"
                onClick={() => setViewYear((y) => y - 1)}
                className="cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                ← {viewYear - 1}
              </button>
              <span className="text-xs font-bold text-blue-600">{viewYear}</span>
              <button
                type="button"
                onClick={() => setViewYear((y) => y + 1)}
                className="cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                {viewYear + 1} →
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {MONTHS.map((m, idx) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setViewMonth(idx);
                    setShowMonthGrid(false);
                  }}
                  className={`cursor-pointer rounded-lg py-2 text-xs font-medium transition-colors ${
                    idx === viewMonth
                      ? 'bg-blue-600 font-semibold text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {m.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Weekday Header */}
            <div className="mb-1.5 grid grid-cols-7 text-center">
              {WEEKDAYS.map((day) => (
                <span
                  key={day}
                  className="text-[11px] font-semibold tracking-wide text-slate-400"
                >
                  {day}
                </span>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-y-1 text-center tabular-nums">
              {calendarDays.map(({ date, inCurrentMonth }, idx) => {
                const selected = isSameDay(selectedDate, date);
                const isToday = isSameDay(today, date);

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectDate(date)}
                    className={`mx-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl text-xs font-medium transition-all duration-150 ${
                      selected
                        ? 'bg-blue-600 font-semibold text-white shadow-sm shadow-blue-600/30'
                        : isToday
                        ? 'bg-blue-50 font-semibold text-blue-600 ring-1 ring-blue-200'
                        : inCurrentMonth
                        ? 'text-slate-700 hover:bg-slate-100'
                        : 'text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Footer: Clear & Today */}
        <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs font-semibold">
          <button
            type="button"
            onClick={handleClear}
            className="cursor-pointer rounded-lg px-2.5 py-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={handleToday}
            className="cursor-pointer rounded-lg px-2.5 py-1 text-blue-600 hover:bg-blue-50 transition-colors"
          >
            Today
          </button>
        </div>
      </div>
    </div>
  );
}