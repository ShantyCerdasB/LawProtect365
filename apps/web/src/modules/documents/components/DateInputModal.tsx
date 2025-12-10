/**
 * @fileoverview Date Input Modal - Modal for entering date to place on PDF
 * @summary Component for capturing date input for PDF placement
 * @description
 * Modal component that allows users to enter a date that will be placed on the PDF
 * at specified coordinates. This is a web-specific component.
 */

import { useState, type ReactElement } from 'react';
import { Modal } from '../../../ui-kit/modals/Modal';
import { Button } from '../../../ui-kit/buttons/Button';
import { TextField } from '../../../ui-kit/forms/TextField';
import type { DateInputModalProps } from '../types';

/**
 * @description Modal component for entering date to place on PDF.
 * @param props Modal state, callbacks, and optional default date
 * @returns JSX element with date input interface
 */
export function DateInputModal({
  isOpen,
  onClose,
  onConfirm,
  onPreview,
  defaultDate,
}: DateInputModalProps): ReactElement {
  const [date, setDate] = useState<Date>(defaultDate || new Date());
  const [format, setFormat] = useState('MM/DD/YYYY');
  const [fontSize, setFontSize] = useState(12);

  const updatePreview = (newDate: Date, newFormat: string, newFontSize: number) => {
    if (onPreview) {
      onPreview(newDate, newFormat, newFontSize);
    }
  };

  const handleDateChange = (newDate: Date) => {
    setDate(newDate);
    updatePreview(newDate, format, fontSize);
  };

  const handleFormatChange = (newFormat: string) => {
    setFormat(newFormat);
    updatePreview(date, newFormat, fontSize);
  };

  const handleFontSizeChange = (newFontSize: number) => {
    setFontSize(newFontSize);
    updatePreview(date, format, newFontSize);
  };

  const handleConfirm = () => {
    onConfirm(date, format, fontSize);
    setDate(new Date());
    setFormat('MM/DD/YYYY');
    setFontSize(12);
    onClose();
  };

  const handleCancel = () => {
    setDate(new Date());
    setFormat('MM/DD/YYYY');
    setFontSize(12);
    if (onPreview) {
      onPreview(new Date(), 'MM/DD/YYYY', 12);
    }
    onClose();
  };

  // Format date for input field (YYYY-MM-DD)
  const dateString = date.toISOString().split('T')[0];

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title="Enter Date">
      <div className="space-y-4">
        <TextField
          type="date"
          label="Date"
          value={dateString}
          onChange={(e) => handleDateChange(new Date(e.target.value))}
        />
        <TextField
          label="Format"
          placeholder="MM/DD/YYYY"
          value={format}
          onChange={(e) => handleFormatChange(e.target.value)}
          helpText="Use MM for month, DD for day, YYYY for year"
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
            className="px-4 py-2 text-sm text-white bg-sky-600 hover:bg-sky-500 rounded-md"
          >
            Confirm
          </Button>
        </div>
      </div>
    </Modal>
  );
}

