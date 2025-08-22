import { TrimmedString } from "@lawprotect/shared-ts";

/**
 * Safe reason string for decline/cancel actions.
 */
export const ReasonSchema = TrimmedString; 
export type Reason = string;
