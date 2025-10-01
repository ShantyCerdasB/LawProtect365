import { UseCaseFactory } from '../../../../../src/infrastructure/factories/use-cases/UseCaseFactory';

describe('UseCaseFactory', () => {
  it('should be importable', () => {
    expect(UseCaseFactory).toBeDefined();
  });

  it('should have createCreateEnvelopeUseCase method', () => {
    expect(UseCaseFactory.createCreateEnvelopeUseCase).toBeDefined();
    expect(typeof UseCaseFactory.createCreateEnvelopeUseCase).toBe('function');
  });

  it('should have createGetEnvelopeUseCase method', () => {
    expect(UseCaseFactory.createGetEnvelopeUseCase).toBeDefined();
    expect(typeof UseCaseFactory.createGetEnvelopeUseCase).toBe('function');
  });

  it('should have createUpdateEnvelopeUseCase method', () => {
    expect(UseCaseFactory.createUpdateEnvelopeUseCase).toBeDefined();
    expect(typeof UseCaseFactory.createUpdateEnvelopeUseCase).toBe('function');
  });

  it('should have createSignDocumentUseCase method', () => {
    expect(UseCaseFactory.createSignDocumentUseCase).toBeDefined();
    expect(typeof UseCaseFactory.createSignDocumentUseCase).toBe('function');
  });

  it('should have createDownloadDocumentUseCase method', () => {
    expect(UseCaseFactory.createDownloadDocumentUseCase).toBeDefined();
    expect(typeof UseCaseFactory.createDownloadDocumentUseCase).toBe('function');
  });

  it('should have createDeclineSignerUseCase method', () => {
    expect(UseCaseFactory.createDeclineSignerUseCase).toBeDefined();
    expect(typeof UseCaseFactory.createDeclineSignerUseCase).toBe('function');
  });
});
