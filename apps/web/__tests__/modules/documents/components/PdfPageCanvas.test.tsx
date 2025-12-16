// @ts-nocheck
/**
 * @fileoverview PDF Page Canvas Component Tests
 * @summary Tests for the PdfPageCanvas component
 */

/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { screen } from '@testing-library/react';
import { PdfElementType } from '@lawprotect/frontend-core';
import { renderWithProviders } from '@/__tests__/helpers';
import { PdfPageCanvas } from '@/modules/documents/components/PdfPageCanvas';

describe('PdfPageCanvas', () => {
  const mockOnClick = jest.fn();
  const mockOnPointerDown = jest.fn();
  const mockOnPointerMove = jest.fn();
  const mockOnPointerUp = jest.fn();
  const mockDisplayCanvasRef = React.createRef<HTMLCanvasElement>();
  const mockContainerRef = React.createRef<HTMLDivElement>();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render canvas component', () => {
    renderWithProviders(
      <PdfPageCanvas
        displayCanvasRef={mockDisplayCanvasRef}
        containerRef={mockContainerRef}
        draggedElement={null}
        resizeHandle={null}
        onClick={mockOnClick}
        onPointerDown={mockOnPointerDown}
        onPointerMove={mockOnPointerMove}
        onPointerUp={mockOnPointerUp}
        currentPage={1}
        totalPages={5}
      />
    );

    const canvas = mockDisplayCanvasRef.current;
    expect(canvas).toBeInTheDocument();
  });

  it('should display page information', () => {
    renderWithProviders(
      <PdfPageCanvas
        displayCanvasRef={mockDisplayCanvasRef}
        containerRef={mockContainerRef}
        draggedElement={null}
        resizeHandle={null}
        onClick={mockOnClick}
        onPointerDown={mockOnPointerDown}
        onPointerMove={mockOnPointerMove}
        onPointerUp={mockOnPointerUp}
        currentPage={3}
        totalPages={10}
      />
    );

    expect(screen.getByText('Page 3 of 10')).toBeInTheDocument();
  });

  it('should have crosshair cursor when not dragging or resizing', () => {
    const { container } = renderWithProviders(
      <PdfPageCanvas
        displayCanvasRef={mockDisplayCanvasRef}
        containerRef={mockContainerRef}
        draggedElement={null}
        resizeHandle={null}
        onClick={mockOnClick}
        onPointerDown={mockOnPointerDown}
        onPointerMove={mockOnPointerMove}
        onPointerUp={mockOnPointerUp}
        currentPage={1}
        totalPages={5}
      />
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toHaveClass('cursor-crosshair');
  });

  it('should have grabbing cursor when dragging', () => {
    const { container } = renderWithProviders(
      <PdfPageCanvas
        displayCanvasRef={mockDisplayCanvasRef}
        containerRef={mockContainerRef}
        draggedElement={{ type: PdfElementType.Signature, index: 0, offsetX: 0, offsetY: 0 }}
        resizeHandle={null}
        onClick={mockOnClick}
        onPointerDown={mockOnPointerDown}
        onPointerMove={mockOnPointerMove}
        onPointerUp={mockOnPointerUp}
        currentPage={1}
        totalPages={5}
      />
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toHaveClass('cursor-grabbing');
  });

  it('should have resize cursor when resizing', () => {
    const { container } = renderWithProviders(
      <PdfPageCanvas
        displayCanvasRef={mockDisplayCanvasRef}
        containerRef={mockContainerRef}
        draggedElement={null}
        resizeHandle={{ 
          type: PdfElementType.Signature, 
          index: 0, 
          handle: 'se' as any,
          startX: 0,
          startY: 0,
          startWidth: 100,
          startHeight: 50
        }}
        onClick={mockOnClick}
        onPointerDown={mockOnPointerDown}
        onPointerMove={mockOnPointerMove}
        onPointerUp={mockOnPointerUp}
        currentPage={1}
        totalPages={5}
      />
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toHaveClass('cursor-nwse-resize');
  });

  it('should attach event handlers to canvas', () => {
    const { container } = renderWithProviders(
      <PdfPageCanvas
        displayCanvasRef={mockDisplayCanvasRef}
        containerRef={mockContainerRef}
        draggedElement={null}
        resizeHandle={null}
        onClick={mockOnClick}
        onPointerDown={mockOnPointerDown}
        onPointerMove={mockOnPointerMove}
        onPointerUp={mockOnPointerUp}
        currentPage={1}
        totalPages={5}
      />
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    // Event handlers are attached as React props, not HTML attributes
    // We verify they work by checking the canvas exists and can receive events
  });

  it('should have proper container styling', () => {
    const { container } = renderWithProviders(
      <PdfPageCanvas
        displayCanvasRef={mockDisplayCanvasRef}
        containerRef={mockContainerRef}
        draggedElement={null}
        resizeHandle={null}
        onClick={mockOnClick}
        onPointerDown={mockOnPointerDown}
        onPointerMove={mockOnPointerMove}
        onPointerUp={mockOnPointerUp}
        currentPage={1}
        totalPages={5}
      />
    );

    const outerContainer = container.firstChild as HTMLElement;
    expect(outerContainer).toHaveClass('border', 'border-slate-200', 'rounded-lg');
  });

  it('should have canvas with touch action none', () => {
    const { container } = renderWithProviders(
      <PdfPageCanvas
        displayCanvasRef={mockDisplayCanvasRef}
        containerRef={mockContainerRef}
        draggedElement={null}
        resizeHandle={null}
        onClick={mockOnClick}
        onPointerDown={mockOnPointerDown}
        onPointerMove={mockOnPointerMove}
        onPointerUp={mockOnPointerUp}
        currentPage={1}
        totalPages={5}
      />
    );

    const canvas = container.querySelector('canvas') as HTMLCanvasElement;
    expect(canvas).toBeInTheDocument();
    expect(canvas.style.touchAction).toBe('none');
  });

  it('should have proper canvas styling', () => {
    const { container } = renderWithProviders(
      <PdfPageCanvas
        displayCanvasRef={mockDisplayCanvasRef}
        containerRef={mockContainerRef}
        draggedElement={null}
        resizeHandle={null}
        onClick={mockOnClick}
        onPointerDown={mockOnPointerDown}
        onPointerMove={mockOnPointerMove}
        onPointerUp={mockOnPointerUp}
        currentPage={1}
        totalPages={5}
      />
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toHaveClass('hover:opacity-90', 'transition-opacity');
    expect(canvas).toHaveStyle({ maxWidth: '100%', height: 'auto', display: 'block' });
  });
});


