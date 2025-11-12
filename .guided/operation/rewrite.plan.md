# History Rewrite Plan - ProcureFlow v1.0.0

**Date**: November 11, 2025  
**Current Branch**: main  
**Target**: Rewrite history to single commit  
**Safety Level**: High (reversible with backup)  
**Approval Required**: Yes (`APPROVE_HISTORY_REWRITE=yes`)

---

## Executive Summary

This document outlines a safe, reversible plan to rewrite the ProcureFlow Git repository history into a single commit whose message is derived from the CHANGELOG.md. This operation is **optional** and **destructive**, so it requires explicit approval via an environment variable flag before execution.

**Why Rewrite History?**
- Clean slate: Single commit representing the v1.0.0 baseline
- Simplified history: No intermediate development commits
- Clear provenance: Commit message derived from comprehensive changelog

**Why NOT Rewrite History?**
- Loss of granular commit history (useful for debugging and understanding evolution)
- May break existing clones/forks (requires re-clone)
- Complex operation with potential for mistakes if not executed correctly

**Recommendation**: Only proceed if this is a fresh repository or if clean history is a hard requirement. For most projects, preserving the full commit history is preferable.

---

## Pre-Rewrite State

### Current Repository Status

**Branch**: main  
**Latest Commit**: (to be determined at execution time)  
**Total Commits**: (to be counted at execution time)

**Verification Command**:
```powershell
git log --oneline --all | Measure-Object -Line
```

### Working Directory Status

**Command**: `git status`

**Expected State**: Clean working directory with all release changes committed.

**If Not Clean**: Stash or commit changes before proceeding:
```powershell
git add .
git commit -m "chore(release): prepare v1.0.0 release"
```

---

## Backup Strategy

### 1. Create Annotated Backup Tag

**Purpose**: Mark the current state of the repository before any destructive operations.

**Tag Name Format**: `backup/pre-rewrite-YYYYMMDD-HHMM`

**Example**: `backup/pre-rewrite-20251111-1430`

**Command**:
```powershell
$backupTag = "backup/pre-rewrite-$(Get-Date -Format 'yyyyMMdd-HHmm')"
git tag -a $backupTag -m "Backup before history rewrite to single commit for v1.0.0 release

This tag preserves the full commit history before rewriting to a single commit.
To restore: git reset --hard $backupTag

Created: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Total commits: $(git rev-list --count HEAD)
Latest commit: $(git rev-parse HEAD)"

Write-Host "Backup tag created: $backupTag"
git tag -n5 $backupTag
```

**Verification**:
```powershell
git tag | Select-String "backup/pre-rewrite"
git show $backupTag --stat
```

**Expected Output**: Annotated tag with commit count and hash details.

### 2. Create Git Bundle (Portable Backup)

**Purpose**: Create a standalone file containing the entire repository history for offline restoration.

**Bundle Path**: `.guided/backups/pre-rewrite-YYYYMMDD-HHMM.bundle`

**Command**:
```powershell
$bundleDir = ".guided/backups"
if (-not (Test-Path $bundleDir)) {
    New-Item -ItemType Directory -Path $bundleDir -Force
}

$bundleName = "pre-rewrite-$(Get-Date -Format 'yyyyMMdd-HHmm').bundle"
$bundlePath = Join-Path $bundleDir $bundleName

git bundle create $bundlePath --all

Write-Host "Bundle created: $bundlePath"
Write-Host "Bundle size: $((Get-Item $bundlePath).Length / 1MB) MB"
```

**Verification**:
```powershell
# Verify bundle is valid
git bundle verify $bundlePath

# List refs in bundle
git bundle list-heads $bundlePath
```

**Expected Output**: 
```
The bundle contains these 1 refs:
<commit-hash> refs/heads/main
The bundle records a complete history
```

### 3. Document Pre-Rewrite State

**File**: `.guided/operation/rewrite.pre-state.md`

