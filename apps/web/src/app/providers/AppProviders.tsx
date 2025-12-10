/**
 * @fileoverview Application Providers - Global React context providers for the web app
 * @summary Wraps the React tree with shared infrastructure such as React Query
 * @description
 * This component composes all cross-cutting providers required by the web application,
 * including the React Query client created from the shared `frontend-core` package.
 */

import type { PropsWithChildren, ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@lawprotect/frontend-core';

const queryClient = createQueryClient(QueryClient);

/**
 * @description Root provider component for the web application.
 * @param props React children to render inside the provider tree
 * @returns JSX element wrapping children with shared providers
 */
export function AppProviders({ children }: PropsWithChildren): ReactElement {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

