/**
 * Cloud Run Service Configuration
 * 
 * Deploys ProcureFlow Next.js app on Cloud Run
 * FREE TIER optimized:
 * - Always Free: 2M requests/month
 * - Always Free: 360,000 GB-seconds/month
 * - Always Free: 180,000 vCPU-seconds/month
 * - minScale: 0 (no cost when idle)
 */

import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';

interface CloudRunConfig {
  projectId: string;
  region: string;
  environment: string;
  imageTag: string;
  secrets: {
    nextauthSecretId: pulumi.Input<string>;
    openaiApiKeyId: pulumi.Input<string>;
    mongodbUriId: pulumi.Input<string>;
  };
}

export function createCloudRunService(config: CloudRunConfig) {
  const pulumiConfig = new pulumi.Config();

  // Create dedicated service account for Cloud Run
  const serviceAccount = new gcp.serviceaccount.Account('cloudrun-sa', {
    accountId: 'procureflow-cloudrun',
    displayName: 'ProcureFlow Cloud Run Service Account',
    description: 'Service account for ProcureFlow Cloud Run service',
  });

  // Build image URL from Artifact Registry
  const imageUrl = pulumi.interpolate`${config.region}-docker.pkg.dev/${config.projectId}/procureflow/web:${config.imageTag}`;

  // Get service URL for NEXTAUTH_URL
  const serviceName = 'procureflow-web';

  // Create Cloud Run service with FREE TIER optimizations (using v1 API for stability)
  const service = new gcp.cloudrun.Service(serviceName, {
    name: serviceName,
    location: config.region,

    template: {
      metadata: {
        annotations: {
          'autoscaling.knative.dev/minScale': '0', // ⚡ Scale to zero when idle (FREE)
          'autoscaling.knative.dev/maxScale': '2', // Prevent runaway costs
          'run.googleapis.com/cpu-throttling': 'true', // Throttle CPU when idle
          'run.googleapis.com/execution-environment': 'gen2',
        },
      },

      spec: {
        serviceAccountName: serviceAccount.email,
        containerConcurrency: 80,
        timeoutSeconds: 300,

        containers: [
          {
            image: imageUrl,

            ports: [
              {
                name: 'http1',
                containerPort: 3000,
              },
            ],

            resources: {
              limits: {
                cpu: '1000m', // 1 vCPU
                memory: '512Mi', // 512 MB
              },
            },

            envs: [
              {
                name: 'NODE_ENV',
                value: 'production',
              },
              {
                name: 'NEXT_TELEMETRY_DISABLED',
                value: '1',
              },
              {
                name: 'NEXTAUTH_URL',
                value: pulumi.interpolate`https://${serviceName}-\${config.projectId}.${config.region}.run.app`,
              },
              // Secrets from Secret Manager
              {
                name: 'NEXTAUTH_SECRET',
                valueFrom: {
                  secretKeyRef: {
                    name: config.secrets.nextauthSecretId,
                    key: 'latest',
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

    traffics: [
      {
        percent: 100,
        latestRevision: true,
      },
    ],

    metadata: {
      labels: {
        environment: config.environment,
        'managed-by': 'pulumi',
        app: 'procureflow',
      },
    },
  });

  // Make service publicly accessible (no authentication required)
  const iamPolicy = new gcp.cloudrun.IamMember('cloudrun-public-access', {
    service: service.name,
    location: config.region,
    role: 'roles/run.invoker',
    member: 'allUsers',
  });

  return {
    service,
    serviceAccount,
    iamPolicy,

    // Outputs
    serviceUrl: service.statuses.apply(s => s[0]?.url || ''),
    serviceName: service.name,
    serviceAccountEmail: serviceAccount.email,
  };
}

export function createArtifactRegistry(config: { projectId: string; region: string; environment: string }) {
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