**Content**:
```powershell
@"
# Pre-Rewrite Repository State

**Date**: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
**Branch**: $(git branch --show-current)
**Latest Commit**: $(git rev-parse HEAD)
**Total Commits**: $(git rev-list --count HEAD)
**Backup Tag**: $backupTag
**Bundle Path**: $bundlePath

## Commit History (Last 20)

``````
$(git log --oneline -20)
``````

## All Branches

``````
$(git branch -a)
``````

## All Tags

``````
$(git tag)
``````

## Remote URLs

``````
$(git remote -v)
``````

## Repository Size

``````
$(git count-objects -vH)
``````
"@ | Out-File -FilePath ".guided/operation/rewrite.pre-state.md" -Encoding utf8

Write-Host "Pre-rewrite state documented in .guided/operation/rewrite.pre-state.md"
```

---

## Rewrite Execution Plan

### Overview

The rewrite process involves:
1. Creating a new orphan branch (no parent commits)
2. Adding all files from the working tree
3. Creating a single commit with message derived from CHANGELOG.md
4. Replacing the main branch with the new orphan branch
5. Force-pushing to remote (with `--force-with-lease` for safety)

### Detailed Steps

#### Step 1: Extract Commit Message from CHANGELOG.md

**Purpose**: Use the v1.0.0 section of CHANGELOG.md as the commit message body.

**Command**:
```powershell
$changelogPath = "CHANGELOG.md"

# Extract v1.0.0 section (between [1.0.0] and [0.1.0])
$changelogContent = Get-Content $changelogPath -Raw
$pattern = '(?s)## \[1\.0\.0\].*?(?=## \[|$)'
$releaseSection = [regex]::Match($changelogContent, $pattern).Value

# Create commit message file
$commitMsgPath = ".guided/operation/rewrite.commit-message.txt"
@"
chore(release): release v1.0.0 - first stable release

$releaseSection
"@ | Out-File -FilePath $commitMsgPath -Encoding utf8

Write-Host "Commit message prepared in $commitMsgPath"
```

**Verification**:
```powershell
Get-Content $commitMsgPath | Select-Object -First 50
```

**Expected**: Commit message with subject line and full v1.0.0 changelog section.

#### Step 2: Create Orphan Branch

**Purpose**: Start fresh with no commit history.

**Branch Name**: `temp/single-commit`

**Command**:
```powershell
$tempBranch = "temp/single-commit"
git checkout --orphan $tempBranch

Write-Host "Created orphan branch: $tempBranch"
git status
```

**Expected Output**: 
```
On branch temp/single-commit

Initial commit

Changes to be committed:
  (use "git rm --cached <file>..." to unstage)
        new file:   ...
        ...
```

**Note**: All files in the working tree are automatically staged on an orphan branch.

#### Step 3: Create Single Commit

**Purpose**: Commit all files with the prepared commit message.

**Command**:
```powershell
git commit -F $commitMsgPath

Write-Host "Single commit created on $tempBranch"
git log --oneline
```

**Expected Output**: 
```
<commit-hash> chore(release): release v1.0.0 - first stable release
```

**Verification**:
```powershell
# Should show exactly 1 commit
git rev-list --count HEAD
# Expected: 1

# Show commit details
git show --stat
```

#### Step 4: Replace Main Branch

**Purpose**: Replace the main branch with the new single-commit branch.

**Command**:
```powershell
# Delete the old main branch (local only, not remote yet)
git branch -D main

# Rename orphan branch to main
git branch -m $tempBranch main

Write-Host "Main branch replaced with single-commit branch"
git log --oneline --all
```

**Expected Output**: 
```
<commit-hash> chore(release): release v1.0.0 - first stable release
```

**Verification**:
```powershell
git branch
# Expected: * main

git rev-list --count HEAD
# Expected: 1
```

#### Step 5: Force-Push to Remote (with Lease)

**Purpose**: Update remote repository while protecting against concurrent changes.

**Safety Mechanism**: `--force-with-lease` will abort if remote has been updated since last fetch.

**Command**:
```powershell
# Fetch latest remote state
git fetch origin

# Force-push with lease (safer than --force)
git push origin main --force-with-lease --tags

Write-Host "Force-pushed main branch to remote with lease protection"
```

**Expected Output**: 
```
To https://github.com/guiofsaints/procureflow.git
 + <old-hash>...<new-hash> main -> main (forced update)
```

