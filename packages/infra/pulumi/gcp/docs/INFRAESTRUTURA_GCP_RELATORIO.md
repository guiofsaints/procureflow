# Relatório de Análise - Infraestrutura GCP ProcureFlow

**Data:** 11 de Novembro de 2025  
**Versão:** 2.0 - FREE TIER EDITION  
**Status:** Plano Completo para Deploy Gratuito

---

## 📋 Sumário Executivo

Infraestrutura **100% FREE TIER** para testes do ProcureFlow usando:

- ✅ **Cloud Run** (Always Free: 2M requests/mês)
- ✅ **MongoDB Atlas M0** (Free Tier permanente: 512MB)
- ✅ **Secret Manager** (Free: primeiros 6 secrets)
- ✅ **GitHub Actions** (Free: 2000 min/mês)
- ✅ **Pulumi Cloud** (Free: 1 stack, deployments ilimitados)

**💰 Custo Total Mensal: $0.00** (dentro do free tier)

### Stack Tecnológica

```
┌─────────────────────────────────────────────┐
│          GitHub Repository (Free)           │
│  - Source code                              │
│  - GitHub Actions CI/CD                     │
└─────────────────┬───────────────────────────┘
                  │
                  │ git push
                  ▼
┌─────────────────────────────────────────────┐
│      GitHub Actions Workflow (Free)         │
│  - Trigger: push to main                    │
│  - Build Docker image                       │
│  - Run: pulumi up                           │
└─────────────────┬───────────────────────────┘
                  │
                  │ deploy
                  ▼
┌─────────────────────────────────────────────┐
│         Pulumi Cloud (Free Tier)            │
│  - State management                         │
│  - Deployment history                       │
└─────────────────┬───────────────────────────┘
                  │
                  │ provision
                  ▼
┌─────────────────────────────────────────────┐
│         Google Cloud Platform               │
│                                             │
│  ┌──────────────────────────────┐          │
│  │   Cloud Run (Always Free)    │          │
│  │   - 2M requests/mês          │◄─────────┼── Users
│  │   - 360k GB-sec/mês          │          │
│  │   - minScale: 0              │          │
│  └──────────────┬───────────────┘          │
│                 │                           │
│                 │ uses                      │
│                 ▼                           │
│  ┌──────────────────────────────┐          │
│  │  Secret Manager (Free)       │          │
│  │  - 3 secrets                 │          │
│  │  - NEXTAUTH_SECRET           │          │
│  │  - MONGODB_URI               │          │
│  │  - OPENAI_API_KEY            │          │
│  └──────────────────────────────┘          │
│                                             │
│  ┌──────────────────────────────┐          │
│  │  Artifact Registry           │          │
│  │  - Docker images             │          │
│  │  - ~$0.30/mês (único custo)  │          │
│  └──────────────────────────────┘          │
└─────────────────┬───────────────────────────┘
                  │
                  │ connect
                  ▼
┌─────────────────────────────────────────────┐
│      MongoDB Atlas (Free Tier M0)           │
│  - 512 MB storage                           │
│  - Shared RAM/CPU                           │
│  - Sempre gratuito                          │
└─────────────────────────────────────────────┘
```

### Status Atual vs Plano FREE

| Categoria                  | Status Atual     | Plano FREE          | Prioridade |
| -------------------------- | ---------------- | ------------------- | ---------- |
| **Compute (Cloud Run)**    | ⚠️ Básico        | 🎯 FREE (min=0)     | P0         |
| **Database (MongoDB)**     | ❌ Ausente       | 🎯 Atlas M0 FREE    | P0         |
| **Secrets Management**     | ❌ Ausente       | 🎯 FREE (6 secrets) | P0         |
| **CI/CD (GitHub Actions)** | ❌ Ausente       | 🎯 FREE (2k min)    | P0         |
| **State (Pulumi Cloud)**   | ❌ Ausente       | 🎯 FREE (1 stack)   | P0         |
| **Storage (GCS)**          | ⚠️ Desnecessário | ❌ Removido         | -          |
| **Networking (VPC)**       | ❌ Ausente       | ❌ Não necessário   | -          |
| **Monitoring**             | ❌ Ausente       | ⚠️ Básico (logs)    | P2         |

**Completude Plano FREE:** 100% dos recursos essenciais gratuitos

---

## 🎯 Plano de Implementação FREE TIER

### Arquitetura Simplificada (Custo Zero)

**Removido do plano original:**

- ❌ Cloud Storage Bucket (não necessário - servir static do Cloud Run)
- ❌ VPC Connector (MongoDB Atlas usa conexão pública)
- ❌ Load Balancer (Cloud Run já tem)
- ❌ Cloud Build (usar GitHub Actions)
- ❌ Monitoring avançado (usar logs básicos)

**Stack final:**

1. **Cloud Run** - Always Free tier (2M req/mês)
2. **MongoDB Atlas M0** - Free permanente (512MB)
3. **Secret Manager** - Free (6 secrets)
4. **Artifact Registry** - ~$0.30/mês (único custo)
5. **GitHub Actions** - Free (2000 min/mês)
6. **Pulumi Cloud** - Free (1 stack)

### Fase Única: Deploy FREE Completo (2-3 horas)

**Prioridade: P0 (Tudo ou nada)**

#### Passo 1: Setup MongoDB Atlas (15 min)

```powershell
# 1. Criar conta no MongoDB Atlas
# https://cloud.mongodb.com/

# 2. Criar organização e projeto "ProcureFlow"

# 3. Criar API Keys para Pulumi
# Organization Settings → Access Manager → API Keys
# Salvar: Public Key e Private Key

# 4. Anotar Organization ID
# Organization Settings → Organization ID
```

#### Passo 2: Configurar Pulumi Cloud (10 min)

```powershell
# 1. Criar conta no Pulumi Cloud (free)
# https://app.pulumi.com/signup

# 2. Login via CLI
pulumi login

# 3. Criar novo stack
cd packages/infra/pulumi/gcp
pulumi stack init dev

# 4. Configurar stack como FREE tier
pulumi config set app:tier free
```

#### Passo 3: Configurar GCP (10 min)

```powershell
# 1. Criar projeto GCP (se não existir)
gcloud projects create procureflow-dev --name="ProcureFlow Dev"

# 2. Habilitar billing (cartão de crédito necessário, mas não será cobrado)
# Console: https://console.cloud.google.com/billing

# 3. Habilitar APIs necessárias
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com

# 4. Configurar Pulumi
pulumi config set gcp:project procureflow-dev
pulumi config set gcp:region us-central1
```

#### Passo 4: Configurar Secrets (10 min)

