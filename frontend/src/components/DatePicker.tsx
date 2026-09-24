import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  minYear?: number;
  maxYear?: number;
  required?: boolean;
  id?: string;
  name?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  minYear = 1990,
  maxYear = 2026,
  required = false,
  id = 'dob',
  name = 'dob',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate years list from minYear to maxYear (e.g. 1990 to 2026)
  const years: number[] = [];
  for (let y = maxYear; y >= minYear; y--) {
    years.push(y);
  }

  // Parse initial date or default to a reasonable college student year (e.g. 2005) or current year
  const initialDate = value ? new Date(value) : null;
  const validInitialDate = initialDate && !isNaN(initialDate.getTime()) ? initialDate : null;

  const [currentYear, setCurrentYear] = useState<number>(() => {
    if (validInitialDate) return validInitialDate.getFullYear();
    // Default preview around 2004 for college participants
    return 2004;
  });

  const [currentMonth, setCurrentMonth] = useState<number>(() => {
    if (validInitialDate) return validInitialDate.getMonth();
    return 0; // January
  });

  // When value changes from outside, sync current view
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setCurrentYear(d.getFullYear());
        setCurrentMonth(d.getMonth());
      }
    }
  }, [value]);

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      if (currentYear > minYear) {
        setCurrentYear((prev) => prev - 1);
        setCurrentMonth(11);
      }
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      if (currentYear < maxYear) {
        setCurrentYear((prev) => prev + 1);
        setCurrentMonth(0);
      }
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const mStr = String(currentMonth + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    const formattedDate = `${currentYear}-${mStr}-${dStr}`;
    onChange(formattedDate);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const handleToday = () => {
    const today = new Date();
    const y = today.getFullYear();
    if (y >= minYear && y <= maxYear) {
      const mStr = String(today.getMonth() + 1).padStart(2, '0');
      const dStr = String(today.getDate()).padStart(2, '0');
      setCurrentYear(y);
      setCurrentMonth(today.getMonth());
      onChange(`${y}-${mStr}-${dStr}`);
    } else {
      // If today is outside, clamp to maxYear
      const mStr = '01';
      const dStr = '01';
      setCurrentYear(maxYear);
      setCurrentMonth(0);
      onChange(`${maxYear}-${mStr}-${dStr}`);
    }
    setIsOpen(false);
  };

  // Calculate days in month & offset
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  // Selected date parts
  let selectedYear: number | null = null;
  let selectedMonth: number | null = null;
  let selectedDay: number | null = null;

  if (value) {
    const parts = value.split('-');
    if (parts.length === 3) {
      selectedYear = parseInt(parts[0], 10);
      selectedMonth = parseInt(parts[1], 10) - 1;
      selectedDay = parseInt(parts[2], 10);
    }
  }

  // Format date display for input trigger
  const displayFormatted = value
    ? (() => {
        const parts = value.split('-');
        if (parts.length === 3) {
          const y = parts[0];
          const m = parseInt(parts[1], 10) - 1;
          const d = parseInt(parts[2], 10);
          return `${d} ${MONTH_NAMES[m]} ${y}`;
        }
        return value;
      })()
    : '';

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Hidden real input for native form validity / serialization */}
      <input
        type="hidden"
        id={id}
        name={name}
        value={value}
        required={required}
      />

      {/* Styled Interactive Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white flex items-center justify-between cursor-pointer select-none transition-all"
        style={{
          border: '3px solid #000000',
          padding: '12px 16px',
          boxShadow: isOpen ? '4px 4px 0px #000000' : 'none',
          backgroundColor: '#ffffff',
        }}
      >
        <div className="flex items-center gap-3">
          <CalendarIcon size={18} className="text-black shrink-0" />
          <span
            className="text-[0.95rem] font-bold"
            style={{ color: displayFormatted ? '#000000' : '#999999' }}
          >
            {displayFormatted || 'Select Date of Birth'}
          </span>
        </div>
        {value ? (
          <button
            type="button"
            onClick={handleClear}
            className="text-black hover:bg-black hover:text-white p-1 transition-colors border border-black"
            title="Clear date"
          >
            <X size={14} />
          </button>
        ) : (
          <span className="text-xs font-black uppercase text-gray-500">▼</span>
        )}
      </div>

      {/* Custom Neo-Brutalist Calendar Popup */}
      {isOpen && (
        <div
          className="absolute left-0 top-full mt-2 z-50 bg-white p-4 w-full sm:w-[340px]"
          style={{
            border: '3px solid #000000',
            boxShadow: '6px 6px 0px #000000',
          }}
        >
          {/* Header Controls: Month & Year Selectors */}
          <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b-2 border-black">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 bg-[#FFE600] border-2 border-black hover:translate-x-[-1px] hover:translate-y-[-1px] transition-transform cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft size={16} className="text-black font-bold" />
            </button>

            <div className="flex items-center gap-2 flex-1 justify-center">
              {/* Month Dropdown */}
              <select
                value={currentMonth}
                onChange={(e) => setCurrentMonth(parseInt(e.target.value, 10))}
                className="bg-white border-2 border-black px-2 py-1 text-xs font-black uppercase cursor-pointer outline-none"
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx}>
                    {m}
                  </option>
                ))}
              </select>

              {/* Year Dropdown (1990 - 2026) */}
              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(parseInt(e.target.value, 10))}
                className="bg-[#00F0FF] border-2 border-black px-2 py-1 text-xs font-black cursor-pointer outline-none"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 bg-[#FFE600] border-2 border-black hover:translate-x-[1px] hover:translate-y-[-1px] transition-transform cursor-pointer"
              title="Next Month"
            >
              <ChevronRight size={16} className="text-black font-bold" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {DAY_NAMES.map((day) => (
              <div
                key={day}
                className="text-[11px] font-black uppercase text-gray-600 py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Empty slots for start of month */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="p-2" />
            ))}

            {/* Calendar Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const isSelected =
                selectedDay === dayNum &&
                selectedMonth === currentMonth &&
                selectedYear === currentYear;

              return (
                <button
                  type="button"
                  key={dayNum}
                  onClick={() => handleSelectDay(dayNum)}
                  className={`p-2 text-xs font-bold transition-all border ${
                    isSelected
                      ? 'bg-[#FFE600] text-black border-2 border-black shadow-[2px_2px_0px_#000] font-black scale-105'
                      : 'bg-white text-black border-transparent hover:border-black hover:bg-[#FF3B93] hover:text-white cursor-pointer'
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* Footer Actions: Clear & Today */}
          <div className="mt-4 pt-3 border-t-2 border-black flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className="text-xs font-black uppercase text-red-600 hover:underline cursor-pointer"
            >
              Clear
            </button>
            <div className="text-[10px] font-bold text-gray-500 uppercase">
              1990 - 2026
            </div>
            <button
              type="button"
              onClick={handleToday}
              className="text-xs font-black uppercase bg-[#00FF66] border-2 border-black px-2.5 py-1 hover:translate-x-0.5 hover:translate-y-0.5 transition-transform cursor-pointer shadow-[1.5px_1.5px_0px_#000]"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
