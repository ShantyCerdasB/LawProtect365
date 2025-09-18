/**
 * @file setupLocalStack.ts
 * @summary Setup AWS resources in LocalStack
 * @description Creates Cognito User Pool, S3 buckets, KMS keys, and other AWS resources for testing
 */

import { CognitoIdentityProviderClient, CreateUserPoolCommand, CreateUserPoolClientCommand, CreateGroupCommand, AdminCreateUserCommand, AdminSetUserPasswordCommand } from '@aws-sdk/client-cognito-identity-provider';
import { S3Client, CreateBucketCommand, PutBucketVersioningCommand, PutBucketEncryptionCommand, PutBucketLifecycleConfigurationCommand } from '@aws-sdk/client-s3';
import { KMSClient, CreateKeyCommand, CreateAliasCommand } from '@aws-sdk/client-kms';
import { EventBridgeClient, CreateEventBusCommand } from '@aws-sdk/client-eventbridge';
import { SSMClient, PutParameterCommand } from '@aws-sdk/client-ssm';
import { startLocalStack } from './startLocalStack';

// Configure AWS SDK for LocalStack
const localstackEndpoint = 'http://localhost:4566';
const region = 'us-east-1';

const cognito = new CognitoIdentityProviderClient({
  endpoint: localstackEndpoint,
  region: region,
  credentials: { accessKeyId: 'test', secretAccessKey: 'test' }
});

const s3 = new S3Client({
  endpoint: localstackEndpoint,
  region: region,
  credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
  forcePathStyle: true as any
});

const kms = new KMSClient({
  endpoint: localstackEndpoint,
  region: region,
  credentials: { accessKeyId: 'test', secretAccessKey: 'test' }
});

const eventbridge = new EventBridgeClient({
  endpoint: localstackEndpoint,
  region: region,
  credentials: { accessKeyId: 'test', secretAccessKey: 'test' }
});

const ssm = new SSMClient({
  endpoint: localstackEndpoint,
  region: region,
  credentials: { accessKeyId: 'test', secretAccessKey: 'test' }
});

async function setupLocalStack() {
  console.log('🔧 Setting up AWS resources in LocalStack...');
  
  try {
    // Start LocalStack first
    await startLocalStack();
    
    // Wait a bit for services to be fully ready
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Skip Cognito setup (not available in free LocalStack)
    console.log('⚠️  Skipping Cognito setup (not available in free LocalStack)');
    
    // Setup S3 buckets
    await setupS3Buckets();
    
    // Setup KMS keys
    await setupKMSKeys();
    
    // Setup EventBridge
    await setupEventBridge();
    
    // Setup SSM parameters
    await setupSSMParameters();
    
    console.log('✅ LocalStack setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Failed to setup LocalStack:', error);
    process.exit(1);
  }
}

async function setupCognitoUserPool() {
  console.log('🔐 Setting up Cognito User Pool...');
  
  try {
    // Create User Pool (matching Terraform configuration)
    const userPoolParams = {
      PoolName: 'lawprotect365-test-user-pool',
      MfaConfiguration: 'OPTIONAL',
      AutoVerifiedAttributes: ['email'],
      UsernameAttributes: ['email'],
      Schema: [
        {
          Name: 'email',
          AttributeDataType: 'String',
          Required: true,
          Mutable: true
        }
      ],
      Policies: {
        PasswordPolicy: {
          MinimumLength: 8,
          RequireUppercase: true,
          RequireLowercase: true,
          RequireNumbers: true,
          RequireSymbols: false
        }
      }
    };
    
    const userPoolResult = await cognito.send(new CreateUserPoolCommand(userPoolParams as any));
    const userPoolId = userPoolResult.UserPool?.Id;
    
    if (!userPoolId) {
      throw new Error('Failed to create User Pool');
    }
    
    console.log(`✅ User Pool created: ${userPoolId}`);
    
    // Create User Pool Client (matching Terraform configuration)
    const clientParams = {
      UserPoolId: userPoolId,
      ClientName: 'lawprotect365-test-app-client',
      GenerateSecret: true, // Terraform sets this to true
      ExplicitAuthFlows: [
        'ALLOW_USER_SRP_AUTH',
        'ALLOW_REFRESH_TOKEN_AUTH'
      ],
      SupportedIdentityProviders: ['COGNITO'],
      CallbackURLs: ['http://localhost:3000/callback'],
      LogoutURLs: ['http://localhost:3000/logout'],
      AllowedOAuthFlows: ['code'],
      AllowedOAuthScopes: [
        'openid',
        'email', 
        'profile',
        'aws.cognito.signin.user.admin'
      ],
      AllowedOAuthFlowsUserPoolClient: true
    };
    
    const clientResult = await cognito.send(new CreateUserPoolClientCommand(clientParams as any));
    const clientId = clientResult.UserPoolClient?.ClientId;
    
    if (!clientId) {
      throw new Error('Failed to create User Pool Client');
    }
    
    console.log(`✅ User Pool Client created: ${clientId}`);
    
    // Store configuration in environment variables for tests
    process.env.COGNITO_USER_POOL_ID = userPoolId;
    process.env.COGNITO_CLIENT_ID = clientId;
    process.env.COGNITO_ISSUER = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
    
    // Update JWT configuration for tests
    process.env.JWT_ISSUER = process.env.COGNITO_ISSUER;
    process.env.JWT_AUDIENCE = clientId;
    process.env.JWKS_URI = `http://localhost:4566/.well-known/jwks.json`;
    
    // Create user groups (matching Terraform configuration)
    await createUserGroups(userPoolId);
    
    // Create test users
    await createTestUsers(userPoolId);
    
  } catch (error) {
    console.error('❌ Failed to setup Cognito:', error);
    throw error;
  }
}