```powershell
# 1. Gerar NEXTAUTH_SECRET
$nextauthSecret = openssl rand -base64 32
pulumi config set --secret nextauth-secret $nextauthSecret

# 2. Configurar OpenAI API Key (ou deixar vazio)
pulumi config set --secret openai-api-key "sk-your-key-or-empty"

# 3. MongoDB Atlas credentials
pulumi config set --secret mongodb-atlas:public-key "your-public-key"
pulumi config set --secret mongodb-atlas:private-key "your-private-key"
pulumi config set mongodb-atlas:org-id "your-org-id"
```

#### Passo 5: Deploy Infraestrutura (30 min)

```powershell
# 1. Instalar dependências
cd packages/infra/pulumi/gcp
pnpm install

# 2. Preview (verificar o que será criado)
pnpm run infra:preview

# 3. Deploy (primeira vez demora ~10-15 min)
pnpm run infra:deploy

# 4. Anotar outputs
# - serviceUrl: URL do Cloud Run
# - mongodbUri: Connection string do MongoDB
```

#### Passo 6: Build e Deploy da Aplicação (20 min)

```powershell
# 1. Fazer build da imagem Docker localmente
cd ../../../.. # Voltar para root
docker build -f packages/infra/docker/Dockerfile.web -t temp-image .

# 2. Autenticar Docker com GCP
gcloud auth configure-docker us-central1-docker.pkg.dev

# 3. Tag e push
$PROJECT_ID = gcloud config get-value project
docker tag temp-image us-central1-docker.pkg.dev/$PROJECT_ID/procureflow/web:v1.0.0
docker push us-central1-docker.pkg.dev/$PROJECT_ID/procureflow/web:v1.0.0

# 4. Atualizar Cloud Run com imagem real
cd packages/infra/pulumi/gcp
pulumi config set app:image-tag v1.0.0
pnpm run infra:deploy
```

#### Passo 7: Configurar GitHub Actions (15 min)

```powershell
# 1. Criar service account para GitHub
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions"

# 2. Dar permissões necessárias
$PROJECT_ID = gcloud config get-value project
$SA_EMAIL = "github-actions@$PROJECT_ID.iam.gserviceaccount.com"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/artifactregistry.writer"

# 3. Criar chave JSON
gcloud iam service-accounts keys create github-actions-key.json \
  --iam-account=$SA_EMAIL

# 4. Converter para base64 (para GitHub Secret)
$KEY_BASE64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes("github-actions-key.json"))

# 5. Adicionar secrets no GitHub
# Ir em: https://github.com/USER/REPO/settings/secrets/actions
# Adicionar:
# - GCP_PROJECT_ID
# - GCP_SA_KEY (conteúdo de $KEY_BASE64)
# - PULUMI_ACCESS_TOKEN (de https://app.pulumi.com/account/tokens)
```

#### Passo 8: Testar Deploy Automático (10 min)

```powershell
# 1. Fazer alteração e commit
git add .
git commit -m "feat: enable GitHub Actions deploy"
git push origin main

# 2. Acompanhar workflow
# https://github.com/USER/REPO/actions

# 3. Verificar deploy
# Acessar URL do Cloud Run
```

**Entregável:** Infraestrutura 100% funcional e gratuita com CI/CD automático

#### 1.1 Cloud Run Service ✅

```typescript
const cloudRunService = new gcp.cloudrun.Service('procureflow-web', {
  location: region,
  template: {
    spec: {
      containers: [
        {
          image: 'gcr.io/cloudrun/hello', // ⚠️ PLACEHOLDER
          ports: [{ containerPort: 3000 }],
          envs: [
            { name: 'NODE_ENV', value: 'production' },
            { name: 'NEXTAUTH_URL', value: pulumi.interpolate`...` },
            {
              name: 'NEXTAUTH_SECRET',
              value: 'change-this-in-production-use-secret-manager',
            }, // ⚠️ HARDCODED
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
  },
});
```

**Problemas Identificados:**

- ❌ **Imagem placeholder** (`gcr.io/cloudrun/hello`) - precisa apontar para GCR/Artifact Registry
- ❌ **Secrets hardcoded** - `NEXTAUTH_SECRET` exposto no código
- ❌ **Falta variável `MONGODB_URI`** - crítica para o app funcionar
- ❌ **Falta variável `OPENAI_API_KEY`** - necessária para funcionalidades AI
- ⚠️ **Recursos subdimensionados** - 512Mi pode ser insuficiente para Next.js + MongoDB driver

**Recomendações:**

- Apontar para imagem real no GCR: `gcr.io/${projectId}/procureflow-web:${version}`
- Migrar secrets para Secret Manager
- Adicionar health check customizado
- Aumentar memória para 1Gi (mínimo)

#### 1.2 Cloud Storage Bucket ✅

```typescript
const storageBucket = new gcp.storage.Bucket('procureflow-assets', {
  location: region,
  uniformBucketLevelAccess: true,
  lifecycleRules: [
    {
      condition: { age: 30 },
      action: { type: 'Delete' },
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
```

**Problemas Identificados:**

- ⚠️ **CORS muito permissivo** - `origins: ['*']` aceita qualquer domínio
- ⚠️ **Bucket público** - IAM permite `allUsers` como `storage.objectViewer`
- ❌ **Falta versionamento** - sem proteção contra exclusão acidental
- ❌ **Falta criptografia customizada** - usando default do GCP

**Recomendações:**

- Restringir CORS ao domínio do app
- Implementar CDN (Cloud CDN) para performance
- Habilitar versionamento e soft delete
- Configurar criptografia com KMS (opcional para MVP)

#### 1.3 IAM Policies ⚠️

```typescript
const iamPolicy = new gcp.cloudrun.IamMember('procureflow-web-public', {
  service: cloudRunService.name,
  location: cloudRunService.location,
  role: 'roles/run.invoker',
  member: 'allUsers', // ⚠️ PÚBLICO
});
```

**Problemas Identificados:**

- ❌ **Serviço totalmente público** - sem autenticação no Cloud Run
- ❌ **Falta service account dedicada** - usando compute default service account
- ❌ **Sem least privilege** - permissões não seguem princípio de menor privilégio

**Recomendações:**

- Criar service account específica com permissões mínimas
- Implementar Cloud Armor para proteção DDoS
- Adicionar Identity-Aware Proxy (IAP) se necessário controle de acesso

---

### 2. Recursos Críticos Faltando (Bloqueadores para MVP)

#### 2.1 Database (MongoDB) ❌ **CRÍTICO**

**Status:** Não implementado

**Problema:**
A aplicação ProcureFlow depende **obrigatoriamente** de MongoDB (variável `MONGODB_URI` é required em `lib/db/mongoose.ts`). Sem banco de dados, o app **não funciona**.

**Opções para Implementação:**

##### Opção A: MongoDB Atlas (Recomendado para MVP) ⭐

