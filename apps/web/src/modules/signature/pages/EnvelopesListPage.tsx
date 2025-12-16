/**
 * @fileoverview Envelopes List Page - Page for listing user's signature envelopes
 * @summary Page component for displaying and managing user's envelopes
 * @description
 * This page displays a list of all user's signature envelopes with filtering,
 * pagination, and quick actions.
 */

import { type ReactElement, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignatureHttpClient, useEnvelopes, SignerStatus, EnvelopeStatus } from '@lawprotect/frontend-core';
import { LocalStorageAdapter } from '../../../app/adapters/LocalStorageAdapter';
import { Button } from '../../../ui-kit/buttons/Button';
import { PageLayout } from '../../../ui-kit/layout/PageLayout';
import { Select } from '../../../ui-kit/forms/Select';
import { Alert } from '../../../ui-kit/feedback/Alert';
import { EnvelopeStatusBadge } from '../components/EnvelopeStatusBadge';

/**
 * @description Page component for listing user's envelopes.
 * @returns JSX element with envelopes list
 */
export function EnvelopesListPage(): ReactElement {
  const navigate = useNavigate();
  const storage = new LocalStorageAdapter();
  const httpClient = useSignatureHttpClient({
    fetchImpl: fetch,
    storage,
    tokenKey: 'auth_token',
  });

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [limit] = useState(20);
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  const queryResult = useEnvelopes(
    { httpClient },
    {
      status: statusFilter || undefined,
      limit,
      cursor,
      includeSigners: true,
    }
  );

  const { data, isLoading, error } = queryResult;
  const refetch = queryResult.refetch as () => Promise<any>;


  /**
   * @description Gets progress percentage.
   * @param signers Array of signers
   * @returns Progress percentage (0-100)
   */
  const getProgress = (signers: any[]) => {
    if (!signers || signers.length === 0) return 0;
    const signed = signers.filter((s) => s.status === SignerStatus.SIGNED).length;
    return Math.round((signed / signers.length) * 100);
  };

  if (isLoading) {
    return (
      <PageLayout
        title={
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">My Envelopes</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading envelopes...</p>
          </div>
        }
      >
        <div className="flex items-center justify-center p-12">
          <div className="text-slate-500 dark:text-slate-400">Loading...</div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout
        title={
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">My Envelopes</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Error loading envelopes</p>
          </div>
        }
      >
        <Alert tone="error" message={error instanceof Error ? error.message : 'Failed to load envelopes'} />
      </PageLayout>
    );
  }

  const envelopes = (data as any)?.envelopes || [];
  const signers = (data as any)?.signers || [];
  const nextCursor = (data as any)?.nextCursor;

  return (
    <PageLayout
      title={
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">My Envelopes</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage your signature envelopes</p>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Filters and Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-4">
            <Select
              label="Filter by Status"
              value={statusFilter}
              onChange={async (e) => {
                setStatusFilter(e.target.value);
                setCursor(undefined);
                await refetch();
              }}
              options={[
                { value: '', label: 'All Statuses' },
                { value: EnvelopeStatus.DRAFT, label: 'Draft' },
                { value: EnvelopeStatus.SENT, label: 'Sent' },
                { value: EnvelopeStatus.COMPLETED, label: 'Completed' },
                { value: EnvelopeStatus.CANCELLED, label: 'Cancelled' },
                { value: EnvelopeStatus.DECLINED, label: 'Declined' },
              ]}
            />
          </div>
          <Button
            onClick={() => navigate('/signature/envelopes/create')}
            className="bg-sky-600 text-white hover:bg-sky-500"
          >
            Create New Envelope
          </Button>
        </div>

        {/* Envelopes List */}
        {envelopes.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
            <p className="text-slate-500 dark:text-slate-400">No envelopes found</p>
            <Button
              onClick={() => navigate('/signature/envelopes/create')}
              className="mt-4 bg-sky-600 text-white hover:bg-sky-500"
            >
              Create Your First Envelope
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {envelopes.map((envelope: any, index: number) => {
              const envelopeSigners = signers[index] || [];
              const progress = getProgress(envelopeSigners);

              return (
                <div
                  key={envelope.id}
                  className="rounded-lg border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                          {envelope.title}
                        </h3>
                        <EnvelopeStatusBadge status={envelope.status} />
                      </div>
                      {envelope.description && (
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{envelope.description}</p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                        <span>Created: {new Date(envelope.createdAt).toLocaleDateString()}</span>
                        {envelope.expiresAt && (
                          <span>Expires: {new Date(envelope.expiresAt).toLocaleDateString()}</span>
                        )}
                        <span>{envelopeSigners.length} signer{envelopeSigners.length !== 1 ? 's' : ''}</span>
                      </div>
                      {envelopeSigners.length > 0 && (
                        <div className="mt-3">
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="text-slate-600 dark:text-slate-400">Progress</span>
                            <span className="font-medium text-slate-900 dark:text-slate-50">{progress}%</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                            <div
                              className="h-full bg-sky-600 transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex gap-2">
                      <Button
                        onClick={() => navigate(`/signature/envelopes/${envelope.id}`)}
                        className="bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                      >
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {nextCursor && (
          <div className="flex justify-center">
            <Button
              onClick={async () => {
                setCursor(nextCursor);
                await refetch();
              }}
              className="bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              Load More
            </Button>
          </div>
        )}
      </div>
    </PageLayout>
  );
}

