/**
 * @fileoverview File System Port - Interface for file operations
 * @summary Platform-agnostic file system abstraction
 * @description Defines a contract for file picking, reading, and saving operations
 * across web (File API) and mobile (expo-document-picker) platforms.
 */

/**
 * @description Represents a file with its metadata.
 */
export interface FileData {
  /**
   * @description File name with extension.
   */
  name: string;
  /**
   * @description File MIME type (e.g., 'application/pdf', 'image/png').
   */
  type: string;
  /**
   * @description File size in bytes.
   */
  size: number;
  /**
   * @description File content as Uint8Array.
   */
  data: Uint8Array;
  /**
   * @description Platform-specific file URI (for mobile) or blob URL (for web).
   */
  uri?: string;
}

/**
 * @description Interface for file system operations.
 * Implementations should handle platform-specific file APIs.
 */
export interface FileSystemPort {
  /**
   * @description Opens a document picker dialog and returns the selected file.
   * @param options Optional configuration for file picking (allowed types, multiple files)
   * @returns Promise that resolves to the selected file, or null if cancelled
   */
  pickDocument(options?: {
    /**
     * @description Allowed MIME types (e.g., ['application/pdf', 'image/*']).
     */
    allowedTypes?: string[];
    /**
     * @description Whether to allow multiple file selection.
     */
    multiple?: boolean;
  }): Promise<FileData | FileData[] | null>;

  /**
   * @description Opens an image picker dialog and returns the selected image.
   * @param options Optional configuration for image picking (camera, gallery, quality)
   * @returns Promise that resolves to the selected image, or null if cancelled
   */
  pickImage(options?: {
    /**
     * @description Whether to allow camera capture.
     */
    allowsCamera?: boolean;
    /**
     * @description Whether to allow gallery selection.
     */
    allowsGallery?: boolean;
    /**
     * @description Image quality (0-1) for compression.
     */
    quality?: number;
  }): Promise<FileData | null>;

  /**
   * @description Saves a file to the device's file system.
   * @param data File data to save
   * @param filename Suggested filename for the saved file
   * @returns Promise that resolves when file is saved
   */
  saveFile(data: Uint8Array, filename: string): Promise<void>;

  /**
   * @description Reads a file and returns its content as Uint8Array.
   * @param file File to read
   * @returns Promise that resolves to file content as Uint8Array
   */
  readFile(file: FileData): Promise<Uint8Array>;
}

