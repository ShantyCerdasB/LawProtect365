/**
 * @fileoverview Search Bar Interfaces - Types for search bar component
 * @summary Type definitions for search bar props
 * @description Defines interfaces used by the SearchBar component.
 */

export interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
}

