/**
 * @fileoverview Invite Signer Modal - Modal for inviting signers to an envelope
 * @summary Modal component for adding signers to existing envelopes
 * @description
 * This modal allows users to invite additional signers to an envelope,
 * with validation and support for both internal and external signers.
 */

import { type ReactElement, useState } from 'react';
import { Modal } from '../../../ui-kit/modals/Modal';
import { TextField } from '../../../ui-kit/forms/TextField';
import { Button } from '../../../ui-kit/buttons/Button';
import type { InviteSignerModalProps, InviteSignerData } from '../interfaces/SignatureComponentsInterfaces';

// Re-export for backward compatibility
export type { InviteSignerData };

/**
 * @description Modal component for inviting signers.
 * @param props Component props
 * @returns JSX element with invite signer modal
 */
export function InviteSignerModal({
  isOpen,
  onClose,
  onInvite,
  isLoading = false,
  checkEmailExists,
}: InviteSignerModalProps): ReactElement {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [order, setOrder] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  /**
   * @description Handles form submission.
   */
  const handleSubmit = async () => {
    setError(null);

    if (!email || !fullName) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
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

      onInvite({
        email: email.toLowerCase(),
        fullName,
        isExternal,
        order,
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

  /**
   * @description Handles modal close.
   */
  const handleClose = () => {
    setEmail('');
    setFullName('');
    setOrder(undefined);
    setError(null);
    setIsChecking(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite Signer">
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        <TextField
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="signer@example.com"
          required
          disabled={isLoading || isChecking}
        />

        <TextField
          label="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="John Doe"
          required
          disabled={isLoading || isChecking}
        />

        <TextField
          label="Signing Order (Optional)"
          type="number"
          value={order?.toString() || ''}
          onChange={(e) => setOrder(e.target.value ? parseInt(e.target.value, 10) : undefined)}
          placeholder="1, 2, 3..."
          helpText="Leave empty for parallel signing. The system will automatically detect if the email belongs to a registered user."
          disabled={isLoading || isChecking}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button
            onClick={handleClose}
            disabled={isLoading || isChecking}
            className="bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || isChecking || !email || !fullName}
            className="bg-sky-600 text-white hover:bg-sky-500"
          >
            {isLoading || isChecking ? (isChecking ? 'Checking...' : 'Inviting...') : 'Invite Signer'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

