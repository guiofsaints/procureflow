# .guided - AI-Assisted Development Artifacts

This directory contains documentation, assessments, and operational logs generated during AI-assisted development sessions.

---

## Directory Structure

```
.guided/
├── assessment/           # Technical assessments and analyses
│   └── infra.pulumi/    # Pulumi infrastructure assessment (2025-11-11)
└── operation/           # Operational logs and summaries
    ├── WORKLOG.pulumi.assessment.md           # Detailed activity log
    └── PHASE1-IMPLEMENTATION-SUMMARY.md       # Implementation results
```

---

## Current Assessments

### Pulumi Infrastructure Assessment (2025-11-11)

**Location**: `assessment/infra.pulumi/`

**Status**: ✅ Complete (Phase 1 implemented)

**Score**: 67/100 → 75/100 (Grade C → B-)

**Key Documents**:
- `action-plan.SIMPLIFIED.md` - Pragmatic 2-hour improvement plan (RECOMMENDED)
- `scoring.md` - Detailed rubric assessment
- `inventory.md` - Complete resource catalog
- `commands-and-setup.md` - Command reference guide
- `risk-register.md` - Risk analysis and mitigation

**Implementation**:
- Phase 1: ✅ Complete (45 minutes, +8 points)
- Phase 2: ⏭️ Deferred (optional, when needed)

---

## Worklogs

### WORKLOG.pulumi.assessment.md

Chronological log of Pulumi infrastructure assessment activities.

**Contains**:
- Tool versions and environment setup
- Commands executed
- Findings and decisions
- Assessment completion summary

---

## Usage Guidelines

### For Developers

**When starting new work**:
1. Review relevant assessment docs in `assessment/`
2. Check `operation/` for recent implementation summaries
3. Follow recommendations from action plans

**When AI assists**:
- New assessments → `assessment/<topic>/`
- Activity logs → `operation/WORKLOG.<topic>.md`
- Implementation summaries → `operation/<PHASE>-SUMMARY.md`

---

### For AI Agents

**Assessment Pattern**:
```
.guided/
├── assessment/<topic>/
│   ├── inventory.md              # What exists
│   ├── usage-map.md              # How it's used
│   ├── scoring.md                # Current state score
│   ├── action-plan.md            # Improvement roadmap
│   └── ...
└── operation/
    ├── WORKLOG.<topic>.md        # Chronological log
    └── PHASE<N>-SUMMARY.md       # Implementation results
```

**Documentation Standards**:
- Markdown format
- Tables for structured data
- Code blocks for commands/examples
- Clear section headers
- Dates in YYYY-MM-DD format

---

## Philosophy

**Purpose**: Capture AI-assisted work artifacts for:
- Future reference and knowledge retention
- Decision rationale documentation
- Implementation tracking
- Onboarding new team members

**Principles**:
- ✅ Pragmatic over perfect
- ✅ Actionable recommendations
- ✅ Clear, concise documentation
- ✅ Business value first

---

## Archive Policy

**Keep**:
- Completed assessments (historical reference)
- Implementation summaries (what was done)
- Worklogs (decision history)

**Update**:
- Action plans (if priorities change)
- Scoring (quarterly or after major changes)

**Remove**:
- Outdated assessments (>1 year old, superseded)
- Interim drafts (keep final versions only)

---

## Quick Links

**Pulumi Infrastructure**:
- [Simplified Action Plan](assessment/infra.pulumi/action-plan.SIMPLIFIED.md) ⭐
- [Implementation Summary](operation/PHASE1-IMPLEMENTATION-SUMMARY.md)
- [Troubleshooting Runbook](../packages/infra/pulumi/gcp/docs/runbooks/pulumi-troubleshooting.md)
- [Cost Alert Setup](../packages/infra/pulumi/gcp/docs/cost-alert-setup.md)

---

**Maintained By**: GitHub Copilot AI Agent & Development Team  
**Last Updated**: 2025-11-11  
**Status**: Active documentation repository
