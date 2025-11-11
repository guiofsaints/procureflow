# Changelog

> **Format**: Keep a Changelog v1.0.0  
> **Versioning**: Semantic Versioning  

All notable changes to ProcureFlow will be documented in this file.

## [Unreleased]

### Added
- Initial `.guided/` documentation structure
- Comprehensive technical assessment
- Architecture documentation
- Testing strategy and risk analysis

## [0.1.0] - 2024-Q4 (Bootstrap Codebase)

### Added
- Next.js 15 with App Router
- TypeScript configuration
- MongoDB with Mongoose ODM
- NextAuth.js authentication (JWT strategy)
- LangChain + OpenAI/Gemini AI integration
- Feature-based architecture (catalog, cart, checkout, agent, auth)
- Service layer pattern
- Winston logging with Loki integration
- Prometheus metrics
- Docker Compose for local development
- Pulumi IaC for GCP deployment
- pnpm workspace monorepo structure
- ESLint + Prettier with pre-commit hooks
- Conventional commits with commitlint
- Database seed scripts

### Features
- AI agent chat interface
- Conversational catalog search
- Cart management via agent
- Purchase request creation
- Item registration
- Demo authentication

### Infrastructure
- MongoDB text search index
- Radix UI component library
- Tailwind CSS styling
- Circuit breaker for AI API calls
- Rate limiting for OpenAI
- Retry logic with exponential backoff

### Documentation
- `.github/copilot-instructions.md`
- `README.md`
- Product documentation in `.guided/product/`
- Architecture documentation in `.guided/architecture/`

### Known Limitations
- No automated tests
- No approval workflows (future)
- No budget management (future)
- Demo authentication only (OAuth future)
- Single organization (multi-tenancy future)

---

## Release Notes Template

```markdown
## [Version] - YYYY-MM-DD

### Added
- New features

### Changed
- Changes to existing functionality

### Deprecated
- Soon-to-be removed features

### Removed
- Removed features

### Fixed
- Bug fixes

### Security
- Security improvements
```

---

## Related Documentation

- Product roadmap: `.guided/product/roadmap.md`
- Worklog: `.guided/operation/worklog.md`
