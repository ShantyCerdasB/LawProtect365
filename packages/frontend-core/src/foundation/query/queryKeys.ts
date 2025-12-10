/**
 * @description Centralized React Query keys to avoid string literals across the app.
 */
export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const
  }
};

