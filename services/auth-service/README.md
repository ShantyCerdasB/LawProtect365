# Auth Service

## Overview

The Auth Service is a microservice responsible for user authentication, authorization, and user management within the LawProtect365 platform. It provides comprehensive APIs for user registration, authentication, role management, and audit trails with full compliance features.

## Architecture

This service follows a microservice architecture pattern with:
- **Domain-Driven Design (DDD)** with clean architecture principles
- **JWT-based authentication** with Cognito integration
- **Role-based access control (RBAC)** with hierarchical permissions
- **Multi-factor authentication (MFA)** support
- **OAuth provider integration** for social login
- **Comprehensive audit trails** for compliance

## Project Structure

```
services/auth-service/
├── src/
│   ├── config/                    # Configuration management
│   │   ├── AppConfig.ts           # Environment configuration
│   │   └── index.ts
│   │
│   ├── domain/                    # Domain layer (DDD)
│   │   ├── entities/              # Domain entities
│   │   │   ├── User.ts            # User aggregate root
│   │   │   ├── OAuthAccount.ts    # OAuth provider accounts
│   │   │   ├── Role.ts            # User roles
│   │   │   ├── UserAuditEvent.ts  # Audit events
│   │   │   └── index.ts
│   │   ├── enums/                 # Domain enums
│   │   │   ├── UserAccountStatus.ts
│   │   │   ├── UserAuditAction.ts
│   │   │   ├── UserRole.ts
│   │   │   ├── OAuthProvider.ts
│   │   │   └── index.ts
│   │   ├── value-objects/         # Value objects
│   │   │   ├── UserId.ts          # User identifier
│   │   │   ├── CognitoSub.ts      # Cognito subject identifier
│   │   │   └── index.ts
│   │   ├── rules/                 # Business rules
│   │   │   ├── RoleAssignmentRules.ts
│   │   │   ├── MfaPolicyRules.ts
│   │   │   ├── UserLifecycleRules.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── schemas/                   # Validation schemas
│   │   ├── MeSchema.ts           # GET/PATCH /me
│   │   ├── UsersQuerySchema.ts   # GET /users
│   │   ├── SetRolesSchema.ts     # POST /users/{id}/roles
│   │   ├── SetStatusSchema.ts    # POST /users/{id}:set-status
│   │   ├── LinkProviderSchema.ts # POST /users/{id}:link-provider
│   │   └── index.ts
│   │
│   ├── types/                     # Type definitions
│   │   ├── dto/                   # Data transfer objects
│   │   │   ├── MeDTO.ts
│   │   │   ├── UserDTO.ts
│   │   │   ├── RoleDTO.ts
│   │   │   └── ProviderLinkDTO.ts
│   │   ├── events/                # Event types
│   │   │   ├── IntegrationEventTypes.ts
│   │   │   └── index.ts
│   │   ├── cognito/               # Cognito trigger types
│   │   │   ├── PreAuthEvent.ts
│   │   │   ├── PreTokenGenEvent.ts
│   │   │   ├── PostConfirmEvent.ts
│   │   │   └── PostAuthEvent.ts
│   │   └── index.ts
│   │
│   ├── handlers/                  # HTTP handlers
│   │   ├── users/                 # User endpoints
│   │   │   ├── GetMeHandler.ts    # GET /me
│   │   │   └── PatchMeHandler.ts  # PATCH /me
│   │   └── admin/                 # Admin endpoints
│   │       ├── ListUsersHandler.ts
│   │       ├── GetUserHandler.ts
│   │       ├── SetRolesHandler.ts
│   │       ├── SetStatusHandler.ts
│   │       └── LinkProviderHandler.ts
│   │
│   ├── triggers/                  # Cognito triggers
│   │   ├── PreAuthenticationTrigger.ts
│   │   ├── PreTokenGenerationTrigger.ts
│   │   ├── PostConfirmationTrigger.ts
│   │   └── PostAuthenticationTrigger.ts
│   │
│   ├── jobs/                      # Scheduled jobs
│   │   └── MfaDriftReconciler.ts
│   │
│   ├── services/                  # Domain services
│   │   ├── AuthzService.ts        # Authorization service
│   │   ├── RoleService.ts         # Role management
│   │   ├── UserService.ts         # User management
│   │   ├── ProviderLinkService.ts # OAuth provider linking
│   │   ├── CognitoService.ts      # Cognito integration
│   │   ├── EventBusService.ts     # Event publishing
│   │   └── AuditService.ts        # Audit trail
│   │
│   ├── repositories/              # Data repositories
│   │   ├── UserRepository.ts
│   │   ├── OAuthAccountRepository.ts
│   │   ├── RoleRepository.ts
│   │   └── UserAuditEventRepository.ts
│   │
│   ├── infrastructure/            # Infrastructure layer
│   │   └── factories/
│   │       ├── CompositionRoot.ts
│   │       ├── RepositoryFactory.ts
│   │       ├── ServiceFactory.ts
│   │       └── AwsClientFactory.ts
│   │
│   ├── auth-errors/               # Error handling
│   │   ├── codes.ts              # Error codes
│   │   ├── factories.ts          # Error factories
│   │   └── index.ts
│   │
│   └── index.ts
│
├── __tests__/                     # Test files
│   ├── unit/                      # Unit tests
│   ├── integration/               # Integration tests
│   ├── helpers/                   # Test helpers
│   └── mocks/                     # Test mocks
│
├── package.json
├── tsconfig.json
├── tsconfig.jest.json
├── jest.unit.cjs
├── jest.integration.cjs
└── README.md
```