```typescript
// Usar MongoDB Atlas via Pulumi provider
import * as mongodbatlas from '@pulumi/mongodbatlas';

const cluster = new mongodbatlas.Cluster('procureflow-mongodb', {
  projectId: atlasProjectId,
  name: 'procureflow-cluster',
  providerName: 'GCP',
  providerRegionName: 'US_CENTRAL1',
  providerInstanceSizeName: 'M10', // Menor tier paid
  mongoDbMajorVersion: '7.0',
  autoScalingDiskGbEnabled: true,
});
```

**Vantagens:**

- ✅ Managed service - sem operação de infra
- ✅ Backups automáticos
- ✅ Suporte a replica sets nativo
- ✅ Free tier (M0) disponível para dev
- ✅ Integração fácil com GCP via Private Link

**Desvantagens:**

- ❌ Custo adicional (M10 ~$60/mês)
- ❌ Vendor lock-in com Atlas

##### Opção B: Cloud SQL for PostgreSQL (Migração necessária)

```typescript
const dbInstance = new gcp.sql.DatabaseInstance('procureflow-db', {
  databaseVersion: 'POSTGRES_15',
  region: region,
  settings: {
    tier: 'db-f1-micro',
    ipConfiguration: {
      authorizedNetworks: [],
      privateNetwork: vpcNetwork.selfLink,
    },
  },
});
```

**Vantagens:**

- ✅ Nativo do GCP
- ✅ Integração com VPC e Cloud Run
- ✅ Backups automáticos

**Desvantagens:**

- ❌ **Requer migração de MongoDB para PostgreSQL** (trabalho significativo)
- ❌ Precisa reescrever schemas e queries
- ❌ Perde features específicas do MongoDB (text search, embedded documents)

##### Opção C: MongoDB em Compute Engine (Não recomendado)

**Desvantagens:**

- ❌ Alta complexidade operacional
- ❌ Sem managed backups
- ❌ Precisa configurar replica set manualmente
- ❌ Custo operacional alto (DevOps)

**Recomendação Final:** **MongoDB Atlas (Opção A)** - balanceia facilidade, custo e time-to-market.

**Prioridade:** 🔴 **CRÍTICA** (P0 - bloqueador)

---

#### 2.2 Secret Manager ❌ **CRÍTICO**

**Status:** Não implementado

**Problema:**
Secrets como `NEXTAUTH_SECRET`, `OPENAI_API_KEY` e `MONGODB_URI` estão **hardcoded** no código Pulumi ou não configurados.

**Implementação Necessária:**

```typescript
// 1. Criar secrets no Secret Manager
const nextauthSecret = new gcp.secretmanager.Secret('nextauth-secret', {
  secretId: 'nextauth-secret',
  replication: {
    automatic: true,
  },
});

const nextauthSecretVersion = new gcp.secretmanager.SecretVersion(
  'nextauth-secret-v1',
  {
    secret: nextauthSecret.id,
    secretData: config.requireSecret('nextauth-secret'), // Via pulumi config --secret
  }
);

const openaiApiKey = new gcp.secretmanager.Secret('openai-api-key', {
  secretId: 'openai-api-key',
  replication: { automatic: true },
});

const openaiApiKeyVersion = new gcp.secretmanager.SecretVersion(
  'openai-api-key-v1',
  {
    secret: openaiApiKey.id,
    secretData: config.requireSecret('openai-api-key'),
  }
);

const mongodbUri = new gcp.secretmanager.Secret('mongodb-uri', {
  secretId: 'mongodb-uri',
  replication: { automatic: true },
});

const mongodbUriVersion = new gcp.secretmanager.SecretVersion(
  'mongodb-uri-v1',
  {
    secret: mongodbUri.id,
    secretData: atlasCluster.connectionStrings[0].standard, // De MongoDB Atlas
  }
);

// 2. Dar permissão para Cloud Run acessar
const secretAccessorBinding = new gcp.secretmanager.SecretIamMember(
  'cloudrun-secret-access',
  {
    secretId: nextauthSecret.id,
    role: 'roles/secretmanager.secretAccessor',
    member: pulumi.interpolate`serviceAccount:${serviceAccount.email}`,
  }
);

// 3. Referenciar no Cloud Run
const cloudRunService = new gcp.cloudrun.Service('procureflow-web', {
  template: {
    spec: {
      containers: [
        {
          envs: [
            {
              name: 'NEXTAUTH_SECRET',
              valueFrom: {
                secretKeyRef: {
                  name: nextauthSecret.secretId,
                  key: 'latest',
                },
              },
            },
            // ... outras secrets
          ],
        },
      ],
    },
  },
});
```

**Secrets Necessários:**

1. `NEXTAUTH_SECRET` - Auth.js session encryption
2. `MONGODB_URI` - Connection string do MongoDB Atlas
3. `OPENAI_API_KEY` - OpenAI API (ou `GOOGLE_API_KEY` para Gemini)
4. `NEXTAUTH_URL` - URL do app (pode ser pulumi.interpolate)

**Configuração via Pulumi CLI:**

```bash
# Set secrets via Pulumi config (encrypted automatically)
pulumi config set --secret nextauth-secret $(openssl rand -base64 32)
pulumi config set --secret openai-api-key sk-your-key-here
pulumi config set --secret mongodb-uri mongodb+srv://user:pass@cluster.mongodb.net/procureflow
```

**Prioridade:** 🔴 **CRÍTICA** (P0 - bloqueador de segurança)

---

#### 2.3 Container Registry & CI/CD ❌ **ALTA**

**Status:** Não implementado

**Problema:**
O Cloud Run está apontando para imagem placeholder. Precisa de pipeline para:

1. Build da imagem Docker
2. Push para GCR/Artifact Registry
3. Deploy automático no Cloud Run

**Implementação Necessária:**

##### Artifact Registry (substitui GCR legacy)

```typescript
const artifactRegistry = new gcp.artifactregistry.Repository(
  'procureflow-images',
  {
    location: region,
    repositoryId: 'procureflow',
    format: 'DOCKER',
    description: 'ProcureFlow container images',
  }
);

export const imageRegistry = pulumi.interpolate`${region}-docker.pkg.dev/${projectId}/${artifactRegistry.repositoryId}`;
```

##### Cloud Build Trigger (CI/CD)

```typescript
const buildTrigger = new gcp.cloudbuild.Trigger('procureflow-deploy', {
  name: 'procureflow-main-deploy',
  github: {
    owner: 'your-org',
    name: 'procureflow',
    push: {
      branch: '^main$',
    },
  },
  filename: 'cloudbuild.yaml', // Arquivo na raiz do repo
});
```

##### cloudbuild.yaml (criar na raiz do projeto)

