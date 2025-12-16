/**
 * @fileoverview Signers List - Reusable component for displaying signers
 * @summary Component for showing list of signers with their status
 * @description
 * This component displays a list of signers with their status, email, and signing information.
 * It's reusable across different pages and contexts.
 */

import { type ReactElement } from 'react';
import { SignerStatus } from '@lawprotect/frontend-core';
import type { SignerData, SignersListProps } from '../interfaces/SignatureComponentsInterfaces';
export type { SignerData } from '../interfaces/SignatureComponentsInterfaces';

/**
 * @description Gets signer status badge color.
 * @param status Signer status enum or string
 * @returns CSS classes for status badge
 */
const getSignerStatusColor = (status: SignerStatus | string) => {
  switch (status) {
    case SignerStatus.PENDING:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    case SignerStatus.SIGNED:
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case SignerStatus.DECLINED:
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    default:
      return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
  }
};

/**
 * @description Reusable component for displaying signers list.
 * @param props Component props
 * @returns JSX element with signers list
 */
export function SignersList({
  signers,
  showActions = false,
  onAction,
  emptyMessage = 'No signers added yet',
}: SignersListProps): ReactElement {
  if (signers.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-800">
        <p className="text-sm text-slate-500 dark:text-slate-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {signers.map((signer, index) => (
        <div
          key={signer.id || index}
          className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 transition-shadow hover:shadow-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <p className="font-medium text-slate-900 dark:text-slate-50">
                {signer.fullName || 'Unknown Signer'}
              </p>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getSignerStatusColor(
                  signer.status
                )}`}
              >
                {signer.status}
              </span>
              {signer.isExternal && (
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  External
                </span>
              )}
            </div>
            {signer.email && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{signer.email}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              {signer.order && <span>Order: {signer.order}</span>}
              {signer.signedAt && (
                <span className="text-green-600 dark:text-green-400">
                  Signed: {new Date(signer.signedAt).toLocaleString()}
                </span>
              )}
              {signer.declinedAt && (
                <span className="text-red-600 dark:text-red-400">
                  Declined: {new Date(signer.declinedAt).toLocaleString()}
                </span>
              )}
            </div>
            {signer.declineReason && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">Reason: {signer.declineReason}</p>
            )}
          </div>
          {showActions && onAction && (
            <div className="ml-4 flex gap-2">
              {signer.status === SignerStatus.PENDING && (
                <button
                  onClick={() => onAction(signer.id, 'resend')}
                  className="text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400"
                >
                  Resend
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

