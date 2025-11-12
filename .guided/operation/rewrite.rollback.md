# History Rewrite Rollback Procedure

**Date**: November 11, 2025  
**Purpose**: Safe restoration from backup after history rewrite  
**Scope**: ProcureFlow v1.0.0 release  
**Risk Level**: Low (with backup tag and bundle)

---

## Overview

This document provides step-by-step instructions for rolling back a Git history rewrite if issues are discovered after execution. The rollback process uses either the backup Git tag or the Git bundle file created during the pre-rewrite backup phase.

**When to Rollback**:

- Post-rewrite build fails unexpectedly
- Files are missing or corrupted after rewrite
- Team members object to the history change
- CI/CD pipelines are broken and cannot be fixed
- Rewrite was executed by mistake

**Safety**: All rollback methods are **safe** and **reversible**. The backup tag and bundle preserve the complete original repository state.

---

## Prerequisites

Before attempting rollback, verify:

1. **Backup Tag Exists**:

   ```powershell
   git tag | Select-String "backup/pre-rewrite"
   ```

   **Expected**: One or more tags like `backup/pre-rewrite-20251111-1430`

2. **Bundle File Exists**:

   ```powershell
   Get-ChildItem .guided/backups/*.bundle
   ```

   **Expected**: One or more `.bundle` files

3. **Pre-State Documentation Exists**:
   ```powershell
   Test-Path .guided/operation/rewrite.pre-state.md
   ```
   **Expected**: True

**If any prerequisite fails**, rollback may be limited. Proceed with caution and consult Git reflog (see Advanced Rollback section).

---

## Method 1: Rollback from Backup Tag (Recommended)

**Use Case**: Fastest and simplest rollback method when backup tag is available locally.

**Difficulty**: Low  
**Time**: ~5 minutes  
**Risk**: Low (tag is immutable and trusted)

### Step 1: Identify Backup Tag

```powershell
# List all backup tags
$backupTags = git tag | Select-String "backup/pre-rewrite"

# Show details of the most recent backup
$latestBackup = $backupTags | Select-Object -Last 1
Write-Host "Latest backup tag: $latestBackup"

# Display tag annotation (includes commit count, hash, etc.)
git tag -n10 $latestBackup
```

**Expected Output**:

```
Latest backup tag: backup/pre-rewrite-20251111-1430

backup/pre-rewrite-20251111-1430 Backup before history rewrite...
    This tag preserves the full commit history before rewriting...
    Created: 2025-11-11 14:30:00
    Total commits: 47
    Latest commit: abc123def456...
```

### Step 2: Reset Local Repository to Backup Tag

```powershell
# Confirm current state before rollback
Write-Host "Current branch: $(git branch --show-current)"
Write-Host "Current commit: $(git rev-parse HEAD)"
Write-Host "Total commits: $(git rev-list --count HEAD)"

# Reset to backup tag (hard reset, discards rewritten history)
git reset --hard $latestBackup

Write-Host "`nRollback complete!"
Write-Host "New commit: $(git rev-parse HEAD)"
Write-Host "Total commits: $(git rev-list --count HEAD)"
```

**What This Does**:

- Moves `HEAD` to the backup tag commit
- Discards the rewritten single-commit history
- Restores all original commits
- Keeps working directory clean (all files match the backup state)

**Expected Output**:

```
Current branch: main
Current commit: <new-single-commit-hash>
Total commits: 1

Rollback complete!
New commit: <original-commit-hash>
Total commits: 47
```

### Step 3: Force-Push to Remote (If Rewritten History Was Pushed)

**Warning**: Only execute if the rewritten history was already pushed to remote. Skip this step if rewrite was local-only.

```powershell
# Fetch latest remote state to confirm it needs rollback
git fetch origin

# Compare local (rolled back) with remote (possibly rewritten)
$localHash = git rev-parse HEAD
$remoteHash = git rev-parse origin/main