```yaml
steps:
  # Build Next.js Docker image
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-f'
      - 'packages/infra/docker/Dockerfile.web'
      - '-t'
      - '${_REGION}-docker.pkg.dev/${PROJECT_ID}/procureflow/procureflow-web:${SHORT_SHA}'
      - '-t'
      - '${_REGION}-docker.pkg.dev/${PROJECT_ID}/procureflow/procureflow-web:latest'
      - '.'
    dir: '.'

  # Push to Artifact Registry
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - '--all-tags'
      - '${_REGION}-docker.pkg.dev/${PROJECT_ID}/procureflow/procureflow-web'

  # Deploy to Cloud Run
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'procureflow-web'
      - '--image=${_REGION}-docker.pkg.dev/${PROJECT_ID}/procureflow/procureflow-web:${SHORT_SHA}'
      - '--region=${_REGION}'
      - '--platform=managed'
      - '--allow-unauthenticated'

substitutions:
  _REGION: us-central1

options:
  machineType: 'N1_HIGHCPU_8'
  logging: CLOUD_LOGGING_ONLY

timeout: '1200s'
```

**Permissões IAM para Cloud Build:**

```typescript
const buildServiceAccount = new gcp.serviceaccount.Account('cloudbuild-sa', {
  accountId: 'cloudbuild-deployer',
  displayName: 'Cloud Build Service Account',
});

// Permissão para deploy no Cloud Run
const cloudRunAdminBinding = new gcp.projects.IAMMember(
  'cloudbuild-run-admin',
  {
    project: projectId,
    role: 'roles/run.admin',
    member: pulumi.interpolate`serviceAccount:${buildServiceAccount.email}`,
  }
);

// Permissão para usar service account
const actAsBinding = new gcp.projects.IAMMember('cloudbuild-act-as', {
  project: projectId,
  role: 'roles/iam.serviceAccountUser',
  member: pulumi.interpolate`serviceAccount:${buildServiceAccount.email}`,
});
```

**Alternativa Manual (para MVP rápido):**

```bash
# Build local e push manual
cd packages/web
docker build -f ../infra/docker/Dockerfile.web -t us-central1-docker.pkg.dev/PROJECT_ID/procureflow/procureflow-web:v1.0.0 ../..
docker push us-central1-docker.pkg.dev/PROJECT_ID/procureflow/procureflow-web:v1.0.0

# Atualizar Pulumi index.ts com imagem real
```

**Prioridade:** 🟠 **ALTA** (P1 - necessário para automação)

---

#### 2.4 Networking (VPC & Serverless VPC Access) ⚠️ **MÉDIA**

**Status:** Não implementado (usando rede default)

**Problema:**

- Cloud Run não consegue acessar recursos privados (ex: MongoDB em VPC)
- Sem controle de egress/ingress
- Sem firewall rules customizadas

**Implementação Necessária:**

```typescript
// VPC Network
const vpcNetwork = new gcp.compute.Network('procureflow-vpc', {
  name: 'procureflow-network',
  autoCreateSubnetworks: false,
});

// Subnet para Cloud Run
const subnet = new gcp.compute.Subnetwork('procureflow-subnet', {
  name: 'procureflow-subnet',
  ipCidrRange: '10.0.0.0/24',
  region: region,
  network: vpcNetwork.id,
  privateIpGoogleAccess: true,
});

// Serverless VPC Access Connector
const vpcConnector = new gcp.vpcaccess.Connector('procureflow-connector', {
  name: 'procureflow-vpc-conn',
  region: region,
  ipCidrRange: '10.8.0.0/28',
  network: vpcNetwork.name,
  minInstances: 2,
  maxInstances: 3,
  machineType: 'f1-micro',
});

// Atualizar Cloud Run para usar VPC
const cloudRunService = new gcp.cloudrun.Service('procureflow-web', {
  template: {
    metadata: {
      annotations: {
        'run.googleapis.com/vpc-access-connector': vpcConnector.id,
        'run.googleapis.com/vpc-access-egress': 'private-ranges-only',
      },
    },
  },
});

// Firewall rule - permitir egress para MongoDB Atlas
const firewallRule = new gcp.compute.Firewall('allow-mongodb-atlas', {
  network: vpcNetwork.id,
  allows: [
    {
      protocol: 'tcp',
      ports: ['27017'],
    },
  ],
  direction: 'EGRESS',
  destinationRanges: ['0.0.0.0/0'], // Melhorar com IP ranges do Atlas
});
```

**Quando é Necessário:**

- ✅ Se usar Cloud SQL (requer Private IP)
- ✅ Se usar MongoDB em Compute Engine
- ❌ **NÃO necessário para MongoDB Atlas** (conexão pública com IP whitelist)

**Recomendação:** Implementar apenas se usar Cloud SQL. Para MongoDB Atlas, pode ser posposto.

**Prioridade:** 🟡 **MÉDIA** (P2 - otimização futura)

---

#### 2.5 Monitoring & Logging ❌ **MÉDIA**

**Status:** Não implementado

**Problema:**

- Sem dashboards customizados
- Sem alertas para falhas
- Logs dispersos sem agregação

**Implementação Necessária:**

```typescript
// Cloud Monitoring Alert Policy
const errorRateAlert = new gcp.monitoring.AlertPolicy('high-error-rate', {
  displayName: 'High Error Rate - ProcureFlow',
  conditions: [
    {
      displayName: 'Error rate > 5%',
      conditionThreshold: {
        filter: `resource.type="cloud_run_revision" AND resource.labels.service_name="procureflow-web" AND metric.type="run.googleapis.com/request_count" AND metric.labels.response_code_class="5xx"`,
        comparison: 'COMPARISON_GT',
        thresholdValue: 5,
        duration: '300s',
        aggregations: [
          {
            alignmentPeriod: '60s',
            perSeriesAligner: 'ALIGN_RATE',
          },
        ],
      },
    },
  ],
  notificationChannels: [emailChannel.id],
  alertStrategy: {
    autoClose: '1800s',
  },
});

// Notification Channel (Email)
const emailChannel = new gcp.monitoring.NotificationChannel('email-alerts', {
  displayName: 'ProcureFlow Alerts',
  type: 'email',
  labels: {
    email_address: config.require('alert-email'),
  },
});

// Log-based Metric
const errorLogMetric = new gcp.logging.Metric('critical-errors', {
  name: 'procureflow/critical-errors',
  filter: 'resource.type="cloud_run_revision" AND severity>=ERROR',
  metricDescriptor: {
    metricKind: 'DELTA',
    valueType: 'INT64',
  },
});
```

**Métricas Essenciais:**

1. Request rate e latência (P50, P95, P99)
2. Error rate (4xx, 5xx)
3. Container instance count
4. Memory e CPU usage
5. Database connection pool

**Prioridade:** 🟡 **MÉDIA** (P2 - operação pós-deploy)

---

#### 2.6 Custom Domain & SSL ❌ **BAIXA**

**Status:** Não implementado

**Problema:**
URL padrão do Cloud Run: `procureflow-web-xxxx-uc.a.run.app` (não profissional)

