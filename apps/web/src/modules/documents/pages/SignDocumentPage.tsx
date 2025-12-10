/**
 * @fileoverview Sign Document Page - Complete page for document editing workflow
 * @summary Web page that orchestrates PDF viewing, element placement, and PDF generation
 * @description
 * This page component composes web-specific UI components (PDFViewer, SignatureCanvas, TextInputModal, DateInputModal)
 * with shared business logic hooks (useDocumentEditing, useElementHandlers) to provide a complete
 * document editing experience. It handles file upload, element placement (signature, text, date),
 * and PDF download for validation.
 */

import { type ReactElement } from 'react';
import { useDocumentEditing, useElementHandlers, type PDFCoordinates } from '@lawprotect/frontend-core';
import { PdfElementType } from '@lawprotect/frontend-core';
import { PDFViewer } from '../components/PDFViewer';
import { SignatureCanvas } from '../components/SignatureCanvas';
import { TextInputModal } from '../components/TextInputModal';
import { DateInputModal } from '../components/DateInputModal';
import { ElementTypePopover } from '../components/ElementTypePopover';
import { Button } from '../../../ui-kit/buttons/Button';
import { PageLayout } from '../../../ui-kit/layout/PageLayout';
import type { SignDocumentPageProps } from '../types';
import { usePdfFileUpload } from '../hooks/usePdfFileUpload';
import { useModalState } from '../hooks/useModalState';
import { usePendingElementState } from '../hooks/usePendingElementState';
import { usePdfGeneration } from '../hooks/usePdfGeneration';

/**
 * @description Complete page component for editing PDF documents.
 * @param props Envelope and signer information
 * @returns JSX element with document editing interface
 */
