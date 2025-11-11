# Guided Engineering Structure

## Overview

This document defines the canonical `.guided/` folder structure for Guided Engineering documentation. All documentation artifacts, assessments, personas, and prompts are organized within this structure.

## Folder Structure

```
.guided/
├── base/                           # Foundation documentation
│   ├── structure.md               # This file - canonical structure reference
│   ├── project.structure.md       # Project-specific structure analysis
│   └── setup.instructions.md      # Environment setup guide
│
├── product/                        # Product documentation
│   ├── prd.md                     # Product Requirements Document
│   ├── roadmap.md                 # Product roadmap and milestones
│   └── personas.md                # User personas and journeys
│
├── architecture/                   # Architecture documentation
│   ├── stack.md                   # Technology stack inventory
│   ├── context.md                 # Architectural contexts and boundaries
│   ├── entities.md                # Domain model and entities
│   ├── rules.md                   # Business and domain rules
│   ├── guided.md                  # Guided Engineering principles
│   ├── guardrails.md              # Technical guardrails and conventions
│   ├── plugins.md                 # Extensibility and plugin architecture
│   └── adr/                       # Architecture Decision Records
│       └── NNNN-title.md          # Individual ADRs (numbered)
│
├── assessment/                     # Technical assessments
│   ├── summary.md                 # Overall assessment summary
│   ├── structure.md               # Structure assessment
│   ├── stack.md                   # Technology stack assessment
│   ├── entities.md                # Domain model assessment
│   ├── plugins.md                 # Extensibility assessment
│   ├── risks.md                   # Risk assessment
│   └── personas.md                # Persona assessment
│
├── testing/                        # Testing documentation
│   ├── strategy.md                # Testing strategy and approach
│   ├── playbook.md                # Testing playbook and procedures
│   ├── coverage.md                # Test coverage analysis
│   └── risks.md                   # Testing risks and gaps
│
├── operation/                      # Operational documentation
│   ├── worklog.md                 # Development worklog (append-only)
│   ├── changelog.md               # Version changelog
│   ├── troubleshooting.md         # Common issues and solutions
│   └── faq.md                     # Frequently asked questions
│
├── personas/                       # AI agent personas
│   ├── personas.yml               # Persona registry
│   └── template.persona.yml       # Persona template
│
├── prompts/                        # Structured prompts
│   └── template.prompt.yml        # Prompt template
│
├── schema/                         # JSON schemas
│   ├── prompt.schema.json         # Prompt structure schema
│   └── persona.schema.json        # Persona structure schema
│
├── context/                        # Contextual information
│   ├── local.md                   # Local development context
│   └── env.md                     # Environment variables reference
│
└── tmp/                           # Temporary/generated files
    └── system.context.md          # System environment detection
```

## File Naming Conventions

### General Rules

1. **Lowercase with hyphens**: Use `kebab-case` for multi-word files (e.g., `project.structure.md`)
2. **Descriptive names**: Names should clearly indicate content purpose
3. **Consistent extensions**:
   - `.md` - Markdown documentation
   - `.yml` / `.yaml` - Structured data (personas, prompts)
   - `.json` - Schemas and structured configuration

### Specific Patterns

| Category | Pattern | Example |
|----------|---------|---------|
| Base docs | `*.md` | `project.structure.md` |
| Product docs | `*.md` | `prd.md`, `roadmap.md` |
| Architecture | `*.md` | `stack.md`, `context.md` |
| ADRs | `NNNN-title.md` | `0001-use-nextjs.md` |
| Assessment | `*.md` | `summary.md`, `risks.md` |
| Testing | `*.md` | `strategy.md`, `coverage.md` |
| Operation | `*.md` | `worklog.md`, `changelog.md` |
| Personas | `*.persona.yml` | `backend-developer.persona.yml` |
| Prompts | `*.prompt.yml` | `create-feature.prompt.yml` |
| Schemas | `*.schema.json` | `prompt.schema.json` |

## Purpose and Usage

### Base (`base/`)

Foundation documentation that defines the project structure and setup.

