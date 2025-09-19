/**
 * @file setupLocalStack.ts
 * @summary Setup AWS resources in LocalStack for testing
 * @description Creates and configures AWS resources in LocalStack including S3 buckets,
 * KMS keys, EventBridge event buses, and SSM parameters. This script is designed to
 * replicate the production AWS infrastructure locally for integration testing.
 * Cognito setup is skipped as it's not available in the free LocalStack tier.
 */

import { CognitoIdentityProviderClient, CreateUserPoolCommand, CreateUserPoolClientCommand, CreateGroupCommand, AdminCreateUserCommand, AdminSetUserPasswordCommand } from '@aws-sdk/client-cognito-identity-provider';
import { S3Client, CreateBucketCommand, PutBucketVersioningCommand, PutBucketEncryptionCommand, PutBucketLifecycleConfigurationCommand } from '@aws-sdk/client-s3';
import { KMSClient, CreateKeyCommand, CreateAliasCommand } from '@aws-sdk/client-kms';
import { EventBridgeClient, CreateEventBusCommand } from '@aws-sdk/client-eventbridge';
import { SSMClient, PutParameterCommand } from '@aws-sdk/client-ssm';
import { startLocalStack } from './startLocalStack';

/**
 * LocalStack endpoint configuration for AWS SDK clients
 */
const localstackEndpoint = 'http://localhost:4566';
const region = 'us-east-1';

/**
 * AWS SDK clients configured for LocalStack with test credentials
 */
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

/**
 * Main setup function that orchestrates the creation of all AWS resources in LocalStack
 * 
 * @description Starts LocalStack container, waits for services to be ready, then
 * creates S3 buckets, KMS keys, EventBridge event buses, and SSM parameters.
 * Cognito setup is skipped as it's not available in the free LocalStack tier.
 * 
 * @returns Promise<void> Resolves when all resources are created successfully
 * @throws Exits process with code 1 if any setup step fails
 */
async function setupLocalStack(): Promise<void> {
  console.log('🔧 Setting up AWS resources in LocalStack...');
  
  try {
    await startLocalStack();
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('⚠️  Skipping Cognito setup (not available in free LocalStack)');
    
    await setupS3Buckets();
    await setupKMSKeys();
    await setupEventBridge();
    await setupSSMParameters();
    
    console.log('✅ LocalStack setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Failed to setup LocalStack:', error);
    process.exit(1);
  }
}

/**
 * Creates a Cognito User Pool with client and test users for authentication testing
 * 
 * @description Sets up a complete Cognito User Pool with OAuth configuration,
 * user groups, and test users. This function is currently unused as Cognito
 * is not available in the free LocalStack tier.
 * 
 * @returns Promise<void> Resolves when User Pool setup is complete
 * @throws Error if User Pool or Client creation fails
 */
async function setupCognitoUserPool(): Promise<void> {
  console.log('🔐 Setting up Cognito User Pool...');
  
  try {
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

/**
 * Creates user groups in the Cognito User Pool for role-based access control
 * 
 * @description Creates predefined user groups (SuperAdmin, Admin, Lawyer, Customer)
 * that match the production Terraform configuration for consistent testing.
 * 
 * @param userPoolId - The Cognito User Pool ID where groups will be created
 * @returns Promise<void> Resolves when all groups are created
 * @throws Logs warnings for groups that already exist
 */
async function createUserGroups(userPoolId: string): Promise<void> {
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

/**
 * Creates test users in the Cognito User Pool for integration testing
 * 
 * @description Creates predefined test users with verified email addresses
 * and permanent passwords for automated testing scenarios.
 * 
 * @param userPoolId - The Cognito User Pool ID where users will be created
 * @returns Promise<void> Resolves when all test users are created
 * @throws Logs warnings for users that already exist
 */
async function createTestUsers(userPoolId: string): Promise<void> {
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

/**
 * Creates and configures S3 buckets for document storage and evidence
 * 
 * @description Creates S3 buckets with versioning, encryption, and lifecycle
 * policies that match the production Terraform configuration. Handles
 * region-specific bucket creation requirements.
 * 
 * @returns Promise<void> Resolves when all buckets are created and configured
 * @throws Logs warnings for buckets that already exist
 */
async function setupS3Buckets(): Promise<void> {
  console.log('🪣 Setting up S3 buckets...');
  
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

/**
 * Creates KMS keys and aliases for document signing operations
 * 
 * @description Creates RSA signing keys with aliases that match the production
 * Terraform configuration. Sets up environment variables for test usage.
 * 
 * @returns Promise<void> Resolves when all keys and aliases are created
 * @throws Error if key creation fails
 */
async function setupKMSKeys(): Promise<void> {
  console.log('🔑 Setting up KMS keys...');
  
  try {
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

/**
 * Creates EventBridge event bus for event-driven architecture testing
 * 
 * @description Creates an event bus that matches the production Terraform
 * configuration and sets up environment variables for test usage.
 * 
 * @returns Promise<void> Resolves when event bus is created
 * @throws Logs warnings if event bus already exists
 */
async function setupEventBridge(): Promise<void> {
  console.log('📡 Setting up EventBridge...');
  
  try {
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

/**
 * Creates SSM parameters for storing configuration values
 * 
 * @description Creates SSM parameters that store KMS key ARNs and EventBridge
 * ARNs for use in integration tests, matching the production configuration.
 * 
 * @returns Promise<void> Resolves when all parameters are created
 * @throws Logs warnings for parameters that already exist
 */
async function setupSSMParameters(): Promise<void> {
  console.log('🔧 Setting up SSM parameters...');
  
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

/**
 * Executes the setup function when this script is run directly from the command line
 */
if (require.main === module) {
  setupLocalStack();
}

/**
 * Exports the main setup function for use by other modules
 */
export { setupLocalStack };
