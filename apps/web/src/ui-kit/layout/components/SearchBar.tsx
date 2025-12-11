import { useState, type ReactElement } from 'react';
import { useTranslation } from '@lawprotect/frontend-core';
import type { SearchBarProps } from '../interfaces/SearchBarInterfaces';

export function SearchBar({
  onSearch,
  placeholder,
  className = '',
}: SearchBarProps): ReactElement {
  const { t } = useTranslation('layout');
  const defaultPlaceholder = placeholder || t('header.searchPlaceholder');
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(query);
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={defaultPlaceholder}
        className="w-full px-4 py-2 pr-10 rounded-lg bg-white text-gray placeholder-gray/60 focus:outline-none focus:ring-2 focus:ring-emerald"
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray hover:text-emerald transition-colors cursor-pointer"
        aria-label="Search"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </button>
    </form>
  );
}