**Verification**:
```powershell
# Verify remote matches local
git log origin/main --oneline
# Expected: Single commit

# Verify all tags are pushed
git ls-remote --tags origin
```

---

## Approval Gate

### Explicit Approval Required

This rewrite will **NOT** execute unless the following environment variable is set:

```powershell
$env:APPROVE_HISTORY_REWRITE = "yes"
```

**Why**: Prevents accidental execution of destructive operations.

### Approval Checklist

Before setting `APPROVE_HISTORY_REWRITE=yes`, confirm:

- [ ] Backup tag created and verified: `git tag | Select-String backup/pre-rewrite`
- [ ] Git bundle created and verified: `git bundle verify .guided/backups/*.bundle`
- [ ] Pre-rewrite state documented: `.guided/operation/rewrite.pre-state.md` exists
- [ ] No uncommitted changes: `git status` shows clean working directory
- [ ] Remote repository URL confirmed: `git remote -v`
- [ ] Understand this is irreversible without backup restoration
- [ ] Understand all clones/forks will need to re-clone
- [ ] Understand CI/CD may need reconfiguration (GitHub Actions, etc.)
- [ ] Team members (if any) have been notified and approve

**If all checks pass**, set approval:

```powershell
$env:APPROVE_HISTORY_REWRITE = "yes"
```

**To execute rewrite**:

```powershell
# Run the history rewrite script (to be created)
.\scripts\rewrite-history.ps1
```

---

## Rollback Plan (If Needed)

See `.guided/operation/rewrite.rollback.md` for detailed rollback instructions.

**Quick Rollback from Backup Tag**:

```powershell
# 1. Find backup tag
$backupTag = git tag | Select-String "backup/pre-rewrite" | Select-Object -Last 1

# 2. Reset to backup tag
git reset --hard $backupTag

# 3. Force-push to remote (if already pushed rewritten history)
git push origin main --force-with-lease

Write-Host "Rolled back to $backupTag"
```

**Quick Rollback from Bundle**:

```powershell
# 1. Find bundle file
$bundlePath = Get-ChildItem .guided/backups/*.bundle | Select-Object -Last 1

# 2. Fetch from bundle
git fetch $bundlePath.FullName main:main-restored

# 3. Switch to restored branch
git checkout main-restored

# 4. Replace main with restored
git branch -D main
git branch -m main-restored main

# 5. Force-push to remote
git push origin main --force-with-lease

Write-Host "Restored from bundle: $($bundlePath.Name)"
```

---

## Post-Rewrite Verification

### Automated Verification Steps

**To be executed after rewrite**:

```powershell
# 1. Verify single commit
$commitCount = git rev-list --count HEAD
if ($commitCount -ne 1) {
    Write-Error "Expected 1 commit, found $commitCount"
} else {
    Write-Host "✓ Single commit verified"
}

# 2. Verify commit message starts with release tag
$commitMsg = git log -1 --pretty=%s
if ($commitMsg -like "*v1.0.0*") {
    Write-Host "✓ Commit message contains v1.0.0"
} else {
    Write-Warning "Commit message does not contain v1.0.0: $commitMsg"
}

# 3. Verify all files present
$fileCount = git ls-files | Measure-Object -Line
Write-Host "✓ Files in repository: $($fileCount.Lines)"

# 4. Verify remote matches local
git fetch origin
$localHash = git rev-parse HEAD
$remoteHash = git rev-parse origin/main
if ($localHash -eq $remoteHash) {
    Write-Host "✓ Remote matches local"
} else {
    Write-Warning "Remote does not match local. Push may be needed."
}

# 5. Verify backup tag still exists
$backupTagExists = git tag | Select-String "backup/pre-rewrite"
if ($backupTagExists) {
    Write-Host "✓ Backup tag exists: $backupTagExists"
} else {
    Write-Error "Backup tag not found. This is unexpected."
}

# 6. Verify bundle file exists
$bundleExists = Test-Path ".guided/backups/*.bundle"
if ($bundleExists) {
    Write-Host "✓ Bundle file exists"
} else {
    Write-Warning "Bundle file not found in .guided/backups/"
}
```

### Manual Verification Steps

