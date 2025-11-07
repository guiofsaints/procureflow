# Domain Types and Data Dictionary - Implementation Summary

**Generated**: November 7, 2025  
**Status**: ✅ Complete  
**Guided Engineering Prompt**: `tech-case.procureflow.domain-types-and-data-dictionary`

---

## 📦 Generated Artifacts

This guided prompt has generated the complete domain model and data dictionary for ProcureFlow:

### 1. TypeScript Domain Types
**File**: `apps/web/src/domain/entities.ts`

Defines core domain interfaces and types:
- **User**: Authentication and ownership
- **Item (CatalogItem)**: Materials/services in the procurement catalog
- **Cart & CartItem**: Shopping cart with line items
- **PurchaseRequest & PurchaseRequestItem**: Simulated ERP submissions
- **AgentConversation, AgentMessage, AgentAction**: AI agent interactions

All types include:
- Complete JSDoc documentation
- MVP vs Future scope indicators
- Business rule references
- Type-safe enums for status fields

### 2. Mongoose Document Types
**File**: `apps/web/src/domain/mongo-schemas.d.ts`

Defines MongoDB/Mongoose-oriented document shapes:
- Maps domain entities to persisted database documents
- Handles ObjectId conversions
- Documents embedded vs referenced relationships
- Includes utility types for schema definitions

### 3. Domain Index
**File**: `apps/web/src/domain/index.ts`

Central export point for easy importing:
```typescript
import { User, Item, Cart, ItemStatus } from '@/domain';
```

### 4. Domain and Data Dictionary Documentation
**File**: `.guided/product/domain-and-data-dictionary.md`

Comprehensive documentation including:
- Entity overview and purpose
- Field-by-field data dictionary tables
- Entity relationship diagrams (text notation)
- Business rules mapping
- MVP vs Future scope breakdown
- Validation rules summary
- Indexing strategy
- Example data flows

---

## 🎯 Key Design Decisions

### 1. Snapshot Pattern
Cart items and purchase request items capture point-in-time data to preserve historical accuracy:
- `CartItem` stores item name/price at add-to-cart time
- `PurchaseRequestItem` stores complete item snapshot at checkout
- Ensures consistency even if catalog items are updated/deleted

### 2. Embedded Sub-documents
Line items and conversation data use MongoDB embedded arrays:
- **Advantages**: Atomic operations, simpler queries, parent-child co-location
- **Used for**: CartItem, PurchaseRequestItem, AgentMessage, AgentAction
- **Trade-off**: 16MB BSON document limit (not a concern at tech case scale)

### 3. Status Enums
All workflow entities use TypeScript enums for status management:
- `ItemStatus`: Active, PendingReview, Inactive
- `PurchaseRequestStatus`: Submitted, PendingApproval, Approved, Rejected
- `AgentMessageRole`: user, assistant, system
- `AgentActionType`: search_catalog, register_item, add_to_cart, checkout, etc.

MVP defaults to simple states; Future states prepared for approval workflows.

### 4. User Ownership
All transactional entities reference User for multi-tenancy:
- `Cart.userId`
- `PurchaseRequest.userId`
- `AgentConversation.userId`
- `Item.registeredBy` (for user-created items)

### 5. Type Safety
Domain types use:
- Branded type aliases for IDs (UserId, ItemId, etc.)
- Strict TypeScript with proper null handling
- Enum validation for status fields
- Clear separation of domain vs database concerns

---

## 📋 Entity Summary

| Entity | Purpose | Key Fields | Relationships |
|--------|---------|------------|---------------|
| **User** | Authentication & ownership | email, passwordHash, role | → Cart, PurchaseRequest, AgentConversation, Item |
| **Item** | Catalog materials/services | name, category, description, price, status | ← CartItem, PurchaseRequestItem |
| **Cart** | Shopping cart | userId, items[], totalCost | → User, → CartItem |
| **CartItem** | Cart line item (embedded) | itemId, itemName, itemPrice, quantity | → Item |
| **PurchaseRequest** | Simulated ERP submission | userId, items[], totalCost, status | → User, → PurchaseRequestItem |
| **PurchaseRequestItem** | Request line item (embedded) | itemId, itemName, unitPrice, quantity (snapshot) | → Item |
| **AgentConversation** | AI agent session | userId, messages[], actions[], isActive | → User, → AgentMessage, → AgentAction |
| **AgentMessage** | Conversation message (embedded) | role, content, timestamp | N/A |
| **AgentAction** | Agent tool call (embedded) | actionType, parameters, result | N/A |

