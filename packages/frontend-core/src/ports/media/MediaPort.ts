/**
 * @fileoverview Media Port - Interface for camera and gallery operations
 * @summary Platform-agnostic media capture abstraction
 * @description Defines a contract for camera and gallery access across
 * web (getUserMedia API) and mobile (expo-camera/expo-image-picker) platforms.
 */

/**
 * @description Represents a captured or selected media item.
 */
export interface MediaItem {
  /**
   * @description URI or blob URL to the media file.
   */
  uri: string;
  /**
   * @description Optional base64-encoded representation of the media.
   */
  base64?: string;
  /**
   * @description Media width in pixels.
   */
  width?: number;
  /**
   * @description Media height in pixels.
   */
  height?: number;
  /**
   * @description Media MIME type (e.g., 'image/jpeg', 'video/mp4').
   */
  type?: string;
}

/**
 * @description Interface for media capture and selection operations.
 * Implementations should use platform-native camera and gallery APIs.
 */
export interface MediaPort {
  /**
   * @description Opens the camera to capture a photo.
   * @param options Optional configuration for camera capture (quality, format)
   * @returns Promise that resolves to the captured photo, or null if cancelled
   */
  takePhoto(options?: {
    /**
     * @description Image quality (0-1) for compression.
     */
    quality?: number;
    /**
     * @description Whether to include base64 representation.
     */
    includeBase64?: boolean;
  }): Promise<MediaItem | null>;

  /**
   * @description Opens the gallery to select a photo or video.
   * @param options Optional configuration for gallery selection (media type, quality)
   * @returns Promise that resolves to the selected media, or null if cancelled
   */
  pickFromGallery(options?: {
    /**
     * @description Media type to allow ('photo', 'video', or 'all').
     */
    mediaType?: 'photo' | 'video' | 'all';
    /**
     * @description Image quality (0-1) for compression.
     */
    quality?: number;
    /**
     * @description Whether to include base64 representation.
     */
    includeBase64?: boolean;
  }): Promise<MediaItem | null>;
}

