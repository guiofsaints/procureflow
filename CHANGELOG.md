# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial bootstrap codebase with Next.js 15, TypeScript, and Tailwind CSS
- Auth.js authentication setup with Credentials provider
- MongoDB integration with Mongoose
- LangChain and OpenAI integration for AI features
- Docker and docker-compose configuration
- Pulumi infrastructure-as-code setup for GCP
- ESLint, Prettier, and commitlint tooling
- Comprehensive documentation and development workflow
- **Layout Migration**: Migrated layout to shadcn-admin patterns (7 phases completed)
  - Phase 1: Theme & global styles (sidebar tokens, scrollbars, utilities, animations)
  - Phase 2: Layout shell structure (LayoutContext, Header with scroll effects, Main, SkipToMain)
  - Phase 3: Sidebar enhancement (NavGroup, external navigation data, collapsible support, SidebarRail)
  - Phase 4: Header enhancement (ThemeToggle moved to header)
  - Phase 5: ThemeToggle refactor (dropdown with light/dark/system options, animated icons)
  - Phase 6: UserMenu verification (functional in header and sidebar)
  - Phase 7: Cleanup & validation (all tests passing, build successful)
- Collapsible component from Radix UI for navigation groups
- LayoutProvider context for variant/collapsible mode management
- Enhanced accessibility with skip-to-main link
- Dynamic cart badge in navigation
- Container query support for responsive layouts

### Changed

- Refactored AppShell to use new layout structure with separate Header/Main components
- Refactored Sidebar to use NavGroup component with external data
- Refactored ThemeToggle to dropdown pattern with sun/moon animated transitions
- Updated ThemeToggle to include system theme option
- Updated Header with scroll-based glassmorphism and shadow effects
- Moved ThemeToggle from sidebar footer to header
- Navigation data now externalized in `sidebar-data.ts`

### Deprecated

### Removed

### Fixed

### Security

---

**Note:** This changelog is automatically maintained using [standard-version](https://github.com/conventional-changelog/standard-version). Please use conventional commit messages for automatic changelog generation.
