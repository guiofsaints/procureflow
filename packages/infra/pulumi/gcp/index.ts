/**
 * ProcureFlow GCP Infrastructure - FREE TIER Edition
 * 
 * Stack: MongoDB Atlas M0 + GCP Cloud Run + Secret Manager
 * Cost: $0.00/month (within free tiers)
 * 
 * Prerequisites:
 * 1. MongoDB Atlas account (free)
 * 2. GCP account with billing enabled (free tier usage)
 * 3. Pulumi Cloud account (free tier)
 * 4. GitHub account (for Actions)
 * 
 * Setup:
 * ```
 * pulumi stack init dev
 * pulumi config set gcp:project YOUR_PROJECT_ID
 * pulumi config set gcp:region us-central1
 * pulumi config set --secret nextauth-secret $(openssl rand -base64 32)
 * pulumi config set --secret mongodb-password $(openssl rand -base64 32)
 * pulumi config set --secret mongodb-atlas:publicKey YOUR_ATLAS_PUBLIC_KEY
 * pulumi config set --secret mongodb-atlas:privateKey YOUR_ATLAS_PRIVATE_KEY
 * pulumi config set mongodb-atlas:orgId YOUR_ATLAS_ORG_ID
 * pulumi config set app:image-tag latest
 * pnpm install
 * pnpm run preview
 * pnpm run deploy
 * ```
 */

import * as pulumi from '@pulumi/pulumi';
import { createSecrets, grantSecretAccess } from './project/secrets';
import { createCloudRunService, createArtifactRegistry } from './project/cloudrun';

// ==============================================================================
// Configuration
// ==============================================================================

const config = new pulumi.Config();
const gcpConfig = new pulumi.Config('gcp');

// GCP Configuration
const projectId = gcpConfig.require('project');
const region = gcpConfig.get('region') || 'us-central1';

// Application Configuration
const environment = config.get('environment') || 'dev';
const imageTag = config.get('image-tag') || 'latest';

// MongoDB Configuration (using existing cluster)
const mongoAtlasProjectId = config.get('mongodb-project-id') || '6913b7cf8e8db76c8799c1ea';

// ==============================================================================
// Infrastructure Components
// ==============================================================================

// 1. MongoDB Connection String (using existing cluster)
const mongodbConnectionString = config.requireSecret('mongodb-connection-string');

// 2. Artifact Registry (for Docker images)
const registry = createArtifactRegistry({
  projectId: projectId,
  region: region,
  environment: environment,
});

// 3. Secret Manager (FREE: first 6 secrets)
const secrets = createSecrets(
  {
    projectId: projectId,
    environment: environment,
  },
  mongodbConnectionString
);

// 4. Cloud Run Service (FREE TIER optimized)
const cloudrun = createCloudRunService({
  projectId: projectId,
  region: region,
  environment: environment,
  imageTag: imageTag,
  secrets: secrets.secrets,
});

// 5. Grant Secret Access to Cloud Run
const secretAccess = grantSecretAccess(secrets, cloudrun.serviceAccountEmail);

// ==============================================================================
// Outputs
// ==============================================================================

export const outputs = {
  // MongoDB Atlas
  mongodbClusterId: 'procureflow-dev',
  mongodbProjectId: mongoAtlasProjectId,
  mongodbConnectionString: pulumi.secret(mongodbConnectionString), // Marked as secret
  mongodbClusterState: 'IDLE',

  // Artifact Registry
  artifactRegistryUrl: registry.repositoryUrl,
  
  // Cloud Run
  serviceUrl: cloudrun.serviceUrl,
  serviceName: cloudrun.serviceName,
  serviceAccountEmail: cloudrun.serviceAccountEmail,

  // Configuration
  projectId: projectId,
  region: region,
  environment: environment,
  imageTag: imageTag,

  // Deployment Instructions
  deploymentInstructions: pulumi.interpolate`
=============================================================================
🎉 ProcureFlow Infrastructure Deployed Successfully!
=============================================================================

📋 Service Information:
   - Service URL: ${cloudrun.serviceUrl}
   - Environment: ${environment}
   - Region: ${region}

🗄️  MongoDB Atlas:
   - Cluster State: IDLE (existing cluster)
   - Project ID: ${mongoAtlasProjectId}
   - Connection: Check Secret Manager (mongodb-uri)

🐳 Container Registry:
   - Registry: ${registry.repositoryUrl}
   - Current Tag: ${imageTag}

📝 Next Steps:

1. Build and push Docker image:
   cd ../../../../
   docker build -f packages/infra/docker/Dockerfile.web -t ${registry.repositoryUrl}/web:${imageTag} .
   gcloud auth configure-docker ${region}-docker.pkg.dev
   docker push ${registry.repositoryUrl}/web:${imageTag}

2. Update Cloud Run with new image:
   cd packages/infra/pulumi/gcp
   pnpm run deploy

3. Test the service:
   curl ${cloudrun.serviceUrl}/api/health

4. View logs:
   gcloud run logs tail ${cloudrun.serviceName} --region ${region}

5. Monitor costs (should be $0.00):
   https://console.cloud.google.com/billing

=============================================================================
💰 FREE TIER Status:
   - Cloud Run: ✅ Always Free (2M req/month)
   - MongoDB Atlas: ✅ M0 Free Forever (512MB)
   - Secret Manager: ✅ Free (6 secrets)
   - Artifact Registry: ⚠️  ~$0.30/month (only cost)
   
   Estimated Monthly Cost: $0.30 - $0.50
=============================================================================
`,
};

// Export individual values for easier access
export const serviceUrl = outputs.serviceUrl;
export const artifactRegistryUrl = outputs.artifactRegistryUrl;
export const mongodbConnectionUri = outputs.mongodbConnectionString;
export const deploymentInstructions = outputs.deploymentInstructions;