if ($localHash -ne $remoteHash) {
    Write-Host "Local and remote differ. Force-push required to complete rollback."

    # Temporarily disable branch protection if enabled
    # (Manual step on GitHub: Settings → Branches → Edit main → Uncheck protection)

    # Force-push with lease (safer than --force)
    git push origin main --force-with-lease --tags

    Write-Host "Remote updated to match rolled-back local state"
} else {
    Write-Host "Local and remote match. No force-push needed."
}
```

**Expected Output**:

```
Local and remote differ. Force-push required to complete rollback.
To https://github.com/guiofsaints/procureflow.git
 + <rewritten-hash>...<original-hash> main -> main (forced update)
Remote updated to match rolled-back local state
```

### Step 4: Verify Rollback

```powershell
# Verify commit count restored
$commitCount = git rev-list --count HEAD
Write-Host "Commit count after rollback: $commitCount"

# Verify commit history
git log --oneline -10

# Verify remote matches local
git fetch origin
$localHash = git rev-parse HEAD
$remoteHash = git rev-parse origin/main
if ($localHash -eq $remoteHash) {
    Write-Host "✓ Remote matches local. Rollback successful."
} else {
    Write-Warning "Remote does not match local. Force-push may have failed."
}

# Verify working directory is clean
$status = git status --porcelain
if (-not $status) {
    Write-Host "✓ Working directory is clean"
} else {
    Write-Warning "Working directory has uncommitted changes"
}
```

**Expected Output**:

```
Commit count after rollback: 47
<commit-hash> chore(release): prepare v1.0.0 release
<commit-hash> feat(agent): add checkout confirmation flow
<commit-hash> fix(cart): prevent duplicate items
...
✓ Remote matches local. Rollback successful.
✓ Working directory is clean
```

---

## Method 2: Rollback from Git Bundle

**Use Case**: When backup tag is not available locally or repository was deleted and needs restoration.

**Difficulty**: Medium  
**Time**: ~10 minutes  
**Risk**: Low (bundle is complete repository backup)

### Step 1: Locate Bundle File

```powershell
# Find bundle file in backups directory
$bundlePath = Get-ChildItem .guided/backups/*.bundle | Select-Object -Last 1

if ($bundlePath) {
    Write-Host "Found bundle: $($bundlePath.FullName)"
    Write-Host "Bundle size: $([math]::Round($bundlePath.Length / 1MB, 2)) MB"
} else {
    Write-Error "No bundle file found in .guided/backups/"
    exit 1
}
```

**Expected Output**:

```
Found bundle: C:\Workspace\procureflow\.guided\backups\pre-rewrite-20251111-1430.bundle
Bundle size: 15.43 MB
```

### Step 2: Verify Bundle Integrity

```powershell
# Verify bundle is valid and complete
git bundle verify $bundlePath.FullName

# List refs (branches/tags) in bundle
Write-Host "`nRefs in bundle:"
git bundle list-heads $bundlePath.FullName
```

**Expected Output**:

```
The bundle contains these refs:
<commit-hash> refs/heads/main
<commit-hash> refs/tags/v1.0.0
<commit-hash> refs/tags/backup/pre-rewrite-20251111-1430
...
The bundle records a complete history
```

### Step 3: Fetch from Bundle into Temporary Branch

```powershell
# Fetch main branch from bundle into temporary restore branch
git fetch $bundlePath.FullName main:main-restored

Write-Host "Fetched main branch from bundle into main-restored"

# Verify restored branch has correct commit count
$restoredCommitCount = git rev-list --count main-restored
Write-Host "Restored branch commit count: $restoredCommitCount"
```

**Expected Output**:

```
From C:\Workspace\procureflow\.guided\backups\pre-rewrite-20251111-1430.bundle
 * [new branch]      main       -> main-restored
Fetched main branch from bundle into main-restored
Restored branch commit count: 47
```

### Step 4: Replace Current Main with Restored Branch

```powershell
# Switch to restored branch
git checkout main-restored

# Delete old main branch
git branch -D main

# Rename restored branch to main
git branch -m main-restored main

Write-Host "Main branch replaced with restored branch from bundle"
git log --oneline -5
```

**Expected Output**:

```
Switched to branch 'main-restored'
Deleted branch main (was <rewritten-commit-hash>)
Main branch replaced with restored branch from bundle

<commit-hash> chore(release): prepare v1.0.0 release
<commit-hash> feat(agent): add checkout confirmation flow
...
```

### Step 5: Force-Push to Remote (If Needed)

```powershell
# Same as Method 1, Step 3
git fetch origin
git push origin main --force-with-lease --tags

Write-Host "Remote updated with restored history"
```

### Step 6: Restore Tags from Bundle

```powershell
# Fetch all tags from bundle
git fetch $bundlePath.FullName 'refs/tags/*:refs/tags/*'

# Push all tags to remote
git push origin --tags --force

Write-Host "All tags restored and pushed to remote"
```

**Expected Output**:

```
From C:\Workspace\procureflow\.guided\backups\pre-rewrite-20251111-1430.bundle
 * [new tag]         v1.0.0     -> v1.0.0
 * [new tag]         backup/pre-rewrite-20251111-1430 -> backup/pre-rewrite-20251111-1430
...
All tags restored and pushed to remote
```

---

## Method 3: Advanced Rollback Using Reflog

**Use Case**: When backup tag and bundle are both unavailable or corrupted (rare).

**Difficulty**: High  
**Time**: ~15 minutes  
**Risk**: Medium (requires manual commit identification)

**Warning**: Reflog only works if the repository has not been garbage-collected. Use this method only as a last resort.

### Step 1: View Reflog

```powershell
# Display recent HEAD movements
git reflog show --all | Select-Object -First 50
```

**Expected Output**:

```
<hash1> HEAD@{0}: reset: moving to <single-commit-hash>
<hash2> HEAD@{1}: commit: chore(release): prepare v1.0.0 release
<hash3> HEAD@{2}: commit: feat(agent): add checkout confirmation
...
```

### Step 2: Identify Pre-Rewrite Commit

Look for the commit immediately before the rewrite operation (usually right before "reset: moving to" or "checkout: moving to temp/single-commit").

```powershell
# Example: If the pre-rewrite commit is at HEAD@{2}
$preRewriteCommit = git rev-parse HEAD@{2}
Write-Host "Pre-rewrite commit: $preRewriteCommit"

# Verify commit details
git show $preRewriteCommit --stat
```

### Step 3: Reset to Pre-Rewrite Commit

```powershell
git reset --hard $preRewriteCommit

Write-Host "Rolled back to pre-rewrite commit"
git log --oneline -5
```

### Step 4: Force-Push to Remote

```powershell
git push origin main --force-with-lease --tags
```

**Note**: This method does NOT restore deleted tags. You may need to recreate tags manually.

---

## Post-Rollback Verification Checklist

After completing rollback using any method, verify:

- [ ] **Commit count restored**: `git rev-list --count HEAD` shows original count (not 1)
- [ ] **Commit history visible**: `git log --oneline -10` shows multiple commits
- [ ] **Files intact**: Critical files (CHANGELOG.md, package.json, etc.) present and correct
- [ ] **Remote matches local**: `git rev-parse HEAD` == `git rev-parse origin/main`
- [ ] **Tags restored**: `git tag` shows expected tags (including backup tag)
- [ ] **Build succeeds**: `pnpm install && pnpm build` completes without errors
- [ ] **Application runs**: `pnpm dev` starts successfully

**Verification Script**:

```powershell
Write-Host "=== Post-Rollback Verification ===" -ForegroundColor Cyan

# 1. Commit count
$commitCount = git rev-list --count HEAD
Write-Host "Commit count: $commitCount" -ForegroundColor $(if ($commitCount -gt 1) { "Green" } else { "Red" })

# 2. Commit history
Write-Host "`nRecent commits:" -ForegroundColor Cyan
git log --oneline -5

# 3. Critical files
$criticalFiles = @("CHANGELOG.md", "package.json", "packages/web/package.json", "README.md")
foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        Write-Host "✓ $file exists" -ForegroundColor Green
    } else {
        Write-Host "✗ $file missing" -ForegroundColor Red
    }
}

# 4. Remote sync
git fetch origin -q
$localHash = git rev-parse HEAD
$remoteHash = git rev-parse origin/main
if ($localHash -eq $remoteHash) {
    Write-Host "✓ Remote matches local" -ForegroundColor Green
} else {
    Write-Host "✗ Remote does not match local" -ForegroundColor Red
}

# 5. Tags
$tagCount = (git tag | Measure-Object -Line).Lines
Write-Host "Tags present: $tagCount" -ForegroundColor $(if ($tagCount -gt 0) { "Green" } else { "Yellow" })

# 6. Build test
Write-Host "`nTesting build..." -ForegroundColor Cyan
$buildResult = pnpm build 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Build successful" -ForegroundColor Green
} else {
    Write-Host "✗ Build failed" -ForegroundColor Red
}

Write-Host "`n=== Verification Complete ===" -ForegroundColor Cyan
```

---

## Rollback Scenarios and Solutions

### Scenario 1: Rollback Before Remote Push

**Situation**: Rewrite executed locally but not yet pushed to remote.

**Solution**: Use Method 1 (Backup Tag), skip Step 3 (force-push).

**Impact**: Low - only local repository affected.

---

### Scenario 2: Rollback After Remote Push

**Situation**: Rewrite executed and pushed to remote. Team members may have pulled.

**Solution**:

1. Use Method 1 (Backup Tag) including Step 3 (force-push)
2. Notify team members to re-fetch:
   ```powershell
   git fetch origin
   git reset --hard origin/main
   ```

**Impact**: Medium - all collaborators must re-sync.

---

### Scenario 3: Backup Tag Deleted

**Situation**: Backup tag was accidentally deleted before rollback needed.

**Solution**: Use Method 2 (Git Bundle) to restore.

**Impact**: Medium - requires bundle file access.

---

### Scenario 4: Both Backup Tag and Bundle Missing

**Situation**: Backup tag and bundle file both deleted or corrupted.

**Solution**: Use Method 3 (Reflog) if repository is recent. Otherwise:

1. Check GitHub repository for unmerged branches with history
2. Check other team members' clones for original history
3. Contact GitHub support for advice on recovering repository state

**Impact**: High - may result in partial or no recovery.

---

### Scenario 5: Rollback After Multiple Commits on New History

**Situation**: Rewrite executed, new commits added, then rollback needed.

**Solution**:

1. Create a temporary branch to preserve new commits:
   ```powershell
   git branch temp/preserve-new-commits
   ```
2. Execute rollback using Method 1 or 2
3. Cherry-pick new commits onto restored history:
   ```powershell
   git cherry-pick <new-commit-hash1> <new-commit-hash2>
   ```

**Impact**: Medium - requires manual commit identification and cherry-picking.

---

## Re-Enabling Branch Protection

If branch protection was disabled for force-push, re-enable it:

1. Navigate to GitHub repository
2. Go to Settings → Branches
3. Find "main" branch rule
4. Click "Edit"
5. Re-check protection options:
   - Require pull request reviews before merging
   - Require status checks to pass before merging
   - Include administrators (if desired)
6. Save changes

---

## Notification Template for Team

**Subject**: Repository History Rollback - Action Required

**Body**:

```
Team,

We have rolled back the ProcureFlow repository history to the state before
the v1.0.0 rewrite. This was done due to [REASON].

Action Required:

1. Fetch the latest main branch:
   git fetch origin
   git reset --hard origin/main

2. Verify your local commit count:
   git rev-list --count HEAD
   Expected: 47 commits (not 1)

3. If you encounter issues, re-clone the repository:
   git clone https://github.com/guiofsaints/procureflow.git

No code changes were lost. The repository is now in the same state as
before the rewrite.

If you have questions, please reply to this message.

- Release Engineering
```

---

## Automated Rollback Script

**File**: `scripts/rollback-from-backup.ps1`

```powershell
<#
.SYNOPSIS
    Automated rollback from backup tag or bundle
.DESCRIPTION
    Safely restores repository to pre-rewrite state using backup tag or bundle
.PARAMETER Method
    Rollback method: "tag" or "bundle" (default: "tag")
.PARAMETER PushRemote
    Whether to force-push to remote after rollback (default: false)
.EXAMPLE
    .\rollback-from-backup.ps1 -Method tag -PushRemote
#>

param(
    [ValidateSet("tag", "bundle")]
    [string]$Method = "tag",

    [switch]$PushRemote
)

Write-Host "=== ProcureFlow History Rollback ===" -ForegroundColor Cyan
Write-Host "Method: $Method" -ForegroundColor Yellow
Write-Host "Push to remote: $PushRemote" -ForegroundColor Yellow

# Confirm before proceeding
$confirm = Read-Host "`nThis will reset your main branch. Continue? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "Rollback cancelled" -ForegroundColor Yellow
    exit 0
}

if ($Method -eq "tag") {
    # Method 1: Backup Tag
    $backupTag = git tag | Select-String "backup/pre-rewrite" | Select-Object -Last 1

    if (-not $backupTag) {
        Write-Error "No backup tag found. Try -Method bundle"
        exit 1
    }

    Write-Host "`nRolling back to tag: $backupTag" -ForegroundColor Green
    git reset --hard $backupTag

} elseif ($Method -eq "bundle") {
    # Method 2: Bundle
    $bundlePath = Get-ChildItem .guided/backups/*.bundle | Select-Object -Last 1

    if (-not $bundlePath) {
        Write-Error "No bundle file found"
        exit 1
    }

    Write-Host "`nVerifying bundle..." -ForegroundColor Green
    git bundle verify $bundlePath.FullName

    Write-Host "`nRestoring from bundle..." -ForegroundColor Green
    git fetch $bundlePath.FullName main:main-restored
    git checkout main-restored
    git branch -D main
    git branch -m main-restored main
}

Write-Host "`n✓ Rollback complete" -ForegroundColor Green
Write-Host "Current commit: $(git rev-parse HEAD)"
Write-Host "Total commits: $(git rev-list --count HEAD)"

if ($PushRemote) {
    Write-Host "`nPushing to remote..." -ForegroundColor Yellow
    git push origin main --force-with-lease --tags
    Write-Host "✓ Remote updated" -ForegroundColor Green
} else {
    Write-Host "`nSkipping remote push. To push manually:" -ForegroundColor Yellow
    Write-Host "git push origin main --force-with-lease --tags"
}

Write-Host "`n=== Rollback Complete ===" -ForegroundColor Cyan
```

**Usage**:

```powershell
# Local rollback only
.\scripts\rollback-from-backup.ps1

# Rollback and push to remote
.\scripts\rollback-from-backup.ps1 -Method tag -PushRemote

# Rollback from bundle
.\scripts\rollback-from-backup.ps1 -Method bundle -PushRemote
```

---

## Conclusion

This rollback procedure provides multiple safe methods to restore repository history after a rewrite. The backup tag and bundle ensure complete recoverability with minimal risk.

**Key Takeaways**:

- Backup tag is fastest and simplest (Method 1)
- Bundle file is most portable and complete (Method 2)
- Reflog is last resort for emergency recovery (Method 3)
- Always verify after rollback using checklist
- Communicate with team if remote was affected

**Status**: ✅ Complete rollback procedures documented

**Prepared By**: Release Engineering Agent  
**Date**: November 11, 2025  
**Document Version**: 1.0.0
