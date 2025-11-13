# ProcureFlow Documentation

Welcome to the ProcureFlow comprehensive documentation. This directory contains all product, architecture, API, testing, and operational documentation following the C4 model and industry best practices.

---

## Quick Navigation

### 🎯 For New Developers

1. **Start Here**: [Discovery Summary](./assessment/docs.discovery-summary.md) - Repository overview and key findings
2. **Product Vision**: [PRD: Objectives and Features](./product/prd.objective-and-features.md)
3. **Architecture**: [C4 Context Diagram](./architecture/c4.context.md) → System boundary and external dependencies
4. **Local Setup**: [Runbook: Local Development](./operation/runbooks/local-dev.md)
5. **Contribution**: [CONTRIBUTING.md](/CONTRIBUTING.md)

### 🛠️ For Platform Engineers

1. **Infrastructure**: [Infrastructure Documentation](./architecture/infrastructure.md)
2. **Deployment**: [Deployment Strategy](./operations/deployment-strategy.md)
3. **Rollback**: [Rollback Strategy](./operations/rollback-strategy.md)
4. **Runbooks**: [Operational Runbooks](./operation/runbooks.plan.md)
5. **Autoscaling**: [Autoscaling Policy](./operations/autoscaling-policy.md)

### 📊 For Product Teams

1. **Features**: [PRD: Objectives and Features](./product/prd.objective-and-features.md)
2. **Functional Requirements**: [PRD: Functional Requirements](./product/prd.functional-requirements.md)
3. **Non-Functional Requirements**: [PRD: Non-Functional Requirements](./product/prd.non-functional-requirements.md)
4. **API Documentation**: [OpenAPI Status](./api/openapi.status-and-plan.md)
5. **Testing Strategy**: [Testing Strategy](./testing/testing-strategy.md)

---

## Documentation Status

| Section           | Status      | Completion       |
| ----------------- | ----------- | ---------------- |
| **Assessment**    | ✅ Complete | 100% (2/2 files) |
| **Product (PRD)** | ✅ Complete | 100% (3/3 files) |
| **Architecture**  | ✅ Complete | 100% (4/4 files) |
| **API**           | ✅ Complete | 100% (1/1 files) |
| **Testing**       | ✅ Complete | 100% (1/1 files) |
| **Operations**    | ✅ Complete | 100% (3/3 files) |
| **Runbooks**      | ✅ Complete | 100% (5/5 files) |

**Last Updated**: 2025-11-13  
**Current Phase**: Phase 3 - Documentation Enhancement Complete

---

## Document Structure

```
.guided/
├── README.md                           # This file
├── assessment/                         # Discovery and planning
│   ├── docs.discovery-summary.md       # ✅ Complete
│   └── docs.information-architecture.md # ✅ Complete
├── product/                            # Product requirements
│   ├── prd.objective-and-features.md   # ✅ Complete
│   ├── prd.functional-requirements.md  # ✅ Complete
│   └── prd.non-functional-requirements.md # ✅ Complete
├── architecture/                       # Technical architecture
│   ├── c4.context.md                   # ✅ Complete
│   ├── c4.container.md                 # ✅ Complete
│   ├── c4.component.md                 # 📝 Optional
│   ├── stack-and-patterns.md           # ✅ Complete
│   └── infrastructure.md               # ✅ Complete
├── api/                                # API documentation
│   ├── openapi.status-and-plan.md      # ✅ Complete
│   └── openapi.yaml                    # 📝 Future (automated generation)
├── testing/                            # Testing documentation
│   └── testing-strategy.md             # ✅ Complete
├── operations/                         # Deployment and operations
│   ├── deployment-strategy.md          # ✅ Complete
│   ├── rollback-strategy.md            # ✅ Complete
│   └── autoscaling-policy.md           # ✅ Complete
├── operation/                          # Operational runbooks
│   ├── runbooks.plan.md                # ✅ Complete
│   └── runbooks/
│       ├── local-dev.md                # ✅ Complete
│       ├── build-and-deploy.md         # ✅ Complete
│       ├── rollback.md                 # ✅ Complete
│       ├── autoscaling-check.md        # ✅ Complete
│       └── troubleshooting.md          # ✅ Complete
├── glossary.md                         # ✅ Complete
└── references.md                       # ✅ Complete
```

