/**
 * Secret Manager Configuration
 * 
 * Creates and manages application secrets for ProcureFlow.
 * 
 * **FREE TIER Limits:**
 * - First 6 secret versions: FREE
 * - First 10,000 access operations/month: FREE
 * - Current usage: 3 secrets = $0.00 ✅
 * 
 * **Secrets Created:**
 * - nextauth-secret: NextAuth.js session encryption key
 * - openai-api-key: OpenAI API key (optional, agent features)
 * - mongodb-uri: MongoDB Atlas connection string
 * 
 * **Security Notes:**
 * - Automatic replication across regions
 * - Encrypted at rest and in transit
 * - IAM-based access control (least-privilege)
 * - Version history maintained
 * 
 * @module security/secrets
 */

import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';

/**
 * Configuration for Secret Manager resources
 */
interface SecretConfig {
  /** GCP Project ID */
  projectId: string;
  
  /** Environment name (dev/staging/prod) */
  environment: string;
}

/**
 * Creates Secret Manager secrets for ProcureFlow application.
 * 
 * Provisions three secrets with automatic replication:
 * 1. NEXTAUTH_SECRET - Session encryption (required)
 * 2. OPENAI_API_KEY - AI features (optional)
 * 3. MONGODB_URI - Database connection (required)
 * 
 * Secrets are sourced from Pulumi config (encrypted at rest in state file).
 * 
 * @param config - Secret Manager configuration
 * @param mongodbConnectionString - MongoDB Atlas connection string (from config)
 * @returns Secret resources, versions, and secret IDs for Cloud Run
 * 
 * @example
 * ```typescript
 * const secrets = createSecrets(
 *   { projectId: 'my-project', environment: 'dev' },
 *   pulumi.output('mongodb+srv://...')
 * );
 * 
 * // Use in Cloud Run
 * const cloudRun = createCloudRunService({
 *   secrets: secrets.secrets
 * });
 * ```
 */
export function createSecrets(config: SecretConfig, mongodbConnectionString: pulumi.Output<string>) {
  // Validate configuration
  if (!config.projectId || !config.environment) {
    throw new Error('projectId and environment are required for Secret Manager');
  }

  const pulumiConfig = new pulumi.Config();

  // 🔐 1. NEXTAUTH_SECRET - NextAuth.js session encryption key
  // Generate with: openssl rand -base64 32
  const nextauthSecret = new gcp.secretmanager.Secret('nextauth-secret', {
    secretId: 'nextauth-secret',
    replication: {
      auto: {}, // Automatic replication across regions
    },
    labels: {
      environment: config.environment,
      managed_by: 'pulumi',
      app: 'procureflow',
    },
  });

  const nextauthSecretVersion = new gcp.secretmanager.SecretVersion(
    'nextauth-secret-v1',
    {
      secret: nextauthSecret.id,
      secretData: pulumiConfig.requireSecret('nextauth-secret'),
    }
  );

  // 🤖 2. OPENAI_API_KEY - OpenAI API key for agent features (optional)
  // Defaults to 'not-set' if not provided (agent features will be disabled)
  const openaiApiKey = new gcp.secretmanager.Secret('openai-api-key', {
    secretId: 'openai-api-key',
    replication: {
      auto: {},
    },
    labels: {
      environment: config.environment,
      managed_by: 'pulumi',
      app: 'procureflow',
    },
  });

  const openaiApiKeyVersion = new gcp.secretmanager.SecretVersion(
    'openai-api-key-v1',
    {
      secret: openaiApiKey.id,
      secretData: pulumiConfig.getSecret('openai-api-key') || 'not-set',
    }
  );

  // 🗄️ 3. MONGODB_URI - MongoDB Atlas connection string (required)
  // Sourced from Pulumi config (encrypted)
  const mongodbUriSecret = new gcp.secretmanager.Secret('mongodb-uri', {
    secretId: 'mongodb-uri',
    replication: {
      auto: {},
    },
    labels: {
      environment: config.environment,
      managed_by: 'pulumi',
      app: 'procureflow',
    },
  });

  const mongodbUriVersion = new gcp.secretmanager.SecretVersion(
    'mongodb-uri-v1',
    {
      secret: mongodbUriSecret.id,
      secretData: mongodbConnectionString,
    }
  );

  return {
    // Secret resources (for IAM bindings)
    nextauthSecret,
    nextauthSecretVersion,
    openaiApiKey,
    openaiApiKeyVersion,
    mongodbUriSecret,
    mongodbUriVersion,

    // Secret IDs for Cloud Run environment variables
    secrets: {
      nextauthSecretId: nextauthSecret.secretId,
      openaiApiKeyId: openaiApiKey.secretId,
      mongodbUriId: mongodbUriSecret.secretId,
    },
  };
}

/**
 * Grants Secret Manager access to a service account.
 * 
 * Creates IAM bindings that allow the specified service account
 * to read secret values at runtime. Uses least-privilege model
 * (secretAccessor role, not admin).
 * 
 * @param secrets - Secrets created by createSecrets()
 * @param serviceAccountEmail - Service account email (from Cloud Run)
 * @returns IAM member bindings for each secret
 * 
 * @example
 * ```typescript
 * const secrets = createSecrets(...);
 * const cloudRun = createCloudRunService(...);
 * 
 * const secretAccess = grantSecretAccess(
 *   secrets,
 *   cloudRun.serviceAccountEmail
 * );
 * ```
 */
export function grantSecretAccess(
  secrets: ReturnType<typeof createSecrets>,
  serviceAccountEmail: pulumi.Output<string>
) {
  // 🔐 Grant Cloud Run service account access to secrets (least-privilege)
  // Role: secretAccessor (read-only, cannot modify or delete)
  const nextauthAccess = new gcp.secretmanager.SecretIamMember(
    'nextauth-secret-access',
    {
      secretId: secrets.nextauthSecret.id,
      role: 'roles/secretmanager.secretAccessor',
      member: pulumi.interpolate`serviceAccount:${serviceAccountEmail}`,
    }
  );

  const openaiAccess = new gcp.secretmanager.SecretIamMember(
    'openai-secret-access',
    {
      secretId: secrets.openaiApiKey.id,
      role: 'roles/secretmanager.secretAccessor',
      member: pulumi.interpolate`serviceAccount:${serviceAccountEmail}`,
    }
  );

  const mongodbAccess = new gcp.secretmanager.SecretIamMember(
    'mongodb-secret-access',
    {
      secretId: secrets.mongodbUriSecret.id,
      role: 'roles/secretmanager.secretAccessor',
      member: pulumi.interpolate`serviceAccount:${serviceAccountEmail}`,
    }
  );

  return {
    nextauthAccess,
    openaiAccess,
    mongodbAccess,
  };
}

/**
 * Secret Manager Pricing (FREE TIER):
 * 
 * ✅ Free:
 * - First 6 secret versions: $0.00
 * - First 10,000 access operations/month: $0.00
 * 
 * 💰 Paid (if exceeded):
 * - Additional secrets: $0.06/secret version/month
 * - Additional access: $0.03/10,000 operations
 * 
 * Current usage: 3 secrets = FREE ✅
 */
