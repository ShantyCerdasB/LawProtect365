import { PropsWithChildren, type ReactElement } from 'react';

/**
 * @fileoverview Modal - Basic modal component for overlays
 * @summary Reusable modal component with backdrop and close functionality
 * @description Provides a simple modal overlay with optional title and close handler.
 */

/**
 * @description Props for the Modal component.
 */
type Props = PropsWithChildren<{
  /** Optional modal title */
  title?: string;
  /** Whether the modal is open */
  isOpen?: boolean;
  /** Callback when modal should be closed */
  onClose?: () => void;
}>;

/**
 * @description Basic modal component with backdrop.
 * @param props Modal content and state
 * @returns JSX element with modal overlay
 */
export function Modal({ title, children, isOpen = true, onClose }: Props): ReactElement | null {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/40 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-lg shadow-xl min-w-[320px] max-w-[90vw] max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {onClose && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none"
                aria-label="Close modal"
              >
                ×
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

