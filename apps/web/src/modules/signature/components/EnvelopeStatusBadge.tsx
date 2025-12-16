/**
 * @fileoverview Envelope Status Badge - Badge component for envelope status
 * @summary Visual badge component for displaying envelope status
 * @description
 * This component displays a colored badge indicating the current status of an envelope.
 * It's reusable across different pages and contexts.
 */

import { type ReactElement } from 'react';
import { EnvelopeStatus } from '@lawprotect/frontend-core';
import type { EnvelopeStatusBadgeProps } from '../interfaces/SignatureComponentsInterfaces';

// Re-export for backward compatibility
export type { EnvelopeStatusBadgeProps } from '../interfaces/SignatureComponentsInterfaces';

/**
 * @description Gets status badge color classes.
 * @param status Envelope status enum or string
 * @returns CSS classes for status badge
 */
const getStatusColor = (status: EnvelopeStatus | string) => {
  switch (status) {
    case EnvelopeStatus.DRAFT:
      return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
    case EnvelopeStatus.SENT:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case EnvelopeStatus.COMPLETED:
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case EnvelopeStatus.CANCELLED:
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    case EnvelopeStatus.DECLINED:
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
    default:
      return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
  }
};

/**
 * @description Badge component for displaying envelope status.
 * @param props Component props
 * @returns JSX element with status badge
 */
export function EnvelopeStatusBadge({ status, className = '' }: EnvelopeStatusBadgeProps): ReactElement {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
        status
      )} ${className}`}
    >
      {status}
    </span>
  );
}