export function SignDocumentPage({ envelopeId, signerId, invitationToken }: SignDocumentPageProps): ReactElement {
  const { pdfFile, pdfSource, handleFileUpload, clearFile } = usePdfFileUpload();
  const {
    isModalOpen,
    modalType,
    popoverPosition,
    isPopoverOpen,
    openModal,
    closeModal,
    openPopover,
    closePopover,
    openModalFromPopover,
    handlePopoverClose,
  } = useModalState();
  const {
    pendingCoordinates,
    pendingSignatureImage,
    pendingSignatureWidth,
    pendingSignatureHeight,
    pendingText,
    pendingTextFontSize,
    pendingDate,
    pendingDateFormat,
    pendingDateFontSize,
    setPendingCoordinates,
    updateSignaturePreview,
    updateTextPreview,
    updateDatePreview,
    updateSignatureSize,
    clearPendingState,
    clearPendingElement,
  } = usePendingElementState();
  const { isGenerating, generateError, generateSuccess, generateAndDownload, clearGenerationState } = usePdfGeneration();

  const {
    signatures,
    texts,
    dates,
    addSignature,
    addText,
    addDate,
    removeSignature,
    removeText,
    removeDate,
    updateSignatureCoordinates,
    updateTextCoordinates,
    updateDateCoordinates,
    updateTextFontSize,
    updateDateFontSize,
    updateSignatureSize: updateSignatureSizeInState,
    clearAll,
    applyElementsAsBytes,
    isApplying,
    error,
  } = useDocumentEditing({
    pdfSource: pdfSource || new ArrayBuffer(0),
  });

  const {
    handleElementMove,
    handleElementDelete,
    handleTextResize,
    handleDateResize,
    handleSignatureResize: handleSignatureResizeBase,
  } = useElementHandlers({
    updateSignatureCoordinates,
    updateTextCoordinates,
    updateDateCoordinates,
    updateTextFontSize,
    updateDateFontSize,
    updateSignatureSize: updateSignatureSizeInState,
    removeSignature,
    removeText,
    removeDate,
  });

  /**
   * @description Handles file upload and clears related state.
   * @param event File input change event
   */
  const handleFileUploadWithClear = async (event: React.ChangeEvent<HTMLInputElement>) => {
    await handleFileUpload(event);
    clearGenerationState();
    clearAll();
  };

  /**
   * @description Handles page click for element placement.
   * @param coordinates PDF coordinates where page was clicked
   * @param clickEvent Optional click event with client coordinates
   */
  const handlePageClick = (coordinates: PDFCoordinates, clickEvent?: { clientX: number; clientY: number }) => {
    if (pendingCoordinates && modalType) {
      setPendingCoordinates(coordinates);
      return;
    }

    setPendingCoordinates(coordinates);
    if (clickEvent) {
      openPopover(clickEvent.clientX, clickEvent.clientY);
    }
  };

  /**
   * @description Handles element type selection from popover.
   * @param type Element type to place
   */
  const handleElementTypeSelect = (type: PdfElementType) => {
    if (!pendingCoordinates) {
      return;
    }

    openModalFromPopover(type);
  };

  /**
   * @description Handles signature confirmation from modal.
   * @param signatureImage Signature image data URL
   * @param width Signature width
   * @param height Signature height
   */
  const handleSignatureConfirm = (signatureImage: string, width: number, height: number) => {
    if (pendingCoordinates) {
      addSignature(signatureImage, pendingCoordinates, width, height);
      clearPendingState();
      closeModal();
    }
  };

  /**
   * @description Handles text confirmation from modal.
   * @param text Text content
   * @param fontSize Font size
   */
  const handleTextConfirm = (text: string, fontSize: number) => {
    if (pendingCoordinates) {
      addText(text, pendingCoordinates, fontSize);
      clearPendingState();
      closeModal();
    }
  };

  /**
   * @description Handles date confirmation from modal.
   * @param date Date object
   * @param format Date format string
   * @param fontSize Font size
   */
  const handleDateConfirm = (date: Date, format: string, fontSize: number) => {
    if (pendingCoordinates) {
      addDate(date, pendingCoordinates, format, fontSize);
      clearPendingState();
      closeModal();
    }
  };

  /**
   * @description Handles signature resize, including pending signatures.
   * @param index Element index (-1 for pending)
   * @param width New width
   * @param height New height
   */
  const handleSignatureResize = (index: number, width: number, height: number) => {
    if (index === -1) {
      updateSignatureSize(width, height);
      return;
    }

    handleSignatureResizeBase(index, width, height);
  };

  /**
   * @description Handles signature modal close.
   */
  const handleSignatureModalClose = () => {
    if (!pendingSignatureImage) {
      clearPendingState();
      closeModal();
    } else {
      closeModal();
    }
  };

  /**
   * @description Handles text modal close.
   */
  const handleTextModalClose = () => {
    closeModal();
    clearPendingElement(PdfElementType.Text);
    setPendingCoordinates(null);
  };

  /**
   * @description Handles date modal close.
   */
  const handleDateModalClose = () => {
    closeModal();
    clearPendingElement(PdfElementType.Date);
    setPendingCoordinates(null);
  };

  /**
   * @description Handles PDF download.
   */
  const handleDownload = async () => {
    const totalElements = signatures.length + texts.length + dates.length;
    if (totalElements === 0) {
      return;
    }

    try {
      const modifiedPdfBytes = await applyElementsAsBytes();
      await generateAndDownload(modifiedPdfBytes);
    } catch (err) {
      // Error is handled by usePdfGeneration hook
    }
  };

  const totalElements = signatures.length + texts.length + dates.length;

  if (!pdfFile || !pdfSource) {
    return (
      <PageLayout
        title={
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Edit Document</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Upload a PDF document to edit</p>
          </div>
        }
      >
        <div className="mx-auto max-w-md">
          <label className="block">
            <span className="sr-only">Choose PDF file</span>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileUploadWithClear}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
            />
          </label>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Edit Document</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Click on the PDF to place elements (signature, text, or date)
          </p>
        </div>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        )}

        {generateError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {generateError}
          </div>
        )}

        {generateSuccess && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            PDF generated and downloaded successfully!
          </div>
        )}

        {popoverPosition && (
          <ElementTypePopover
            isOpen={isPopoverOpen}
            x={popoverPosition.x}
            y={popoverPosition.y}
            onSelectSignature={() => handleElementTypeSelect(PdfElementType.Signature)}
            onSelectText={() => handleElementTypeSelect(PdfElementType.Text)}
            onSelectDate={() => handleElementTypeSelect(PdfElementType.Date)}
            onClose={() => handlePopoverClose(() => setPendingCoordinates(null))}
          />
        )}

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-900">Elements Placed</h3>
            <div className="text-xs text-slate-500">
              {totalElements} element{totalElements !== 1 ? 's' : ''} placed
            </div>
          </div>
          <p className="text-xs text-slate-600 mb-3">
            Click anywhere on the PDF to place an element. You can add multiple elements.
          </p>
          {totalElements > 0 && (
            <div className="space-y-2">
              {signatures.map((sig, index) => (
                <div
                  key={`sig-${index}`}
                  className="flex items-center justify-between p-2 bg-white rounded border border-slate-200"
                >
                  <span className="text-xs text-slate-700">
                    Signature on page {sig.coordinates.pageNumber} at ({Math.round(sig.coordinates.x)},{' '}
                    {Math.round(sig.coordinates.y)})
                  </span>
                  <Button
                    type="button"
                    onClick={() => removeSignature(index)}
                    className="px-2 py-1 text-xs text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
              ))}
              {texts.map((text, index) => (
                <div
                  key={`text-${index}`}
                  className="flex items-center justify-between p-2 bg-white rounded border border-slate-200"
                >
                  <span className="text-xs text-slate-700">
                    Text &quot;{text.text}&quot; on page {text.coordinates.pageNumber} at (
                    {Math.round(text.coordinates.x)}, {Math.round(text.coordinates.y)})
                  </span>
                  <Button
                    type="button"
                    onClick={() => removeText(index)}
                    className="px-2 py-1 text-xs text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
              ))}
              {dates.map((date, index) => (
                <div
                  key={`date-${index}`}
                  className="flex items-center justify-between p-2 bg-white rounded border border-slate-200"
                >
                  <span className="text-xs text-slate-700">
                    Date on page {date.coordinates.pageNumber} at ({Math.round(date.coordinates.x)},{' '}
                    {Math.round(date.coordinates.y)})
                  </span>
                  <Button
                    type="button"
                    onClick={() => removeDate(index)}
                    className="px-2 py-1 text-xs text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <PDFViewer
          pdfSource={pdfSource}
          onPageClick={handlePageClick}
          signatures={signatures}
          texts={texts}
          dates={dates}
          pendingCoordinates={pendingCoordinates}
          pendingElementType={modalType}
          pendingSignatureImage={pendingSignatureImage}
          pendingSignatureWidth={pendingSignatureWidth}
          pendingSignatureHeight={pendingSignatureHeight}
          onSignatureResize={handleSignatureResize}
          onTextResize={handleTextResize}
          onDateResize={handleDateResize}
          pendingText={pendingText}
          pendingTextFontSize={pendingTextFontSize}
          pendingDate={pendingDate}
          pendingDateFormat={pendingDateFormat}
          pendingDateFontSize={pendingDateFontSize}
          onElementMove={handleElementMove}
          onElementDelete={handleElementDelete}
        />

        <SignatureCanvas
          isOpen={isModalOpen && modalType === PdfElementType.Signature}
          onClose={handleSignatureModalClose}
          onConfirm={handleSignatureConfirm}
          onPreview={updateSignaturePreview}
        />

        <TextInputModal
          isOpen={isModalOpen && modalType === PdfElementType.Text}
          onClose={handleTextModalClose}
          onConfirm={(text, fontSize) => {
            handleTextConfirm(text, fontSize);
            closeModal();
          }}
          onPreview={updateTextPreview}
        />

        <DateInputModal
          isOpen={isModalOpen && modalType === PdfElementType.Date}
          onClose={handleDateModalClose}
          onConfirm={(date, format, fontSize) => {
            handleDateConfirm(date, format, fontSize);
            closeModal();
          }}
          onPreview={updateDatePreview}
        />

        <div className="flex justify-end gap-2">
          {totalElements > 0 && (
            <>
              <Button
                type="button"
                onClick={clearAll}
                className="px-4 py-2 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
              >
                Clear All
              </Button>
              <Button
                type="button"
                onClick={handleDownload}
                disabled={isGenerating || isApplying}
                className="px-6 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-500 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-md"
              >
                {isGenerating || isApplying ? 'Generating PDF...' : 'Download PDF'}
              </Button>
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