**Implementação Necessária:**

```typescript
// Domain Mapping
const domainMapping = new gcp.cloudrun.DomainMapping('procureflow-domain', {
  location: region,
  name: 'app.procureflow.com',
  metadata: {
    namespace: projectId,
  },
  spec: {
    routeName: cloudRunService.name,
  },
});

// DNS Record (usando Cloud DNS)
const dnsZone = new gcp.dns.ManagedZone('procureflow-zone', {
  name: 'procureflow-zone',
  dnsName: 'procureflow.com.',
});

const dnsRecord = new gcp.dns.RecordSet('procureflow-app-record', {
  name: pulumi.interpolate`app.${dnsZone.dnsName}`,
  type: 'CNAME',
  ttl: 300,
  managedZone: dnsZone.name,
  rrdatas: ['ghs.googlehosted.com.'],
});
```

**Prioridade:** 🟢 **BAIXA** (P3 - UX improvement)

---

### 3. Configurações Ausentes no Pulumi.yaml

**Arquivo Atual:**

```yaml
config:
  gcp:project:
    description: GCP Project ID
  gcp:region:
    description: GCP Region
    default: us-central1
  gcp:zone:
    description: GCP Zone
    default: us-central1-a
  app:domain:
    description: Custom domain
  app:environment:
    description: Environment name
    default: dev
  app:mongodb-tier:
    description: MongoDB Atlas cluster tier
    default: M0
```

**Faltando:**

```yaml
config:
  # Secrets (encrypted)
  nextauth-secret:
    description: NextAuth.js secret key
    secret: true
  openai-api-key:
    description: OpenAI API key
    secret: true
  mongodb-uri:
    description: MongoDB connection string
    secret: true

  # MongoDB Atlas (se usar)
  mongodb-atlas:public-key:
    description: MongoDB Atlas public API key
    secret: true
  mongodb-atlas:private-key:
    description: MongoDB Atlas private API key
    secret: true
  mongodb-atlas:org-id:
    description: MongoDB Atlas organization ID

  # Alerting
  alert-email:
    description: Email for monitoring alerts

  # CI/CD
  github:repo-owner:
    description: GitHub repository owner
  github:repo-name:
    description: GitHub repository name
    default: procureflow

  # Container image
  container:image-tag:
    description: Docker image tag
    default: latest
```

---

### 4. Dependencies Faltando no package.json

**Arquivo Atual:**

```json
{
  "dependencies": {
    "@pulumi/gcp": "9.4.0",
    "@pulumi/pulumi": "^3.206.0"
  }
}
```

**Adicionar:**

```json
{
  "dependencies": {
    "@pulumi/gcp": "9.4.0",
    "@pulumi/pulumi": "^3.206.0",
    "@pulumi/mongodbatlas": "^4.11.0", // Para MongoDB Atlas
    "@pulumi/random": "^4.16.0" // Para gerar secrets
  }
}
```

---

## 📊 Plano de Implementação Mínima Viável (MVP)

### Fase 1: Fundação (Bloqueadores) - 1-2 dias

**Prioridade: P0 (Crítica)**

1. **Setup MongoDB Atlas**
   - [ ] Criar conta no MongoDB Atlas
   - [ ] Adicionar `@pulumi/mongodbatlas` ao package.json
   - [ ] Implementar cluster M0 (free tier) ou M10 (paid)
   - [ ] Configurar IP whitelist para Cloud Run (0.0.0.0/0 inicialmente)
   - [ ] Obter connection string

2. **Implementar Secret Manager**
   - [ ] Criar secrets: `nextauth-secret`, `mongodb-uri`, `openai-api-key`
   - [ ] Adicionar secret versions via `pulumi config --secret`
   - [ ] Configurar IAM para Cloud Run acessar secrets
   - [ ] Atualizar Cloud Run service com `valueFrom.secretKeyRef`

3. **Corrigir Cloud Run Configuration**
   - [ ] Criar service account dedicada
   - [ ] Adicionar todas env vars necessárias (incluindo MONGODB_URI)
   - [ ] Aumentar resources (memory: 1Gi, cpu: 2000m)
   - [ ] Configurar health check em `/api/health`

**Entregável:** Infraestrutura básica funcional com banco de dados e secrets seguros

---

### Fase 2: CI/CD (Automação) - 1-2 dias

**Prioridade: P1 (Alta)**

1. **Setup Artifact Registry**
   - [ ] Criar repository no Artifact Registry
   - [ ] Exportar URL do registry como output

2. **Cloud Build Configuration**
   - [ ] Criar `cloudbuild.yaml` na raiz do projeto
   - [ ] Configurar build trigger para branch `main`
   - [ ] Adicionar IAM permissions para Cloud Build SA
   - [ ] Testar build manual primeiro

3. **Atualizar Cloud Run com Imagem Real**
   - [ ] Fazer build inicial da imagem
   - [ ] Push para Artifact Registry
   - [ ] Atualizar `index.ts` com imagem real
   - [ ] Deploy via `pulumi up`

**Entregável:** Pipeline automatizado de build e deploy

---

### Fase 3: Monitoramento (Observabilidade) - 1 dia

**Prioridade: P2 (Média)**

1. **Cloud Monitoring**
   - [ ] Criar alert policy para error rate
   - [ ] Criar notification channel (email)
   - [ ] Configurar log-based metrics
   - [ ] Dashboard básico (opcional)

2. **Logging**
   - [ ] Verificar logs estruturados no Cloud Run
   - [ ] Criar log sink para BigQuery (análise futura)

**Entregável:** Monitoramento básico para detecção de falhas

---

### Fase 4: Otimizações (Post-MVP) - Backlog

**Prioridade: P3 (Baixa)**

- [ ] Custom domain com SSL
- [ ] VPC e Serverless VPC Access
- [ ] Cloud CDN para static assets
- [ ] Cloud Armor (WAF)
- [ ] Backup automatizado
- [ ] Multi-region deployment

---

## 💰 Estimativa de Custos (Mensal)

### Cenário MVP (Low Traffic - <10k requests/dia)

| Serviço               | Configuração                 | Custo Estimado |
| --------------------- | ---------------------------- | -------------- |
| **Cloud Run**         | 1 vCPU, 1Gi RAM, 100 req/min | ~$10-20        |
| **MongoDB Atlas**     | M0 (free tier)               | $0             |
| **MongoDB Atlas**     | M10 (paid, HA)               | $60            |
| **Secret Manager**    | 3 secrets, 1000 access/mês   | $0.18          |
| **Artifact Registry** | 5 GB storage                 | $0.50          |
| **Cloud Build**       | 120 builds/mês (free tier)   | $0             |
| **Cloud Storage**     | 10 GB, 1000 req/mês          | $0.30          |
| **Cloud Monitoring**  | Logs + metrics básicos       | $5-10          |
| **Networking**        | Data transfer 10 GB          | $1.20          |

