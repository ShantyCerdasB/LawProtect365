/**
 * @fileoverview Frontend Core - Shared library for web and mobile applications
 * @summary Cross-platform business logic, HTTP client, React Query, and ports
 * @description Provides platform-agnostic modules, foundation utilities, and port interfaces
 * for building consistent frontend applications across web and React Native platforms.
 */

export * from './foundation';
export * from './ports';
export * from './modules/auth';
export * from './modules/users';
export * from './modules/kyc';
export * from './modules/signature';
export * from './modules/documents';