---

## 🚀 Next Steps for Implementation

### 1. Create Mongoose Schemas
Use the document types in `mongo-schemas.d.ts` to define actual Mongoose schemas:

```typescript
// Example: apps/web/src/lib/db/models/User.ts
import { Schema, model } from 'mongoose';
import type { UserDocument } from '@/domain';

const userSchema = new Schema<UserDocument>({
  email: { type: String, required: true, unique: true },
  name: { type: String },
  passwordHash: { type: String },
  // ... other fields
}, { timestamps: true });

export const UserModel = model<UserDocument>('User', userSchema);
```

### 2. Implement API Routes
Use domain types for request/response validation:

```typescript
// Example: apps/web/app/api/items/search/route.ts
import type { Item } from '@/domain';

export async function GET(request: Request) {
  // ... search logic
  const items: Item[] = await ItemModel.find({ ... });
  return Response.json({ items });
}
```

### 3. Build Frontend Components
Use domain types for props and state:

```typescript
// Example: apps/web/src/components/CartItemList.tsx
import type { CartItem } from '@/domain';

interface CartItemListProps {
  items: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
}
```

### 4. Implement Agent Tools
Use domain types for LangChain tool definitions:

```typescript
import type { AgentActionType, Item } from '@/domain';

const searchCatalogTool = {
  name: 'search_catalog',
  description: 'Search for items in the catalog',
  // ... implementation
};
```

---

## 🔍 Validation Checklist

All requirements from the PRD are properly represented:

### Search & Register (Journey 1)
- ✅ Item entity with name, category, description, price
- ✅ ItemStatus enum (Active, PendingReview, Inactive)
- ✅ User registration tracking via `registeredBy`
- ✅ Business rules: BR-1.1 to BR-1.6

### Cart & Checkout (Journey 2)
- ✅ Cart entity with userId, items[], totalCost
- ✅ CartItem embedded sub-documents with snapshot pattern
- ✅ PurchaseRequest with immutable item snapshots
- ✅ PurchaseRequestStatus enum
- ✅ Business rules: BR-2.1 to BR-2.8

### Agent-first (Journey 3)
- ✅ AgentConversation with messages and actions
- ✅ AgentMessage with role enum (user, assistant, system)
- ✅ AgentAction with actionType enum and parameters
- ✅ Conversation logging for debugging
- ✅ Business rules: BR-3.1 to BR-3.6

### Authentication & Authorization (FR-6.x)
- ✅ User entity with email/password support
- ✅ OAuth fields prepared for Future (provider, providerId)
- ✅ Role field prepared for Future RBAC

### All Entities Include
- ✅ Proper TypeScript types (string, number, Date, enums)
- ✅ MVP vs Future field annotations
- ✅ createdAt/updatedAt timestamps
- ✅ Validation rules documented

---

## 📚 Documentation Reference

For detailed information, see:

1. **PRD**: `.guided/product/PRD.md` - Business requirements and user journeys
2. **Data Dictionary**: `.guided/product/domain-and-data-dictionary.md` - Complete entity documentation
3. **Domain Types**: `apps/web/src/domain/entities.ts` - TypeScript definitions
4. **Mongoose Types**: `apps/web/src/domain/mongo-schemas.d.ts` - Database document shapes

---

## 🎓 Key Patterns and Conventions

### Import Convention
Always import from the domain index:
```typescript
import { User, Item, Cart, ItemStatus } from '@/domain';
```

### Naming Convention
- **Entities**: PascalCase (User, Item, Cart)
- **Types**: PascalCase with suffix (UserId, ItemStatus)
- **Enums**: PascalCase for enum name, PascalCase for values
- **Fields**: camelCase

### Type vs Interface
- Use `type` for ID aliases and unions
- Use `interface` for entity shapes (allows extension)
- Use `enum` for fixed status/role sets

### Comments
- Include `[MVP]` or `[Future]` tags in JSDoc
- Reference business rules with `BR-X.Y` format
- Explain snapshot fields clearly

---

**Status**: ✅ All domain types and documentation are complete and ready for implementation.

The domain model is aligned with the PRD, follows ProcureFlow coding standards, and provides a solid foundation for building the three core journeys (Search & Register, Cart & Checkout, Agent-first).
