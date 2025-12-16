/**
 * @fileoverview Wizard Step Upload - First step of envelope creation wizard
 * @summary Component for uploading PDF document or selecting template
 * @description
 * This component handles the first step of the envelope creation wizard,
 * allowing users to upload a PDF file or select a template.
 */

import { type ReactElement, useRef, useState } from 'react';
import { DocumentOriginType } from '@lawprotect/frontend-core';
import { Button } from '../../../ui-kit/buttons/Button';
import { TextField } from '../../../ui-kit/forms/TextField';
import { Select } from '../../../ui-kit/forms/Select';
import type { WizardStepUploadProps } from '../interfaces/WizardComponentsInterfaces';

/**
 * @description Upload step component for the envelope creation wizard.
 * @param props Component props
 * @returns JSX element with upload interface
 */
export function WizardStepUpload({ pdfFile, onUpload, isLoading, onOriginTypeChange }: WizardStepUploadProps): ReactElement {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [originType, setOriginType] = useState<DocumentOriginType>(DocumentOriginType.UPLOAD);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedTemplateVersion, setSelectedTemplateVersion] = useState('');

  /**
   * @description Handles file selection.
   */
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please select a PDF file');
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      await onUpload(file, arrayBuffer);
    } catch (error) {
      console.error('Error reading file:', error);
    }
  };

  /**
   * @description Handles origin type change.
   */
  const handleOriginTypeChange = (newType: DocumentOriginType) => {
    setOriginType(newType);
    onOriginTypeChange(newType, selectedTemplateId || undefined, selectedTemplateVersion || undefined);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Select Document Source</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Choose how you want to create this envelope</p>
      </div>

      <div className="space-y-4">
        <Select
          label="Document Source"
          value={originType}
          onChange={(e) => handleOriginTypeChange(e.target.value as DocumentOriginType)}
          options={[
            { value: DocumentOriginType.UPLOAD, label: 'Upload PDF Document' },
            { value: DocumentOriginType.TEMPLATE, label: 'Use Template' },
            { value: DocumentOriginType.GENERATED, label: 'Generate Document' },
          ]}
        />

        {originType === DocumentOriginType.UPLOAD && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Upload PDF</label>
              <div className="mt-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="bg-sky-600 text-white hover:bg-sky-500"
                  >
                    {isLoading ? 'Uploading...' : 'Choose PDF File'}
                  </Button>
                  {pdfFile && (
                    <div className="flex-1">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Selected: <span className="font-medium">{pdfFile.name}</span>
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500">
                        {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {originType === DocumentOriginType.TEMPLATE && (
          <div className="space-y-4">
            <TextField
              label="Template ID"
              value={selectedTemplateId}
              onChange={(e) => {
                setSelectedTemplateId(e.target.value);
                onOriginTypeChange(originType, e.target.value || undefined, selectedTemplateVersion || undefined);
              }}
              placeholder="Enter template ID"
            />
            <TextField
              label="Template Version"
              value={selectedTemplateVersion}
              onChange={(e) => {
                setSelectedTemplateVersion(e.target.value);
                onOriginTypeChange(originType, selectedTemplateId || undefined, e.target.value || undefined);
              }}
              placeholder="Enter template version"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select a template from your template library
            </p>
          </div>
        )}

        {originType === DocumentOriginType.GENERATED && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Document generation feature coming soon. For now, please upload a PDF or use a template.
            </p>
          </div>
        )}
      </div>

      {pdfFile && originType === DocumentOriginType.UPLOAD && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
          <p className="text-sm font-medium text-green-800 dark:text-green-200">✓ Document uploaded successfully</p>
        </div>
      )}
    </div>
  );
}

