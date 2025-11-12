# Pulumi Infrastructure Troubleshooting Runbook

**Project**: procureflow-gcp  
**Stack**: dev (primary)  
**Region**: us-central1  
**Last Updated**: 2025-11-11

---

## Quick Diagnostics

### Check Stack Health

```bash
# Current stack status
pulumi stack

# Preview changes without applying
pulumi refresh --preview-only

# View recent deployment history
pulumi history
```

**Expected**: No pending updates, state synchronized with GCP.

---

### Verify GCP Resources

```bash
# Cloud Run service
gcloud run services describe procureflow-web --region=us-central1

# Secrets
gcloud secrets list

# Artifact Registry
gcloud artifacts repositories list --location=us-central1
```

---

## Common Issues & Fixes

### Issue 1: Pulumi Up Fails

**Symptoms**: `pulumi up` returns error, deployment incomplete

**Quick Check**:

```bash
# 1. Verify GCP authentication
gcloud auth list
gcloud auth application-default print-access-token

# 2. Check Pulumi state
pulumi stack --show-urns

# 3. Verify project permissions
gcloud projects describe procureflow-dev
```

**Common Causes**:

**A. GCP Credentials Expired**

```bash
# Fix: Re-authenticate
gcloud auth login
gcloud auth application-default login
```

**B. State File Locked**

```bash
# Fix: Cancel conflicting operation or wait for timeout
pulumi cancel

# Or force unlock (use with caution)
pulumi stack export > backup.json
pulumi stack import < backup.json
```

**C. Resource Quota Exceeded**

```bash
# Fix: Check quotas
gcloud compute project-info describe --project=procureflow-dev

# View current usage
gcloud run services list --region=us-central1
```

---

### Issue 2: Cloud Run Service Not Accessible

**Symptoms**: Service URL returns 404, 503, or timeout

**Quick Check**:

```bash
# 1. Verify service is running
gcloud run services describe procureflow-web --region=us-central1 --format='value(status.url)'

# 2. Check recent logs
gcloud run logs tail procureflow-web --region=us-central1 --limit=50

# 3. Test endpoint
curl -I https://procureflow-web-592353558869.us-central1.run.app/api/health
```

**Common Causes**:

**A. Service Failed to Deploy**

```bash
# Fix: Check deployment logs
gcloud run services describe procureflow-web --region=us-central1

# View error details
gcloud run revisions list --service=procureflow-web --region=us-central1
```

**B. Container Image Missing**

```bash
# Fix: Rebuild and push image
cd ../../../../
docker build -f packages/infra/docker/Dockerfile.web \
  -t us-central1-docker.pkg.dev/procureflow-dev/procureflow/web:latest .

# Authenticate Docker
gcloud auth configure-docker us-central1-docker.pkg.dev

# Push image
docker push us-central1-docker.pkg.dev/procureflow-dev/procureflow/web:latest

# Redeploy service
cd packages/infra/pulumi/gcp
pulumi up
```

**C. Environment Variables Misconfigured**

```bash
# Fix: Update env vars
gcloud run services update procureflow-web \
  --region=us-central1 \
  --update-env-vars="NEXTAUTH_URL=https://procureflow-web-592353558869.us-central1.run.app"
```

---

### Issue 3: Secrets Not Working

**Symptoms**: Application can't read secrets, auth fails, database connection error

**Quick Check**:

```bash
# 1. Verify secrets exist
gcloud secrets list

# 2. Test secret access
gcloud secrets versions access latest --secret=nextauth-secret

# 3. Check Pulumi config
pulumi config --show-secrets
```

**Common Causes**:

**A. Secret Not Created**

```bash
# Fix: Create missing secret via Pulumi
pulumi up

# Or manually via gcloud
gcloud secrets create my-secret --data-file=/path/to/secret.txt
```

**B. Permission Denied**

