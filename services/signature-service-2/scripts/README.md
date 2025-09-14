# DynamoDB Local Setup for Signature Service

This directory contains scripts and configuration for running the signature service with DynamoDB Local for development and testing.

## Overview

The signature service now supports three environments:

1. **Test Environment** - Uses DynamoDB Local with test tables
2. **Local Development** - Uses DynamoDB Local with local tables  
3. **Production** - Uses real AWS DynamoDB

## Quick Start

### For Testing
```bash
# Run tests with DynamoDB Local (automatic setup)
npm test

# Run tests with manual DynamoDB Local control
npm run test:local
```

### For Local Development
```bash
# Start DynamoDB Local and development server
npm run dev:local

# Or manually:
npm run dynamodb:start
npm run dev
```

## Available Scripts

### Test Scripts
- `npm test` - Run tests with automatic DynamoDB Local setup
- `npm run test:local` - Run tests with manual DynamoDB Local control
- `npm run test:watch` - Run tests in watch mode

### Development Scripts
- `npm run dev` - Start development server (requires DynamoDB Local)
- `npm run dev:local` - Start DynamoDB Local and development server

### DynamoDB Local Scripts
- `npm run dynamodb:start` - Start DynamoDB Local server
- `npm run dynamodb:stop` - Stop DynamoDB Local server
- `npm run dynamodb:create-tables` - Create tables in running DynamoDB Local
- `npm run dynamodb:setup` - Start DynamoDB Local and create tables
- `npm run dynamodb:reset` - Stop, start, and recreate tables

## Environment Configuration

### Test Environment
- **Endpoint**: `http://localhost:8000`
- **Tables**: `test-*` prefix
- **Credentials**: `fake`/`fake`
- **Region**: `us-east-1`

### Local Development Environment
- **Endpoint**: `http://localhost:8000`
- **Tables**: `local-*` prefix
- **Credentials**: `fake`/`fake`
- **Region**: `us-east-1`

### Production Environment
- **Endpoint**: AWS DynamoDB (no endpoint specified)
- **Tables**: Production table names
- **Credentials**: AWS credentials
- **Region**: `us-east-1` (or configured region)

## Table Schema

The following tables are created automatically:

1. **test-envelopes** / **local-envelopes** - Envelope aggregates
2. **test-documents** / **local-documents** - Document records
3. **test-inputs** / **local-inputs** - Input field records
4. **test-parties** / **local-parties** - Party records
5. **test-idempotency** / **local-idempotency** - Idempotency tokens
6. **test-outbox** / **local-outbox** - Outbox events
7. **test-audit** / **local-audit** - Audit events
8. **test-consent** / **local-consent** - Consent records
9. **test-delegation** / **local-delegation** - Delegation records
10. **test-global-parties** / **local-global-parties** - Global party records

## Environment Variables

### Required for All Environments
```bash
AWS_REGION=us-east-1
```

### For Test/Local Environments
```bash
AWS_ENDPOINT_URL=http://localhost:8000
AWS_ACCESS_KEY_ID=fake
AWS_SECRET_ACCESS_KEY=fake
```

### Table Names (Auto-configured)
```bash
ENVELOPES_TABLE=test-envelopes  # or local-envelopes
DOCUMENTS_TABLE=test-documents  # or local-documents
INPUTS_TABLE=test-inputs        # or local-inputs
PARTIES_TABLE=test-parties      # or local-parties
IDEMPOTENCY_TABLE=test-idempotency  # or local-idempotency
OUTBOX_TABLE=test-outbox        # or local-outbox
AUDIT_TABLE=test-audit          # or local-audit
CONSENT_TABLE=test-consent      # or local-consent
DELEGATION_TABLE=test-delegation # or local-delegation
GLOBAL_PARTIES_TABLE=test-global-parties  # or local-global-parties
```

## Troubleshooting

### DynamoDB Local Won't Start
```bash
# Check if port 8000 is in use
lsof -i :8000

# Kill any existing DynamoDB Local processes
npm run dynamodb:stop

# Try starting again
npm run dynamodb:start
```

### Tables Not Created
```bash
# Check if DynamoDB Local is running
curl http://localhost:8000

# Create tables manually
npm run dynamodb:create-tables
```

### Tests Failing
```bash
# Reset DynamoDB Local completely
npm run dynamodb:reset

# Run tests again
npm test
```

### Development Server Issues
```bash
# Make sure DynamoDB Local is running
npm run dynamodb:start

# Check if tables exist
npm run dynamodb:create-tables

# Start development server
npm run dev
```

## Architecture

### Environment Detection
The system automatically detects the environment based on:
- `NODE_ENV` environment variable
- `AWS_ENDPOINT_URL` environment variable
- `JEST_WORKER_ID` (for tests)

### Configuration Flow
1. **Environment Detection** - Determines if running in test, local, or production
2. **DynamoDB Config** - Creates appropriate DynamoDB client configuration
3. **Table Names** - Sets table names with appropriate prefixes
4. **Client Creation** - Creates DynamoDB clients with correct endpoints and credentials

### Test Flow
1. **Global Setup** - Starts DynamoDB Local and creates test tables
2. **Test Execution** - Runs tests against real DynamoDB Local
3. **Global Teardown** - Stops DynamoDB Local

## Benefits

### Real Integration Testing
- Tests run against actual DynamoDB operations
- Validates real table schemas and constraints
- Tests actual error handling and edge cases
- No mock inconsistencies

### Development Consistency
- Local development matches production behavior
- Real DynamoDB operations and performance
- Actual AWS SDK behavior
- Proper error handling

### CI/CD Ready
- Tests can run in any environment
- No external dependencies
- Deterministic test results
- Fast test execution
