# Signature Service

## Overview

The Signature Service is a microservice responsible for managing digital signature workflows, document processing, and signature validation within the LawProtect365 platform. It provides comprehensive APIs for creating, managing, and executing digital signature processes with full audit trails and compliance features.

## Architecture

This service follows a microservice architecture pattern with:
- **Single-table design** using DynamoDB with partition/sort key patterns
- **Event-driven architecture** with EventBridge for asynchronous processing
- **JWT-based authentication** with Cognito integration
- **KMS encryption** for document signing operations
- **S3 storage** for document and evidence management

## Project Structure

```
services/signature-service/
├── __tests__/                    # Test files and configurations
│   ├── globalSetup.ts           # Jest global setup for test environment
│   ├── globalTeardown.ts        # Jest global teardown for cleanup
│   ├── setup.ts                 # Jest setup file for test configuration
│   └── integration/             # Integration test files
│       └── helpers/             # Test helper utilities
│           └── mockJwksServer.ts # Mock JWKS server for JWT testing
├── scripts/                     # Utility scripts for development
│   ├── createLocalTables.ts     # DynamoDB table creation script
│   ├── setupLocalStack.ts       # LocalStack AWS services setup
│   ├── startDynamoDB.ts         # DynamoDB Local management
│   └── startLocalStack.ts       # LocalStack container management
├── src/                         # Source code
├── jest.config.cjs              # Jest configuration
├── jest.base.cjs                # Base Jest configuration
├── package.json                 # Dependencies and scripts
└── README.md                    # This file
```

## Development Setup

### Prerequisites

- Node.js 18+
- Docker Desktop
- AWS CLI (for production deployments)

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start LocalStack (AWS services emulation):**
   ```bash
   npm run localstack:start
   ```

3. **Start DynamoDB Local:**
   ```bash
   npm run dynamodb:start
   ```

4. **Create local tables:**
   ```bash
   npm run dynamodb:create-tables
   ```

5. **Run tests:**
   ```bash
   # Run all tests
   npm test
   
   # Run tests in CI mode (without pretest hooks)
   npm run test:ci
   ```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Build the TypeScript project |
| `npm test` | Run all tests with full setup |
| `npm run test:ci` | Run tests without pretest hooks (for CI) |
| `npm run localstack:start` | Start LocalStack container |
| `npm run localstack:reset` | Reset LocalStack container |
| `npm run dynamodb:start` | Start DynamoDB Local |
| `npm run dynamodb:create-tables` | Create DynamoDB tables |
| `npm run dynamodb:stop` | Stop DynamoDB Local |

## API Endpoints

### Envelopes Management (JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/envelopes` | Create a new envelope with metadata and policies |
| `GET` | `/envelopes` | List/paginate envelopes by state/date/tenant |
| `GET` | `/envelopes/{id}` | Get envelope details |
| `PATCH` | `/envelopes/{id}` | Update envelope in draft state |
| `DELETE` | `/envelopes/{id}` | Delete draft envelope (hard delete) |
| `GET` | `/envelopes/{id}/status` | Get consolidated status (who signed/when/missing) |
| `GET` | `/envelopes/{id}/events` | Get event history/audit trail |

### Document Management (JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/envelopes/{id}/documents` | Attach document to envelope |
| `GET` | `/envelopes/{id}/documents` | List envelope documents |
| `GET` | `/envelopes/{id}/documents/{docId}` | Get document metadata |
| `PATCH` | `/envelopes/{id}/documents/{docId}` | Update document metadata/party mapping |
| `DELETE` | `/envelopes/{id}/documents/{docId}` | Remove document (if draft) |

### Input Fields Management (JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/envelopes/{id}/inputs` | Define input fields (signature/initials/text/checkbox) |
| `GET` | `/envelopes/{id}/inputs` | List defined input fields |
| `PATCH` | `/envelopes/{id}/inputs/{inputId}` | Update field type/positions/validations |
| `DELETE` | `/envelopes/{id}/inputs/{inputId}` | Delete input field |

### Parties Management (JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/envelopes/{id}/parties` | Add party (email, role, sequence, MFA) |
| `GET` | `/envelopes/{id}/parties` | List envelope parties |
| `GET` | `/envelopes/{id}/parties/{partyId}` | Get party details |
| `PATCH` | `/envelopes/{id}/parties/{partyId}` | Update party role/order/verification |
| `DELETE` | `/envelopes/{id}/parties/{partyId}` | Remove party (if draft) |
| `POST` | `/envelopes/{id}/parties/{partyId}/delegate` | Delegate to another person |

