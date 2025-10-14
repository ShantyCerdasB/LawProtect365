# EventPublishingService Usage Guide

## Overview

`EventPublishingService` provides a centralized way to publish integration events across all triggers and use cases in the auth-service. It encapsulates the logic for publishing events using the Outbox pattern.

## Usage Examples

### 1. In PostAuthenticationTrigger

```typescript
// PostAuthenticationOrchestrator.ts
export class PostAuthenticationOrchestrator {
  constructor(
    private readonly eventPublishingService: EventPublishingService
  ) {}

  private async publishIntegrationEvents(user: User, created: boolean) {
    if (created) {
      await this.eventPublishingService.publishUserRegistered(user, {
        source: 'PostAuthentication'
      });
    } else {
      await this.eventPublishingService.publishUserUpdated(user, {
        source: 'PostAuthentication'
      });
    }
  }
}
```

### 2. In PreAuthenticationTrigger

```typescript
// PreAuthenticationTrigger.ts
export class PreAuthenticationTrigger extends LambdaTriggerBase<PreAuthEvent, PreAuthResult> {
  protected async processEvent(event: PreAuthEvent): Promise<PreAuthResult> {
    const cr = await CompositionRoot.build();
    
    // Publish access attempt event
    await cr.eventPublishingService.publishCustomEvent('UserAccessAttempt', {
      userId: user.getId().toString(),
      email: user.getEmail()?.toString(),
      status: user.getStatus(),
      ipAddress: event.request.userAttributes?.ip_address
    });
    
    return event;
  }
}
```

### 3. In PreTokenGenerationTrigger

```typescript
// PreTokenGenerationTrigger.ts
export class PreTokenGenerationTrigger extends LambdaTriggerBase<PreTokenEvent, PreTokenResult> {
  protected async processEvent(event: PreTokenEvent): Promise<PreTokenResult> {
    const cr = await CompositionRoot.build();
    
    // Publish token generation event
    await cr.eventPublishingService.publishCustomEvent('TokenGenerated', {
      userId: user.getId().toString(),
      role: user.getRole(),
      mfaEnabled: user.isMfaEnabled(),
      tokenType: 'access_token'
    });
    
    return event;
  }
}
```

### 4. In PostConfirmationTrigger

```typescript
// PostConfirmationTrigger.ts
export class PostConfirmationTrigger extends LambdaTriggerBase<PostConfirmEvent, PostConfirmResult> {
  protected async processEvent(event: PostConfirmEvent): Promise<PostConfirmResult> {
    const cr = await CompositionRoot.build();
    
    // Publish user confirmation event
    await cr.eventPublishingService.publishUserRegistered(user, {
      source: 'PostConfirmation',
      confirmationMethod: 'email'
    });
    
    return event;
  }
}
```

## Available Methods

### User Events
- `publishUserRegistered(user, metadata?)` - User registration
- `publishUserUpdated(user, metadata?)` - User profile update
- `publishUserRoleChanged(user, oldRole, newRole, metadata?)` - Role change
- `publishUserStatusChanged(user, oldStatus, newStatus, metadata?)` - Status change
- `publishMfaStatusChanged(user, mfaEnabled, metadata?)` - MFA status change

### OAuth Events
- `publishOAuthAccountLinked(user, provider, providerAccountId, metadata?)` - OAuth link
- `publishOAuthAccountUnlinked(user, provider, providerAccountId, metadata?)` - OAuth unlink

### Custom Events
- `publishCustomEvent(eventType, eventData, dedupId?)` - Custom event with full control

## Event Structure

All events follow this structure:
```typescript
{
  type: string,           // Event type (e.g., 'UserRegistered')
  source: 'auth-service',  // Service source
  data: {
    userId: string,
    email?: string,
    role: string,
    status: string,
    mfaEnabled: boolean,
    firstName: string,
    lastName: string,
    timestamp: string,    // ISO timestamp
    ...additionalData     // Custom metadata
  }
}
```

## Benefits

1. **Centralized Logic**: All event publishing logic in one place
2. **Type Safety**: Strongly typed event methods
3. **Non-blocking**: Events don't fail the main flow
4. **Reusable**: Can be used across all triggers and use cases
5. **Consistent**: Same event structure across all services
6. **Extensible**: Easy to add new event types

## Error Handling

All event publishing is non-blocking. If an event fails to publish:
- A warning is logged
- The main flow continues
- No exceptions are thrown

This ensures that event publishing failures don't break the authentication flow.
