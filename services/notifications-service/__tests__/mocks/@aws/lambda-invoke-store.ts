/**
 * @fileoverview Mock for @aws/lambda-invoke-store
 * @summary Mock implementation for AWS Lambda invoke store
 * @description This mock provides a minimal implementation of the AWS Lambda invoke store
 * to prevent Jest from failing when AWS SDK middleware tries to import this module.
 */

export class InvokeStore {
  constructor() {
    // Mock implementation
  }

  async get(key: string): Promise<any> {
    return undefined;
  }

  async set(key: string, value: any): Promise<void> {
    // Mock implementation
  }

  async delete(key: string): Promise<void> {
    // Mock implementation
  }
}

export default InvokeStore;












