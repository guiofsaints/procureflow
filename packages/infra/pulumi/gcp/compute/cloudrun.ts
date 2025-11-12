/**
 * Cloud Run Service Configuration
 * 
 * Deploys ProcureFlow Next.js app on Cloud Run with FREE TIER optimizations.
 * 
 * **FREE TIER Limits:**
 * - Always Free: 2M requests/month
 * - Always Free: 360,000 GB-seconds/month
 * - Always Free: 180,000 vCPU-seconds/month
 * - minScale: 0 (scales to zero when idle = $0.00)
 * 
 * **Resources Created:**
 * - Cloud Run Service (gen2, public access)
 * - Service Account (least-privilege IAM)
 * - IAM Policy (allUsers invoker role)
 * - Artifact Registry Repository (Docker images)
 * 
 * @module compute/cloudrun
 */

import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';

/**
 * Configuration for Cloud Run service deployment
 */
interface CloudRunConfig {
  /** GCP Project ID */
  projectId: string;
  
  /** GCP region (e.g., 'us-central1') */
  region: string;
  
  /** Environment name (dev/staging/prod) */
  environment: string;
  
  /** Docker image tag to deploy */
  imageTag: string;
  
  /** Secret Manager secret IDs for environment variables */
  secrets: {
    /** NextAuth.js session encryption secret */
    nextauthSecretId: pulumi.Input<string>;
    
    /** OpenAI API key (optional) */
    openaiApiKeyId: pulumi.Input<string>;
    
    /** MongoDB connection string */
    mongodbUriId: pulumi.Input<string>;
  };
}

/**
 * Creates a Cloud Run service for ProcureFlow web application.
 * 
 * Provisions a fully-configured Cloud Run service with:
 * - Auto-scaling (0-2 instances)
 * - Secret Manager integration
 * - Public HTTPS access
 * - Dedicated service account
 * - FREE TIER optimizations
 * 
 * @param config - Cloud Run service configuration
 * @returns Cloud Run service, service account, IAM policy, and outputs
 * 
 * @example
 * ```typescript
 * const cloudRun = createCloudRunService({
 *   projectId: 'my-project',
 *   region: 'us-central1',
 *   environment: 'dev',
 *   imageTag: 'latest',
 *   secrets: { ... }
 * });
 * 
 * export const url = cloudRun.serviceUrl;
 * ```
 */
export function createCloudRunService(config: CloudRunConfig) {
  // Validate configuration
  if (!config.projectId || !config.region) {
    throw new Error('projectId and region are required for Cloud Run service');
  }

  const pulumiConfig = new pulumi.Config();

  // Create dedicated service account for Cloud Run (least-privilege principle)
  const serviceAccount = new gcp.serviceaccount.Account('cloudrun-sa', {
    accountId: 'procureflow-cloudrun',
    displayName: 'ProcureFlow Cloud Run Service Account',
    description: 'Service account for ProcureFlow Cloud Run service with secret access',
  });

  // Build fully-qualified image URL from Artifact Registry
  const imageUrl = pulumi.interpolate`${config.region}-docker.pkg.dev/${config.projectId}/procureflow/web:${config.imageTag}`;

  const serviceName = 'procureflow-web';

  // Deploy Cloud Run service with FREE TIER optimizations (v1 API for stability)
  // See: https://cloud.google.com/run/docs/configuring/services/containers
  const service = new gcp.cloudrun.Service(serviceName, {
    name: serviceName,
    location: config.region,

    template: {
      metadata: {
        annotations: {
          // ⚡ Scale to zero when idle (FREE TIER: $0 when no traffic)
          'autoscaling.knative.dev/minScale': '0',
          
          // 🔒 Prevent runaway costs (max 2 concurrent instances)
          'autoscaling.knative.dev/maxScale': '2',
          
          // 💰 Throttle CPU when idle (reduce costs)
          'run.googleapis.com/cpu-throttling': 'true',
          
          // 🚀 Use gen2 execution environment (faster cold starts)
          'run.googleapis.com/execution-environment': 'gen2',
        },
      },

      spec: {
        serviceAccountName: serviceAccount.email,
        
        // Allow 80 concurrent requests per container instance
        containerConcurrency: 80,
        
        // Timeout after 5 minutes (max allowed)
        timeoutSeconds: 300,

        containers: [
          {
            image: imageUrl,

            ports: [
              {
                name: 'http1',
                containerPort: 3000, // Next.js default port
              },
            ],

            // Resource limits (FREE TIER optimized)
            resources: {
              limits: {
                cpu: '1000m',    // 1 vCPU (within 180k vCPU-seconds/month free)
                memory: '512Mi', // 512 MB (within 360k GB-seconds/month free)
              },
            },

            envs: [
              // Node.js environment
              {
                name: 'NODE_ENV',
                value: 'production',
              },
              
              // Disable Next.js telemetry
              {
                name: 'NEXT_TELEMETRY_DISABLED',
                value: '1',
              },
              
              // NOTE: NEXTAUTH_URL must be set via gcloud after deployment
              // See: docs/SETUP.md for post-deployment configuration
              
              // 🔐 Secrets from Secret Manager (injected at runtime)
              {
                name: 'NEXTAUTH_SECRET',
                valueFrom: {
                  secretKeyRef: {
                    name: config.secrets.nextauthSecretId,
                    key: 'latest', // Always use latest version
                  },
                },
              },
              {
                name: 'MONGODB_URI',
                valueFrom: {
                  secretKeyRef: {
                    name: config.secrets.mongodbUriId,
                    key: 'latest',
                  },
                },
              },
              {
                name: 'OPENAI_API_KEY',
                valueFrom: {
                  secretKeyRef: {
                    name: config.secrets.openaiApiKeyId,
                    key: 'latest',
                  },
                },
              },
            ],
          },
        ],
      },
    },

    // Route 100% of traffic to latest revision (standard deployment)
    traffics: [
      {
        percent: 100,
        latestRevision: true,
      },
    ],

    // Resource labels for organization and cost tracking
    metadata: {
      labels: {
        environment: config.environment,
        'managed-by': 'pulumi',
        app: 'procureflow',
      },
    },
  });

  // 🌐 Make service publicly accessible (no authentication required)
  // WARNING: Remove this if you need authentication at the Cloud Run level
  const iamPolicy = new gcp.cloudrun.IamMember('cloudrun-public-access', {
    service: service.name,
    location: config.region,
    role: 'roles/run.invoker',
    member: 'allUsers',
  });

  return {
    // Resources
    service,
    serviceAccount,
    iamPolicy,

    // Outputs for stack exports
    serviceUrl: service.statuses.apply(s => s[0]?.url || ''),
    serviceName: service.name,
    serviceAccountEmail: serviceAccount.email,
  };
}

