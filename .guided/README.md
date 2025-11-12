# ProcureFlow Documentation

Welcome to the ProcureFlow comprehensive documentation. This directory contains all product, architecture, API, testing, and operational documentation following the C4 model and industry best practices.

---

## Quick Navigation

### 🎯 For New Developers

1. **Start Here**: [Discovery Summary](./assessment/docs.discovery-summary.md) - Repository overview and key findings
2. **Product Vision**: [PRD: Objectives and Features](./product/prd.objective-and-features.md)
3. **Architecture**: [C4 Context Diagram](./architecture/c4.context.md) → System boundary and external dependencies
4. **Local Setup**: [Runbook: Local Development](./operation/runbooks/local-dev.md) (coming soon)
5. **Contribution**: [CONTRIBUTING.md](/CONTRIBUTING.md)

### 🛠️ For Platform Engineers

1. **Infrastructure**: [Infrastructure Documentation](./architecture/infrastructure.md)
2. **Deployment**: [Deployment Strategy](./operations/deployment-strategy.md) (coming soon)
3. **Rollback**: [Rollback Strategy](./operations/rollback-strategy.md) (coming soon)
4. **Runbooks**: [Operational Runbooks](./operation/runbooks.plan.md) (coming soon)
5. **Autoscaling**: [Autoscaling Policy](./operations/autoscaling-policy.md) (coming soon)

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
| **Operations**    | 📝 Planned  | 0% (0/3 files)   |
| **Runbooks**      | 📝 Planned  | 0% (0/6 files)   |

**Last Updated**: 2025-11-12  
**Current Phase**: Phase 2 - Operations and Runbooks

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
│   ├── deployment-strategy.md          # 📝 Planned
│   ├── rollback-strategy.md            # 📝 Planned
│   └── autoscaling-policy.md           # 📝 Planned
├── operation/                          # Operational runbooks
│   ├── runbooks.plan.md                # 📝 Planned
│   └── runbooks/
│       ├── local-dev.md                # 📝 Planned
│       ├── build-and-deploy.md         # 📝 Planned
│       ├── rollback.md                 # 📝 Planned
│       ├── autoscaling-check.md        # 📝 Planned
│       └── troubleshooting.md          # 📝 Planned
├── glossary.md                         # 📝 Future
└── references.md                       # 📝 Future
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

---

## Pending Documentation (Next Steps)

### Priority 1: Operations Documentation (CURRENT PHASE)

1. **operations/deployment-strategy.md** - Deploy flow, promotion model, required checks, smoke tests
2. **operations/rollback-strategy.md** - Rollback decision tree, data migration handling, validation checks
3. **operations/autoscaling-policy.md** - Metrics/triggers, min/max instances, cost guardrails, load test baselines

### Priority 2: Runbooks

4. **operation/runbooks.plan.md** - Initial runbook inventory with format and ownership
5. **operation/runbooks/local-dev.md** - Local development setup procedure
6. **operation/runbooks/build-and-deploy.md** - CI/CD workflow execution
7. **operation/runbooks/rollback.md** - Execute rollback procedure
8. **operation/runbooks/autoscaling-check.md** - Monitor and adjust autoscaling
9. **operation/runbooks/troubleshooting.md** - Common failures and resolutions

### Priority 3: Quality Check and Cross-linking

10. **Cross-linking pass** - Link PRD ↔ C4 ↔ Infrastructure ↔ Testing ↔ Operations ↔ Runbooks
11. **Executive Summary verification** - Ensure all summaries ≤8 lines
12. **Mermaid diagram testing** - Verify rendering in VSCode and GitHub
13. **Update docs.discovery-summary.md** - Add post-completion section with remaining gaps

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
- All runbooks include owner and last verification date

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

- **Owner**: Tech Lead
- **Maintainers**: Engineering Team
- **Last Major Update**: 2025-11-12 (Phase 2: Operations and Runbooks)

---

**README Version**: 2.0.0  
**Phase**: 2 - Operations and Runbooks  
**Completion**: 73% (11/15 core documents complete)  
**Next Milestone**: Complete Operations section (3 documents)