1. **Clone Repository Fresh**:
   ```powershell
   cd C:\Temp
   git clone https://github.com/guiofsaints/procureflow.git procureflow-test
   cd procureflow-test
   git log --oneline
   ```
   **Expected**: Single commit

2. **Build and Test**:
   ```powershell
   pnpm install
   pnpm --filter web db:create-text-index
   pnpm dev
   ```
   **Expected**: Application runs successfully

3. **Check GitHub UI**:
   - Navigate to repository on GitHub
   - Verify commit history shows single commit
   - Verify tags are present (including backup tag)
   - Verify README.md and files display correctly

---

## Impact Assessment

### Who/What is Affected?

| Entity | Impact | Action Required |
|--------|--------|-----------------|
| **Local Development** | Local main branch replaced | Re-fetch: `git fetch origin && git reset --hard origin/main` |
| **Existing Clones** | Diverged from remote | Re-clone repository or force-pull |
| **Forks** | Out of sync with upstream | Re-fork or sync with force-pull |
| **Pull Requests** | May become invalid | Close and re-create based on new main |
| **CI/CD Pipelines** | May reference old commit hashes | Update references or re-run pipelines |
| **External Links** | Commit hash links will break | Update documentation with new commit hash |
| **Branch Protection** | May block force-push | Temporarily disable or use admin override |

### Mitigation Strategies

1. **Notify Collaborators**: Send announcement before executing rewrite.
2. **Disable Branch Protection**: Temporarily disable on GitHub before force-push.
3. **Update Documentation**: Replace old commit references with new hash.
4. **Re-run CI/CD**: Trigger builds after force-push to verify.
5. **Provide Re-Clone Instructions**: Document how to re-clone for affected users.

---

## Execution Timeline

| Step | Duration | Cumulative |
|------|----------|------------|
| Create backup tag | 1 min | 1 min |
| Create git bundle | 2 min | 3 min |
| Document pre-state | 1 min | 4 min |
| Extract commit message | 2 min | 6 min |
| Create orphan branch | 1 min | 7 min |
| Create single commit | 1 min | 8 min |
| Replace main branch | 1 min | 9 min |
| Force-push to remote | 2 min | 11 min |
| Verify post-rewrite state | 3 min | 14 min |
| **Total Estimated Time** | | **~15 minutes** |

**Note**: Add 5-10 minutes buffer for unexpected issues or verification steps.

---

## Decision Point: Execute or Skip?

### Execute Rewrite If:

- ✅ Clean history is a hard requirement for project
- ✅ Repository is fresh with no external forks/clones
- ✅ All collaborators have been notified and approve
- ✅ Backup and rollback plan are understood
- ✅ Approval flag `APPROVE_HISTORY_REWRITE=yes` is explicitly set

### Skip Rewrite If:

- ❌ Granular commit history is valuable for debugging
- ❌ Existing clones/forks would be disrupted
- ❌ Team members are not on board with the change
- ❌ Approval flag is not set
- ❌ Uncertain about rollback procedures

**Default**: **SKIP** (no rewrite unless explicitly approved)

---

## Approval Status

**Current Approval**: ❌ NOT APPROVED (default safe state)

**To Approve**:
```powershell
$env:APPROVE_HISTORY_REWRITE = "yes"
```

**To Execute** (after approval):
```powershell
# This script will be created if approval is given
.\scripts\rewrite-history.ps1
```

---

## References

- Git Bundle Documentation: https://git-scm.com/docs/git-bundle
- Git Force-with-Lease: https://git-scm.com/docs/git-push#Documentation/git-push.txt---force-with-leaseltrefnamegt
- Git Orphan Branches: https://git-scm.com/docs/git-checkout#Documentation/git-checkout.txt---orphanltnew-branchgt
- Keep a Changelog: https://keepachangelog.com/
- Semantic Versioning: https://semver.org/

---

**Plan Status**: ✅ Ready for Review

**Next Steps**:
1. Review this plan thoroughly
2. Decide: Execute or Skip history rewrite
3. If Execute: Set `APPROVE_HISTORY_REWRITE=yes` and run script
4. If Skip: Proceed with standard Git tag and push workflow

**Prepared By**: Release Engineering Agent  
**Date**: November 11, 2025  
**Document Version**: 1.0.0