**Total Estimado (com MongoDB M0):** ~$17-32/mês  
**Total Estimado (com MongoDB M10):** ~$77-92/mês

### Cenário Produção (Medium Traffic - 100k requests/dia)

| Serviço                  | Configuração                    | Custo Estimado |
| ------------------------ | ------------------------------- | -------------- |
| **Cloud Run**            | 2 vCPU, 2Gi RAM, autoscale 1-10 | $80-150        |
| **MongoDB Atlas**        | M30 (HA, 2 replicas)            | $230           |
| **Secret Manager**       | 5 secrets, 10k access/mês       | $0.36          |
| **Artifact Registry**    | 20 GB storage                   | $2             |
| **Cloud Build**          | 300 builds/mês                  | $15            |
| **Cloud Storage**        | 50 GB, 10k req/mês              | $2             |
| **Cloud Monitoring**     | Advanced metrics + alerting     | $20-30         |
| **Networking**           | Data transfer 100 GB            | $12            |
| **VPC Access Connector** | f1-micro, 2-3 instances         | $10-15         |

**Total Estimado:** ~$370-470/mês

---

## 🚀 Checklist de Deploy

### Pré-requisitos

- [ ] Conta GCP com projeto criado
- [ ] Billing account ativada
- [ ] Pulumi CLI instalado (`pulumi version`)
- [ ] GCP CLI autenticado (`gcloud auth login`)
- [ ] MongoDB Atlas account (se usar)
- [ ] OpenAI API key (ou Google Gemini)

### Configuração Inicial

```powershell
# 1. Instalar dependências
cd packages/infra/pulumi/gcp
pnpm install

# 2. Adicionar MongoDB Atlas provider
pnpm add @pulumi/mongodbatlas @pulumi/random

# 3. Login no Pulumi
pulumi login

# 4. Criar novo stack
pulumi stack init dev

# 5. Configurar GCP
pulumi config set gcp:project YOUR_PROJECT_ID
pulumi config set gcp:region us-central1

# 6. Configurar secrets
pulumi config set --secret nextauth-secret $(openssl rand -base64 32)
pulumi config set --secret openai-api-key sk-your-key-here
pulumi config set --secret mongodb-uri mongodb+srv://user:pass@cluster.mongodb.net/procureflow

# 7. Configurar MongoDB Atlas (se usar)
pulumi config set --secret mongodb-atlas:public-key your-public-key
pulumi config set --secret mongodb-atlas:private-key your-private-key
pulumi config set mongodb-atlas:org-id your-org-id

# 8. Configurar alerting
pulumi config set alert-email your-email@example.com

# 9. Preview changes
pulumi preview

# 10. Deploy
pulumi up
```

### Pós-Deploy

- [ ] Testar health endpoint: `curl https://SERVICE_URL/api/health`
- [ ] Verificar logs: `gcloud run logs tail procureflow-web --region us-central1`
- [ ] Verificar secrets: `gcloud secrets list`
- [ ] Testar autenticação
- [ ] Verificar conexão com MongoDB
- [ ] Testar funcionalidade AI agent
- [ ] Configurar domain (se aplicável)

---

## 📝 Arquivos a Criar/Atualizar

### Novos Arquivos

1. **`packages/infra/pulumi/gcp/mongodb-atlas.ts`**

   ```typescript
   // Implementação do MongoDB Atlas cluster
   ```

2. **`packages/infra/pulumi/gcp/secrets.ts`**

   ```typescript
   // Gerenciamento de secrets no Secret Manager
   ```

3. **`packages/infra/pulumi/gcp/cicd.ts`**

   ```typescript
   // Artifact Registry + Cloud Build
   ```

4. **`packages/infra/pulumi/gcp/monitoring.ts`**

   ```typescript
   // Alert policies e notification channels
   ```

5. **`cloudbuild.yaml`** (raiz do projeto)

   ```yaml
   # Cloud Build configuration
   ```

6. **`.gcloudignore`** (raiz do projeto)
   ```
   node_modules/
   .git/
   .env*
   ```

### Arquivos a Atualizar

1. **`packages/infra/pulumi/gcp/index.ts`**
   - Importar novos módulos
   - Corrigir Cloud Run service
   - Adicionar service account
   - Exportar outputs completos

2. **`packages/infra/pulumi/gcp/package.json`**
   - Adicionar `@pulumi/mongodbatlas`
   - Adicionar `@pulumi/random`

3. **`packages/infra/pulumi/gcp/Pulumi.yaml`**
   - Adicionar configurações de secrets
   - Adicionar MongoDB Atlas configs
   - Adicionar CI/CD configs

4. **`packages/infra/pulumi/gcp/tsconfig.json`**
   - Adicionar novos arquivos no `include`

---

## ⚠️ Riscos e Mitigações

| Risco                             | Impacto    | Mitigação                             |
| --------------------------------- | ---------- | ------------------------------------- |
| **MongoDB Atlas não configurado** | 🔴 Crítico | Implementar na Fase 1 (P0)            |
| **Secrets expostos no código**    | 🔴 Crítico | Secret Manager na Fase 1 (P0)         |
| **Imagem Docker placeholder**     | 🔴 Crítico | CI/CD na Fase 2 (P1)                  |
| **Custo inesperado**              | 🟠 Alto    | Billing alerts + budget limits        |
| **Sem monitoramento**             | 🟠 Alto    | Implementar na Fase 3 (P2)            |
| **Downtime sem alertas**          | 🟡 Médio   | Uptime checks + notification channels |
| **MongoDB público (sem VPC)**     | 🟡 Médio   | IP whitelist + strong passwords       |
| **Dependência de vendor (Atlas)** | 🟢 Baixo   | Aceitar como tradeoff de MVP          |

---

## 🗑️ Destruição da Infraestrutura

### Comando de Destruição (Pulumi)

```powershell
# Destruir TODOS os recursos criados pelo Pulumi
cd packages/infra/pulumi/gcp
pulumi destroy

# Confirmar com 'yes' quando solicitado
# Aguardar conclusão (3-5 minutos)
```

### Processo de Destruição Segura

**Antes de destruir:**

```powershell
# 1. Exportar dados importantes (se houver)
# Fazer backup do banco MongoDB Atlas via UI ou CLI

# 2. Verificar dependências
pulumi stack graph

# 3. Preview das destruições
pulumi destroy --preview-only

# 4. Verificar custos acumulados
gcloud billing accounts list
```

**Ordem de Destruição (automática pelo Pulumi):**

