/**
 * @fileoverview Auth Store Tests - Test suite for useAuthStore Zustand store
 * @summary Tests authentication state management and actions
 * @description
 * Tests the useAuthStore including initial state, authentication actions,
 * state updates, and async operations.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '@/app/store/useAuthStore';

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      isAuthenticated: false,
    });
  });

  describe('initial state', () => {
    it('should have isAuthenticated as false by default', () => {
      const { result } = renderHook(() => useAuthStore());
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should provide setAuthenticated function', () => {
      const { result } = renderHook(() => useAuthStore());
      expect(typeof result.current.setAuthenticated).toBe('function');
    });

    it('should provide login function', () => {
      const { result } = renderHook(() => useAuthStore());
      expect(typeof result.current.login).toBe('function');
    });

    it('should provide logout function', () => {
      const { result } = renderHook(() => useAuthStore());
      expect(typeof result.current.logout).toBe('function');
    });
  });

  describe('setAuthenticated', () => {
    it('should update isAuthenticated to true', () => {
      const { result } = renderHook(() => useAuthStore());
      act(() => {
        result.current.setAuthenticated(true);
      });
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should update isAuthenticated to false', () => {
      const { result } = renderHook(() => useAuthStore());
      act(() => {
        result.current.setAuthenticated(true);
      });
      act(() => {
        result.current.setAuthenticated(false);
      });
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should allow multiple state updates', () => {
      const { result } = renderHook(() => useAuthStore());
      act(() => {
        result.current.setAuthenticated(true);
      });
      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.setAuthenticated(false);
      });
      expect(result.current.isAuthenticated).toBe(false);

      act(() => {
        result.current.setAuthenticated(true);
      });
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('login', () => {
    it('should set isAuthenticated to true', async () => {
      const { result } = renderHook(() => useAuthStore());
      await act(async () => {
        await result.current.login();
      });
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should be callable multiple times', async () => {
      const { result } = renderHook(() => useAuthStore());
      await act(async () => {
        await result.current.login();
      });
      expect(result.current.isAuthenticated).toBe(true);

      await act(async () => {
        await result.current.login();
      });
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('logout', () => {
    it('should set isAuthenticated to false', async () => {
      const { result } = renderHook(() => useAuthStore());
      act(() => {
        result.current.setAuthenticated(true);
      });
      await act(async () => {
        await result.current.logout();
      });
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should set isAuthenticated to false from initial state', async () => {
      const { result } = renderHook(() => useAuthStore());
      await act(async () => {
        await result.current.logout();
      });
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('state persistence', () => {
    it('should maintain state across multiple hook calls', () => {
      const { result: result1 } = renderHook(() => useAuthStore());
      act(() => {
        result1.current.setAuthenticated(true);
      });

      const { result: result2 } = renderHook(() => useAuthStore());
      expect(result2.current.isAuthenticated).toBe(true);
    });

    it('should allow independent state access from multiple components', () => {
      const { result: result1 } = renderHook(() => useAuthStore());
      const { result: result2 } = renderHook(() => useAuthStore());

      act(() => {
        result1.current.setAuthenticated(true);
      });

      expect(result1.current.isAuthenticated).toBe(true);
      expect(result2.current.isAuthenticated).toBe(true);
    });
  });
});
