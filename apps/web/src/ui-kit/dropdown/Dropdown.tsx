/**
 * @fileoverview Dropdown - Generic dropdown component
 * @summary Reusable dropdown with customizable styling
 * @description
 * Generic dropdown component that can be used throughout the application.
 * Supports custom styling via className props while maintaining default app colors.
 */

import { useState, useRef, useEffect, type ReactElement } from 'react';
import type { DropdownProps } from './interfaces/DropdownInterfaces';

export function Dropdown<T = string>({
  items,
  selectedValue,
  onSelect,
  trigger,
  className = '',
  dropdownClassName = '',
  itemClassName = '',
  selectedItemClassName = '',
}: DropdownProps<T>): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedItem = items.find((item) => item.value === selectedValue);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  const handleSelect = (value: T) => {
    onSelect(value);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger(isOpen)}</div>

      {isOpen && (
        <div
          className={`absolute top-full left-0 mt-1 w-full bg-blue rounded-lg shadow-lg border-2 border-emerald overflow-hidden z-50 ${dropdownClassName}`}
        >
          <div className="py-1">
            {items.map((item) => {
              const isSelected = item.value === selectedValue || item.selected;
              return (
                <button
                  key={String(item.value)}
                  type="button"
                  onClick={() => handleSelect(item.value)}
                  className={`w-full px-3 py-2.5 text-left text-sm flex items-center gap-3 transition-colors ${
                    isSelected
                      ? `bg-emerald/20 text-white font-medium border-l-4 border-emerald ${selectedItemClassName}`
                      : `text-white hover:bg-blue-dark ${itemClassName}`
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

