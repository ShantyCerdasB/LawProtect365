/**
 * Minimal type declarations for @tanstack/react-query used in tests.
 * This avoids needing the real library installed in this workspace while
 * still allowing TypeScript to type-check imports.
 */

declare module '@tanstack/react-query' {
  export interface QueryClientConfig {
    defaultOptions?: Record<string, unknown>;
  }

  export class QueryClient {
    constructor(config?: QueryClientConfig);
    invalidateQueries(options: unknown): void;
  }

  export interface UseQueryResult<TData = unknown, TError = unknown> {
    data?: TData;
    error?: TError;
    isLoading: boolean;
    isFetching: boolean;
    [key: string]: unknown;
  }

  export interface UseMutationResult<TData = unknown, TError = unknown, TVariables = unknown> {
    mutate: (variables: TVariables) => void;
    mutateAsync: (variables: TVariables) => Promise<TData>;
    isPending: boolean;
    error?: TError;
    [key: string]: unknown;
  }

  // The hook signatures are intentionally loose – tests only need them to exist.
  export function useQuery<TData = unknown, TError = unknown>(
    options: unknown
  ): UseQueryResult<TData, TError>;

  export function useMutation<TData = unknown, TError = unknown, TVariables = unknown>(
    options: unknown
  ): UseMutationResult<TData, TError, TVariables>;

  export function useQueryClient(): QueryClient;
}



