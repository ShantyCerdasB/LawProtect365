/**
 * @fileoverview Wizard Step Signers - Second step of envelope creation wizard
 * @summary Component for adding signers to the envelope
 * @description
 * This component handles the second step of the envelope creation wizard,
 * allowing users to add, edit, and remove signers.
 */

import { type ReactElement, useState } from 'react';
import { Button } from '../../../ui-kit/buttons/Button';
import { TextField } from '../../../ui-kit/forms/TextField';
import type { WizardSigner } from '../types/CreateEnvelopeWizard';
import type { WizardStepSignersProps } from '../interfaces/WizardComponentsInterfaces';

/**
 * @description Signers step component for the envelope creation wizard.
 * @param props Component props
 * @returns JSX element with signers management interface
 */
export function WizardStepSigners({ signers, onAddSigner, onRemoveSigner, onUpdateSigner }: WizardStepSignersProps): ReactElement {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [order, setOrder] = useState<number | undefined>(undefined);

  /**
   * @description Handles adding a new signer.
   */
  const handleAddSigner = () => {
    if (!email || !fullName) {
      alert('Please fill in email and full name');
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address');
      return;
    }

    onAddSigner({
      email: email.toLowerCase(),
      fullName,
      isExternal: true, // Will be detected automatically by checkEmailExists
      order: order || signers.length + 1,
      fields: [], // Empty fields array, will be assigned later
    });

    // Reset form
    setEmail('');
    setFullName('');
    setOrder(undefined);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Add Signers</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Add the people who need to sign this document. You can add multiple signers.
        </p>
      </div>

      {/* Add Signer Form */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="mb-4 text-sm font-medium text-slate-900 dark:text-slate-50">Add New Signer</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextField
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="signer@example.com"
            required
          />
          <TextField
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Doe"
            required
          />
          <TextField
            label="Signing Order (Optional)"
            type="number"
            value={order?.toString() || ''}
            onChange={(e) => setOrder(e.target.value ? parseInt(e.target.value, 10) : undefined)}
            placeholder="1, 2, 3..."
            helpText="Leave empty for parallel signing"
          />
        </div>
        <Button
          onClick={handleAddSigner}
          className="mt-4 bg-sky-600 text-white hover:bg-sky-500"
        >
          Add Signer
        </Button>
      </div>

      {/* Signers List */}
      <div>
        <h3 className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-50">
          Signers ({signers.length})
        </h3>
        {signers.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">No signers added yet. Add your first signer above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {signers.map((signer, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-slate-50">{signer.fullName}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{signer.email}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        signer.isExternal
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      }`}
                    >
                      {signer.isExternal ? 'External' : 'Internal'}
                    </span>
                    {signer.order && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">Order: {signer.order}</span>
                    )}
                  </div>
                </div>
                <Button
                  onClick={() => onRemoveSigner(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