/**
 * Configuration for Artifact Registry repository
 */
interface ArtifactRegistryConfig {
  /** GCP Project ID */
  projectId: string;
  
  /** GCP region for repository */
  region: string;
  
  /** Environment name (dev/staging/prod) */
  environment: string;
}

/**
 * Creates an Artifact Registry repository for Docker images.
 * 
 * Provisions a Docker repository for storing container images.
 * Images are automatically scanned for vulnerabilities.
 * 
 * @param config - Artifact Registry configuration
 * @returns Repository resource and fully-qualified URL
 * 
 * @example
 * ```typescript
 * const registry = createArtifactRegistry({
 *   projectId: 'my-project',
 *   region: 'us-central1',
 *   environment: 'dev'
 * });
 * 
 * export const repoUrl = registry.repositoryUrl;
 * ```
 */
export function createArtifactRegistry(config: ArtifactRegistryConfig) {
  // Validate configuration
  if (!config.projectId || !config.region) {
    throw new Error('projectId and region are required for Artifact Registry');
  }

  // Create Artifact Registry repository for Docker images
  const repository = new gcp.artifactregistry.Repository('procureflow-images', {
    repositoryId: 'procureflow',
    location: config.region,
    format: 'DOCKER',
    description: 'ProcureFlow container images',
    labels: {
      environment: config.environment,
      managed_by: 'pulumi',
    },
  });

  return {
    repository,
    repositoryUrl: pulumi.interpolate`${config.region}-docker.pkg.dev/${config.projectId}/${repository.repositoryId}`,
  };
}

/**
 * Cloud Run Pricing (FREE TIER):
 * 
 * ✅ Always Free (per month):
 * - 2,000,000 requests
 * - 360,000 GB-seconds memory
 * - 180,000 vCPU-seconds
 * - 1 GB network egress (North America)
 * 
 * With minScale: 0, service scales to zero when idle = $0.00
 * 
 * Example calculation for 10,000 requests/month:
 * - Requests: 10k (within 2M free) = $0.00
 * - Memory: ~50 GB-seconds (within 360k free) = $0.00
 * - vCPU: ~25 vCPU-seconds (within 180k free) = $0.00
 * - Total: $0.00 ✅
 * 
 * 💰 Paid (if exceeded free tier):
 * - Additional requests: $0.40/million
 * - Additional memory: $0.0000025/GB-second
 * - Additional vCPU: $0.00002400/vCPU-second
 */