```bash
# Fix: Grant Cloud Run service account access
gcloud secrets add-iam-policy-binding nextauth-secret \
  --member="serviceAccount:procureflow-web@procureflow-dev.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

**C. Secret Version Disabled**

```bash
# Fix: Enable latest version
gcloud secrets versions enable latest --secret=nextauth-secret
```

---

### Issue 4: MongoDB Connection Fails

**Symptoms**: `MongoServerSelectionError`, `ECONNREFUSED`, timeout

**Quick Check**:

```bash
# 1. Verify MongoDB Atlas cluster is running
# Visit: https://cloud.mongodb.com

# 2. Check connection string in secret
pulumi config get mongodb-connection-string --show-secrets

# 3. Test from local machine
mongosh "mongodb+srv://your-connection-string"
```

**Common Causes**:

**A. IP Not Whitelisted**

```bash
# Fix: Add Cloud Run IP range to MongoDB Atlas Network Access
# 1. Go to MongoDB Atlas Console
# 2. Network Access → Add IP Address
# 3. Allow access from anywhere: 0.0.0.0/0 (for Cloud Run)
```

**B. Credentials Changed**

```bash
# Fix: Update secret
pulumi config set --secret mongodb-connection-string "mongodb+srv://new-connection-string"
pulumi up
```

**C. Cluster Paused (M0 Free Tier)**

```bash
# Fix: Resume cluster in MongoDB Atlas Console
# M0 clusters auto-pause after 60 days of inactivity
```

---

### Issue 5: Deployment Takes Too Long

**Symptoms**: `pulumi up` hangs, timeout after 10+ minutes

**Quick Check**:

```bash
# 1. Check operation status
pulumi stack --show-urns

# 2. View detailed logs
pulumi up --logtostderr -v=9

# 3. Check GCP operation status
gcloud run operations list --region=us-central1
```

**Common Causes**:

**A. Large Docker Image**

```bash
# Fix: Optimize Dockerfile
# Add .dockerignore to exclude node_modules, .git, etc.

# Check current image size
gcloud artifacts docker images describe \
  us-central1-docker.pkg.dev/procureflow-dev/procureflow/web:latest
```

**B. Network Issues**

```bash
# Fix: Retry deployment
pulumi up

# Or cancel and re-run
pulumi cancel
pulumi up
```

---

### Issue 6: Cost Spike Alert

**Symptoms**: Received email alert that budget threshold exceeded

**Immediate Actions**:

```bash
# 1. Check current billing
gcloud billing accounts list

# 2. View cost breakdown in Console
# Visit: https://console.cloud.google.com/billing/reports

# 3. List all resources
gcloud run services list --region=us-central1
gcloud compute instances list
gcloud sql instances list
```

**Common Causes**:

**A. Accidental Resource Creation**

```bash
# Fix: Delete unwanted resources
gcloud compute instances delete INSTANCE_NAME --zone=us-central1-a

# Or via Pulumi
pulumi destroy --target urn:pulumi:dev::procureflow-gcp::resource-type::resource-name
```

**B. Traffic Spike (Cloud Run)**

```bash
# Fix: Check request volume
gcloud run services describe procureflow-web --region=us-central1

# Set max instances to limit costs
gcloud run services update procureflow-web \
  --region=us-central1 \
  --max-instances=10
```

---

### Issue 7: State File Corruption

**Symptoms**: Pulumi commands fail with state errors, inconsistent state

**Quick Check**:

```bash
# Export current state
pulumi stack export > state-backup-$(date +%Y%m%d).json

# Verify state is valid JSON
cat state-backup-*.json | jq .
```

**Fix**:

```bash
# 1. Restore from backup
pulumi stack import < state-backup-YYYYMMDD.json

# 2. Refresh state from GCP
pulumi refresh

# 3. If still broken, recreate stack
pulumi stack init dev-new
# ... reconfigure and import resources
```

---

## Emergency Rollback

### Quick Rollback via Git

```bash
# 1. Revert to previous commit
git log --oneline  # Find commit hash
git revert <commit-hash>
git push origin main

