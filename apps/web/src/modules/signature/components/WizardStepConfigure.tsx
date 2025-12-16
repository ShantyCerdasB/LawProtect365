/**
 * @fileoverview Wizard Step Configure - Third step of envelope creation wizard
 * @summary Component for configuring envelope settings
 * @description
 * This component handles the third step of the envelope creation wizard,
 * allowing users to configure envelope title, description, expiration, and signing order.
 */

import { type ReactElement } from 'react';
import { SigningOrderType } from '@lawprotect/frontend-core';
import { TextField } from '../../../ui-kit/forms/TextField';
import { Select } from '../../../ui-kit/forms/Select';
import type { WizardStepConfigureProps } from '../interfaces/WizardComponentsInterfaces';

/**
 * @description Configure step component for the envelope creation wizard.
 * @param props Component props
 * @returns JSX element with configuration interface
 */
export function WizardStepConfigure({ config, onUpdateConfig, signingOrderType }: WizardStepConfigureProps): ReactElement {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Configure Envelope</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Set the details and preferences for this envelope
        </p>
      </div>

      <div className="space-y-4">
        <TextField
          label="Envelope Title"
          value={config.title}
          onChange={(e) => onUpdateConfig({ title: e.target.value })}
          placeholder="e.g., Contract Agreement"
          required
          helpText="A descriptive title for this envelope"
        />

        <TextField
          label="Description (Optional)"
          value={config.description || ''}
          onChange={(e) => onUpdateConfig({ description: e.target.value })}
          placeholder="Add a description..."
          helpText="Additional details about this envelope"
        />

        <Select
          label="Signing Order"
          value={signingOrderType}
          onChange={(e) => onUpdateConfig({ signingOrderType: e.target.value as SigningOrderType })}
          options={[
            { value: SigningOrderType.OWNER_FIRST, label: 'Owner Signs First' },
            { value: SigningOrderType.INVITEES_FIRST, label: 'Invitees Sign First' },
          ]}
        />
        <p className="text-xs text-slate-500 dark:text-slate-400">Choose the order in which signers will sign</p>

        <TextField
          label="Expiration Date (Optional)"
          type="datetime-local"
          value={config.expiresAt ? new Date(config.expiresAt).toISOString().slice(0, 16) : ''}
          onChange={(e) => {
            const date = e.target.value ? new Date(e.target.value).toISOString() : undefined;
            onUpdateConfig({ expiresAt: date });
          }}
          helpText="When should this envelope expire? Leave empty for no expiration"
        />
      </div>
    </div>
  );
}

