import { ServiceFactory } from '../../../../../src/infrastructure/factories/services/ServiceFactory';

describe('ServiceFactory', () => {
  it('should be importable', () => {
    expect(ServiceFactory).toBeDefined();
  });

  it('should have createEnvelopeCrudService method', () => {
    expect(ServiceFactory.createEnvelopeCrudService).toBeDefined();
    expect(typeof ServiceFactory.createEnvelopeCrudService).toBe('function');
  });

  it('should have createEnvelopeAccessService method', () => {
    expect(ServiceFactory.createEnvelopeAccessService).toBeDefined();
    expect(typeof ServiceFactory.createEnvelopeAccessService).toBe('function');
  });

  it('should have createEnvelopeStateService method', () => {
    expect(ServiceFactory.createEnvelopeStateService).toBeDefined();
    expect(typeof ServiceFactory.createEnvelopeStateService).toBe('function');
  });

  it('should have createEnvelopeDownloadService method', () => {
    expect(ServiceFactory.createEnvelopeDownloadService).toBeDefined();
    expect(typeof ServiceFactory.createEnvelopeDownloadService).toBe('function');
  });

  it('should have createEnvelopeSignerService method', () => {
    expect(ServiceFactory.createEnvelopeSignerService).toBeDefined();
    expect(typeof ServiceFactory.createEnvelopeSignerService).toBe('function');
  });

  it('should have createEnvelopeNotificationService method', () => {
    expect(ServiceFactory.createEnvelopeNotificationService).toBeDefined();
    expect(typeof ServiceFactory.createEnvelopeNotificationService).toBe('function');
  });

  it('should have createInvitationTokenService method', () => {
    expect(ServiceFactory.createInvitationTokenService).toBeDefined();
    expect(typeof ServiceFactory.createInvitationTokenService).toBe('function');
  });

  it('should have createConsentService method', () => {
    expect(ServiceFactory.createConsentService).toBeDefined();
    expect(typeof ServiceFactory.createConsentService).toBe('function');
  });
});
