/**
 * @fileoverview Element Type Popover - Floating popover for selecting element type
 * @summary Component that displays element type options at click position
 * @description
 * A floating popover that appears at the click position on the PDF,
 * allowing users to quickly select the type of element to add without
 * scrolling to the top of the page.
 */

import { type ReactElement } from 'react';
import { Button } from '../../../ui-kit/buttons/Button';
import type { ElementTypePopoverProps } from '../interfaces';

/**
 * @description Floating popover for selecting element type at click position.
 * @param props Popover state, position, and callbacks
 * @returns JSX element with floating popover
 */
export function ElementTypePopover({
  isOpen,
  x,
  y,
  onSelectSignature,
  onSelectText,
  onSelectDate,
  onClose,
}: ElementTypePopoverProps): ReactElement | null {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        onContextMenu={(e) => e.preventDefault()}
      />
      {/* Popover */}
      <div
        className="fixed z-50 bg-white border border-gray rounded-lg shadow-xl p-2 min-w-[200px]"
        style={{
          left: `${x}px`,
          top: `${y}px`,
          transform: 'translate(-50%, -100%)',
          marginTop: '-8px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-1">
          <Button
            type="button"
            onClick={() => {
              onSelectSignature();
              onClose();
            }}
            className="w-full px-4 py-2 text-sm font-medium text-left text-gray bg-white hover:bg-emerald/10 rounded-md border border-gray hover:border-emerald transition-colors"
          >
            ✍️ Add Signature
          </Button>
          <Button
            type="button"
            onClick={() => {
              onSelectText();
              onClose();
            }}
            className="w-full px-4 py-2 text-sm font-medium text-left text-gray bg-white hover:bg-emerald/10 rounded-md border border-gray hover:border-emerald transition-colors"
          >
            📝 Add Text
          </Button>
          <Button
            type="button"
            onClick={() => {
              onSelectDate();
              onClose();
            }}
            className="w-full px-4 py-2 text-sm font-medium text-left text-gray bg-white hover:bg-emerald/10 rounded-md border border-gray hover:border-emerald transition-colors"
          >
            📅 Add Date
          </Button>
        </div>
      </div>
    </>
  );
}


