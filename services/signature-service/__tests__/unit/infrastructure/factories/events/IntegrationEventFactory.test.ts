import { generateTestIpAddress } from '../../../../integration/helpers/testHelpers';
import { IntegrationEventFactory } from '../../../../../src/infrastructure/factories/events/IntegrationEventFactory';

describe('IntegrationEventFactory', () => {
  let factory: IntegrationEventFactory;

  beforeEach(() => {
    factory = new IntegrationEventFactory();
  });

  function createMockEnvelope() {
    return {
      getId: jest.fn(() => ({ getValue: () => 'test-envelope-id' })),
      getTitle: jest.fn(() => 'Test Envelope'),
      getCreatedBy: jest.fn(() => 'test-user-id')
    };
  }

  function createMockSigner() {
    return {
      getId: jest.fn(() => ({ getValue: () => 'test-signer-id' })),
      getEmail: jest.fn(() => ({ getValue: () => 'test@example.com' })),
      getFullName: jest.fn(() => 'Test User')
    };
  }

  function createMockViewer() {
    return {
      getId: jest.fn(() => ({ getValue: () => 'test-viewer-id' })),
      getEmail: jest.fn(() => ({ getValue: () => 'viewer@example.com' })),
      getFullName: jest.fn(() => 'Test Viewer')
    };
  }

  function createMockNetworkContext() {
    return {
      ipAddress: generateTestIpAddress(),
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      country: 'US'
    };
  }

  it('should be importable', () => {
    expect(IntegrationEventFactory).toBeDefined();
  });

  it('should be instantiable', () => {
    expect(factory).toBeDefined();
  });

  it('should have envelopeInvitation method', () => {
    expect(factory.envelopeInvitation).toBeDefined();
    expect(typeof factory.envelopeInvitation).toBe('function');
  });

  it('should have viewerInvitation method', () => {
    expect(factory.viewerInvitation).toBeDefined();
    expect(typeof factory.viewerInvitation).toBe('function');
  });

  it('should have signerDeclined method', () => {
    expect(factory.signerDeclined).toBeDefined();
    expect(typeof factory.signerDeclined).toBe('function');
  });

  it('should have envelopeCancelled method', () => {
    expect(factory.envelopeCancelled).toBeDefined();
    expect(typeof factory.envelopeCancelled).toBe('function');
  });

  it('should have reminderNotification method', () => {
    expect(factory.reminderNotification).toBeDefined();
    expect(typeof factory.reminderNotification).toBe('function');
  });

  describe('method signatures', () => {
    it('should have envelopeInvitation method with correct signature', () => {
      expect(factory.envelopeInvitation).toBeDefined();
      expect(typeof factory.envelopeInvitation).toBe('function');
      expect(factory.envelopeInvitation.length).toBe(1);
    });

    it('should have viewerInvitation method with correct signature', () => {
      expect(factory.viewerInvitation).toBeDefined();
      expect(typeof factory.viewerInvitation).toBe('function');
      expect(factory.viewerInvitation.length).toBe(1);
    });

    it('should have signerDeclined method with correct signature', () => {
      expect(factory.signerDeclined).toBeDefined();
      expect(typeof factory.signerDeclined).toBe('function');
      expect(factory.signerDeclined.length).toBe(1);
    });

    it('should have envelopeCancelled method with correct signature', () => {
      expect(factory.envelopeCancelled).toBeDefined();
      expect(typeof factory.envelopeCancelled).toBe('function');
      expect(factory.envelopeCancelled.length).toBe(1);
    });

    it('should have reminderNotification method with correct signature', () => {
      expect(factory.reminderNotification).toBeDefined();
      expect(typeof factory.reminderNotification).toBe('function');
      expect(factory.reminderNotification.length).toBe(1);
    });
  });

  describe('event creation with mocks', () => {
    it('should create envelope invitation event with proper structure', () => {
      const mockEnvelope = createMockEnvelope();
      const mockSigner = createMockSigner();

      const args = {
        envelope: mockEnvelope as any,
        signer: mockSigner as any,
        message: 'Please sign this document',
        invitationToken: 'test-token',
        sentAtISO: '2024-01-01T00:00:00.000Z'
      };

      const result = factory.envelopeInvitation(args);

      expect(result).toBeDefined();
      expect(result.name).toBe('ENVELOPE_INVITATION');
      expect(result.payload).toBeDefined();
      expect(result.payload.envelopeId).toBe('test-envelope-id');
      expect(result.payload.signerId).toBe('test-signer-id');
    });

    it('should create viewer invitation event with proper structure', () => {
      const mockEnvelope = createMockEnvelope();

      const args = {
        envelope: mockEnvelope as any,
        email: 'viewer@example.com',
        fullName: 'Viewer User',
        message: 'Please view this document',
        token: 'test-token',
        expiresAtISO: '2024-01-02T00:00:00.000Z',
        sentAtISO: '2024-01-01T00:00:00.000Z'
      };

      const result = factory.viewerInvitation(args);

      expect(result).toBeDefined();
      expect(result.name).toBe('DOCUMENT_VIEW_INVITATION');
      expect(result.payload).toBeDefined();
      expect(result.payload.envelopeId).toBe('test-envelope-id');
      expect(result.payload.viewerEmail).toBe('viewer@example.com');
    });

    it('should create signer declined event with proper structure', () => {
      const mockEnvelope = createMockEnvelope();
      const mockSigner = createMockSigner();

      const args = {
        envelope: mockEnvelope as any,
        signer: mockSigner as any,
        reason: 'I decline to sign',
        whenISO: '2024-01-01T00:00:00.000Z',
        ipAddress: generateTestIpAddress(),
        userAgent: 'TestAgent',
        country: 'US'
      };

      const result = factory.signerDeclined(args);

      expect(result).toBeDefined();
      expect(result.name).toBe('SIGNER_DECLINED');
      expect(result.payload).toBeDefined();
      expect(result.payload.envelopeId).toBe('test-envelope-id');
      expect(result.payload.signerId).toBe('test-signer-id');
      expect(result.payload.declineReason).toBe('I decline to sign');
    });

    it('should create envelope cancelled event with proper structure', () => {
      const mockEnvelope = createMockEnvelope();

      const args = {
        envelope: mockEnvelope as any,
        cancelledByUserId: 'test-user-id',
        whenISO: '2024-01-01T00:00:00.000Z',
        ipAddress: generateTestIpAddress(),
        userAgent: 'TestAgent',
        country: 'US'
      };

      const result = factory.envelopeCancelled(args);

      expect(result).toBeDefined();
      expect(result.name).toBe('ENVELOPE_CANCELLED');
      expect(result.payload).toBeDefined();
      expect(result.payload.envelopeId).toBe('test-envelope-id');
      expect(result.payload.cancelledByUserId).toBe('test-user-id');
    });

    it('should create reminder notification event with proper structure', () => {
      const args = {
        envelopeId: 'test-envelope-id',
        signerId: 'test-signer-id',
        message: 'Please sign this document',
        reminderCount: 1,
        whenISO: '2024-01-01T00:00:00.000Z'
      };

      const result = factory.reminderNotification(args);

      expect(result).toBeDefined();
      expect(result.name).toBe('REMINDER_NOTIFICATION');
      expect(result.payload).toBeDefined();
      expect(result.payload.envelopeId).toBe('test-envelope-id');
      expect(result.payload.signerId).toBe('test-signer-id');
      expect(result.payload.reminderCount).toBe(1);
    });

    it('should handle signer declined event with fallback values', () => {
      const factory = new IntegrationEventFactory();
      const args = {
        envelope: {
          getId: jest.fn(() => ({ getValue: () => 'test-envelope-id' })),
          getTitle: jest.fn(() => 'Test Envelope')
        } as any,
        signer: {
          getId: jest.fn(() => ({ getValue: () => 'test-signer-id' })),
          getFullName: jest.fn(() => null),
          getEmail: jest.fn(() => null)
        } as any,
        reason: 'I decline to sign',
        whenISO: '2024-01-01T00:00:00Z',
        ipAddress: generateTestIpAddress(),
        userAgent: 'TestAgent/1.0',
        country: 'US'
      };

      const result = factory.signerDeclined(args);

      expect(result).toBeDefined();
      expect(result.name).toBe('SIGNER_DECLINED');
      expect(result.payload).toBeDefined();
      expect(result.payload.signerName).toBeNull();
      expect(result.payload.declineReason).toBe('I decline to sign');
    });
  });
});