## Development Setup

### Prerequisites

- Node.js 18+
- AWS CLI configured
- Access to Cognito User Pool

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit environment variables
   nano .env
   ```

3. **Run tests:**
   ```bash
   # Run all tests
   npm test
   
   # Run unit tests only
   npm run test:unit
   
   # Run integration tests only
   npm run test:integration
   ```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Build the TypeScript project |
| `npm test` | Run all tests |
| `npm run test:unit` | Run unit tests only |
| `npm run test:integration` | Run integration tests only |
| `npm run typecheck` | Type check without compilation |

## API Endpoints

### User Management (Authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/me` | Get current user profile |
| `PATCH` | `/me` | Update current user profile |

### Admin Management (Admin/Super Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/users` | List users with pagination |
| `GET` | `/users/{id}` | Get user details |
| `POST` | `/users/{id}/roles` | Assign roles to user |
| `POST` | `/users/{id}:set-status` | Change user status |
| `POST` | `/users/{id}:link-provider` | Link OAuth provider |

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `AWS_REGION` | AWS region for services | `us-east-1` |
| `COGNITO_USER_POOL_ID` | Cognito User Pool ID | Required |
| `COGNITO_CLIENT_ID` | Cognito Client ID | Required |
| `COGNITO_CLIENT_SECRET` | Cognito Client Secret | Optional |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRATION` | JWT expiration time | `24h` |
| `MFA_REQUIRED` | Require MFA for all users | `false` |
| `MFA_OPTIONAL` | Allow optional MFA | `true` |
| `SOCIAL_LOGIN_ENABLED` | Enable social login | `true` |
| `ADMIN_USER_MANAGEMENT` | Enable admin user management | `true` |

## Features

### Authentication
- JWT-based authentication with Cognito
- Multi-factor authentication (MFA) support
- OAuth provider integration (Google, Microsoft, Apple)
- Session management and token refresh

### Authorization
- Role-based access control (RBAC)
- Hierarchical role permissions
- Fine-grained permission system
- Admin user management

### User Management
- User registration and verification
- Profile management
- User lifecycle management (active, suspended, deleted)
- OAuth account linking

### Security
- Comprehensive audit trails
- Security event tracking
- Rate limiting and abuse prevention
- Compliance reporting

## Testing

### Test Structure

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test API endpoints with mocked AWS services
- **Coverage**: 79% branches, 91% functions/lines/statements

### Test Environment

The test environment uses:
- **AWS Service Mocks**: For Cognito, EventBridge, SSM operations
- **Mock JWKS Server**: For JWT token validation during tests
- **Realistic Mocks**: For comprehensive testing without external dependencies

## Deployment

### CI/CD Pipeline

The service is designed to work with AWS CodePipeline and CodeBuild:
- **TypeScript Compilation**: Strict type checking
- **Test Execution**: Unit and integration tests
- **Code Quality**: ESLint and SonarQube compliance
- **Security Scanning**: Dependency vulnerability checks

### Production Considerations

- Use real AWS services (Cognito, EventBridge, SSM)
- Configure proper IAM roles and policies
- Set up monitoring and logging
- Implement proper secret management
- Enable MFA for production environments

## Contributing

1. Follow the established TSDoc documentation standards
2. Ensure all functions have proper `@param`, `@returns`, and `@throws` documentation
3. Run tests before submitting changes
4. Use the shared utilities from `@lawprotect/shared-ts` when possible
5. Follow the domain-driven design principles

## Dependencies

### Core Dependencies
- **AWS SDK v3**: For AWS service integration
- **JWT**: For token-based authentication
- **Shared TypeScript Package**: For common utilities and types

### Development Dependencies
- **Jest**: For testing framework
- **TypeScript**: For type safety
- **tsx**: For TypeScript execution

## License

This project is part of the LawProtect365 platform and is proprietary software.
