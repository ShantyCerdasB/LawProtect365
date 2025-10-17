/**
 * @fileoverview Mock for @aws/lambda-invoke-store
 * @summary Mock implementation for AWS Lambda invoke store
 * @description Mock implementation for integration tests to avoid AWS SDK dependencies
 */

/**
 * Mock implementation of AWS Lambda invoke store
 */
export const mockLambdaInvokeStore = {
  invoke: jest.fn().mockResolvedValue({}),
  invokeAsync: jest.fn().mockResolvedValue({}),
  getInvocation: jest.fn().mockResolvedValue({}),
  listInvocations: jest.fn().mockResolvedValue({}),
  deleteInvocation: jest.fn().mockResolvedValue({}),
};

export default mockLambdaInvokeStore;
