/**
 * @fileoverview App Store - Global UI state for the web shell
 * @summary Minimal Zustand store for app-level flags
 * @description
 * This store keeps lightweight UI state (e.g. readiness flags) that belongs
 * to the web shell rather than to a specific business module.
 */

import { create } from 'zustand';

type State = {
  /** Indicates whether the app shell finished its initial bootstrapping. */
  ready: boolean;
  /**
   * @description Updates the `ready` flag.
   * @param ready New ready value
   * @returns void
   */
  setReady: (ready: boolean) => void;
};

/**
 * @description Hook to access the global app store implemented with Zustand.
 * @returns Zustand store slice with `ready` flag and `setReady` action
 */
export const useAppStore = create<State>((set) => ({
  ready: false,
  setReady: (ready: boolean) => set({ ready })
}));