async function createUserGroups(userPoolId: string) {
  console.log('👥 Creating user groups...');
  
  const groups = [
    {
      GroupName: 'SuperAdmin',
      Description: 'Full platform super-administrator'
    },
    {
      GroupName: 'Admin', 
      Description: 'Platform administrator with elevated privileges'
    },
    {
      GroupName: 'Lawyer',
      Description: 'Verified lawyer user'
    },
    {
      GroupName: 'Customer',
      Description: 'End-user customer'
    }
  ];
  
  for (const group of groups) {
    try {
      await cognito.send(new CreateGroupCommand({
        UserPoolId: userPoolId,
        GroupName: group.GroupName,
        Description: group.Description
      }));
      
      console.log(`✅ User group created: ${group.GroupName}`);
    } catch (error) {
      console.log(`⚠️  User group ${group.GroupName} might already exist:`, error.message);
    }
  }
}

async function createTestUsers(userPoolId: string) {
  console.log('👥 Creating test users...');
  
  const testUsers = [
    {
      username: 'test-owner@lawprotect365.com',
      email: 'test-owner@lawprotect365.com',
      password: 'TestPassword123!',
      groups: ['customer'] // Cognito role
    },
    {
      username: 'test-signer1@lawprotect365.com',
      email: 'test-signer1@lawprotect365.com',
      password: 'TestPassword123!',
      groups: ['customer'] // Cognito role
    },
    {
      username: 'test-signer2@lawprotect365.com',
      email: 'test-signer2@lawprotect365.com',
      password: 'TestPassword123!',
      groups: ['customer'] // Cognito role
    }
  ];
  
  for (const user of testUsers) {
    try {
      // Create user
      await cognito.send(new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: user.username,
        UserAttributes: [
          { Name: 'email', Value: user.email },
          { Name: 'email_verified', Value: 'true' }
        ],
        TemporaryPassword: user.password,
        MessageAction: 'SUPPRESS'
      }));
      
      // Set permanent password
      await cognito.send(new AdminSetUserPasswordCommand({
        UserPoolId: userPoolId,
        Username: user.username,
        Password: user.password,
        Permanent: true
      }));
      
      console.log(`✅ Test user created: ${user.email}`);
    } catch (error) {
      console.log(`⚠️  User ${user.email} might already exist:`, error.message);
    }
  }
}

