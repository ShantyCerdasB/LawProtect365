/**
 * @fileoverview testSetupHelpers - Helper functions for test setup to eliminate code duplication
 * @summary Common test setup patterns
 * @description Provides reusable functions for common test setup patterns
 * to eliminate code duplication across integration tests.
 */

import { WorkflowTestHelper } from './workflowHelpers';
import { TestDataFactory } from './testDataFactory';

/**
 * Interface for envelope setup options
 */
export interface EnvelopeSetupOptions {
  title?: string;
  description?: string;
  signerCount?: number;
  sendToAll?: boolean;
  message?: string;
}

/**
 * Interface for envelope setup result
 */
export interface EnvelopeSetupResult {
  envelopeId: string;
  signerIds: string[];
  createResponse: any;
  addSignersResponse: any;
  sendResponse: any;
}

/**
 * Sets up a complete envelope with signers and sends it
 * @param helper - WorkflowTestHelper instance
 * @param options - Setup options
 * @returns Complete setup result
 */
export async function setupEnvelopeWithSigners(
  helper: WorkflowTestHelper,
  options: EnvelopeSetupOptions = {}
): Promise<EnvelopeSetupResult> {
  const {
    title = 'Test Contract',
    description = 'Document for testing',
    signerCount = 1,
    sendToAll = true,
    message = 'Please sign this document'
  } = options;

  // 1. Create envelope
  const envelopeData = TestDataFactory.createEnvelopeData({
    title,
    description
  });
  const createResponse = await helper.createEnvelope(envelopeData);
  expect(createResponse.id).toBeDefined();
  const envelopeId = createResponse.id;

  // 2. Add signers
  const signers = TestDataFactory.createMultipleSigners(signerCount, 1);
  const addSignersResponse = await helper.updateEnvelope(envelopeId, {
    addSigners: signers
  });
  expect(addSignersResponse.statusCode).toBe(200);
  const signerIds = addSignersResponse.data.signers.map((s: any) => s.id);

  // 3. Send envelope
  const sendResponse = await helper.sendEnvelope(envelopeId, {
    message,
    sendToAll
  });
  expect(sendResponse.statusCode).toBe(200);

  return {
    envelopeId,
    signerIds,
    createResponse,
    addSignersResponse,
    sendResponse
  };
}

/**
 * Sets up a basic envelope without signers
 * @param helper - WorkflowTestHelper instance
 * @param options - Setup options
 * @returns Basic setup result
 */
export async function setupBasicEnvelope(
  helper: WorkflowTestHelper,
  options: EnvelopeSetupOptions = {}
): Promise<{ envelopeId: string; createResponse: any }> {
  const {
    title = 'Test Contract',
    description = 'Document for testing'
  } = options;

  // 1. Create envelope
  const envelopeData = TestDataFactory.createEnvelopeData({
    title,
    description
  });
  const createResponse = await helper.createEnvelope(envelopeData);
  expect(createResponse.id).toBeDefined();
  const envelopeId = createResponse.id;

  return {
    envelopeId,
    createResponse
  };
}

/**
 * Sets up an envelope with signers but doesn't send it
 * @param helper - WorkflowTestHelper instance
 * @param options - Setup options
 * @returns Setup result without sending
 */
export async function setupEnvelopeWithSignersOnly(
  helper: WorkflowTestHelper,
  options: EnvelopeSetupOptions = {}
): Promise<{ envelopeId: string; signerIds: string[]; createResponse: any; addSignersResponse: any }> {
  const {
    title = 'Test Contract',
    description = 'Document for testing',
    signerCount = 1
  } = options;

  // 1. Create envelope
  const envelopeData = TestDataFactory.createEnvelopeData({
    title,
    description
  });
  const createResponse = await helper.createEnvelope(envelopeData);
  expect(createResponse.id).toBeDefined();
  const envelopeId = createResponse.id;

  // 2. Add signers
  const signers = TestDataFactory.createMultipleSigners(signerCount, 1);
  const addSignersResponse = await helper.updateEnvelope(envelopeId, {
    addSigners: signers
  });
  expect(addSignersResponse.statusCode).toBe(200);
  const signerIds = addSignersResponse.data.signers.map((s: any) => s.id);

  return {
    envelopeId,
    signerIds,
    createResponse,
    addSignersResponse
  };
}
