/**
 * @fileoverview Text Input Modal - Modal for entering text to place on PDF
 * @summary Component for capturing text input for PDF placement
 * @description
 * Modal component that allows users to enter text that will be placed on the PDF
 * at specified coordinates. This is a web-specific component.
 */

import { useState, type ReactElement } from 'react';
import { Modal } from '../../../ui-kit/modals/Modal';
import { Button } from '../../../ui-kit/buttons/Button';
import { TextField } from '../../../ui-kit/forms/TextField';
import type { TextInputModalProps } from '../types';

/**
 * @description Modal component for entering text to place on PDF.
 * @param props Modal state, callbacks, and optional default text
 * @returns JSX element with text input interface
 */
export function TextInputModal({
  isOpen,
  onClose,
  onConfirm,
  onPreview,
  defaultText = '',
}: TextInputModalProps): ReactElement {
  const [text, setText] = useState(defaultText);
  const [fontSize, setFontSize] = useState(12);

  const handleTextChange = (newText: string) => {
    setText(newText);
    if (onPreview && newText.trim()) {
      onPreview(newText.trim(), fontSize);
    }
  };

  const handleFontSizeChange = (newFontSize: number) => {
    setFontSize(newFontSize);
    if (onPreview && text.trim()) {
      onPreview(text.trim(), newFontSize);
    }
  };

  const handleConfirm = () => {
    if (text.trim()) {
      onConfirm(text.trim(), fontSize);
      setText('');
      setFontSize(12);
      onClose();
    }
  };

  const handleCancel = () => {
    setText('');
    setFontSize(12);
    if (onPreview) {
      onPreview('', 12);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title="Enter Text">
      <div className="space-y-4">
        <TextField
          label="Text"
          placeholder="Enter text to place on PDF"
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          autoFocus
        />
        <TextField
          type="number"
          label="Font Size"
          placeholder="12"
          value={fontSize.toString()}
          onChange={(e) => handleFontSizeChange(Number.parseInt(e.target.value) || 12)}
          min={8}
          max={72}
        />
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!text.trim()}
            className="px-4 py-2 text-sm text-white bg-sky-600 hover:bg-sky-500 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-md"
          >
            Confirm
          </Button>
        </div>
      </div>
    </Modal>
  );
}

