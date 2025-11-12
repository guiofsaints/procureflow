/**
 * ProcureFlow GCP Infrastructure - FREE TIER Edition
 *
 * **Architecture:**
 * - MongoDB Atlas M0 (free tier, existing cluster)
 * - GCP Cloud Run (free tier: 2M requests/month)
 * - GCP Secret Manager (free tier: 6 secrets)
 * - GCP Artifact Registry (~$0.30/month)
 *
 * **Estimated Cost:** $0.30 - $0.50/month
 *
 * **Prerequisites:**
 * 1. MongoDB Atlas account (free M0 cluster)
 * 2. GCP account with billing enabled
 * 3. Pulumi Cloud account (free tier)
 * 4. GitHub account (for CI/CD)
 *
 * **Quick Start:**
 * ```bash
 * # Initialize stack
 * pulumi stack init dev
 * pulumi config set gcp:project YOUR_PROJECT_ID
 * pulumi config set gcp:region us-central1
 *
 * # Set secrets
 * pulumi config set --secret nextauth-secret $(openssl rand -base64 32)
 * pulumi config set --secret mongodb-connection-string "mongodb+srv://..."
 * pulumi config set --secret openai-api-key "sk-..."
 *
 * # Deploy
 * pnpm install
 * pnpm run deploy
 * ```
 *
 * See: docs/SETUP.md for detailed setup instructions
 *
 * @module index
 */

import * as pulumi from '@pulumi/pulumi';
import { createSecrets, grantSecretAccess } from './security/secrets';
import { createCloudRunService } from './compute/cloudrun';

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
const mongoAtlasProjectId =
  config.get('mongodb-project-id') || '6913b7cf8e8db76c8799c1ea';

// ==============================================================================
// Infrastructure Components
// ==============================================================================

// 1. MongoDB Connection String (using existing cluster)
const mongodbConnectionString = config.requireSecret(
  'mongodb-connection-string'
);

// 2. Artifact Registry (for Docker images)
// Note: Artifact Registry is managed manually due to CI/CD permission constraints
// Registry URL: us-central1-docker.pkg.dev/{project-id}/procureflow
const artifactRegistryUrl = `${region}-docker.pkg.dev/${projectId}/procureflow`;

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

  // Artifact Registry (managed manually)
  artifactRegistryUrl: artifactRegistryUrl,

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
   - Registry: ${artifactRegistryUrl}
   - Current Tag: ${imageTag}
   - Note: Artifact Registry managed manually (permission constraint)

📝 Next Steps:

1. Build and push Docker image:
   cd ../../../../
   docker build -f packages/infra/docker/Dockerfile.web -t ${artifactRegistryUrl}/web:${imageTag} .
   gcloud auth configure-docker ${region}-docker.pkg.dev
   docker push ${artifactRegistryUrl}/web:${imageTag}

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
   - Artifact Registry: ⚠️  ~$0.30/month (only cost, managed manually)
   
   Estimated Monthly Cost: $0.30 - $0.50
=============================================================================
`,
};

// Export individual values for easier access
export const serviceUrl = outputs.serviceUrl;
export const registryUrl = outputs.artifactRegistryUrl;
export const mongodbConnectionUri = outputs.mongodbConnectionString;
export const deploymentInstructions = outputs.deploymentInstructions;