# 2. Wait for CI/CD to redeploy
# Or manually: pulumi up
```

---

### Rollback via Pulumi State

```bash
# 1. View deployment history
pulumi history

# 2. Export previous state
pulumi stack export --version <version-number> > rollback.json

# 3. Import previous state
pulumi stack import < rollback.json

# 4. Refresh infrastructure
pulumi refresh
```

---

## Health Monitoring

### Regular Health Checks

```bash
# Service health endpoint
curl https://procureflow-web-592353558869.us-central1.run.app/api/health

# Expected response: {"status": "ok"}
```

---

### View Logs

```bash
# Live tail
gcloud run logs tail procureflow-web --region=us-central1

# Last 100 lines
gcloud run logs tail procureflow-web --region=us-central1 --limit=100

# Filter by severity
gcloud run logs tail procureflow-web --region=us-central1 --log-filter='severity>=ERROR'
```

---

### Metrics

Visit Cloud Run Metrics Dashboard:

- https://console.cloud.google.com/run/detail/us-central1/procureflow-web/metrics

**Key metrics to monitor**:

- Request count
- Request latency
- Error rate (4xx, 5xx)
- Container instance count
- CPU utilization
- Memory utilization

---

## Performance Issues

### Slow Response Times

**Quick Check**:

```bash
# Check current resource allocation
gcloud run services describe procureflow-web --region=us-central1 \
  --format='value(spec.template.spec.containers[0].resources)'
```

**Fix**: Increase Cloud Run resources

```bash
gcloud run services update procureflow-web \
  --region=us-central1 \
  --memory=512Mi \
  --cpu=1
```

---

### Cold Start Issues

**Fix**: Set minimum instances

```bash
gcloud run services update procureflow-web \
  --region=us-central1 \
  --min-instances=1
```

**Note**: Minimum instances = cost increase (not free tier).

---

## Diagnostic Commands Cheat Sheet

```bash
# Pulumi
pulumi stack                          # Stack status
pulumi preview                        # Preview changes
pulumi refresh                        # Sync state
pulumi history                        # Deployment history
pulumi config --show-secrets          # View configuration

# GCP - Cloud Run
gcloud run services list --region=us-central1
gcloud run logs tail procureflow-web --region=us-central1
gcloud run revisions list --service=procureflow-web --region=us-central1

# GCP - Secrets
gcloud secrets list
gcloud secrets versions access latest --secret=nextauth-secret

# GCP - Artifact Registry
gcloud artifacts docker images list \
  us-central1-docker.pkg.dev/procureflow-dev/procureflow

# GCP - Billing
gcloud billing accounts list
```

---

## When to Escalate

**Contact GCP Support** if:

- Persistent platform issues (GCP services down)
- Quota increase requests
- Billing disputes

**Contact Pulumi Support** if:

- State corruption beyond recovery
- Provider bugs
- Complex migration issues

---

## Emergency Contacts

**Primary**: [Your email]  
**Secondary**: [Team lead email]  
**GCP Console**: https://console.cloud.google.com  
**Pulumi Console**: https://app.pulumi.com  
**MongoDB Atlas**: https://cloud.mongodb.com

---

## Prevention Best Practices

1. ✅ Always run `pulumi preview` before `pulumi up`
2. ✅ Backup state before major changes: `pulumi stack export > backup.json`
3. ✅ Test infrastructure changes in local/dev first
4. ✅ Monitor cost alerts weekly
5. ✅ Review Cloud Run logs daily
6. ✅ Keep Pulumi and providers updated
7. ✅ Document configuration changes
8. ✅ Use version control (git) for all infrastructure code

---

**Runbook Maintained By**: GitHub Copilot AI Agent  
**Last Incident**: None  
**Last Updated**: 2025-11-11  
**Next Review**: Quarterly or after major incident
