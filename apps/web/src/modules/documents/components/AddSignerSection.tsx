/**
 * @fileoverview Add Signer Section - Component for adding signers to document
 * @summary Section component for managing signers during document editing
 * @description
 * This component allows users to add signers while editing a document.
 * It automatically detects if a signer is internal or external based on email lookup.
 */

import { type ReactElement, useState } from 'react';
import { Button } from '../../../ui-kit/buttons/Button';
import { TextField } from '../../../ui-kit/forms/TextField';
import type { AddSignerSectionProps, DocumentSigner } from '../interfaces/DocumentsComponentsInterfaces';
export type { DocumentSigner };

/**
 * @description Component for adding and managing signers during document editing.
 * @param props Component props
 * @returns JSX element with signer management interface
 */
export function AddSignerSection({
  signers,
  onAddSigner,
  onRemoveSigner,
  checkEmailExists,
}: AddSignerSectionProps): ReactElement {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [order, setOrder] = useState<number | undefined>(undefined);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * @description Handles adding a new signer.
   */
  const handleAddSigner = async () => {
    setError(null);

    if (!email || !fullName) {
      setError('Please fill in email and full name');
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Check if email already added
    if (signers.some((s) => s.email.toLowerCase() === email.toLowerCase())) {
      setError('This email is already added as a signer');
      return;
    }

    setIsChecking(true);

    try {
      // Check if user exists (internal) - if checkEmailExists is provided
      let isExternal = true;
      let userId: string | undefined;

      if (checkEmailExists) {
        try {
          const result = await checkEmailExists(email);
          if (result.exists) {
            isExternal = false;
            userId = result.userId;
          }
        } catch {
          // If check fails, assume external (safe default)
          isExternal = true;
        }
      }

      onAddSigner({
        email: email.toLowerCase(),
        fullName,
        isExternal,
        order: order || signers.length + 1,
        userId,
      });

      // Reset form
      setEmail('');
      setFullName('');
      setOrder(undefined);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add signer');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <div>
        <h3 className="text-sm font-medium text-slate-900 dark:text-slate-50">Add Signers</h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Add people who need to sign this document. The system will automatically detect if they are registered users.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <TextField
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="signer@example.com"
          required
          disabled={isChecking}
        />
        <TextField
          label="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="John Doe"
          required
          disabled={isChecking}
        />
        <TextField
          label="Signing Order (Optional)"
          type="number"
          value={order?.toString() || ''}
          onChange={(e) => setOrder(e.target.value ? parseInt(e.target.value, 10) : undefined)}
          placeholder="1, 2, 3..."
          helpText="Leave empty for parallel signing"
          disabled={isChecking}
        />
      </div>

      <Button
        onClick={handleAddSigner}
        disabled={isChecking || !email || !fullName}
        className="bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-50"
      >
        {isChecking ? 'Checking...' : 'Add Signer'}
      </Button>

      {signers.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Signers ({signers.length})
          </h4>
          {signers.map((signer, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-900 dark:text-slate-50">{signer.fullName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{signer.email}</p>
                {!signer.isExternal && (
                  <span className="mt-1 inline-block text-xs text-green-600 dark:text-green-400">
                    Registered user
                  </span>
                )}
              </div>
              <Button
                onClick={() => onRemoveSigner(index)}
                className="px-2 py-1 text-xs text-red-600 hover:text-red-700"
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