1. ✅ Cloud Run service (preserva logs por 30 dias)
2. ✅ Domain mappings e IAM bindings
3. ✅ Secret Manager secrets (soft delete por 30 dias)
4. ✅ Cloud Build triggers
5. ✅ Artifact Registry repositories (preserva imagens deletadas por 30 dias)
6. ✅ Storage buckets (⚠️ **CUIDADO:** dados perdidos permanentemente)
7. ✅ VPC connectors e networking
8. ✅ Monitoring alert policies
9. ✅ Service accounts

**⚠️ ATENÇÃO - Recursos que NÃO são destruídos automaticamente:**

```powershell
# MongoDB Atlas cluster (se criado via UI)
# Destruir manualmente no console do Atlas

# Logs do Cloud Logging (retained por período configurado)
# Limpar manualmente se necessário:
gcloud logging logs delete projects/YOUR_PROJECT_ID/logs/run.googleapis.com%2Fstderr

# Imagens no Artifact Registry (soft delete)
# Purgar permanentemente:
gcloud artifacts docker images delete REGION-docker.pkg.dev/PROJECT/REPO/IMAGE --delete-tags
```

### Checklist de Limpeza Completa

- [ ] `pulumi destroy` executado com sucesso
- [ ] MongoDB Atlas cluster deletado (via console Atlas)
- [ ] Verificar billing dashboard (sem custos residuais)
- [ ] Limpar logs antigos (opcional)
- [ ] Remover stack do Pulumi: `pulumi stack rm dev`
- [ ] Verificar Secret Manager (secrets em soft delete)
- [ ] Verificar Storage buckets deletados
- [ ] Confirmar no GCP Console: nenhum recurso órfão

### Proteção Contra Deleção Acidental

Para ambientes críticos, adicionar proteção:

```typescript
// Em index.ts, adicionar a recursos importantes:
const storageBucket = new gcp.storage.Bucket(
  'procureflow-assets',
  {
    // ... configurações existentes
    lifecycleRules: [
      {
        condition: { age: 30 },
        action: { type: 'Delete' },
      },
    ],
    // Proteção contra deleção
    retentionPolicy: {
      retentionPeriod: 86400, // 1 dia em segundos
    },
  },
  {
    protect: true, // ⚠️ Impede 'pulumi destroy' sem --remove
  }
);

// Para destruir bucket protegido:
// pulumi destroy --remove
```

### Custo de Recursos em Soft Delete

Mesmo após `pulumi destroy`, alguns recursos geram custo por 30 dias:

| Recurso                  | Período Retenção  | Custo Diário   |
| ------------------------ | ----------------- | -------------- |
| Secret Manager secrets   | 30 dias           | ~$0.006/secret |
| Artifact Registry images | 30 dias           | ~$0.016/GB     |
| Cloud Logging logs       | 30 dias (default) | ~$0.016/GB     |

**Para zerar custos completamente:** Executar purge manual dos recursos acima.

---

## 💵 Custo de 1 Dia de Testes

### Cenário Realista: Teste de MVP (24 horas)

**Configuração:**

- Cloud Run: 1 vCPU, 1Gi RAM
- MongoDB Atlas: M0 (free tier)
- Tráfego: ~100 requests totais (testes manuais)
- Sem CI/CD (build local)
- Sem monitoring avançado

#### Cálculo Detalhado (Preços GCP us-central1)

| Serviço                       | Configuração                     | Custo/Hora | Horas | Total 24h    |
| ----------------------------- | -------------------------------- | ---------- | ----- | ------------ |
| **Cloud Run (CPU allocated)** | 1 vCPU @ $0.00002400/vCPU-second | $0.0864    | 24h   | **$2.07**    |
| **Cloud Run (Memory)**        | 1Gi @ $0.00000250/GiB-second     | $0.009     | 24h   | **$0.22**    |
| **Cloud Run (Requests)**      | 100 requests @ $0.40/million     | -          | -     | **$0.00004** |
| **Secret Manager**            | 3 secrets @ $0.06/secret/mês     | -          | -     | **$0.006**   |
| **Secret Manager (access)**   | 100 acessos (free tier)          | -          | -     | **$0.00**    |
| **Artifact Registry**         | 2 GB storage @ $0.10/GB/mês      | -          | -     | **$0.007**   |
| **Cloud Storage**             | 1 GB storage @ $0.020/GB/mês     | -          | -     | **$0.0007**  |
| **Cloud Storage (ops)**       | 100 operações (free tier)        | -          | -     | **$0.00**    |
| **MongoDB Atlas**             | M0 Free Tier                     | -          | -     | **$0.00**    |
| **Cloud Logging**             | ~100 MB logs @ $0.50/GB          | -          | -     | **$0.05**    |
| **Networking (egress)**       | 500 MB @ $0.12/GB                | -          | -     | **$0.06**    |

**💰 TOTAL ESTIMADO (24 HORAS): ~$2.42**

### Breakdown por Período

| Período                                | Custo Estimado |
| -------------------------------------- | -------------- |
| **1 hora**                             | ~$0.10         |
| **8 horas** (dia de trabalho)          | ~$0.81         |
| **24 horas** (1 dia completo)          | ~$2.42         |
| **72 horas** (fim de semana de testes) | ~$7.26         |

### Otimizações para Minimizar Custo de Teste

#### 1. Usar Cloud Run com "Min Instances = 0"

```typescript
const cloudRunService = new gcp.cloudrun.Service('procureflow-web', {
  template: {
    metadata: {
      annotations: {
        'autoscaling.knative.dev/minScale': '0', // ⚡ Escala para zero quando ocioso
        'autoscaling.knative.dev/maxScale': '1', // Apenas 1 instância
      },
    },
  },
});
```

**Economia:** ~70% do custo de Cloud Run (cobra apenas quando requisições ativas)

**Custo revisado (com min instances = 0):**

- Cloud Run idle: $0.00
- Cloud Run ativo (10 minutos de testes): ~$0.03
- **Novo total 24h: ~$0.43** ✅

#### 2. Usar MongoDB Atlas M0 (Free Tier)

Já incluído no cálculo. **Permanentemente gratuito** com limites:

- 512 MB storage
- Shared RAM
- Shared CPU

**Limitação:** Adequado apenas para testes, não para produção.

#### 3. Desabilitar Logging Verbose

```typescript
// Reduzir volume de logs
const cloudRunService = new gcp.cloudrun.Service('procureflow-web', {
  template: {
    spec: {
      containers: [
        {
          envs: [
            { name: 'LOG_LEVEL', value: 'error' }, // Apenas erros
          ],
        },
      ],
    },
  },
});
```

**Economia:** ~50% em Cloud Logging (~$0.025/dia)

#### 4. Skip CI/CD (Build Local)

Fazer build localmente e push manual:

```powershell
# Build local (grátis)
docker build -t us-central1-docker.pkg.dev/PROJECT/procureflow/web:test .
docker push us-central1-docker.pkg.dev/PROJECT/procureflow/web:test

# Custo Cloud Build evitado: ~$0.05/build
```