---

## Completed Documentation

### Assessment (100% Complete)

**[docs.discovery-summary.md](./assessment/docs.discovery-summary.md)**

- Repository structure and package inventory
- API surface analysis (13 endpoints)
- Deployment paths (local Docker, GCP Cloud Run)
- Testing infrastructure assessment
- Rollback and autoscaling capability gaps
- Prioritized documentation backlog

**[docs.information-architecture.md](./assessment/docs.information-architecture.md)**

- Minimal IA with navigation table
- Document ownership and update SLA definitions
- Standard document format and templates
- Cross-linking strategy
- Quality criteria for each document type
- Maintenance process (quarterly reviews, per-release updates)

### Product Requirements (100% Complete)

**[prd.objective-and-features.md](./product/prd.objective-and-features.md)**

- Problem statement and vision
- Success metrics (KPIs and business outcomes)
- Target user personas (Employee, Buyer, Engineer)
- Must-have features (12 MVP features)
- Nice-to-have features (Phases 2-4)
- Out of scope exclusions

**[prd.functional-requirements.md](./product/prd.functional-requirements.md)**

- 28 detailed functional requirements (FR-CAT, FR-CART, FR-CHECK, FR-AGENT, FR-AUTH)
- Each FR includes: Trigger, Happy Path, Edge Cases, Acceptance Criteria
- Performance targets embedded in acceptance criteria
- Cross-cutting requirements (data integrity, security)

**[prd.non-functional-requirements.md](./product/prd.non-functional-requirements.md)**

- Performance: API latency targets (p50/p95/p99)
- Security: Authentication, input validation, secrets management
- Reliability: 99.5% uptime SLA, error rate < 0.1%
- Observability: Structured logging, Prometheus metrics, health checks
- Scalability: Horizontal scaling, connection pooling, stateless architecture
- Cost: < $50/month infrastructure budget, OpenAI cost control

### Architecture (100% Complete)

**[c4.context.md](./architecture/c4.context.md)**

- Level 1 C4 diagram with Mermaid syntax
- Three primary actors (Employee, Buyer, Engineer)
- System boundary definition
- External dependencies (MongoDB Atlas, OpenAI API)
- Assumptions and limitations

**[c4.container.md](./architecture/c4.container.md)**

- Level 2 C4 diagram showing Next.js app, MongoDB, OpenAI interactions
- Container-level architecture (Web App, API Routes, Agent Service, Database)
- Sequence diagrams for key workflows (catalog search, agent chat, checkout)
- Inter-container communication patterns
- Technology choices for each container

**[stack-and-patterns.md](./architecture/stack-and-patterns.md)**

- Complete technology stack with versions
- 6 architectural patterns (feature-based, service layer, domain-driven design, agent-first, reliability patterns, observability)
- Decision log with 18 architectural decisions
- Technology constraints and trade-offs

**[infrastructure.md](./architecture/infrastructure.md)**

- Environment matrix (dev/staging/prod configuration)
- Deployment architecture (Docker Compose local, Cloud Run dev/prod)
- CI/CD pipeline with GitHub Actions
- Secrets management with GCP Secret Manager
- Observability stack (structured logging, health checks, Prometheus metrics future)
- Autoscaling policies and cost management

### API (100% Complete)

**[openapi.status-and-plan.md](./api/openapi.status-and-plan.md)**

- Current OpenAPI 3.0 specification analysis
- 13 documented endpoints across 5 domains
- 15 schema definitions with validation rules
- 9 coverage gaps identified (versioning, rate limiting, pagination, etc.)
- 4 validation gaps (CI validation, breaking change detection, Zod sync)
- 4-phase consolidation plan (Foundation v1.1 → External Clients v3.0)
- Automated generation roadmap with effort estimates