- **structure.md**: Reference for `.guided/` organization (this file)
- **project.structure.md**: Analysis of the actual project codebase structure
- **setup.instructions.md**: Developer environment setup guide

### Product (`product/`)

Product-level documentation for features, users, and roadmap.

- **prd.md**: Product requirements, features, scope
- **roadmap.md**: Planned milestones and timeline
- **personas.md**: End-user personas (distinct from engineering personas)

### Architecture (`architecture/`)

Technical architecture and design documentation.

- **stack.md**: Complete technology inventory
- **context.md**: Bounded contexts, layers, system boundaries
- **entities.md**: Domain model, schemas, relationships
- **rules.md**: Business rules and constraints
- **guided.md**: Guided Engineering principles for this project
- **guardrails.md**: Technical conventions and rules
- **plugins.md**: Extensibility mechanisms
- **adr/**: Architecture Decision Records (numbered, immutable)

### Assessment (`assessment/`)

Technical assessments and analysis outputs.

- **summary.md**: Executive summary of assessment findings
- **structure.md**: Project structure analysis
- **stack.md**: Technology stack evaluation
- **entities.md**: Domain model evaluation
- **plugins.md**: Extensibility evaluation
- **risks.md**: Identified technical risks
- **personas.md**: Persona usage assessment

### Testing (`testing/`)

Testing strategy, coverage, and risk documentation.

- **strategy.md**: Testing approach, tools, types of tests
- **playbook.md**: Standard testing procedures
- **coverage.md**: Test coverage metrics and analysis
- **risks.md**: Testing gaps and coverage risks

### Operation (`operation/`)

Operational logs and troubleshooting guides.

- **worklog.md**: Chronological development log (append-only)
- **changelog.md**: Version history and release notes
- **troubleshooting.md**: Common issues and resolutions
- **faq.md**: Frequently asked questions

### Personas (`personas/`)

AI agent persona definitions for different engineering roles.

- **personas.yml**: Registry of all available personas
- **template.persona.yml**: Template for creating new personas
- ***.persona.yml**: Individual persona definitions

### Prompts (`prompts/`)

Structured, reusable prompts for common engineering tasks.

- **template.prompt.yml**: Template for creating new prompts
- ***.prompt.yml**: Individual prompt definitions

### Schema (`schema/`)

JSON Schema definitions for validating structured data.

- **prompt.schema.json**: Schema for prompt YAML files
- **persona.schema.json**: Schema for persona YAML files

### Context (`context/`)

Environment and context-specific information.

- **local.md**: Local development configuration notes
- **env.md**: Environment variable documentation

### Tmp (`tmp/`)

Temporary, generated, or transient documentation.

- **system.context.md**: Auto-detected system environment
- Other temporary analysis files

## Maintenance Rules

### Immutability

- **ADRs**: Once created, ADRs are immutable. Create new ADRs to supersede old ones.
- **Worklog**: Append-only. Never edit past entries.

### Versioning

- Documentation should evolve with the codebase
- Use git commits to track documentation changes
- Reference code versions in documentation when relevant

### Consistency

- Follow the established folder structure
- Use templates for personas and prompts
- Maintain consistent formatting within categories

## Creation Guidelines

### When to Create New Files

- **ADRs**: For significant architectural decisions
- **Prompts**: For repeatable engineering tasks
- **Personas**: For new engineering roles or specializations
- **Assessment docs**: After major refactors or audits

### When to Update Existing Files

- **Stack/Entities**: When technologies or domain model changes
- **Guardrails**: When conventions evolve
- **Worklog**: Continuously during development
- **Changelog**: At release milestones

## Integration with Development Workflow

1. **Setup**: Create `.guided/` structure at project initialization
2. **Assessment**: Run initial assessment to populate documentation
3. **Development**: Update relevant docs as code evolves
4. **Review**: Include documentation review in PR process
5. **Release**: Update changelog and roadmap at milestones

## References

- [Guided Engineering Methodology](https://guided.engineering)
- Project-specific setup: See `setup.instructions.md`
- Architecture overview: See `architecture/context.md`
