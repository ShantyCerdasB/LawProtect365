/**
 * @fileoverview App Store Tests - Test suite for useAppStore Zustand store
 * @summary Tests app readiness state management
 * @description
 * Tests the useAppStore including initial state, ready flag updates,
 * and state management operations.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useAppStore } from '@/app/store/useAppStore';

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.setState({
      ready: false,
    });
  });

  describe('initial state', () => {
    it('should have ready as false by default', () => {
      const { result } = renderHook(() => useAppStore());
      expect(result.current.ready).toBe(false);
    });

    it('should provide setReady function', () => {
      const { result } = renderHook(() => useAppStore());
      expect(typeof result.current.setReady).toBe('function');
    });
  });

  describe('setReady', () => {
    it('should update ready to true', () => {
      const { result } = renderHook(() => useAppStore());
      act(() => {
        result.current.setReady(true);
      });
      expect(result.current.ready).toBe(true);
    });

    it('should update ready to false', () => {
      const { result } = renderHook(() => useAppStore());
      act(() => {
        result.current.setReady(true);
      });
      act(() => {
        result.current.setReady(false);
      });
      expect(result.current.ready).toBe(false);
    });

    it('should allow multiple state updates', () => {
      const { result } = renderHook(() => useAppStore());
      act(() => {
        result.current.setReady(true);
      });
      expect(result.current.ready).toBe(true);

      act(() => {
        result.current.setReady(false);
      });
      expect(result.current.ready).toBe(false);

      act(() => {
        result.current.setReady(true);
      });
      expect(result.current.ready).toBe(true);
    });
  });

  describe('state persistence', () => {
    it('should maintain state across multiple hook calls', () => {
      const { result: result1 } = renderHook(() => useAppStore());
      act(() => {
        result1.current.setReady(true);
      });

      const { result: result2 } = renderHook(() => useAppStore());
      expect(result2.current.ready).toBe(true);
    });

    it('should allow independent state access from multiple components', () => {
      const { result: result1 } = renderHook(() => useAppStore());
      const { result: result2 } = renderHook(() => useAppStore());

      act(() => {
        result1.current.setReady(true);
      });

      expect(result1.current.ready).toBe(true);
      expect(result2.current.ready).toBe(true);
    });
  });
});