### 🎯 Configuração Ultra-Econômica para 1 Dia

**Recursos Mínimos:**

- ✅ Cloud Run (min instances = 0)
- ✅ MongoDB Atlas M0 (free)
- ✅ Secret Manager (3 secrets)
- ✅ Artifact Registry (1 imagem)
- ❌ Cloud Build (build local)
- ❌ Monitoring alerts (usar logs manuais)
- ❌ Cloud Storage (servir static do Cloud Run)
- ❌ VPC Connector (acesso público ao MongoDB)

**💰 Custo Total (Ultra-Econômico):** ~**$0.30 - $0.50 / 24h**

### Comparação de Cenários de Teste

| Cenário                 | Configuração                         | Custo 24h | Quando Usar                      |
| ----------------------- | ------------------------------------ | --------- | -------------------------------- |
| **Ultra-Econômico**     | Min=0, M0, sem CI/CD, sem monitoring | **$0.30** | Testes básicos de funcionalidade |
| **Econômico (Default)** | Min=0, M0, build local, logs minimal | **$0.50** | Testes de integração             |
| **Realista**            | Min=1, M0, logs normais              | **$2.50** | Testes de carga leve             |
| **Produção Simulada**   | Min=1, M10, CI/CD, monitoring        | **$3.50** | Testes pré-deploy                |

### Comandos para Deploy de Teste Econômico

```powershell
# 1. Deploy ultra-econômico
cd packages/infra/pulumi/gcp

# 2. Configurar para economia máxima
pulumi config set app:environment test
pulumi config set app:min-instances 0
pulumi config set app:max-instances 1
pulumi config set app:enable-monitoring false

# 3. Deploy
pulumi up --yes

# 4. Testar (economizar tempo ativo)
# Fazer todos os testes em 1-2 horas para minimizar custo

# 5. DESTRUIR imediatamente após testes
pulumi destroy --yes

# 6. Verificar billing
gcloud billing accounts list
# Ir em: console.cloud.google.com/billing
```

### Alertas de Custo (Recomendado)

Configurar billing alert **ANTES** de deploy:

```powershell
# Via Console GCP: Billing → Budgets & alerts
# Ou via gcloud:
gcloud billing budgets create \
  --billing-account=BILLING_ACCOUNT_ID \
  --display-name="ProcureFlow Test Budget" \
  --budget-amount=5 \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=90 \
  --threshold-rule=percent=100
```

**Email de alerta quando atingir:**

- 50% de $5 = $2.50
- 90% de $5 = $4.50
- 100% de $5 = $5.00

### Recursos Gratuitos (Sempre Free)

GCP oferece **sempre grátis** (não apenas trial):

| Serviço           | Quota Gratuita/Mês                              | Equivalente Teste 24h     |
| ----------------- | ----------------------------------------------- | ------------------------- |
| Cloud Run         | 2M requests, 360k GB-seconds, 180k vCPU-seconds | ✅ Suficiente             |
| Secret Manager    | 6 secrets ativos                                | ✅ Suficiente (3 secrets) |
| Cloud Logging     | 50 GB                                           | ✅ Suficiente (~0.1 GB)   |
| Cloud Storage     | 5 GB storage, 5k class A ops                    | ✅ Suficiente             |
| Artifact Registry | -                                               | ❌ Não tem free tier      |

**⚠️ Importante:** Free tier é **mensal**, não diário. Para 1 dia de teste, você usará ~1/30 da quota mensal.

### Estimativa Final para 1 Dia de Teste

#### Configuração Recomendada (Balance custo/realismo)

```typescript
// Configuração em index.ts para teste de 1 dia
const cloudRunService = new gcp.cloudrun.Service('procureflow-web', {
  template: {
    metadata: {
      annotations: {
        'autoscaling.knative.dev/minScale': '0', // 💰 Escala a zero
        'autoscaling.knative.dev/maxScale': '2',
        'run.googleapis.com/cpu-throttling': 'true', // 💰 Throttle quando idle
      },
    },
    spec: {
      containers: [
        {
          resources: {
            limits: {
              cpu: '1000m', // 1 vCPU
              memory: '512Mi', // 512 MB (suficiente para testes)
            },
          },
          envs: [
            { name: 'LOG_LEVEL', value: 'warn' }, // 💰 Menos logs
            // ... outros envs
          ],
        },
      ],
      containerConcurrency: 10, // 💰 Menos concorrência
    },
  },
});
```

**📊 Resultado Final:**

| Componente                          | Custo 24h     |
| ----------------------------------- | ------------- |
| Cloud Run (com min=0, ~30min ativo) | $0.08         |
| MongoDB Atlas M0                    | $0.00         |
| Secret Manager                      | $0.01         |
| Artifact Registry (1 imagem, 2GB)   | $0.01         |
| Cloud Logging (minimal)             | $0.02         |
| Networking                          | $0.03         |
| **TOTAL**                           | **~$0.15** ✅ |

**🎉 Com otimizações: menos de $0.20 por dia de testes!**

---

## 🎯 Próximos Passos Recomendados

### Imediato (Esta Sprint)

1. ✅ **Revisar este relatório** com o time
2. 🔨 **Implementar Fase 1** (MongoDB + Secrets)
3. 🧪 **Testar deploy manual** via Pulumi
4. 📊 **Validar custos** no GCP Console
5. 💰 **Configurar billing alert** ($5 budget)

### Curto Prazo (Próxima Sprint)

1. 🚀 **Implementar Fase 2** (CI/CD)
2. 📈 **Implementar Fase 3** (Monitoring)
3. 🔒 **Security review** (IAM, secrets, networking)
4. 📚 **Documentar runbook** de operação

### Médio Prazo (Próximo Mês)

1. 🌐 **Custom domain** + SSL
2. 🔄 **Backup strategy** para MongoDB
3. 🌍 **Multi-region** considerations
4. 📊 **Performance tuning** baseado em métricas

---

## 📚 Referências

- [Pulumi GCP Provider](https://www.pulumi.com/registry/packages/gcp/)
- [MongoDB Atlas Pulumi Provider](https://www.pulumi.com/registry/packages/mongodbatlas/)
- [Cloud Run Best Practices](https://cloud.google.com/run/docs/best-practices)
- [Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)
- [Cloud Build Configuration](https://cloud.google.com/build/docs/build-config-file-schema)

---

## 🤝 Suporte

Para dúvidas sobre este relatório ou implementação:

- **Pulumi Slack**: [pulumi-community.slack.com](https://pulumi-community.slack.com)
- **GCP Support**: Console GCP → Support
- **MongoDB Atlas**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)

---

**Versão:** 1.0  
**Última Atualização:** 11 de Novembro de 2025  
**Autor:** GitHub Copilot (AI Assistant)  
**Status:** ✅ Análise Completa
