/**
 * @fileoverview Envelope Details Page - Page for viewing and managing envelope details
 * @summary Page component for envelope details with signers and actions
 * @description
 * This page displays complete envelope information including signers, status,
 * and available actions based on the envelope state.
 */

import { type ReactElement, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useSignatureHttpClient,
  useEnvelope,
  useSendEnvelope,
  useCancelEnvelope,
  useDownloadDocument,
  useAuditTrail,
  useUpdateEnvelope,
  EnvelopeStatus,
} from '@lawprotect/frontend-core';
import { LocalStorageAdapter } from '../../../app/adapters/LocalStorageAdapter';
import { Button } from '../../../ui-kit/buttons/Button';
import { PageLayout } from '../../../ui-kit/layout/PageLayout';
import { Alert } from '../../../ui-kit/feedback/Alert';
import { Modal } from '../../../ui-kit/modals/Modal';
import { Tabs } from '../../../ui-kit/navigation/Tabs';
import { EnvelopeStatusBadge } from '../components/EnvelopeStatusBadge';
import { SignersList } from '../components/SignersList';
import { InviteSignerModal } from '../components/InviteSignerModal';
import { useCheckUserEmail } from '../../documents/hooks/useCheckUserEmail';

/**
 * @description Page component for envelope details.
 * @returns JSX element with envelope details
 */
