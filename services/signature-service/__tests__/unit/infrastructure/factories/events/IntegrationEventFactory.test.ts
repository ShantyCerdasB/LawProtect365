import { IntegrationEventFactory } from '../../../../../src/infrastructure/factories/events/IntegrationEventFactory';

describe('IntegrationEventFactory', () => {
  it('should be importable', () => {
    expect(IntegrationEventFactory).toBeDefined();
  });

  it('should be instantiable', () => {
    const factory = new IntegrationEventFactory();
    expect(factory).toBeDefined();
  });

  it('should have envelopeInvitation method', () => {
    const factory = new IntegrationEventFactory();
    expect(factory.envelopeInvitation).toBeDefined();
    expect(typeof factory.envelopeInvitation).toBe('function');
  });

  it('should have viewerInvitation method', () => {
    const factory = new IntegrationEventFactory();
    expect(factory.viewerInvitation).toBeDefined();
    expect(typeof factory.viewerInvitation).toBe('function');
  });

  it('should have signerDeclined method', () => {
    const factory = new IntegrationEventFactory();
    expect(factory.signerDeclined).toBeDefined();
    expect(typeof factory.signerDeclined).toBe('function');
  });

  it('should have envelopeCancelled method', () => {
    const factory = new IntegrationEventFactory();
    expect(factory.envelopeCancelled).toBeDefined();
    expect(typeof factory.envelopeCancelled).toBe('function');
  });

  it('should have reminderNotification method', () => {
    const factory = new IntegrationEventFactory();
    expect(factory.reminderNotification).toBeDefined();
    expect(typeof factory.reminderNotification).toBe('function');
  });
});