### Workflow Actions (JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/envelopes/{id}/send` | Send invitations and generate signing tokens |
| `POST` | `/envelopes/{id}/invitations` | Resend invitation for parties |
| `POST` | `/envelopes/{id}/reminders` | Send reminders to pending parties |
| `POST` | `/envelopes/{id}/cancel` | Cancel envelope (revoke tokens) |
| `POST` | `/envelopes/{id}/finalise` | Force close when all parties signed |
| `GET` | `/envelopes/{id}/audit-trail` | Get audit trail (JSON/PDF) |
| `GET` | `/documents/{id}/certificate` | Get signature certificate for document |
| `GET` | `/envelopes/{id}/certificate` | Get final envelope certificate |

### Public Signing (Token-based, No JWT)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/signing/{token}` | Load signing session (documents/fields/branding) |
| `POST` | `/signing/{token}/consent` | Record ESIGN/UETA consent |
| `POST` | `/signing/{token}/otp/request` | Generate and send OTP |
| `POST` | `/signing/{token}/otp/verify` | Verify OTP and authorize session |
| `POST` | `/signing/{token}/presign-upload` | Get presigned URL for PDF upload |
| `POST` | `/signing/{token}/complete` | Validate PDF hash and sign with KMS |
| `POST` | `/signing/{token}/decline` | Decline with reason |
| `GET` | `/signing/{token}/download` | Download PDF copy for signer |

### Utilities (JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/envelopes/{id}/documents/{docId}/pages/{pageNo}` | Get page thumbnail/preview |

## Testing

### Test Structure

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test API endpoints with real AWS services (LocalStack)
- **Global Setup/Teardown**: Manages test environment lifecycle

### Test Environment

The test environment uses:
- **DynamoDB Local**: For database operations
- **LocalStack**: For AWS services emulation (S3, KMS, EventBridge, SSM)
- **Mock JWKS Server**: For JWT token validation during tests
- **Runtime Certificate Generation**: JWKS certificates are generated at runtime

### Running Tests

```bash
# Run all tests with full environment setup
npm test

# Run tests in CI mode (skips pretest hooks)
npm run test:ci

# Run specific test files
npm test -- --testPathPattern=integration
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `AWS_REGION` | AWS region for services | `us-east-1` |
| `DYNAMODB_ENDPOINT` | DynamoDB endpoint | `http://localhost:8000` |
| `LOCALSTACK_ENDPOINT` | LocalStack endpoint | `http://localhost:4566` |
| `JWT_ISSUER` | JWT token issuer | Cognito User Pool |
| `JWT_AUDIENCE` | JWT token audience | Cognito Client ID |
| `KMS_SIGNER_KEY_ID` | KMS key for signing | `alias/lawprotect365-sign-key-test` |

### LocalStack Services

The following AWS services are emulated in LocalStack:
- **S3**: Document and evidence storage
- **KMS**: Document signing and encryption
- **EventBridge**: Event-driven processing
- **SSM**: Configuration parameter storage
- **Cognito**: User authentication (Pro tier only)

## Deployment

### CI/CD Pipeline

The service is designed to work with AWS CodePipeline and CodeBuild:
- **Privileged Mode**: Required for Docker-in-Docker operations
- **LocalStack Alternative**: Use realistic mocks for CI environments
- **Test Strategy**: `test:ci` script bypasses local service dependencies

### Production Considerations

- Use real AWS services instead of LocalStack
- Configure proper IAM roles and policies
- Set up monitoring and logging
- Implement proper secret management

## Contributing

1. Follow the established TSDoc documentation standards
2. Ensure all functions have proper `@param`, `@returns`, and `@throws` documentation
3. Run tests before submitting changes
4. Use the shared utilities from `@lawprotect/shared-ts` when possible

## Dependencies

### Core Dependencies
- **AWS SDK v3**: For AWS service integration
- **DynamoDB Local**: For local database testing
- **Jest**: For testing framework
- **TypeScript**: For type safety

### Development Dependencies
- **LocalStack**: For AWS services emulation
- **tsx**: For TypeScript execution
- **Docker**: For containerized services

## License

This project is part of the LawProtect365 platform and is proprietary software.