export function EnvelopeDetailsPage(): ReactElement {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const storage = new LocalStorageAdapter();
  const httpClient = useSignatureHttpClient({
    fetchImpl: fetch,
    storage,
    tokenKey: 'auth_token',
  });

  enum TabKey {
    DETAILS = 'details',
    SIGNERS = 'signers',
    AUDIT = 'audit',
  }

  const [activeTab, setActiveTab] = useState<TabKey>(TabKey.DETAILS);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [sendMessage, setSendMessage] = useState('');

  const queryResult = useEnvelope(
    { httpClient },
    {
      envelopeId: id || '',
      includeSigners: true,
    }
  );

  const { data, isLoading, error } = queryResult;
  const refetch = queryResult.refetch as () => Promise<any>;

  const { mutateAsync: sendEnvelope, isPending: isSending } = useSendEnvelope({ httpClient });
  const { mutateAsync: cancelEnvelope, isPending: isCancelling } = useCancelEnvelope({ httpClient });
  const { mutateAsync: downloadDocument, isPending: isDownloading } = useDownloadDocument({ httpClient });
  const { data: auditTrail, isLoading: isLoadingAudit } = useAuditTrail({ httpClient }, id || '');

  if (isLoading) {
    return (
      <PageLayout
        title={
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Envelope Details</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>
          </div>
        }
      >
        <div className="flex items-center justify-center p-12">
          <div className="text-slate-500 dark:text-slate-400">Loading envelope...</div>
        </div>
      </PageLayout>
    );
  }

  if (error || !data) {
    return (
      <PageLayout
        title={
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Envelope Details</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Error loading envelope</p>
          </div>
        }
      >
        <Alert tone="error" message={error instanceof Error ? error.message : 'Failed to load envelope'} />
      </PageLayout>
    );
  }

  const envelope = data as any;
  const signers = envelope.signers || [];
  const status = envelope.status;

  const [showInviteModal, setShowInviteModal] = useState(false);
  const { mutateAsync: updateEnvelope, isPending: isUpdating } = useUpdateEnvelope({ httpClient });
  const { checkEmail } = useCheckUserEmail();

  /**
   * @description Handles sending envelope.
   */
  const handleSend = async () => {
    try {
      await sendEnvelope({
        envelopeId: id || '',
        sendToAll: true,
        message: sendMessage || undefined,
      });
      setShowSendModal(false);
      setSendMessage('');
      await refetch();
    } catch (error) {
      console.error('Failed to send envelope:', error);
    }
  };

  /**
   * @description Handles cancelling envelope.
   */
  const handleCancel = async () => {
    try {
      await cancelEnvelope(id || '');
      setShowCancelModal(false);
      await refetch();
    } catch (error) {
      console.error('Failed to cancel envelope:', error);
    }
  };

  /**
   * @description Handles downloading document.
   */
  const handleDownload = async () => {
    try {
      const data = await downloadDocument({
        envelopeId: id || '',
      });
      if (data && (data as any).downloadUrl) {
        window.open((data as any).downloadUrl, '_blank');
      }
    } catch (error) {
      console.error('Failed to download document:', error);
    }
  };

  /**
   * @description Handles inviting a new signer.
   */
  const handleInviteSigner = async (signerData: any) => {
    try {
      await updateEnvelope({
        envelopeId: id || '',
        addSigners: [
          {
            email: signerData.email,
            fullName: signerData.fullName,
            isExternal: signerData.isExternal,
            order: signerData.order,
            userId: signerData.userId,
          },
        ],
      });
      setShowInviteModal(false);
      await refetch();
    } catch (error) {
      console.error('Failed to invite signer:', error);
    }
  };

  return (
    <PageLayout
      title={
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/signature/envelopes')}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">{envelope.title}</h1>
            <EnvelopeStatusBadge status={status} />
          </div>
          {envelope.description && (
            <p className="text-sm text-slate-500 dark:text-slate-400">{envelope.description}</p>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {status === EnvelopeStatus.DRAFT && (
            <Button
              onClick={() => setShowSendModal(true)}
              className="bg-sky-600 text-white hover:bg-sky-500"
            >
              Send Envelope
            </Button>
          )}
          {(status === EnvelopeStatus.DRAFT || status === EnvelopeStatus.SENT) && (
            <Button
              onClick={() => setShowCancelModal(true)}
              className="bg-red-600 text-white hover:bg-red-500"
            >
              Cancel Envelope
            </Button>
          )}
          {status === EnvelopeStatus.COMPLETED && (
            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              className="bg-green-600 text-white hover:bg-green-500"
            >
              {isDownloading ? 'Downloading...' : 'Download Document'}
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs
          tabs={[
            { key: TabKey.DETAILS, label: 'Details' },
            { key: TabKey.SIGNERS, label: `Signers (${signers.length})` },
            { key: TabKey.AUDIT, label: 'Audit Trail' },
          ]}
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as TabKey)}
        />

        {/* Tab Content */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          {activeTab === TabKey.DETAILS && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Envelope ID</h3>
                <p className="mt-1 font-mono text-sm text-slate-900 dark:text-slate-50">{envelope.id}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Created</h3>
                <p className="mt-1 text-sm text-slate-900 dark:text-slate-50">
                  {new Date(envelope.createdAt).toLocaleString()}
                </p>
              </div>
              {envelope.expiresAt && (
                <div>
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Expires</h3>
                  <p className="mt-1 text-sm text-slate-900 dark:text-slate-50">
                    {new Date(envelope.expiresAt).toLocaleString()}
                  </p>
                </div>
              )}
              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Signing Order</h3>
                <p className="mt-1 text-sm text-slate-900 dark:text-slate-50">{envelope.signingOrderType}</p>
              </div>
            </div>
          )}

          {activeTab === TabKey.SIGNERS && (
            <div className="space-y-4">
              {status === EnvelopeStatus.DRAFT && (
                <div className="flex justify-end">
                  <Button
                    onClick={() => setShowInviteModal(true)}
                    className="bg-sky-600 text-white hover:bg-sky-500"
                  >
                    Invite Signer
                  </Button>
                </div>
              )}
              <SignersList
                signers={signers}
                showActions={status === EnvelopeStatus.SENT}
                onAction={(signerId, action) => {
                  if (action === 'resend') {
                    // TODO: Implement resend invitation
                    console.log('Resend invitation for', signerId);
                  }
                }}
                emptyMessage="No signers added yet"
              />
            </div>
          )}

          {activeTab === TabKey.AUDIT && (
            <div className="space-y-4">
              {isLoadingAudit ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Loading audit trail...</p>
              ) : (
                <>
                  {auditTrail && (auditTrail as any).events ? (
                    <div className="space-y-3">
                      {(auditTrail as any).events.map((event: any, index: number) => (
                        <div key={event.id || index} className="border-l-2 border-slate-200 pl-4 dark:border-slate-700">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                            {event.description}
                          </p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {new Date(event.createdAt).toLocaleString()}
                          </p>
                          {event.userEmail && (
                            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                              By: {event.userEmail}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No audit events found</p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Send Modal */}
      <Modal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        title="Send Envelope"
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-1 text-sm">
            <label className="font-medium">Message (Optional)</label>
            <textarea
              value={sendMessage}
              onChange={(e) => setSendMessage(e.target.value)}
              placeholder="Add a message for the signers..."
              rows={4}
              className="border rounded px-3 py-2"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => setShowSendModal(false)}
              className="bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={isSending}
              className="bg-sky-600 text-white hover:bg-sky-500"
            >
              {isSending ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancel Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Envelope"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Are you sure you want to cancel this envelope? This action cannot be undone and all invitation tokens will be revoked.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => setShowCancelModal(false)}
              className="bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              No, Keep It
            </Button>
            <Button
              onClick={handleCancel}
              disabled={isCancelling}
              className="bg-red-600 text-white hover:bg-red-500"
            >
              {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Invite Signer Modal */}
      <InviteSignerModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInvite={handleInviteSigner}
        isLoading={isUpdating}
        checkEmailExists={async (email) => {
          const result = await checkEmail(email);
          return result;
        }}
      />
    </PageLayout>
  );
}

