/**
 * @fileoverview Auth Guards - Simple route guards for protected views
 * @summary Higher-order components used to protect routes that require auth
 * @description
 * These guards are kept in the app layer and delegate the actual auth checks
 * to hooks or services exposed by `frontend-core`.
 */

import type { ComponentType, ReactElement } from 'react';

/**
 * @description Wraps a component with a basic auth guard.
 * @param Component React component to guard
 * @returns Wrapped component that will later enforce authentication rules
 */
export function withAuthGuard(Component: ComponentType<any>) {
  return (props: any): ReactElement => {
    // TODO: add real auth check using useAuth from frontend-core
    return <Component {...props} />;
  };
}

