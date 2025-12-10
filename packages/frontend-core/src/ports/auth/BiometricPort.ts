/**
 * @fileoverview Biometric Port - Interface for biometric authentication
 * @summary Platform-agnostic biometric authentication abstraction
 * @description Defines a contract for biometric authentication (fingerprint, face, iris)
 * across web (WebAuthn) and mobile (TouchID/FaceID/Fingerprint) platforms.
 */

/**
 * @description Type of biometric authentication available on the device.
 */
export type BiometricType = 'fingerprint' | 'face' | 'iris' | null;

/**
 * @description Interface for biometric authentication operations.
 * Implementations should use platform-native biometric APIs.
 */
export interface BiometricPort {
  /**
   * @description Checks if biometric authentication is available on the device.
   * @returns Promise that resolves to true if biometrics are available, false otherwise
   */
  isAvailable(): Promise<boolean>;

  /**
   * @description Initiates biometric authentication flow.
   * @param reason User-facing reason for authentication (displayed in prompt)
   * @returns Promise that resolves to true if authentication succeeds, false if cancelled or fails
   */
  authenticate(reason: string): Promise<boolean>;

  /**
   * @description Gets the type of biometric authentication available on the device.
   * @returns Promise that resolves to the biometric type, or null if unavailable
   */
  getBiometricType(): Promise<BiometricType>;
}

