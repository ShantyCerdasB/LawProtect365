/**
 * @fileoverview React Query Types Shim - Minimal declarations for @tanstack/react-query
 * @summary Allows TypeScript to resolve React Query in the web app build
 * @description
 * These types are intentionally lightweight and mirror the internal test shims used
 * in the frontend-core package. They can be replaced by full typings if needed.
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

  export function useQuery<TData = unknown, TError = unknown>(
    options: unknown
  ): UseQueryResult<TData, TError>;

  export function useMutation<TData = unknown, TError = unknown, TVariables = unknown>(
    options: unknown
  ): UseMutationResult<TData, TError, TVariables>;

  export function useQueryClient(): QueryClient;

  export interface QueryClientProviderProps {
    client: QueryClient;
    children?: any;
  }

  export function QueryClientProvider(props: QueryClientProviderProps): any;
}


