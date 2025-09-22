# Lambda Functions - Event Publisher

This directory contains AWS Lambda functions for processing outbox events and ensuring reliable event delivery.

## 📁 Files Overview

### Core Lambda Functions
- **`EventPublisherLambda.ts`** - Main Lambda function that processes pending outbox events
- **`LambdaConfig.ts`** - Configuration utilities and factory methods for Lambda functions
- **`EventBridgeRuleConfig.ts`** - Configuration examples for EventBridge rules and scheduling

### Adapters
- **`adapters/AwsClientAdapters.ts`** - Adapters for AWS clients (DynamoDB, EventBridge)
- **`adapters/index.ts`** - Barrel exports for adapters

## 🚀 Next Steps for AWS Deployment

### 1. Create DynamoDB Table for Outbox

```bash
# Create outbox table
aws dynamodb create-table \
  --table-name signature-service-outbox \
  --attribute-definitions \
    AttributeName=pk,AttributeType=S \
    AttributeName=sk,AttributeType=S \
  --key-schema \
    AttributeName=pk,KeyType=HASH \
    AttributeName=sk,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST
```

### 2. Create EventBridge Bus

```bash
# Create custom event bus
aws events create-event-bus \
  --name lawprotect-event-bus \
  --description "LawProtect365 Event Bus for signature service events"
```

### 3. Deploy Lambda Function

#### Option A: Using AWS CLI
```bash
# Package the Lambda function
npm run build
zip -r event-publisher-lambda.zip dist/

# Create Lambda function
aws lambda create-function \
  --function-name EventPublisherLambda \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role \
  --handler EventPublisherLambda.handler \
  --zip-file fileb://event-publisher-lambda.zip \
  --timeout 300 \
  --memory-size 256 \
  --environment Variables='{
    "AWS_REGION":"us-east-1",
    "OUTBOX_TABLE_NAME":"signature-service-outbox",
    "EVENT_BUS_NAME":"lawprotect-event-bus",
    "EVENT_SOURCE":"lambda.event-publisher"
  }'
```

#### Option B: Using CDK
```typescript
import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';

// Create Lambda function
const eventPublisherLambda = new Function(this, 'EventPublisherLambda', {
  runtime: Runtime.NODEJS_18_X,
  handler: 'EventPublisherLambda.handler',
  code: Code.fromAsset('dist'),
  timeout: Duration.minutes(5),
  memorySize: 256,
  environment: {
    AWS_REGION: 'us-east-1',
    OUTBOX_TABLE_NAME: 'signature-service-outbox',
    EVENT_BUS_NAME: 'lawprotect-event-bus',
    EVENT_SOURCE: 'lambda.event-publisher'
  }
});

// Create EventBridge rule
const eventPublisherRule = new Rule(this, 'EventPublisherScheduleRule', {
  schedule: Schedule.rate(Duration.minutes(5)),
  description: 'Triggers EventPublisherLambda every 5 minutes'
});

// Add Lambda as target
eventPublisherRule.addTarget(new LambdaFunction(eventPublisherLambda));
```

#### Option C: Using Serverless Framework
```yaml
# serverless.yml
service: lawprotect-event-publisher

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    AWS_REGION: ${opt:region, 'us-east-1'}
    OUTBOX_TABLE_NAME: ${self:custom.outboxTableName}
    EVENT_BUS_NAME: ${self:custom.eventBusName}
    EVENT_SOURCE: lambda.event-publisher

functions:
  eventPublisher:
    handler: EventPublisherLambda.handler
    timeout: 300
    memorySize: 256
    events:
      - schedule: rate(5 minutes)

custom:
  outboxTableName: signature-service-outbox
  eventBusName: lawprotect-event-bus
```

### 4. Set Up IAM Permissions

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/signature-service-outbox*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "events:PutEvents"
      ],
      "Resource": "arn:aws:events:*:*:event-bus/lawprotect-event-bus"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

### 5. Environment Variables Required

```bash
# Required environment variables
AWS_REGION=us-east-1
OUTBOX_TABLE_NAME=signature-service-outbox
EVENT_BUS_NAME=lawprotect-event-bus
EVENT_SOURCE=lambda.event-publisher

# Optional (if not using IAM roles)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

### 6. Monitoring and Observability

#### CloudWatch Metrics
- Monitor Lambda invocations, errors, and duration
- Set up alarms for failed executions
- Monitor DynamoDB read/write capacity

#### CloudWatch Logs
- Lambda execution logs
- Event processing details
- Error tracking and debugging

#### X-Ray Tracing (Optional)
```typescript
// Enable X-Ray tracing in Lambda
import { captureAWSv3Client } from 'aws-xray-sdk-core';

const dynamoDbClient = captureAWSv3Client(new DynamoDBClient({}));
const eventBridgeClient = captureAWSv3Client(new EventBridgeClient({}));
```

## 🔧 Testing

### Local Testing
```bash
# Test Lambda function locally
npm run test:lambda

# Test with sample event
node -e "
const { handler } = require('./dist/EventPublisherLambda.js');
const event = { source: 'aws.events', 'detail-type': 'Scheduled Event' };
const context = { awsRequestId: 'test-request-id' };
handler(event, context).then(console.log).catch(console.error);
"
```

### Integration Testing
```bash
# Test with real AWS resources
aws lambda invoke \
  --function-name EventPublisherLambda \
  --payload '{"source":"aws.events","detail-type":"Scheduled Event"}' \
  response.json
```

## 📊 Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Signature     │    │   EventBridge    │    │   Notification  │
│   Service       │    │   Rule           │    │   Service       │
│                 │    │   (5 min)        │    │                 │
│ Save to Outbox  │───▶│ Trigger Lambda   │───▶│ Process Events  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   EventPublisher │
                       │   Lambda         │
                       │                  │
                       │ 1. Read Outbox   │
                       │ 2. Send to EB    │
                       │ 3. Mark Sent     │
                       └──────────────────┘
```

## 🚨 Troubleshooting

### Common Issues

1. **Lambda Timeout**
   - Increase timeout to 5 minutes
   - Check DynamoDB query performance
   - Monitor batch size

2. **Permission Errors**
   - Verify IAM role permissions
   - Check DynamoDB table access
   - Verify EventBridge permissions

3. **Event Processing Failures**
   - Check CloudWatch logs
   - Verify event format
   - Monitor EventBridge delivery

### Debug Commands
```bash
# Check Lambda logs
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/EventPublisherLambda

# Check DynamoDB table
aws dynamodb describe-table --table-name signature-service-outbox

# Check EventBridge bus
aws events describe-event-bus --name lawprotect-event-bus
```

## 📈 Performance Optimization

### Batch Processing
- Process events in batches of 10 (EventBridge limit)
- Use DynamoDB batch operations
- Implement exponential backoff for retries

### Monitoring
- Set up CloudWatch alarms
- Monitor Lambda concurrency
- Track event processing latency

### Cost Optimization
- Use DynamoDB on-demand billing
- Optimize Lambda memory allocation
- Monitor EventBridge costs

## 🔄 Maintenance

### Regular Tasks
- Monitor Lambda performance
- Review CloudWatch logs
- Update dependencies
- Scale resources as needed

### Updates
- Deploy new versions using blue-green deployment
- Test in staging environment first
- Monitor rollback procedures
