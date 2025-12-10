/**
 * @fileoverview Query Client Factory - Small helper for creating React Query clients
 * @summary Provides a thin abstraction over the concrete QueryClient constructor
 * @description
 * Instead of importing `@tanstack/react-query` directly, this helper receives
 * the QueryClient constructor from the app layer (web or mobile). This keeps
 * `frontend-core` decoupled from concrete UI dependencies and avoids bundling issues.
 */

/**
 * @description Minimal constructor shape for a React Query client.
 */
export interface QueryClientLike {
  // Use `any` to stay flexible across different React Query versions.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (config?: any): any;
}

/**
 * @description Creates a query client instance using the provided constructor.
 * @param QueryClientCtor Query client constructor (from @tanstack/react-query)
 * @param config Optional configuration object forwarded to the constructor
 * @returns Instantiated query client (typed from the constructor)
 */
export function createQueryClient<TCtor extends QueryClientLike>(
  QueryClientCtor: TCtor,
  config?: ConstructorParameters<TCtor>[0]
): InstanceType<TCtor> {
  return new QueryClientCtor(config) as InstanceType<TCtor>;
}

