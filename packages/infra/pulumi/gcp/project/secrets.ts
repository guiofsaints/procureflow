/**
 * Secret Manager Configuration
 * 
 * Creates and manages secrets for ProcureFlow
 * FREE TIER: First 6 secret versions are free
 */

import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';

interface SecretConfig {
  projectId: string;
  environment: string;
}

export function createSecrets(config: SecretConfig, mongodbConnectionString: pulumi.Output<string>) {
  const pulumiConfig = new pulumi.Config();

  // 1. NEXTAUTH_SECRET - Auth.js session encryption
  const nextauthSecret = new gcp.secretmanager.Secret('nextauth-secret', {
    secretId: 'nextauth-secret',
    replication: {
      auto: {}, // Changed from 'automatic: true' to match v8 API
    },
    labels: {
      environment: config.environment,
      managed_by: 'pulumi',
    },
  });

  const nextauthSecretVersion = new gcp.secretmanager.SecretVersion(
    'nextauth-secret-v1',
    {
      secret: nextauthSecret.id,
      secretData: pulumiConfig.requireSecret('nextauth-secret'),
    }
  );

  // 2. OPENAI_API_KEY - OpenAI API key (optional)
  const openaiApiKey = new gcp.secretmanager.Secret('openai-api-key', {
    secretId: 'openai-api-key',
    replication: {
      auto: {},
    },
    labels: {
      environment: config.environment,
      managed_by: 'pulumi',
    },
  });

  const openaiApiKeyVersion = new gcp.secretmanager.SecretVersion(
    'openai-api-key-v1',
    {
      secret: openaiApiKey.id,
      secretData: pulumiConfig.getSecret('openai-api-key') || 'not-set',
    }
  );

  // 3. MONGODB_URI - MongoDB connection string from Atlas
  const mongodbUriSecret = new gcp.secretmanager.Secret('mongodb-uri', {
    secretId: 'mongodb-uri',
    replication: {
      auto: {},
    },
    labels: {
      environment: config.environment,
      managed_by: 'pulumi',
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
    nextauthSecret,
    nextauthSecretVersion,
    openaiApiKey,
    openaiApiKeyVersion,
    mongodbUriSecret,
    mongodbUriVersion,

    // Outputs for Cloud Run
    secrets: {
      nextauthSecretId: nextauthSecret.secretId,
      openaiApiKeyId: openaiApiKey.secretId,
      mongodbUriId: mongodbUriSecret.secretId,
    },
  };
}

export function grantSecretAccess(
  secrets: ReturnType<typeof createSecrets>,
  serviceAccountEmail: pulumi.Output<string>
) {
  // Grant Cloud Run service account access to secrets
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
