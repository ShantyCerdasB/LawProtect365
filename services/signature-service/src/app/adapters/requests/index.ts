/**
 * @file index.ts
 * @summary Request adapters barrel export.
 * @description Re-exports all request adapters for convenient importing.
 */

export { makeRequestsCommandsPort } from "./makeRequestsCommandsPort";
export { makeRequestsQueriesPort } from "./makeRequestsQueriesPort";
export type { RequestsQueriesPortDependencies } from "./makeRequestsQueriesPort";
