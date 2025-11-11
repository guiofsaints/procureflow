# User Personas

> **Status**: Draft  
> **Last Updated**: 2025-11-10

## Overview

This document defines user personas for ProcureFlow—the end users of the procurement platform. These are distinct from engineering personas (documented in `.guided/personas/`).

## Primary Persona: Employee (Requester)

### Demographics

- **Role**: Knowledge worker, team lead, individual contributor
- **Department**: Any (Engineering, Marketing, Operations, HR, etc.)
- **Technical Proficiency**: Basic to intermediate
- **Age Range**: 25-55
- **Procurement Experience**: None to minimal

### Profile

**Name**: Alex Chen  
**Title**: Software Engineer  
**Company**: Mid-sized tech company  

**Background**:
- Manages a team of 5 engineers
- Occasionally needs to request equipment and supplies
- Has limited time for administrative tasks
- Prefers quick, self-service solutions

### Goals

1. **Speed**: Request items in minimal time
2. **Simplicity**: Avoid complex ERP interfaces
3. **Clarity**: Know exactly what to order without specialized knowledge
4. **Autonomy**: Self-serve without involving procurement team for routine requests

### Pain Points

- Doesn't remember exact item names or SKU codes
- Frustrated by multi-page forms requiring category selections
- Uncertain about budget approval status
- Delays waiting for procurement team to process simple requests
- Intimidated by enterprise software complexity

### Needs

- Natural language search: "I need wireless mice for my team"
- Quick cart management: Add, edit, remove items easily
- Transparency: See what's in cart, total cost, status
- Guidance: Help finding the right items without specialized knowledge

### Behavioral Traits

- **Task-oriented**: Wants to complete procurement and move on
- **Pragmatic**: Values functionality over features
- **Impatient**: Low tolerance for unnecessary steps
- **Self-sufficient**: Prefers finding answers over asking for help

### Technology Comfort

- Comfortable with chat interfaces (Slack, WhatsApp)
- Basic understanding of online shopping (Amazon)
- Minimal experience with enterprise software

### Use Cases

#### Scenario 1: Request Office Supplies

**Context**: Alex's team needs new keyboards and mice.

**Journey**:
1. Opens ProcureFlow agent
2. Types: "I need 5 ergonomic keyboards and wireless mice"
3. Agent shows options with prices
4. Alex selects preferred items
5. Agent adds to cart
6. Alex confirms: "Checkout"
7. Purchase request submitted

**Success**: Request completed in < 2 minutes without leaving chat interface.

#### Scenario 2: Register New Item

**Context**: Alex needs a standing desk, but it's not in catalog.

**Journey**:
1. Searches: "standing desk"
2. Agent responds: "No standing desks found. Would you like to register this item?"
3. Alex: "Yes, I need an adjustable standing desk, budget around $500"
4. Agent captures details and registers item
5. Alex can now add it to cart

**Success**: Alex doesn't need to contact procurement team separately.

#### Scenario 3: Modify Cart Before Checkout

**Context**: Alex added items but realizes quantity is wrong.

**Journey**:
1. "Show me my cart"
2. Agent displays current cart
3. "Change keyboards to 6"
4. Agent updates quantity and total
5. "Checkout"

**Success**: No need to clear cart and start over.

### Quotes

> "I just want to tell someone what I need and have it handled. I don't want to learn another system."

> "If I have to click through 5 pages to order a mouse, I'll just buy it myself and expense it."

> "I never know which category to select. Is a USB hub 'Accessories' or 'Electronics'?"

## Secondary Persona: Buyer (Future)

### Demographics

- **Role**: Procurement specialist, buyer, purchasing manager
- **Department**: Procurement, Finance
- **Technical Proficiency**: Intermediate to advanced
- **Procurement Experience**: 3-10 years

### Profile

**Name**: Maria Rodriguez  
**Title**: Senior Buyer  
**Company**: Mid-sized tech company

**Background**:
- Manages procurement for entire organization
- Responsible for budget compliance and vendor relationships
- Needs visibility into all purchase requests
- Balances efficiency with cost control

### Goals (Future Scope)

1. **Efficiency**: Process routine requests quickly to focus on strategic sourcing
2. **Control**: Ensure requests comply with budget and policy
3. **Visibility**: Monitor spending patterns and identify savings opportunities
4. **Quality**: Maintain catalog accuracy and preferred supplier relationships

### Pain Points

- Overwhelmed by high volume of simple requests
- Manual review of every request is time-consuming
- Difficult to identify duplicate or incorrect items
- Users bypass procurement system entirely

### Needs (Future Scope)

- Approval queue with quick approve/reject actions
- Automated approval for low-value, policy-compliant requests
- Analytics on spending trends
- Tools to review and approve user-registered items

### Use Cases (Future)

#### Scenario 1: Approve Purchase Requests

**Journey**:
1. Opens buyer dashboard
2. Sees pending requests
3. Reviews request details (items, total, requester)
4. Approves or rejects with one click
5. Optional: Adds notes or questions

#### Scenario 2: Review User-Registered Items

**Journey**:
1. Sees list of newly registered items
2. Reviews item details (name, category, estimated price)
3. Approves for catalog or requests more information
4. Optionally: Adds preferred supplier information

## Tertiary Persona: IT Administrator (Future)

### Profile

**Name**: Jordan Kim  
**Title**: IT System Administrator

### Goals (Future Scope)

- Configure system settings
- Manage user access and roles
- Monitor system health and agent performance
- Maintain catalog integrity

### Needs (Future Scope)

- Admin dashboard for configuration
- User and role management
- System monitoring and logs
- Catalog management tools

## Persona Comparison

| Attribute | Employee (Requester) | Buyer | IT Admin |
|-----------|---------------------|-------|----------|
| **Primary Goal** | Request items quickly | Ensure compliance & efficiency | Maintain system health |
| **System Usage** | Occasional (as needed) | Daily | Weekly |
| **Technical Skill** | Basic | Intermediate | Advanced |
| **Focus** | Task completion | Process optimization | Configuration |
| **MVP Priority** | Primary | Future | Future |

## Design Implications

### For Employees (MVP)

- ✅ Conversational interface (no forms)
- ✅ Natural language search
- ✅ Minimal clicks to checkout
- ✅ Clear cart visibility
- ✅ Error messages in plain language

### For Buyers (Future)

- Quick approval/reject actions
- Bulk operations
- Filtering and sorting for requests
- Analytics and reporting

### For IT Admins (Future)

- Configuration UI
- Role-based access control
- Audit logs
- Health monitoring dashboard

## Related Documentation

- Product requirements: `.guided/product/prd.md`
- Domain model: `.guided/architecture/entities.md`
