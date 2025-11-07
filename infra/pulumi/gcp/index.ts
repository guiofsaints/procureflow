import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';

// Get configuration values
const config = new pulumi.Config();
const gcpConfig = new pulumi.Config('gcp');

const projectId = gcpConfig.require('project');
const region = gcpConfig.get('region') || 'us-central1';
const zone = gcpConfig.get('zone') || 'us-central1-a';
const environment = config.get('app:environment') || 'dev';

// Create a Cloud Run service for the Next.js application
const cloudRunService = new gcp.cloudrun.Service('procureflow-web', {
  location: region,

  template: {
    spec: {
      containers: [
        {
          // Note: In production, this should point to your container registry
          // For now, we'll use a placeholder that you'll need to update
          image: 'gcr.io/cloudrun/hello', // Placeholder - replace with your actual image

          ports: [
            {
              containerPort: 3000,
            },
          ],

          envs: [
            {
              name: 'NODE_ENV',
              value: 'production',
            },
            {
              name: 'NEXTAUTH_URL',
              value: pulumi.interpolate`https://procureflow-${environment}-${projectId}.run.app`,
            },
            // Note: In production, use Secret Manager for sensitive values
            {
              name: 'NEXTAUTH_SECRET',
              value: 'change-this-in-production-use-secret-manager',
            },
          ],

          resources: {
            limits: {
              cpu: '1000m',
              memory: '512Mi',
            },
          },
        },
      ],

      containerConcurrency: 80,
      timeoutSeconds: 300,
    },

    metadata: {
      annotations: {
        'autoscaling.knative.dev/maxScale': '10',
        'run.googleapis.com/cpu-throttling': 'false',
      },
    },
  },

  traffics: [
    {
      percent: 100,
      latestRevision: true,
    },
  ],

  metadata: {
    annotations: {
      'run.googleapis.com/ingress': 'all',
    },
  },
});

// Create IAM policy to allow public access to Cloud Run service
const iamPolicy = new gcp.cloudrun.IamMember('procureflow-web-public', {
  service: cloudRunService.name,
  location: cloudRunService.location,
  role: 'roles/run.invoker',
  member: 'allUsers',
});

// Create a storage bucket for static assets (optional)
const storageBucket = new gcp.storage.Bucket('procureflow-assets', {
  location: region,
  uniformBucketLevelAccess: true,

  lifecycleRules: [
    {
      condition: {
        age: 30,
      },
      action: {
        type: 'Delete',
      },
    },
  ],

  cors: [
    {
      origins: ['*'],
      methods: ['GET', 'HEAD'],
      responseHeaders: ['*'],
      maxAgeSeconds: 3600,
    },
  ],
});

// Make the bucket publicly readable
const bucketIamMember = new gcp.storage.BucketIAMMember(
  'procureflow-assets-public',
  {
    bucket: storageBucket.name,
    role: 'roles/storage.objectViewer',
    member: 'allUsers',
  }
);

// Output the service URL
export const serviceUrl = cloudRunService.statuses.apply(
  (statuses) => statuses[0]?.url || 'Not available'
);

export const bucketName = storageBucket.name;
export const bucketUrl = pulumi.interpolate`gs://${storageBucket.name}`;

// Export key configuration for reference
export const projectId_output = projectId;
export const region_output = region;
export const environment_output = environment;

// TODO: Add the following resources when ready for production:
// 1. Cloud SQL for PostgreSQL (instead of MongoDB if preferred)
// 2. Secret Manager for environment variables
// 3. Cloud Build for CI/CD
// 4. Load balancer with SSL certificate
// 5. VPC and firewall rules
// 6. IAM service accounts with minimal permissions
// 7. Cloud Monitoring and logging
// 8. Backup policies
