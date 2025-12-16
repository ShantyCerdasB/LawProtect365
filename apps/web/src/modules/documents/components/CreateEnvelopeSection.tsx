/**
 * @fileoverview Create Envelope Section - Component for creating envelope from document
 * @summary Section component for envelope creation after document editing
 * @description
 * This component allows users to create an envelope directly from the edited document,
 * with all signers and configuration in one place.
 */

import { type ReactElement, useState } from 'react';
import { SigningOrderType } from '@lawprotect/frontend-core';
import { Button } from '../../../ui-kit/buttons/Button';
import { TextField } from '../../../ui-kit/forms/TextField';
import { Select } from '../../../ui-kit/forms/Select';
import { Alert } from '../../../ui-kit/feedback/Alert';
import type { CreateEnvelopeSectionProps } from '../interfaces/DocumentsComponentsInterfaces';

/**
 * @description Gets human-readable label for signing order type.
 * @param signingOrderType Signing order type enum value
 * @returns Human-readable label string
 */
const getSigningOrderLabel = (signingOrderType: SigningOrderType): string => {
  switch (signingOrderType) {
    case SigningOrderType.OWNER_FIRST:
      return 'Owner Signs First';
    case SigningOrderType.INVITEES_FIRST:
      return 'Invitees Sign First';
    default:
      return signingOrderType;
  }
};

/**
 * @description Component for creating envelope from edited document.
 * @param props Component props
 * @returns JSX element with envelope creation form
 */
export function CreateEnvelopeSection({
  signers,
  pdfFile,
  pdfSource,
  onCreateEnvelope,
  isLoading = false,
}: CreateEnvelopeSectionProps): ReactElement {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [signingOrderType, setSigningOrderType] = useState<SigningOrderType>(SigningOrderType.OWNER_FIRST);
  const [expiresAt, setExpiresAt] = useState('');
  const [error, setError] = useState<string | null>(null);

  /**
   * @description Handles envelope creation.
   */
  const handleCreate = async () => {
    setError(null);

    if (!title) {
      setError('Please provide a title for the envelope');
      return;
    }

    if (!pdfFile || !pdfSource) {
      setError('Please upload and edit a PDF document first');
      return;
    }

    if (signers.length === 0) {
      setError('Please add at least one signer');
      return;
    }

    try {
      await onCreateEnvelope({
        title,
        description: description || undefined,
        signingOrderType,
        expiresAt: expiresAt || undefined,
        signers,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create envelope');
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <div>
        <h3 className="text-sm font-medium text-slate-900 dark:text-slate-50">Create Envelope</h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Configure and create the envelope to send to signers
        </p>
      </div>

      {error && <Alert tone="error" message={error} />}

      <div className="space-y-3">
        <TextField
          label="Envelope Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Contract Agreement"
          required
          disabled={isLoading}
        />

        <TextField
          label="Description (Optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a description..."
          disabled={isLoading}
        />

        <Select
          label="Signing Order"
          value={signingOrderType}
          onChange={(e) => setSigningOrderType(e.target.value as SigningOrderType)}
          options={[
            { value: SigningOrderType.OWNER_FIRST, label: 'Owner Signs First' },
            { value: SigningOrderType.INVITEES_FIRST, label: 'Invitees Sign First' },
          ]}
          disabled={isLoading}
        />

        <TextField
          label="Expiration Date (Optional)"
          type="datetime-local"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          disabled={isLoading}
        />

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Ready to create envelope with:
          </p>
          <ul className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-400">
            <li>✓ Document: {pdfFile?.name || 'Ready'}</li>
            <li>✓ Signers: {signers.length}</li>
            <li>✓ Configuration: {getSigningOrderLabel(signingOrderType)}</li>
          </ul>
        </div>

        <Button
          onClick={handleCreate}
          disabled={isLoading || !title || signers.length === 0}
          className="w-full bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-50"
        >
          {isLoading ? 'Creating Envelope...' : 'Create Envelope & Send'}
        </Button>
      </div>
    </div>
  );
}

