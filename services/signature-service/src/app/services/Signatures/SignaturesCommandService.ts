/**
 * @file SignaturesCommandService.ts
 * @summary Command service for Signatures operations
 * @description Wrapper service for Signatures command operations
 */

import type { 
  SignHashCommand,
  SignHashResult
} from "../../../app/ports/signatures/SignaturesCommandsPort";
import type { SignaturesCommandsPort } from "../../ports/signatures/SignaturesCommandsPort";

/**
 * @summary Command service for Signatures operations
 * @description Default implementation of SignaturesCommandService
 */
export class SignaturesCommandService {
  constructor(private readonly commandsPort: SignaturesCommandsPort) {}

  /**
   * Signs a hash digest using KMS
   * @param command - The hash signing command
   * @returns Promise resolving to signing result
   */
  async signHash(command: SignHashCommand): Promise<SignHashResult> {
    return this.commandsPort.signHash(command);
  }
};
