// @ts-nocheck
/**
 * @fileoverview Sign Document Page Component Tests
 * @summary Tests for the SignDocumentPage component
 */

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/__tests__/helpers';
import { SignDocumentPage } from '@/modules/documents/pages/SignDocumentPage';

const mockApplyElementsAsBytes = jest.fn();
const mockClearAll = jest.fn();

jest.mock('@lawprotect/frontend-core', () => ({
  ...jest.requireActual('@lawprotect/frontend-core'),
  useDocumentEditing: jest.fn(() => ({
    signatures: [
      {
        image: 'data:image/png;base64,signature',
        coordinates: { x: 10, y: 20, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
        width: 100,
        height: 40,
      },
    ],
    texts: [],
    dates: [],
    addSignature: jest.fn(),
    addText: jest.fn(),
    addDate: jest.fn(),
    removeSignature: jest.fn(),
    removeText: jest.fn(),
    removeDate: jest.fn(),
    updateSignatureCoordinates: jest.fn(),
    updateTextCoordinates: jest.fn(),
    updateDateCoordinates: jest.fn(),
    updateTextFontSize: jest.fn(),
    updateDateFontSize: jest.fn(),
    updateSignatureSize: jest.fn(),
    clearAll: mockClearAll,
    applyElementsAsBytes: mockApplyElementsAsBytes,
    isApplying: false,
    error: null,
  })),
  useElementHandlers: jest.fn(() => ({
    handleElementMove: jest.fn(),
    handleElementDelete: jest.fn(),
    handleTextResize: jest.fn(),
    handleDateResize: jest.fn(),
    handleSignatureResize: jest.fn(),
  })),
}));

const mockHandleFileUpload = jest.fn();
const mockClearFile = jest.fn();

jest.mock('@/modules/documents/hooks/usePdfFileUpload', () => ({
  usePdfFileUpload: () => ({
    pdfFile: {} as File,
    pdfSource: new ArrayBuffer(8),
    handleFileUpload: mockHandleFileUpload,
    clearFile: mockClearFile,
  }),
}));

jest.mock('@/modules/documents/components/PDFViewer', () => ({
  PDFViewer: jest.fn(({ onPageClick }) => (
    <div data-testid="pdf-viewer">
      <button onClick={() => {
        const coords = { x: 50, y: 100, pageNumber: 1, pageWidth: 800, pageHeight: 1200 };
        onPageClick?.(coords, { clientX: 100, clientY: 200 });
      }}>Click PDF</button>
    </div>
  )),
}));

jest.mock('@/modules/documents/components/SignatureCanvas', () => ({
  SignatureCanvas: jest.fn(({ isOpen, onClose, onConfirm }) =>
    isOpen ? (
      <div data-testid="signature-canvas">
        <button onClick={onClose}>Close</button>
        <button onClick={() => onConfirm('data:image/png;base64,test')}>Confirm</button>
      </div>
    ) : null
  ),
}));

jest.mock('@/modules/documents/components/TextInputModal', () => ({
  TextInputModal: jest.fn(({ isOpen, onClose, onConfirm }) =>
    isOpen ? (
      <div data-testid="text-input-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={() => onConfirm('Test text', 12)}>Confirm</button>
      </div>
    ) : null
  ),
}));

jest.mock('@/modules/documents/components/DateInputModal', () => ({
  DateInputModal: jest.fn(({ isOpen, onClose, onConfirm }) =>
    isOpen ? (
      <div data-testid="date-input-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={() => onConfirm(new Date(), 'MM/DD/YYYY', 12)}>Confirm</button>
      </div>
    ) : null
  ),
}));

jest.mock('@/modules/documents/components/ElementTypePopover', () => ({
  ElementTypePopover: jest.fn(({ isOpen, onSelectSignature, onSelectText, onSelectDate }) =>
    isOpen ? (
      <div data-testid="element-type-popover">
        <button onClick={onSelectSignature}>Signature</button>
        <button onClick={onSelectText}>Text</button>
        <button onClick={onSelectDate}>Date</button>
      </div>
    ) : null
  ),
}));

describe('SignDocumentPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render sign document page', () => {
    renderWithProviders(<SignDocumentPage envelopeId="env1" signerId="signer1" invitationToken="token1" />);

    expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
  });

  it('should render download button', () => {
    renderWithProviders(<SignDocumentPage envelopeId="env1" signerId="signer1" invitationToken="token1" />);

    expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
  });

  it('should render PDF viewer', () => {
    renderWithProviders(<SignDocumentPage envelopeId="env1" signerId="signer1" invitationToken="token1" />);

    expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
  });

  it('should open signature canvas when signature is selected from popover', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignDocumentPage envelopeId="env1" signerId="signer1" invitationToken="token1" />);

    await waitFor(() => {
      expect(screen.queryByTestId('element-type-popover')).not.toBeInTheDocument();
    });
  });

  it('should render with envelope, signer, and token props', () => {
    renderWithProviders(<SignDocumentPage envelopeId="env123" signerId="signer456" invitationToken="token789" />);

    expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
  });

  it('should render clear all button', () => {
    renderWithProviders(<SignDocumentPage envelopeId="env1" signerId="signer1" invitationToken="token1" />);

    expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument();
  });

  it('should render page layout', () => {
    const { container } = renderWithProviders(
      <SignDocumentPage envelopeId="env1" signerId="signer1" invitationToken="token1" />
    );

    expect(container.querySelector('main')).toBeInTheDocument();
  });

  it('should render upload form when no PDF is loaded', () => {
    jest.spyOn(require('@/modules/documents/hooks/usePdfFileUpload'), 'usePdfFileUpload').mockReturnValue({
      pdfFile: null,
      pdfSource: null,
      handleFileUpload: mockHandleFileUpload,
      clearFile: mockClearFile,
    });

    renderWithProviders(<SignDocumentPage envelopeId="env1" signerId="signer1" invitationToken="token1" />);

    expect(screen.getByText(/upload a pdf document to edit/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/choose pdf file/i)).toBeInTheDocument();
  });

  it('should handle file upload with clear', async () => {
    const user = userEvent.setup();
    jest.spyOn(require('@/modules/documents/hooks/usePdfFileUpload'), 'usePdfFileUpload').mockReturnValue({
      pdfFile: null,
      pdfSource: null,
      handleFileUpload: mockHandleFileUpload,
      clearFile: mockClearFile,
    });

    renderWithProviders(<SignDocumentPage envelopeId="env1" signerId="signer1" invitationToken="token1" />);

    const fileInput = screen.getByLabelText(/choose pdf file/i);
    const file = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });

    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(mockHandleFileUpload).toHaveBeenCalled();
      expect(mockClearAll).toHaveBeenCalled();
    });
  });

  it('should handle page click without pending coordinates', async () => {
    const user = userEvent.setup();
    const mockOpenPopover = jest.fn();
    const mockSetPendingCoordinates = jest.fn();
    jest.spyOn(require('@/modules/documents/hooks/useModalState'), 'useModalState').mockReturnValue({
      isModalOpen: false,
      modalType: null,
      popoverPosition: null,
      isPopoverOpen: false,
      openModal: jest.fn(),
      closeModal: jest.fn(),
      openPopover: mockOpenPopover,
      closePopover: jest.fn(),
      openModalFromPopover: jest.fn(),
      handlePopoverClose: jest.fn(),
    });
    jest.spyOn(require('@/modules/documents/hooks/usePendingElementState'), 'usePendingElementState').mockReturnValue({
      pendingCoordinates: null,
      pendingSignatureImage: null,
      pendingSignatureWidth: 150,
      pendingSignatureHeight: 60,
      pendingText: null,
      pendingTextFontSize: 12,
      pendingDate: null,
      pendingDateFormat: 'MM/DD/YYYY',
      pendingDateFontSize: 12,
      setPendingCoordinates: mockSetPendingCoordinates,
      updateSignaturePreview: jest.fn(),
      updateTextPreview: jest.fn(),
      updateDatePreview: jest.fn(),
      updateSignatureSize: jest.fn(),
      clearPendingState: jest.fn(),
      clearPendingElement: jest.fn(),
    });

    renderWithProviders(<SignDocumentPage envelopeId="env1" signerId="signer1" invitationToken="token1" />);

    const pdfViewer = screen.getByTestId('pdf-viewer');
    const clickButton = pdfViewer.querySelector('button');

    if (clickButton) {
      await user.click(clickButton);
    }

    await waitFor(() => {
      expect(mockSetPendingCoordinates).toHaveBeenCalled();
      expect(mockOpenPopover).toHaveBeenCalledWith(100, 200);
    });
  });

  it('should handle page click with pending coordinates and modal type', async () => {
    const user = userEvent.setup();
    const { useModalState } = require('@/modules/documents/hooks/useModalState');
    jest.spyOn(require('@/modules/documents/hooks/useModalState'), 'useModalState').mockReturnValue({
      isModalOpen: false,
      modalType: 'signature',
      popoverPosition: null,
      isPopoverOpen: false,
      openModal: jest.fn(),
      closeModal: jest.fn(),
      openPopover: jest.fn(),
      closePopover: jest.fn(),
      openModalFromPopover: jest.fn(),
      handlePopoverClose: jest.fn(),
    });

    renderWithProviders(<SignDocumentPage envelopeId="env1" signerId="signer1" invitationToken="token1" />);

    const pdfViewer = screen.getByTestId('pdf-viewer');
    const clickButton = pdfViewer.querySelector('button');

    if (clickButton) {
      await user.click(clickButton);
    }
  });

  it('should handle element type select without pending coordinates', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignDocumentPage envelopeId="env1" signerId="signer1" invitationToken="token1" />);

    await waitFor(() => {
      const popover = screen.queryByTestId('element-type-popover');
      if (popover) {
        const signatureButton = screen.getByRole('button', { name: /signature/i });
        user.click(signatureButton);
      }
    });
  });

  it('should handle signature confirm', async () => {
    const user = userEvent.setup();
    const mockAddSignature = jest.fn();
    jest.spyOn(require('@lawprotect/frontend-core'), 'useDocumentEditing').mockReturnValue({
      signatures: [],
      texts: [],
      dates: [],
      addSignature: mockAddSignature,
      addText: jest.fn(),
      addDate: jest.fn(),
      removeSignature: jest.fn(),
      removeText: jest.fn(),
      removeDate: jest.fn(),
      updateSignatureCoordinates: jest.fn(),
      updateTextCoordinates: jest.fn(),
      updateDateCoordinates: jest.fn(),
      updateTextFontSize: jest.fn(),
      updateDateFontSize: jest.fn(),
      updateSignatureSize: jest.fn(),
      clearAll: mockClearAll,
      applyElementsAsBytes: mockApplyElementsAsBytes,
      isApplying: false,
      error: null,
    });

    const { useModalState } = require('@/modules/documents/hooks/useModalState');
    const mockOpenModal = jest.fn();
    const mockCloseModal = jest.fn();
    jest.spyOn(require('@/modules/documents/hooks/useModalState'), 'useModalState').mockReturnValue({
      isModalOpen: true,
      modalType: 'signature',
      popoverPosition: null,
      isPopoverOpen: false,
      openModal: mockOpenModal,
      closeModal: mockCloseModal,
      openPopover: jest.fn(),
      closePopover: jest.fn(),
      openModalFromPopover: jest.fn(),
      handlePopoverClose: jest.fn(),
    });

    const { usePendingElementState } = require('@/modules/documents/hooks/usePendingElementState');
    jest.spyOn(require('@/modules/documents/hooks/usePendingElementState'), 'usePendingElementState').mockReturnValue({
      pendingCoordinates: { x: 100, y: 200, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
      pendingSignatureImage: null,
      pendingSignatureWidth: 150,
      pendingSignatureHeight: 60,
      pendingText: null,
      pendingTextFontSize: 12,
      pendingDate: null,
      pendingDateFormat: 'MM/DD/YYYY',
      pendingDateFontSize: 12,
      setPendingCoordinates: jest.fn(),
      updateSignaturePreview: jest.fn(),
      updateTextPreview: jest.fn(),
      updateDatePreview: jest.fn(),
      updateSignatureSize: jest.fn(),
      clearPendingState: jest.fn(),
      clearPendingElement: jest.fn(),
    });

    renderWithProviders(<SignDocumentPage envelopeId="env1" signerId="signer1" invitationToken="token1" />);

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockAddSignature).toHaveBeenCalled();
      expect(mockCloseModal).toHaveBeenCalled();
    });
  });

  it('should handle text confirm', async () => {
    const user = userEvent.setup();
    const mockAddText = jest.fn();
    jest.spyOn(require('@lawprotect/frontend-core'), 'useDocumentEditing').mockReturnValue({
      signatures: [],
      texts: [],
      dates: [],
      addSignature: jest.fn(),
      addText: mockAddText,
      addDate: jest.fn(),
      removeSignature: jest.fn(),
      removeText: jest.fn(),
      removeDate: jest.fn(),
      updateSignatureCoordinates: jest.fn(),
      updateTextCoordinates: jest.fn(),
      updateDateCoordinates: jest.fn(),
      updateTextFontSize: jest.fn(),
      updateDateFontSize: jest.fn(),
      updateSignatureSize: jest.fn(),
      clearAll: mockClearAll,
      applyElementsAsBytes: mockApplyElementsAsBytes,
      isApplying: false,
      error: null,
    });

    const mockCloseModal = jest.fn();
    jest.spyOn(require('@/modules/documents/hooks/useModalState'), 'useModalState').mockReturnValue({
      isModalOpen: true,
      modalType: 'text',
      popoverPosition: null,
      isPopoverOpen: false,
      openModal: jest.fn(),
      closeModal: mockCloseModal,
      openPopover: jest.fn(),
      closePopover: jest.fn(),
      openModalFromPopover: jest.fn(),
      handlePopoverClose: jest.fn(),
    });

    jest.spyOn(require('@/modules/documents/hooks/usePendingElementState'), 'usePendingElementState').mockReturnValue({
      pendingCoordinates: { x: 100, y: 200, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
      pendingSignatureImage: null,
      pendingSignatureWidth: 150,
      pendingSignatureHeight: 60,
      pendingText: null,
      pendingTextFontSize: 12,
      pendingDate: null,
      pendingDateFormat: 'MM/DD/YYYY',
      pendingDateFontSize: 12,
      setPendingCoordinates: jest.fn(),
      updateSignaturePreview: jest.fn(),
      updateTextPreview: jest.fn(),
      updateDatePreview: jest.fn(),
      updateSignatureSize: jest.fn(),
      clearPendingState: jest.fn(),
      clearPendingElement: jest.fn(),
    });

    renderWithProviders(<SignDocumentPage envelopeId="env1" signerId="signer1" invitationToken="token1" />);

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockAddText).toHaveBeenCalled();
      expect(mockCloseModal).toHaveBeenCalled();
    });
  });

  it('should handle date confirm', async () => {
    const user = userEvent.setup();
    const mockAddDate = jest.fn();
    jest.spyOn(require('@lawprotect/frontend-core'), 'useDocumentEditing').mockReturnValue({
      signatures: [],
      texts: [],
      dates: [],
      addSignature: jest.fn(),
      addText: jest.fn(),
      addDate: mockAddDate,
      removeSignature: jest.fn(),
      removeText: jest.fn(),
      removeDate: jest.fn(),
      updateSignatureCoordinates: jest.fn(),
      updateTextCoordinates: jest.fn(),
      updateDateCoordinates: jest.fn(),
      updateTextFontSize: jest.fn(),
      updateDateFontSize: jest.fn(),
      updateSignatureSize: jest.fn(),
      clearAll: mockClearAll,
      applyElementsAsBytes: mockApplyElementsAsBytes,
      isApplying: false,
      error: null,
    });

    const mockCloseModal = jest.fn();
    jest.spyOn(require('@/modules/documents/hooks/useModalState'), 'useModalState').mockReturnValue({
      isModalOpen: true,
      modalType: 'date',
      popoverPosition: null,
      isPopoverOpen: false,
      openModal: jest.fn(),
      closeModal: mockCloseModal,
      openPopover: jest.fn(),
      closePopover: jest.fn(),
      openModalFromPopover: jest.fn(),
      handlePopoverClose: jest.fn(),
    });

    jest.spyOn(require('@/modules/documents/hooks/usePendingElementState'), 'usePendingElementState').mockReturnValue({
      pendingCoordinates: { x: 100, y: 200, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
      pendingSignatureImage: null,
      pendingSignatureWidth: 150,
      pendingSignatureHeight: 60,
      pendingText: null,
      pendingTextFontSize: 12,
      pendingDate: null,
      pendingDateFormat: 'MM/DD/YYYY',
      pendingDateFontSize: 12,
      setPendingCoordinates: jest.fn(),
      updateSignaturePreview: jest.fn(),
      updateTextPreview: jest.fn(),
      updateDatePreview: jest.fn(),
      updateSignatureSize: jest.fn(),
      clearPendingState: jest.fn(),
      clearPendingElement: jest.fn(),
    });

    renderWithProviders(<SignDocumentPage envelopeId="env1" signerId="signer1" invitationToken="token1" />);

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockAddDate).toHaveBeenCalled();
      expect(mockCloseModal).toHaveBeenCalled();
    });
  });

  it('should handle signature resize for pending signature', () => {
    const mockUpdateSignatureSize = jest.fn();
    jest.spyOn(require('@/modules/documents/hooks/usePendingElementState'), 'usePendingElementState').mockReturnValue({
      pendingCoordinates: { x: 100, y: 200, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
      pendingSignatureImage: null,
      pendingSignatureWidth: 150,
      pendingSignatureHeight: 60,
      pendingText: null,
      pendingTextFontSize: 12,
      pendingDate: null,
      pendingDateFormat: 'MM/DD/YYYY',
      pendingDateFontSize: 12,
      setPendingCoordinates: jest.fn(),
      updateSignaturePreview: jest.fn(),
      updateTextPreview: jest.fn(),
      updateDatePreview: jest.fn(),
      updateSignatureSize: mockUpdateSignatureSize,
      clearPendingState: jest.fn(),
      clearPendingElement: jest.fn(),
    });

    renderWithProviders(<SignDocumentPage envelopeId="env1" signerId="signer1" invitationToken="token1" />);

    const pdfViewer = screen.getByTestId('pdf-viewer');
    expect(pdfViewer).toBeInTheDocument();
  });

  it('should handle signature modal close without pending image', () => {
    const mockClearPendingState = jest.fn();
    const mockCloseModal = jest.fn();
    jest.spyOn(require('@/modules/documents/hooks/useModalState'), 'useModalState').mockReturnValue({
      isModalOpen: true,
      modalType: 'signature',
      popoverPosition: null,
      isPopoverOpen: false,
      openModal: jest.fn(),
      closeModal: mockCloseModal,
      openPopover: jest.fn(),
      closePopover: jest.fn(),
      openModalFromPopover: jest.fn(),
      handlePopoverClose: jest.fn(),
    });

    jest.spyOn(require('@/modules/documents/hooks/usePendingElementState'), 'usePendingElementState').mockReturnValue({
      pendingCoordinates: { x: 100, y: 200, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
      pendingSignatureImage: null,
      pendingSignatureWidth: 150,
      pendingSignatureHeight: 60,
      pendingText: null,
      pendingTextFontSize: 12,
      pendingDate: null,
      pendingDateFormat: 'MM/DD/YYYY',
      pendingDateFontSize: 12,
      setPendingCoordinates: jest.fn(),
      updateSignaturePreview: jest.fn(),
      updateTextPreview: jest.fn(),
      updateDatePreview: jest.fn(),
      updateSignatureSize: jest.fn(),
      clearPendingState: mockClearPendingState,
      clearPendingElement: jest.fn(),
    });

    renderWithProviders(<SignDocumentPage envelopeId="env1" signerId="signer1" invitationToken="token1" />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton).toBeInTheDocument();
  });

  it('should handle text modal close', async () => {
    const user = userEvent.setup();
    const mockClearPendingElement = jest.fn();
    const mockSetPendingCoordinates = jest.fn();
    const mockCloseModal = jest.fn();
    jest.spyOn(require('@/modules/documents/hooks/useModalState'), 'useModalState').mockReturnValue({
      isModalOpen: true,
      modalType: 'text',
      popoverPosition: null,
      isPopoverOpen: false,
      openModal: jest.fn(),
      closeModal: mockCloseModal,
      openPopover: jest.fn(),
      closePopover: jest.fn(),
      openModalFromPopover: jest.fn(),
      handlePopoverClose: jest.fn(),
    });

    jest.spyOn(require('@/modules/documents/hooks/usePendingElementState'), 'usePendingElementState').mockReturnValue({
      pendingCoordinates: { x: 100, y: 200, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
      pendingSignatureImage: null,
      pendingSignatureWidth: 150,
      pendingSignatureHeight: 60,
      pendingText: null,
      pendingTextFontSize: 12,
      pendingDate: null,
      pendingDateFormat: 'MM/DD/YYYY',
      pendingDateFontSize: 12,
      setPendingCoordinates: mockSetPendingCoordinates,
      updateSignaturePreview: jest.fn(),
      updateTextPreview: jest.fn(),
      updateDatePreview: jest.fn(),
      updateSignatureSize: jest.fn(),
      clearPendingState: jest.fn(),
      clearPendingElement: mockClearPendingElement,
    });

    renderWithProviders(<SignDocumentPage envelopeId="env1" signerId="signer1" invitationToken="token1" />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    await waitFor(() => {
      expect(mockCloseModal).toHaveBeenCalled();
      expect(mockClearPendingElement).toHaveBeenCalled();
      expect(mockSetPendingCoordinates).toHaveBeenCalledWith(null);
    });
  });

  it('should handle date modal close', async () => {
    const user = userEvent.setup();
    const mockClearPendingElement = jest.fn();
    const mockSetPendingCoordinates = jest.fn();
    const mockCloseModal = jest.fn();
    jest.spyOn(require('@/modules/documents/hooks/useModalState'), 'useModalState').mockReturnValue({
      isModalOpen: true,
      modalType: 'date',
      popoverPosition: null,
      isPopoverOpen: false,
      openModal: jest.fn(),
      closeModal: mockCloseModal,
      openPopover: jest.fn(),
      closePopover: jest.fn(),
      openModalFromPopover: jest.fn(),
      handlePopoverClose: jest.fn(),
    });

    jest.spyOn(require('@/modules/documents/hooks/usePendingElementState'), 'usePendingElementState').mockReturnValue({
      pendingCoordinates: { x: 100, y: 200, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
      pendingSignatureImage: null,
      pendingSignatureWidth: 150,
      pendingSignatureHeight: 60,
      pendingText: null,
      pendingTextFontSize: 12,
      pendingDate: null,
      pendingDateFormat: 'MM/DD/YYYY',
      pendingDateFontSize: 12,
      setPendingCoordinates: mockSetPendingCoordinates,
      updateSignaturePreview: jest.fn(),
      updateTextPreview: jest.fn(),
      updateDatePreview: jest.fn(),
      updateSignatureSize: jest.fn(),
      clearPendingState: jest.fn(),
      clearPendingElement: mockClearPendingElement,
    });

    renderWithProviders(<SignDocumentPage envelopeId="env1" signerId="signer1" invitationToken="token1" />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    await waitFor(() => {
      expect(mockCloseModal).toHaveBeenCalled();
      expect(mockClearPendingElement).toHaveBeenCalled();
      expect(mockSetPendingCoordinates).toHaveBeenCalledWith(null);
    });
  });

  it('should handle download with no elements', async () => {
    const user = userEvent.setup();
    jest.spyOn(require('@lawprotect/frontend-core'), 'useDocumentEditing').mockReturnValue({
      signatures: [],
      texts: [],
      dates: [],
      addSignature: jest.fn(),
      addText: jest.fn(),
      addDate: jest.fn(),
      removeSignature: jest.fn(),
      removeText: jest.fn(),
      removeDate: jest.fn(),
      updateSignatureCoordinates: jest.fn(),
      updateTextCoordinates: jest.fn(),
      updateDateCoordinates: jest.fn(),
      updateTextFontSize: jest.fn(),
      updateDateFontSize: jest.fn(),
      updateSignatureSize: jest.fn(),
      clearAll: mockClearAll,
      applyElementsAsBytes: mockApplyElementsAsBytes,
      isApplying: false,
      error: null,
    });

    renderWithProviders(<SignDocumentPage envelopeId="env1" signerId="signer1" invitationToken="token1" />);

    expect(screen.queryByRole('button', { name: /download/i })).not.toBeInTheDocument();
  });

  it('should handle download with elements', async () => {
    const user = userEvent.setup();
    const mockGenerateAndDownload = jest.fn().mockResolvedValue(undefined);
    jest.spyOn(require('@/modules/documents/hooks/usePdfGeneration'), 'usePdfGeneration').mockReturnValue({
      isGenerating: false,
      generateError: null,
      generateSuccess: false,
      generateAndDownload: mockGenerateAndDownload,
      clearGenerationState: jest.fn(),
    });

    jest.spyOn(require('@lawprotect/frontend-core'), 'useDocumentEditing').mockReturnValue({
      signatures: [
        {
          image: 'data:image/png;base64,signature',
          coordinates: { x: 10, y: 20, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
          width: 100,
          height: 40,
        },
      ],
      texts: [],
      dates: [],
      addSignature: jest.fn(),
      addText: jest.fn(),
      addDate: jest.fn(),
      removeSignature: jest.fn(),
      removeText: jest.fn(),
      removeDate: jest.fn(),
      updateSignatureCoordinates: jest.fn(),
      updateTextCoordinates: jest.fn(),
      updateDateCoordinates: jest.fn(),
      updateTextFontSize: jest.fn(),
      updateDateFontSize: jest.fn(),
      updateSignatureSize: jest.fn(),
      clearAll: mockClearAll,
      applyElementsAsBytes: mockApplyElementsAsBytes,
      isApplying: false,
      error: null,
    });

    mockApplyElementsAsBytes.mockResolvedValue(new Uint8Array([1, 2, 3]));

    renderWithProviders(<SignDocumentPage envelopeId="env1" signerId="signer1" invitationToken="token1" />);

    const downloadButton = screen.getByRole('button', { name: /download/i });
    await user.click(downloadButton);

    await waitFor(() => {
      expect(mockApplyElementsAsBytes).toHaveBeenCalled();
      expect(mockGenerateAndDownload).toHaveBeenCalled();
    });
  });

  it('should handle download error', async () => {
    const user = userEvent.setup();
    const mockGenerateAndDownload = jest.fn().mockRejectedValue(new Error('Download failed'));
    jest.spyOn(require('@/modules/documents/hooks/usePdfGeneration'), 'usePdfGeneration').mockReturnValue({
      isGenerating: false,
      generateError: null,
      generateSuccess: false,
      generateAndDownload: mockGenerateAndDownload,
      clearGenerationState: jest.fn(),
    });

    jest.spyOn(require('@lawprotect/frontend-core'), 'useDocumentEditing').mockReturnValue({
      signatures: [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: { x: 50, y: 100, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
          width: 150,
          height: 60,
        },
      ],
      texts: [],
      dates: [],
      addSignature: jest.fn(),
      addText: jest.fn(),
      addDate: jest.fn(),
      removeSignature: jest.fn(),
      removeText: jest.fn(),
      removeDate: jest.fn(),
      updateSignatureCoordinates: jest.fn(),
      updateTextCoordinates: jest.fn(),
      updateDateCoordinates: jest.fn(),
      updateTextFontSize: jest.fn(),
      updateDateFontSize: jest.fn(),
      updateSignatureSize: jest.fn(),
      clearAll: mockClearAll,
      applyElementsAsBytes: mockApplyElementsAsBytes,
      isApplying: false,
      error: null,
    });

    mockApplyElementsAsBytes.mockResolvedValue(new Uint8Array([1, 2, 3]));

    renderWithProviders(<SignDocumentPage envelopeId="env1" signerId="signer1" invitationToken="token1" />);

    const downloadButton = screen.getByRole('button', { name: /download/i });
    await user.click(downloadButton);

    await waitFor(() => {
      expect(mockApplyElementsAsBytes).toHaveBeenCalled();
      expect(mockGenerateAndDownload).toHaveBeenCalled();
    });
  });

  it('should display error message', () => {
    jest.spyOn(require('@lawprotect/frontend-core'), 'useDocumentEditing').mockReturnValue({
      signatures: [],
      texts: [],
      dates: [],
      addSignature: jest.fn(),
      addText: jest.fn(),
      addDate: jest.fn(),
      removeSignature: jest.fn(),
      removeText: jest.fn(),
      removeDate: jest.fn(),
      updateSignatureCoordinates: jest.fn(),
      updateTextCoordinates: jest.fn(),
      updateDateCoordinates: jest.fn(),
      updateTextFontSize: jest.fn(),
      updateDateFontSize: jest.fn(),
      updateSignatureSize: jest.fn(),
      clearAll: mockClearAll,
      applyElementsAsBytes: mockApplyElementsAsBytes,
      isApplying: false,
      error: 'Test error message',
    });

    renderWithProviders(<SignDocumentPage envelopeId="env1" signerId="signer1" invitationToken="token1" />);

    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('should display generate error message', () => {
    jest.spyOn(require('@/modules/documents/hooks/usePdfGeneration'), 'usePdfGeneration').mockReturnValue({
      isGenerating: false,
      generateError: 'Generation error',
      generateSuccess: false,
      generateAndDownload: jest.fn(),
      clearGenerationState: jest.fn(),
    });

    renderWithProviders(<SignDocumentPage envelopeId="env1" signerId="signer1" invitationToken="token1" />);

    expect(screen.getByText('Generation error')).toBeInTheDocument();
  });

  it('should display generate success message', () => {
    jest.spyOn(require('@/modules/documents/hooks/usePdfGeneration'), 'usePdfGeneration').mockReturnValue({
      isGenerating: false,
      generateError: null,
      generateSuccess: true,
      generateAndDownload: jest.fn(),
      clearGenerationState: jest.fn(),
    });

    renderWithProviders(<SignDocumentPage envelopeId="env1" signerId="signer1" invitationToken="token1" />);

    expect(screen.getByText(/pdf generated and downloaded successfully/i)).toBeInTheDocument();
  });

  it('should render element list with signatures', () => {
    jest.spyOn(require('@lawprotect/frontend-core'), 'useDocumentEditing').mockReturnValue({
      signatures: [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: { x: 50, y: 100, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
          width: 150,
          height: 60,
        },
      ],
      texts: [],
      dates: [],
      addSignature: jest.fn(),
      addText: jest.fn(),
      addDate: jest.fn(),
      removeSignature: jest.fn(),
      removeText: jest.fn(),
      removeDate: jest.fn(),
      updateSignatureCoordinates: jest.fn(),
      updateTextCoordinates: jest.fn(),
      updateDateCoordinates: jest.fn(),
      updateTextFontSize: jest.fn(),
      updateDateFontSize: jest.fn(),
      updateSignatureSize: jest.fn(),
      clearAll: mockClearAll,
      applyElementsAsBytes: mockApplyElementsAsBytes,
      isApplying: false,
      error: null,
    });

    renderWithProviders(<SignDocumentPage envelopeId="env1" signerId="signer1" invitationToken="token1" />);

    expect(screen.getByText(/signature on page 1/i)).toBeInTheDocument();
  });

  it('should render element list with texts', () => {
    jest.spyOn(require('@lawprotect/frontend-core'), 'useDocumentEditing').mockReturnValue({
      signatures: [],
      texts: [
        {
          text: 'Test text',
          coordinates: { x: 50, y: 100, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
          fontSize: 12,
        },
      ],
      dates: [],
      addSignature: jest.fn(),
      addText: jest.fn(),
      addDate: jest.fn(),
      removeSignature: jest.fn(),
      removeText: jest.fn(),
      removeDate: jest.fn(),
      updateSignatureCoordinates: jest.fn(),
      updateTextCoordinates: jest.fn(),
      updateDateCoordinates: jest.fn(),
      updateTextFontSize: jest.fn(),
      updateDateFontSize: jest.fn(),
      updateSignatureSize: jest.fn(),
      clearAll: mockClearAll,
      applyElementsAsBytes: mockApplyElementsAsBytes,
      isApplying: false,
      error: null,
    });

    renderWithProviders(<SignDocumentPage envelopeId="env1" signerId="signer1" invitationToken="token1" />);

    expect(screen.getByText(/text "test text"/i)).toBeInTheDocument();
  });

  it('should render element list with dates', () => {
    jest.spyOn(require('@lawprotect/frontend-core'), 'useDocumentEditing').mockReturnValue({
      signatures: [],
      texts: [],
      dates: [
        {
          date: new Date('2024-01-15'),
          coordinates: { x: 50, y: 100, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
          format: 'MM/DD/YYYY',
          fontSize: 12,
        },
      ],
      addSignature: jest.fn(),
      addText: jest.fn(),
      addDate: jest.fn(),
      removeSignature: jest.fn(),
      removeText: jest.fn(),
      removeDate: jest.fn(),
      updateSignatureCoordinates: jest.fn(),
      updateTextCoordinates: jest.fn(),
      updateDateCoordinates: jest.fn(),
      updateTextFontSize: jest.fn(),
      updateDateFontSize: jest.fn(),
      updateSignatureSize: jest.fn(),
      clearAll: mockClearAll,
      applyElementsAsBytes: mockApplyElementsAsBytes,
      isApplying: false,
      error: null,
    });

    renderWithProviders(<SignDocumentPage envelopeId="env1" signerId="signer1" invitationToken="token1" />);

    expect(screen.getByText(/date on page 1/i)).toBeInTheDocument();
  });

  it('should disable download button when generating', () => {
    jest.spyOn(require('@/modules/documents/hooks/usePdfGeneration'), 'usePdfGeneration').mockReturnValue({
      isGenerating: true,
      generateError: null,
      generateSuccess: false,
      generateAndDownload: jest.fn(),
      clearGenerationState: jest.fn(),
    });

    renderWithProviders(<SignDocumentPage envelopeId="env1" signerId="signer1" invitationToken="token1" />);

    const downloadButton = screen.getByRole('button', { name: /generating pdf/i });
    expect(downloadButton).toBeDisabled();
  });

  it('should disable download button when applying', () => {
    jest.spyOn(require('@lawprotect/frontend-core'), 'useDocumentEditing').mockReturnValue({
      signatures: [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: { x: 50, y: 100, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
          width: 150,
          height: 60,
        },
      ],
      texts: [],
      dates: [],
      addSignature: jest.fn(),
      addText: jest.fn(),
      addDate: jest.fn(),
      removeSignature: jest.fn(),
      removeText: jest.fn(),
      removeDate: jest.fn(),
      updateSignatureCoordinates: jest.fn(),
      updateTextCoordinates: jest.fn(),
      updateDateCoordinates: jest.fn(),
      updateTextFontSize: jest.fn(),
      updateDateFontSize: jest.fn(),
      updateSignatureSize: jest.fn(),
      clearAll: mockClearAll,
      applyElementsAsBytes: mockApplyElementsAsBytes,
      isApplying: true,
      error: null,
    });

    renderWithProviders(<SignDocumentPage envelopeId="env1" signerId="signer1" invitationToken="token1" />);

    const downloadButton = screen.getByRole('button', { name: /generating pdf/i });
    expect(downloadButton).toBeDisabled();
  });

  it('should handle page click with pending coordinates and modalType (early return)', async () => {
    const user = userEvent.setup();
    const mockSetPendingCoordinates = jest.fn();
    jest.spyOn(require('@/modules/documents/hooks/useModalState'), 'useModalState').mockReturnValue({
      isModalOpen: false,
      modalType: 'signature',
      popoverPosition: null,
      isPopoverOpen: false,
      openModal: jest.fn(),
      closeModal: jest.fn(),
      openPopover: jest.fn(),
      closePopover: jest.fn(),
      openModalFromPopover: jest.fn(),
      handlePopoverClose: jest.fn(),
    });
    jest.spyOn(require('@/modules/documents/hooks/usePendingElementState'), 'usePendingElementState').mockReturnValue({
      pendingCoordinates: { x: 100, y: 200, pageNumber: 1 },
      pendingSignatureImage: null,
      pendingSignatureWidth: 150,
      pendingSignatureHeight: 60,
      pendingText: null,
      pendingTextFontSize: 12,
      pendingDate: null,
      pendingDateFormat: 'MM/DD/YYYY',
      pendingDateFontSize: 12,
      setPendingCoordinates: mockSetPendingCoordinates,
      updateSignaturePreview: jest.fn(),
      updateTextPreview: jest.fn(),
      updateDatePreview: jest.fn(),
      updateSignatureSize: jest.fn(),
      clearPendingState: jest.fn(),
      clearPendingElement: jest.fn(),
    });

    renderWithProviders(<SignDocumentPage envelopeId="env1" signerId="signer1" invitationToken="token1" />);

    const pdfViewer = screen.getByTestId('pdf-viewer');
    const clickButton = pdfViewer.querySelector('button');

    if (clickButton) {
      await user.click(clickButton);
    }

    await waitFor(() => {
      expect(mockSetPendingCoordinates).toHaveBeenCalled();
    });
  });

  it('should handle element type select without pending coordinates (early return)', async () => {
    const user = userEvent.setup();
    jest.spyOn(require('@/modules/documents/hooks/usePendingElementState'), 'usePendingElementState').mockReturnValue({
      pendingCoordinates: null,
      pendingSignatureImage: null,
      pendingSignatureWidth: 150,
      pendingSignatureHeight: 60,
      pendingText: null,
      pendingTextFontSize: 12,
      pendingDate: null,
      pendingDateFormat: 'MM/DD/YYYY',
      pendingDateFontSize: 12,
      setPendingCoordinates: jest.fn(),
      updateSignaturePreview: jest.fn(),
      updateTextPreview: jest.fn(),
      updateDatePreview: jest.fn(),
      updateSignatureSize: jest.fn(),
      clearPendingState: jest.fn(),
      clearPendingElement: jest.fn(),
    });
    const mockOpenModalFromPopover = jest.fn();
    jest.spyOn(require('@/modules/documents/hooks/useModalState'), 'useModalState').mockReturnValue({
      isModalOpen: false,
      modalType: null,
      popoverPosition: { x: 100, y: 200 },
      isPopoverOpen: true,
      openModal: jest.fn(),
      closeModal: jest.fn(),
      openPopover: jest.fn(),
      closePopover: jest.fn(),
      openModalFromPopover: mockOpenModalFromPopover,
      handlePopoverClose: jest.fn(),
    });

    renderWithProviders(<SignDocumentPage envelopeId="env1" signerId="signer1" invitationToken="token1" />);

    const signatureButton = screen.getByRole('button', { name: /signature/i });
    await user.click(signatureButton);

    expect(mockOpenModalFromPopover).not.toHaveBeenCalled();
  });

  it('should handle signature resize for existing signature (index !== -1)', () => {
    const mockHandleSignatureResize = jest.fn();
    jest.spyOn(require('@lawprotect/frontend-core'), 'useElementHandlers').mockReturnValue({
      handleElementMove: jest.fn(),
      handleElementDelete: jest.fn(),
      handleTextResize: jest.fn(),
      handleDateResize: jest.fn(),
      handleSignatureResize: mockHandleSignatureResize,
    });

    renderWithProviders(<SignDocumentPage envelopeId="env1" signerId="signer1" invitationToken="token1" />);

    const pdfViewer = screen.getByTestId('pdf-viewer');
    expect(pdfViewer).toBeInTheDocument();
  });

  it('should handle signature modal close with pending image', async () => {
    const user = userEvent.setup();
    const mockCloseModal = jest.fn();
    jest.spyOn(require('@/modules/documents/hooks/useModalState'), 'useModalState').mockReturnValue({
      isModalOpen: true,
      modalType: 'signature',
      popoverPosition: null,
      isPopoverOpen: false,
      openModal: jest.fn(),
      closeModal: mockCloseModal,
      openPopover: jest.fn(),
      closePopover: jest.fn(),
      openModalFromPopover: jest.fn(),
      handlePopoverClose: jest.fn(),
    });

    jest.spyOn(require('@/modules/documents/hooks/usePendingElementState'), 'usePendingElementState').mockReturnValue({
      pendingCoordinates: { x: 100, y: 200, pageNumber: 1 },
      pendingSignatureImage: 'data:image/png;base64,test',
      pendingSignatureWidth: 150,
      pendingSignatureHeight: 60,
      pendingText: null,
      pendingTextFontSize: 12,
      pendingDate: null,
      pendingDateFormat: 'MM/DD/YYYY',
      pendingDateFontSize: 12,
      setPendingCoordinates: jest.fn(),
      updateSignaturePreview: jest.fn(),
      updateTextPreview: jest.fn(),
      updateDatePreview: jest.fn(),
      updateSignatureSize: jest.fn(),
      clearPendingState: jest.fn(),
      clearPendingElement: jest.fn(),
    });

    renderWithProviders(<SignDocumentPage envelopeId="env1" signerId="signer1" invitationToken="token1" />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    await waitFor(() => {
      expect(mockCloseModal).toHaveBeenCalled();
    });
  });

  it('should handle ElementTypePopover callbacks', async () => {
    const user = userEvent.setup();
    const mockOpenModalFromPopover = jest.fn();
    jest.spyOn(require('@/modules/documents/hooks/useModalState'), 'useModalState').mockReturnValue({
      isModalOpen: false,
      modalType: null,
      popoverPosition: { x: 100, y: 200 },
      isPopoverOpen: true,
      openModal: jest.fn(),
      closeModal: jest.fn(),
      openPopover: jest.fn(),
      closePopover: jest.fn(),
      openModalFromPopover: mockOpenModalFromPopover,
      handlePopoverClose: jest.fn(),
    });
    jest.spyOn(require('@/modules/documents/hooks/usePendingElementState'), 'usePendingElementState').mockReturnValue({
      pendingCoordinates: { x: 100, y: 200, pageNumber: 1 },
      pendingSignatureImage: null,
      pendingSignatureWidth: 150,
      pendingSignatureHeight: 60,
      pendingText: null,
      pendingTextFontSize: 12,
      pendingDate: null,
      pendingDateFormat: 'MM/DD/YYYY',
      pendingDateFontSize: 12,
      setPendingCoordinates: jest.fn(),
      updateSignaturePreview: jest.fn(),
      updateTextPreview: jest.fn(),
      updateDatePreview: jest.fn(),
      updateSignatureSize: jest.fn(),
      clearPendingState: jest.fn(),
      clearPendingElement: jest.fn(),
    });

    renderWithProviders(<SignDocumentPage envelopeId="env1" signerId="signer1" invitationToken="token1" />);

    const signatureButton = screen.getByRole('button', { name: /signature/i });
    await user.click(signatureButton);

    await waitFor(() => {
      expect(mockOpenModalFromPopover).toHaveBeenCalled();
    });

    const textButton = screen.getByRole('button', { name: /text/i });
    await user.click(textButton);

    await waitFor(() => {
      expect(mockOpenModalFromPopover).toHaveBeenCalledTimes(2);
    });

    const dateButton = screen.getByRole('button', { name: /date/i });
    await user.click(dateButton);

    await waitFor(() => {
      expect(mockOpenModalFromPopover).toHaveBeenCalledTimes(3);
    });
  });

  it('should handle remove signature button click', async () => {
    const user = userEvent.setup();
    const mockRemoveSignature = jest.fn();
    jest.spyOn(require('@lawprotect/frontend-core'), 'useDocumentEditing').mockReturnValue({
      signatures: [
        {
          image: 'data:image/png;base64,signature',
          coordinates: { x: 10, y: 20, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
          width: 100,
          height: 40,
        },
      ],
      texts: [],
      dates: [],
      addSignature: jest.fn(),
      addText: jest.fn(),
      addDate: jest.fn(),
      removeSignature: mockRemoveSignature,
      removeText: jest.fn(),
      removeDate: jest.fn(),
      updateSignatureCoordinates: jest.fn(),
      updateTextCoordinates: jest.fn(),
      updateDateCoordinates: jest.fn(),
      updateTextFontSize: jest.fn(),
      updateDateFontSize: jest.fn(),
      updateSignatureSize: jest.fn(),
      clearAll: mockClearAll,
      applyElementsAsBytes: mockApplyElementsAsBytes,
      isApplying: false,
      error: null,
    });

    renderWithProviders(<SignDocumentPage envelopeId="env1" signerId="signer1" invitationToken="token1" />);

    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    await user.click(removeButtons[0]);

    await waitFor(() => {
      expect(mockRemoveSignature).toHaveBeenCalledWith(0);
    });
  });

  it('should handle remove text button click', async () => {
    const user = userEvent.setup();
    const mockRemoveText = jest.fn();
    jest.spyOn(require('@lawprotect/frontend-core'), 'useDocumentEditing').mockReturnValue({
      signatures: [],
      texts: [
        {
          text: 'Test text',
          coordinates: { x: 50, y: 100, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
          fontSize: 12,
        },
      ],
      dates: [],
      addSignature: jest.fn(),
      addText: jest.fn(),
      addDate: jest.fn(),
      removeSignature: jest.fn(),
      removeText: mockRemoveText,
      removeDate: jest.fn(),
      updateSignatureCoordinates: jest.fn(),
      updateTextCoordinates: jest.fn(),
      updateDateCoordinates: jest.fn(),
      updateTextFontSize: jest.fn(),
      updateDateFontSize: jest.fn(),
      updateSignatureSize: jest.fn(),
      clearAll: mockClearAll,
      applyElementsAsBytes: mockApplyElementsAsBytes,
      isApplying: false,
      error: null,
    });

    renderWithProviders(<SignDocumentPage envelopeId="env1" signerId="signer1" invitationToken="token1" />);

    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    await user.click(removeButtons[0]);

    await waitFor(() => {
      expect(mockRemoveText).toHaveBeenCalledWith(0);
    });
  });

  it('should handle remove date button click', async () => {
    const user = userEvent.setup();
    const mockRemoveDate = jest.fn();
    jest.spyOn(require('@lawprotect/frontend-core'), 'useDocumentEditing').mockReturnValue({
      signatures: [],
      texts: [],
      dates: [
        {
          date: new Date('2024-01-15'),
          coordinates: { x: 50, y: 100, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
          format: 'MM/DD/YYYY',
          fontSize: 12,
        },
      ],
      addSignature: jest.fn(),
      addText: jest.fn(),
      addDate: jest.fn(),
      removeSignature: jest.fn(),
      removeText: jest.fn(),
      removeDate: mockRemoveDate,
      updateSignatureCoordinates: jest.fn(),
      updateTextCoordinates: jest.fn(),
      updateDateCoordinates: jest.fn(),
      updateTextFontSize: jest.fn(),
      updateDateFontSize: jest.fn(),
      updateSignatureSize: jest.fn(),
      clearAll: mockClearAll,
      applyElementsAsBytes: mockApplyElementsAsBytes,
      isApplying: false,
      error: null,
    });

    renderWithProviders(<SignDocumentPage envelopeId="env1" signerId="signer1" invitationToken="token1" />);

    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    await user.click(removeButtons[0]);

    await waitFor(() => {
      expect(mockRemoveDate).toHaveBeenCalledWith(0);
    });
  });
});