### Testing (100% Complete)

**[testing-strategy.md](./testing/testing-strategy.md)**

- Testing pyramid: 70% unit / 25% integration / 5% e2e
- Tooling: Vitest 4.0.8 + Testing Library + mongodb-memory-server
- Current state: 1 test file with 6 tests
- Target state: 100 tests achieving 60% coverage by Q1 2025
- CI gates: test execution, coverage thresholds, linting
- Flakiness mitigation strategies

### Operations (100% Complete)

**[deployment-strategy.md](./operations/deployment-strategy.md)**

- GCP Cloud Run deployment via GitHub Actions CI/CD
- Pulumi IaC for infrastructure provisioning
- Docker containerization with Artifact Registry
- Environment configuration (dev/staging/prod)
- Pre-deployment checks and smoke tests
- 5-8 minute deployment timeline

**[rollback-strategy.md](./operations/rollback-strategy.md)**

- Cloud Run revision rollback (2-5 minutes)
- Pulumi state revert (10-30 minutes)
- Rollback decision tree and triggers
- Data migration handling strategies
- Validation and verification procedures

**[autoscaling-policy.md](./operations/autoscaling-policy.md)**

- Cloud Run autoscaling configuration
- Concurrency targets (80 requests/instance)
- Min/max instance limits by environment
- Cost guardrails and monitoring
- Performance metrics and triggers

### Runbooks (80% Complete - 4/5)

**[runbooks.plan.md](./operation/runbooks.plan.md)**

- Runbook inventory and format standards
- Ownership and maintenance guidelines
- 5 core operational procedures
- Quarterly review process

**[runbooks/local-dev.md](./operation/runbooks/local-dev.md)**

- Local development environment setup
- Docker Compose configuration
- Database seeding procedures
- 15-20 minute setup timeline

**[runbooks/build-and-deploy.md](./operation/runbooks/build-and-deploy.md)**

- Automated GitHub Actions deployment
- Manual Pulumi deployment procedures
- Smoke test execution
- Deployment verification steps

**[runbooks/rollback.md](./operation/runbooks/rollback.md)**

- Fast Cloud Run traffic rollback (2-5 min)
- Full infrastructure rollback (10-30 min)
- Rollback validation and verification
- Emergency escalation procedures

**[runbooks/autoscaling-check.md](./operation/runbooks/autoscaling-check.md)**

- Cloud Run metrics monitoring
- Instance count and concurrency tracking
- Cost alerts and anomaly detection
- Scaling behavior verification

**[runbooks/troubleshooting.md](./operation/runbooks/troubleshooting.md)**

- Diagnostic flowchart for quick issue identification
- 10+ common failure scenarios with solutions
- Application errors (500/404/401)
- Database issues (connection, indexes, auth)
- Deployment failures (build, deploy, health)
- Performance problems (latency, memory)
- Escalation procedures

### Reference Documentation (100% Complete)

**[glossary.md](./glossary.md)**

- 60+ domain and technical terms
- Business concepts (Agent, Catalog, Cart, Checkout)
- Architecture patterns (C4, Service Layer, Domain Entity)
- Infrastructure terms (Cloud Run, Pulumi, IaC)
- Development practices (Conventional Commits, Feature-Based Structure)
- Complete acronyms reference

**[references.md](./references.md)**

- 100+ external documentation links
- Framework docs (Next.js, React, TypeScript)
- Backend resources (MongoDB, Mongoose, NextAuth.js)
- AI documentation (LangChain, OpenAI)
- Testing tools (Vitest, Testing Library)
- Infrastructure guides (GCP, Pulumi, Docker)
- Development tools (pnpm, ESLint, GitHub Actions)
- Internal documentation cross-references

---

## Documentation Complete! 🎉

All core documentation files have been created and are ready for use:

- ✅ **Assessment** (2/2 files) - Discovery and information architecture
- ✅ **Product** (3/3 files) - PRD with objectives, features, FR, and NFR
- ✅ **Architecture** (4/4 files) - C4 diagrams, stack, patterns, infrastructure
- ✅ **API** (1/1 files) - OpenAPI status and consolidation plan
- ✅ **Testing** (1/1 files) - Testing strategy and tooling
- ✅ **Operations** (3/3 files) - Deployment, rollback, and autoscaling
- ✅ **Runbooks** (5/5 files) - Operational procedures
- ✅ **Reference** (2/2 files) - Glossary and external references

### Next Steps

1. **Cross-linking pass** - Link PRD ↔ C4 ↔ Infrastructure ↔ Testing ↔ Operations ↔ Runbooks
2. **Executive Summary verification** - Ensure all summaries ≤8 lines
3. **Mermaid diagram testing** - Verify rendering in VSCode and GitHub
4. **Update docs.discovery-summary.md** - Add post-completion section with Phase 2/3 achievements

---

## Document Standards

All `.guided/` documents follow these standards:

### Required Sections

1. **Executive Summary** (≤8 lines)
   - Purpose, scope, key takeaways
   - No fluff, actionable insights only

2. **Main Content**
   - Clear headings (## H2, ### H3 max depth)
   - Tables for lists/comparisons
   - Mermaid diagrams for visuals
   - Code blocks with language tags

3. **Assumptions and Limitations**
   - Constraints, known gaps, future work

4. **References**
   - Links to related .guided/ docs
   - External resources
   - Date of last update

### Mermaid Diagram Guidelines

- Use `graph TD` for C4 diagrams
- Use `sequenceDiagram` for interaction flows
- Use `flowchart TD` for decision trees
- Include styling for clarity (classDef, class assignments)

---

## Contribution Guidelines

### Updating Documentation

1. **Before Release**: Update all "Per release" SLA documents
2. **Quarterly**: Review all "Quarterly" SLA documents
3. **On Change**: Update architecture docs when infrastructure changes
4. **Immediately**: Fix broken links, typos, factual errors

### Pull Request Checklist

When modifying .guided/ documentation:

- [ ] Executive Summary updated (if applicable)
- [ ] Mermaid diagrams render correctly in GitHub
- [ ] Internal links tested and working
- [ ] "Last Updated" date refreshed
- [ ] Cross-references updated

### Quality Gates

- All documents have Executive Summary ≤8 lines
- All Mermaid diagrams render in VSCode and GitHub
- 100% of internal links resolve correctly
- All runbooks include last verification date

---

## External Resources

- [C4 Model](https://c4model.com/) - Architecture diagram standard
- [Keep a Changelog](https://keepachangelog.com/) - Changelog format
- [Semantic Versioning](https://semver.org/) - Version numbering
- [OpenAPI 3.0](https://swagger.io/specification/) - API specification
- [Mermaid Syntax](https://mermaid.js.org/) - Diagram syntax
- [Conventional Commits](https://www.conventionalcommits.org/) - Commit message format

---

## Support

### Questions or Issues

- **Documentation Issues**: Open GitHub issue with `documentation` label
- **Technical Questions**: See [CONTRIBUTING.md](/CONTRIBUTING.md)
- **Architecture Decisions**: Consult decision log in `architecture/stack-and-patterns.md` (coming soon)

### Contact

- **Documentation Issues**: Open GitHub issue with `documentation` label
- **Technical Questions**: See [CONTRIBUTING.md](/CONTRIBUTING.md)
- **Architecture Decisions**: Consult decision log in `architecture/stack-and-patterns.md` (coming soon)

---

**README Version**: 3.0.0  
**Phase**: 3 - Complete (All Core Documentation)  
**Completion**: 100% (17/17 core documents complete)  
**Achievement**: Complete documentation suite ready for production  
**Last Major Update**: 2025-11-13 (Phase 3 complete: Added troubleshooting, glossary, references)
