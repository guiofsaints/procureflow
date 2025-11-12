#!/bin/bash

# Import existing GCP resources into Pulumi state
# Run this script if you see "already exists" errors during pulumi up

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Importing Existing GCP Resources${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Get project ID from Pulumi config
PROJECT_ID=$(pulumi config get gcp:project)

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}Error: GCP project ID not configured${NC}"
    echo "Run: pulumi config set gcp:project YOUR_PROJECT_ID"
    exit 1
fi

echo -e "${GREEN}Project ID: ${PROJECT_ID}${NC}"
echo ""

# Import Service Account
echo -e "${YELLOW}1. Importing Service Account...${NC}"
pulumi import gcp:serviceaccount/account:Account cloudrun-sa \
    "projects/${PROJECT_ID}/serviceAccounts/procureflow-cloudrun@${PROJECT_ID}.iam.gserviceaccount.com" \
    || echo -e "${YELLOW}   Service account already imported or doesn't exist${NC}"

# Import Secrets
echo -e "${YELLOW}2. Importing Secrets...${NC}"

echo "   - nextauth-secret"
pulumi import gcp:secretmanager/secret:Secret nextauth-secret \
    "projects/${PROJECT_ID}/secrets/nextauth-secret" \
    || echo -e "${YELLOW}     Already imported${NC}"

echo "   - openai-api-key"
pulumi import gcp:secretmanager/secret:Secret openai-api-key \
    "projects/${PROJECT_ID}/secrets/openai-api-key" \
    || echo -e "${YELLOW}     Already imported${NC}"

echo "   - mongodb-uri"
pulumi import gcp:secretmanager/secret:Secret mongodb-uri \
    "projects/${PROJECT_ID}/secrets/mongodb-uri" \
    || echo -e "${YELLOW}     Already imported${NC}"

# Note: We don't import SecretVersions as they are ephemeral and will be recreated
echo -e "${YELLOW}   Note: Secret versions will be recreated automatically${NC}"

# Import Artifact Registry (only if it exists)
echo -e "${YELLOW}3. Importing Artifact Registry...${NC}"
echo "   Checking if repository exists..."

if gcloud artifacts repositories describe procureflow \
    --location=us-central1 --project=${PROJECT_ID} &> /dev/null; then
    
    echo "   Repository exists, importing..."
    pulumi import gcp:artifactregistry/repository:Repository procureflow-images \
        "projects/${PROJECT_ID}/locations/us-central1/repositories/procureflow" \
        || echo -e "${YELLOW}     Already imported${NC}"
else
    echo -e "${YELLOW}   Repository doesn't exist yet (will be created)${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Import Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Run: pulumi up --yes"
echo "2. The update should now succeed without 'already exists' errors"
echo ""