async function setupS3Buckets() {
  console.log('🪣 Setting up S3 buckets...');
  
  // Buckets matching Terraform configuration
  const buckets = [
    {
      name: 'lawprotect365-sign-evidence-test',
      enableVersioning: true,
      enableEncryption: true
    },
    {
      name: 'lawprotect365-documents-test', 
      enableVersioning: true,
      enableEncryption: true
    },
    {
      name: 'test-signed',
      enableVersioning: false,
      enableEncryption: false
    }
  ];
  
  for (const bucket of buckets) {
    try {
      // Create bucket
      const createBucketParams: any = {
        Bucket: bucket.name
      };
      
      // Only add LocationConstraint for regions other than us-east-1
      if (region !== 'us-east-1') {
        createBucketParams.CreateBucketConfiguration = {
          LocationConstraint: region
        };
      }
      
      await s3.send(new CreateBucketCommand(createBucketParams as any));
      
      console.log(`✅ S3 bucket created: ${bucket.name}`);
      
      // Enable versioning (matching Terraform)
      if (bucket.enableVersioning) {
        await s3.send(new PutBucketVersioningCommand({
          Bucket: bucket.name,
          VersioningConfiguration: { Status: 'Enabled' }
        }));
        console.log(`✅ Versioning enabled for: ${bucket.name}`);
      }
      
      // Enable server-side encryption (matching Terraform)
      if (bucket.enableEncryption) {
        await s3.send(new PutBucketEncryptionCommand({
          Bucket: bucket.name,
          ServerSideEncryptionConfiguration: {
            Rules: [{ ApplyServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' } }]
          }
        }));
        console.log(`✅ Encryption enabled for: ${bucket.name}`);
      }
      
      // Set lifecycle configuration (matching Terraform)
      await s3.send(new PutBucketLifecycleConfigurationCommand({
        Bucket: bucket.name,
        LifecycleConfiguration: {
          Rules: [{
            ID: 'expire-noncurrent-versions',
            Status: 'Enabled',
            NoncurrentVersionExpiration: { NoncurrentDays: 30 },
            Filter: {}
          }]
        }
      }));
      console.log(`✅ Lifecycle configuration set for: ${bucket.name}`);
      
    } catch (error) {
      if (error.code === 'BucketAlreadyOwnedByYou') {
        console.log(`⚠️  S3 bucket already exists: ${bucket.name}`);
      } else {
        console.error(`❌ Failed to create S3 bucket ${bucket.name}:`, error);
      }
    }
  }
}

async function setupKMSKeys() {
  console.log('🔑 Setting up KMS keys...');
  
  try {
    // Create signing key (matching Terraform configuration)
    const signingKeyParams = {
      Description: 'Test signing key for LawProtect365',
      KeyUsage: 'SIGN_VERIFY',
      CustomerMasterKeySpec: 'RSA_2048'
    };
    
    const signingKeyResult = await kms.send(new CreateKeyCommand(signingKeyParams as any));
    const signingKeyId = signingKeyResult.KeyMetadata?.KeyId;
    
    if (!signingKeyId) {
      throw new Error('Failed to create KMS signing key');
    }
    
    console.log(`✅ KMS signing key created: ${signingKeyId}`);
    
    // Create alias for signing key (matching Terraform) - idempotent
    try {
      await kms.send(new CreateAliasCommand({ AliasName: 'alias/lawprotect365-sign-key-test', TargetKeyId: signingKeyId }));
      console.log(`✅ KMS alias created: alias/lawprotect365-sign-key-test`);
    } catch (error: any) {
      const name = error?.name || error?.code || error?.__type;
      if (name === 'AlreadyExistsException') {
        console.log('⚠️  KMS alias already exists: alias/lawprotect365-sign-key-test');
      } else {
        throw error;
      }
    }
    
    // Create alias for test-key-id (for tests) - idempotent
    try {
      await kms.send(new CreateAliasCommand({ AliasName: 'alias/test-key-id', TargetKeyId: signingKeyId }));
      console.log(`✅ KMS alias created: alias/test-key-id`);
    } catch (error: any) {
      const name = error?.name || error?.code || error?.__type;
      if (name === 'AlreadyExistsException') {
        console.log('⚠️  KMS alias already exists: alias/test-key-id');
      } else {
        throw error;
      }
    }
    
    // Store key ID for tests
    process.env.KMS_SIGNER_KEY_ID = 'alias/lawprotect365-sign-key-test';
    process.env.KMS_SIGNER_KEY_ARN = `arn:aws:kms:${region}:000000000000:key/${signingKeyId}`;
    
  } catch (error) {
    console.error('❌ Failed to setup KMS:', error);
    throw error;
  }
}

async function setupEventBridge() {
  console.log('📡 Setting up EventBridge...');
  
  try {
    // Create event bus (matching Terraform configuration)
    const eventBusParams = {
      Name: 'lawprotect365-event-bus-test'
    };
    
    await eventbridge.send(new CreateEventBusCommand(eventBusParams));
    
    console.log('✅ EventBridge event bus created: lawprotect365-event-bus-test');
    
    // Store event bus ARN for tests
    process.env.EVENT_BUS_ARN = `arn:aws:events:${region}:000000000000:event-bus/lawprotect365-event-bus-test`;
    
  } catch (error) {
    const name = (error as any)?.name || (error as any)?.code || (error as any)?.__type;
    if (name === 'ResourceAlreadyExistsException') {
      console.log('⚠️  EventBridge event bus already exists: lawprotect365-event-bus-test');
    } else {
      console.error('❌ Failed to setup EventBridge:', error);
      throw error;
    }
  }
}

async function setupSSMParameters() {
  console.log('🔧 Setting up SSM parameters...');
  
  // Parameters matching Terraform configuration
  const parameters = [
    {
      Name: '/lawprotect365/test/kms/signer-key-arn',
      Value: process.env.KMS_SIGNER_KEY_ARN || '',
      Type: 'String',
      Description: 'KMS Signer Key ARN for testing'
    },
    {
      Name: '/lawprotect365/test/event-bus-arn',
      Value: process.env.EVENT_BUS_ARN || '',
      Type: 'String',
      Description: 'EventBridge Event Bus ARN for testing'
    }
  ];
  
  for (const param of parameters) {
    try {
      await ssm.send(new PutParameterCommand(param as any));
      console.log(`✅ SSM parameter created: ${param.Name}`);
    } catch (error) {
      console.log(`⚠️  SSM parameter ${param.Name} might already exist:`, error.message);
    }
  }
}

// Run if called directly
if (require.main === module) {
  setupLocalStack();
}

export { setupLocalStack };
