/**
 * @fileoverview Signature Canvas - Web component for drawing signatures
 * @summary React component for capturing user signature via canvas drawing
 * @description
 * This component provides a web-specific interface for drawing signatures using HTML canvas.
 * It wraps react-signature-canvas and exports the signature as a base64 PNG image.
 * Supports both drawing and typing signatures with color and font selection.
 * This is a web-specific component and should not be used in mobile apps.
 */

import { useRef, useState, useEffect, type ReactElement } from 'react';
import SignatureCanvasLib from 'react-signature-canvas';
import { Modal } from '../../../ui-kit/modals/Modal';
import { Button } from '../../../ui-kit/buttons/Button';
import { TextField } from '../../../ui-kit/forms/TextField';
import type { SignatureCanvasProps } from '../types';

type TabType = 'draw' | 'type';

const FONTS = [
  { name: 'Dancing Script', value: '"Dancing Script", cursive' },
  { name: 'Great Vibes', value: '"Great Vibes", cursive' },
  { name: 'Allura', value: '"Allura", cursive' },
  { name: 'Brush Script MT', value: '"Brush Script MT", cursive' },
  { name: 'Pacifico', value: '"Pacifico", cursive' },
  { name: 'Satisfy', value: '"Satisfy", cursive' },
];

const COLORS = [
  { name: 'Black', value: '#000000' },
  { name: 'Blue', value: '#2563eb' },
  { name: 'Red', value: '#dc2626' },
  { name: 'Green', value: '#16a34a' },
  { name: 'Purple', value: '#9333ea' },
];

/**
 * @description Web component for drawing and capturing signatures using HTML canvas.
 * @param props Modal state and callbacks
 * @returns JSX element with signature drawing interface
 */
export function SignatureCanvas({ isOpen, onClose, onConfirm, onPreview }: SignatureCanvasProps): ReactElement {
  const signatureRef = useRef<SignatureCanvasLib>(null);
  const typeCanvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTab, setActiveTab] = useState<TabType>('draw');
  const [isEmpty, setIsEmpty] = useState(true);
  const [typedText, setTypedText] = useState('');
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [selectedFont, setSelectedFont] = useState('"Dancing Script", cursive');
  const [maxLength] = useState(75);

  // Generate typed signature image
  useEffect(() => {
    if (activeTab === 'type' && typeCanvasRef.current && typedText.trim()) {
      const canvas = typeCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size
      canvas.width = 512;
      canvas.height = 256;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Set font and color
      ctx.font = `48px ${selectedFont}`;
      ctx.fillStyle = selectedColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Draw text
      ctx.fillText(typedText, canvas.width / 2, canvas.height / 2);
      
      // Update preview
      if (onPreview) {
        const dataURL = canvas.toDataURL('image/png');
        onPreview(dataURL);
      }
      
      setIsEmpty(false);
    } else if (activeTab === 'type' && !typedText.trim()) {
      setIsEmpty(true);
      if (onPreview) {
        onPreview('');
      }
    }
  }, [typedText, selectedColor, selectedFont, activeTab, onPreview]);

  const handleClear = () => {
    if (activeTab === 'draw') {
      signatureRef.current?.clear();
      setIsEmpty(true);
    } else {
      setTypedText('');
      setIsEmpty(true);
      if (onPreview) {
        onPreview('');
      }
    }
  };

  const handleConfirm = () => {
    if (activeTab === 'draw') {
      if (signatureRef.current && !signatureRef.current.isEmpty()) {
        const dataURL = signatureRef.current.toDataURL('image/png');
        // Default size for drawn signatures
        onConfirm(dataURL, 150, 60);
      }
    } else {
      if (typeCanvasRef.current && typedText.trim()) {
        const dataURL = typeCanvasRef.current.toDataURL('image/png');
        // Use canvas dimensions for typed signatures
        const width = typeCanvasRef.current.width;
        const height = typeCanvasRef.current.height;
        onConfirm(dataURL, width, height);
      }
    }
  };

  const handleBegin = () => {
    setIsEmpty(false);
  };

  const handleEnd = () => {
    if (signatureRef.current) {
      const isEmptyNow = signatureRef.current.isEmpty();
      setIsEmpty(isEmptyNow);
      // Update preview in real-time
      if (onPreview && !isEmptyNow) {
        const dataURL = signatureRef.current.toDataURL('image/png');
        onPreview(dataURL);
      }
    }
  };


  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sign Your Document">
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('draw')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'draw'
                ? 'border-b-2 border-sky-600 text-sky-600 bg-sky-50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Draw
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('type')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'type'
                ? 'border-b-2 border-sky-600 text-sky-600 bg-sky-50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Type
          </button>
        </div>

        {/* Draw Tab */}
        {activeTab === 'draw' && (
          <div className="space-y-4">
            <div className="border-2 border-slate-300 rounded-lg bg-white">
              <SignatureCanvasLib
                ref={signatureRef}
                canvasProps={{
                  className: 'w-full h-64',
                  style: { touchAction: 'none' },
                }}
                onBegin={handleBegin}
                onEnd={handleEnd}
              />
            </div>
          </div>
        )}

        {/* Type Tab */}
        {activeTab === 'type' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Type your signature
              </label>
              <TextField
                type="text"
                value={typedText}
                onChange={(e) => {
                  const value = e.target.value.slice(0, maxLength);
                  setTypedText(value);
                }}
                placeholder="Enter your signature"
                className="w-full"
                maxLength={maxLength}
              />
              <div className="mt-1 text-xs text-slate-500 text-right">
                {typedText.length}/{maxLength}
              </div>
            </div>

            {/* Hidden canvas for typed signature */}
            <canvas ref={typeCanvasRef} className="hidden" />

            {/* Color and Font Selectors */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select color
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setSelectedColor(color.value)}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${
                        selectedColor === color.value
                          ? 'border-sky-600 ring-2 ring-sky-200'
                          : 'border-slate-300 hover:border-slate-400'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Change font
                </label>
                <select
                  value={selectedFont}
                  onChange={(e) => setSelectedFont(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                >
                  {FONTS.map((font) => (
                    <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                      {font.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Preview of typed signature */}
            {typedText.trim() && (
              <div className="border-2 border-slate-300 rounded-lg bg-white p-4 flex items-center justify-center min-h-[120px]">
                <span
                  style={{
                    fontFamily: selectedFont,
                    color: selectedColor,
                    fontSize: '48px',
                  }}
                >
                  {typedText}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-200">
          <Button
            type="button"
            onClick={handleClear}
            className="px-4 py-2 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
          >
            Clear
          </Button>

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isEmpty}
              className="px-4 py-2 text-sm text-white bg-sky-600 hover:bg-sky-500 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-md"
            >
              Confirm Signature
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

