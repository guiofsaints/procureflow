/**
 * MongoDB Atlas Configuration
 * 
 * Creates a FREE TIER (M0) MongoDB cluster for ProcureFlow
 * - 512 MB storage
 * - Shared RAM/CPU
 * - Permanently free
 * - No credit card required after initial GCP setup
 */

import * as mongodbatlas from '@pulumi/mongodbatlas';
import * as pulumi from '@pulumi/pulumi';

interface MongoDBAtlasConfig {
  orgId: string;
  projectId: string;
  projectName: string;
  clusterName: string;
  region: string;
  environment: string;
}

export function createMongoDBAtlas(config: MongoDBAtlasConfig) {
  const pulumiConfig = new pulumi.Config();

  // Use existing MongoDB Atlas Project ID
  const projectId = config.projectId;

  // Create M0 FREE TIER Cluster
  const cluster = new mongodbatlas.Cluster(`${config.clusterName}-cluster`, {
    projectId: projectId,
    name: config.clusterName,

    // FREE TIER Configuration (M0)
    providerName: 'TENANT', // Required for M0/M2/M5
    backingProviderName: 'GCP',
    providerRegionName: 'CENTRAL_US', // Closest to us-central1
    providerInstanceSizeName: 'M0', // FREE TIER

    // MongoDB Version
    mongoDbMajorVersion: '7.0',

    // M0 doesn't support these features (keep disabled)
    autoScalingDiskGbEnabled: false,
    
    // Termination protection (prevent accidental deletion)
    terminationProtectionEnabled: false, // Set to true for production
  });

  // Create database user for the application
  const dbUser = new mongodbatlas.DatabaseUser(`${config.clusterName}-user`, {
    projectId: projectId,
    username: 'procureflow-app',
    password: pulumiConfig.requireSecret('mongodb-password'), // Set via: pulumi config set --secret mongodb-password
    authDatabaseName: 'admin',

    roles: [
      {
        roleName: 'readWrite',
        databaseName: 'procureflow', // Application database
      },
    ],

    // User labels
    labels: [
      {
        key: 'environment',
        value: config.environment,
      },
    ],
  });

  // IP Access List (allow all for FREE tier - no VPC peering available)
  // In production, restrict to specific IPs
  const ipAccessList = new mongodbatlas.ProjectIpAccessList(
    `${config.clusterName}-ip-access`,
    {
      projectId: projectId,
      cidrBlock: '0.0.0.0/0', // ⚠️ Allow all (required for Cloud Run)
      comment: 'Allow Cloud Run access (no fixed IPs available)',
    }
  );

  // Wait for cluster to be ready
  const clusterReady = pulumi.all([cluster.stateName]).apply(([state]) => {
    return state === 'IDLE';
  });

  // Build connection string
  const connectionString = pulumi.interpolate`mongodb+srv://${dbUser.username}:${dbUser.password}@${cluster.connectionStrings[0].standardSrv.apply(
    (srv) => srv.split('//')[1]
  )}/procureflow?retryWrites=true&w=majority`;

  return {
    cluster,
    dbUser,
    ipAccessList,
    clusterReady,
    
    // Outputs
    clusterId: cluster.clusterId,
    connectionString: connectionString,
    projectId: projectId,
    clusterState: cluster.stateName,
  };
}

/**
 * Free Tier Limitations (M0):
 * 
 * ✅ Allowed:
 * - 512 MB storage
 * - Shared RAM/CPU
 * - 100 max connections
 * - 10 GB network transfer/week
 * - Community support
 * 
 * ❌ Not Available:
 * - VPC peering (use IP whitelist)
 * - Automated backups (manual export only)
 * - Performance analytics
 * - Additional regions
 * - Sharding
 * - Auto-scaling
 * 
 * 💡 Upgrade Path:
 * - M10 ($60/month) for production features
 * - Change providerInstanceSizeName: 'M0' → 'M10'
 * - Set providerName: 'GCP' (instead of 'TENANT')
 */
