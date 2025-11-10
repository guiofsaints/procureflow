# Agent System - Sequence Flows

**Document Version**: 1.0  
**Date**: 2025-11-10  
**Scope**: Key user journeys with happy path, failure scenarios, and retry branches

---

## 1. Happy Path: Search Catalog

### Sequence Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Chat UI
    participant API as POST /api/agent/chat
    participant Auth as NextAuth
    participant AS as AgentService
    participant LC as LangChainClient
    participant LLM as OpenAI/Gemini
    participant CS as CatalogService
    participant DB as MongoDB

    U->>UI: "Find wireless mice under $30"
    UI->>API: POST {message, conversationId?}
    API->>Auth: getServerSession()
    Auth-->>API: session {user: {id, email}}

    API->>AS: handleAgentMessage(userId, message, conversationId)
    AS->>DB: findById(conversationId) or create new
    DB-->>AS: conversation doc

    AS->>AS: conversation.messages.push(user message)
    AS->>AS: generateAgentResponse()
    AS->>AS: Build system prompt + 7 tools
    AS->>AS: Get last 10 messages with cart context

    AS->>LC: chatCompletionWithTools(message, tools, history)
    LC->>LC: Format messages (SystemMessage, HumanMessage[])
    LC->>LC: Format tools as OpenAI function defs
    LC->>LLM: POST /chat/completions {messages, tools}

    LLM-->>LC: Response with tool_calls: [{name: "search_catalog", args: {keyword: "wireless mice", maxPrice: 30}}]
    LC-->>AS: {content: "", toolCalls: [{...}], finishReason: "tool_calls"}

    AS->>AS: executeTool("search_catalog", {keyword, maxPrice})
    AS->>CS: searchItems({q: "wireless mice", maxPrice: 30, limit: 5})
    CS->>DB: items.find({$text: {$search: "wireless mice"}, price: {$lte: 30}, status: "active"}).limit(5)
    DB-->>CS: [5 matching items]
    CS-->>AS: [{id, name, category, description, price, status}]

    AS->>AS: Truncate descriptions to 150 chars
    AS->>AS: Map to AgentResponseItem[]
    AS->>AS: Format response: "Found 5 matching products..."

    AS->>AS: conversation.messages.push(agent message with metadata.items)
    AS->>DB: conversation.save()
    DB-->>AS: saved

    AS-->>API: {conversationId, messages: [...]}
    API-->>UI: JSON response
    UI-->>U: Display 5 product cards with prices
```

---

## 2. Happy Path: Add to Cart

### Sequence Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Chat UI
    participant AS as AgentService
    participant LC as LangChainClient
    participant LLM as OpenAI/Gemini
    participant CartS as CartService
    participant DB as MongoDB

    U->>UI: "Add the Logitech MX Master to my cart"
    UI->>AS: handleAgentMessage()

    AS->>LC: chatCompletionWithTools(message, tools, history)
    LC->>LLM: POST /chat/completions
    LLM-->>LC: tool_calls: [{name: "add_to_cart", args: {itemId: "abc123", quantity: 1}}]
    LC-->>AS: {toolCalls: [...]}

    AS->>AS: executeTool("add_to_cart", {itemId, quantity})
    AS->>CartS: addItemToCart(userId, {itemId: "abc123", quantity: 1})

    CartS->>DB: items.findById("abc123")
    DB-->>CartS: item doc {name, price, status}
    CartS->>CartS: Validate item (active status)

    CartS->>DB: carts.findOne({userId})
    DB-->>CartS: cart doc or null

    alt Cart exists
        CartS->>CartS: Find existing item in cart
        alt Item already in cart
            CartS->>CartS: cart.items[i].quantity += 1
        else Item not in cart
            CartS->>CartS: cart.items.push({itemId, quantity: 1, ...})
        end
    else Cart does not exist
        CartS->>DB: carts.create({userId, items: [{...}]})
    end

    CartS->>CartS: Recalculate totalCost
    CartS->>DB: cart.save()
    DB-->>CartS: updated cart

    CartS-->>AS: {items: [...], totalCost: 129.99, itemCount: 1}
    AS->>AS: Format response with cart metadata
    AS->>DB: Save conversation
    AS-->>UI: "Added 1 × Logitech MX Master. Cart total: $129.99"
    UI-->>U: Display success message + updated cart view
```

---

## 3. Failure Scenario: Rate Limit Exceeded

### Sequence Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Chat UI
    participant AS as AgentService
    participant LC as LangChainClient
    participant LLM as OpenAI/Gemini

    U->>UI: "Show me laptops"
    UI->>AS: handleAgentMessage()
    AS->>LC: chatCompletionWithTools()
    LC->>LLM: POST /chat/completions

    alt Gemini Free Tier (15 RPM exceeded)
        LLM-->>LC: 429 Too Many Requests
        LC->>LC: catch (error) { check error.message }
        LC->>LC: error.message.includes('429') || error.message.includes('rate limit')
        LC-->>AS: throw Error('AI API rate limit exceeded...')
    else OpenAI Tier 1 (3.5K RPM exceeded)
        LLM-->>LC: 429 {error: {type: 'rate_limit_exceeded'}}
        LC-->>AS: throw Error('AI API rate limit exceeded...')
    end

    AS->>AS: catch (error) in generateAgentResponse()
    AS->>AS: error.message.includes('rate limit')
    AS-->>UI: {text: "⏳ I apologize, but the AI service is experiencing high demand..."}
    UI-->>U: Display error message

    Note over U,UI: ❌ NO RETRY - User must manually retry
    Note over LC,LLM: ❌ NO BACKOFF - Subsequent requests also fail
```

**Current Issues**:

- ❌ No automatic retry
- ❌ No exponential backoff
- ❌ No queueing (request is dropped)
- ❌ No circuit breaker (keeps hitting 429)

---

## 4. Failure Scenario: LLM Timeout

### Sequence Diagram

```mermaid
sequenceDiagram
    participant AS as AgentService
    participant LC as LangChainClient
    participant OpenAI as OpenAI API
    participant Gemini as Gemini API

    AS->>LC: chatCompletionWithTools()

    alt OpenAI (timeout = 30s)
        LC->>OpenAI: POST /chat/completions
        Note over OpenAI: Request takes 35s
        OpenAI-->>LC: ⏱️ TIMEOUT (30s limit)
        LC->>LC: catch (error) { error.message.includes('timeout') }
        LC-->>AS: throw Error('AI API request timed out...')
    else Gemini (no timeout configured)
        LC->>Gemini: POST /generateContent
        Note over Gemini: Request takes 120s
        Gemini-->>LC: Eventually responds (or Node.js default timeout ~2min)
        LC-->>AS: Response (after long wait)
    end

    AS->>AS: catch (error)
    AS-->>AS: {text: "⏱️ The request took too long to process..."}

    Note over AS,LC: ❌ NO RETRY - Timeout is permanent
    Note over LC,Gemini: ❌ Gemini has no timeout protection
```

---

## 5. Failure Scenario: Tool Execution Failure

### Sequence Diagram

```mermaid
sequenceDiagram
    participant AS as AgentService
    participant LLM as OpenAI/Gemini
    participant CS as CatalogService
    participant DB as MongoDB

    AS->>LLM: chatCompletionWithTools()
    LLM-->>AS: tool_calls: [{name: "search_catalog", args: {keyword: "nonexistent"}}]

    AS->>AS: executeTool("search_catalog", {keyword})
    AS->>CS: searchItems({q: "nonexistent", limit: 5})

    alt MongoDB text index missing
        CS->>DB: items.find({$text: {$search: "nonexistent"}})
        DB-->>CS: MongoError: text index required for $text query
        CS-->>AS: throw Error("Database error: text index missing")
        AS->>AS: catch (error) in executeTool()
        AS-->>AS: {text: "Error performing searches: Database error..."}
    else Search returns 0 results
        CS->>DB: items.find({$text: {$search: "nonexistent"}})
        DB-->>CS: []
        CS-->>AS: []
        AS->>AS: if (items.length === 0)
        AS-->>AS: {text: 'No items found matching "nonexistent". Try different keywords...'}
    end

    Note over AS,DB: ❌ NO FALLBACK - Error message returned to user
    Note over AS: ❌ NO LOGGING - Error not tracked
```

---

## 6. Multi-Tool Execution (Parallel Search)

### Sequence Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant AS as AgentService
    participant LLM as OpenAI/Gemini
    participant CS as CatalogService
    participant DB as MongoDB

    U->>AS: "Show me pens, pencils, and laptops"
    AS->>LLM: chatCompletionWithTools()
    LLM-->>AS: tool_calls: [<br/>  {name: "search_catalog", args: {keyword: "pens"}},<br/>  {name: "search_catalog", args: {keyword: "pencils"}},<br/>  {name: "search_catalog", args: {keyword: "laptops"}}<br/>]

    AS->>AS: Detect multiple search_catalog calls
    AS->>AS: Promise.all([search1, search2, search3])

    par Search pens
        AS->>CS: searchItems({q: "pens", limit: 3})
        CS->>DB: find({$text: {$search: "pens"}}).limit(3)
        DB-->>CS: [3 pen items]
        CS-->>AS: items[]
    and Search pencils
        AS->>CS: searchItems({q: "pencils", limit: 3})
        CS->>DB: find({$text: {$search: "pencils"}}).limit(3)
        DB-->>CS: [3 pencil items]
        CS-->>AS: items[]
    and Search laptops
        AS->>CS: searchItems({q: "laptops", limit: 3})
        CS->>DB: find({$text: {$search: "laptops"}}).limit(3)
        DB-->>CS: [3 laptop items]
        CS-->>AS: items[]
    end

    AS->>AS: Combine results (deduplicate by ID)
    AS->>AS: Truncate descriptions
    AS-->>U: "Found 9 total products across 3 searches (pens, pencils, laptops). Showing 9 results"

    Note over AS: ✅ Parallelization implemented
    Note over AS: ✅ Deduplication by item ID
```

---

## 7. Checkout Flow with Validation

### Sequence Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant AS as AgentService
    participant LLM as OpenAI/Gemini
    participant CheckS as CheckoutService
    participant CartS as CartService
    participant DB as MongoDB

    U->>AS: "Checkout my cart"
    AS->>LLM: chatCompletionWithTools()
    LLM-->>AS: tool_calls: [{name: "checkout", args: {notes: ""}}]

    AS->>AS: executeTool("checkout", {notes})
    AS->>CheckS: checkoutCart(userId, notes)

    CheckS->>CartS: getCartForUser(userId)
    CartS->>DB: carts.findOne({userId})
    DB-->>CartS: cart doc
    CartS-->>CheckS: cart {items: [...], totalCost: 129.99}

    alt Cart is empty
        CheckS->>CheckS: if (cart.items.length === 0)
        CheckS-->>AS: throw EmptyCartError("Cart is empty...")
        AS->>AS: catch (error)
        AS-->>U: "Error: Cart is empty. Add items before checkout."
    else Cart has items
        CheckS->>CheckS: Validate item availability
        loop For each cart item
            CheckS->>DB: items.findById(itemId)
            DB-->>CheckS: item {status, price}
            alt Item inactive
                CheckS-->>AS: throw ValidationError("Item X is no longer available")
            else Item active
                CheckS->>CheckS: Continue
            end
        end

        CheckS->>DB: purchase_requests.create({userId, items, totalCost, status: "pending"})
        DB-->>CheckS: purchaseRequest doc

        CheckS->>CartS: clearCart(userId)
        CartS->>DB: carts.deleteOne({userId})
        DB-->>CartS: deleted

        CheckS-->>AS: {id, items, totalCost, status: "pending"}
        AS-->>U: "✅ Checkout successful! Purchase request #PR001 created..."
    end
```

---

## 8. Error Recovery: Conversation Save Failure

### Sequence Diagram

```mermaid
sequenceDiagram
    participant AS as AgentService
    participant DB as MongoDB

    AS->>AS: generateAgentResponse() completes
    AS->>AS: conversation.messages.push(user msg)
    AS->>AS: conversation.messages.push(agent msg with metadata)
    AS->>AS: conversation.lastMessagePreview = agent msg

    AS->>DB: conversation.save()

    alt MongoDB connection lost
        DB-->>AS: MongoNetworkError: connection closed
        AS->>AS: catch (error)
        Note over AS: ⚠️ Agent response generated but NOT persisted
        AS-->>AS: throw Error("Failed to process agent message")
        Note over AS: ❌ User loses both user message AND agent response
    else Validation error
        DB-->>AS: ValidationError: messages exceeds max length
        AS->>AS: catch (error)
        AS-->>AS: throw Error("Failed to process agent message")
    else Success
        DB-->>AS: saved conversation doc
        AS-->>AS: Return AgentResponse
    end

    Note over AS,DB: ❌ NO RETRY for DB operations
    Note over AS: ❌ NO TRANSACTION (messages not atomic)
```

**Risk**: Agent response is discarded if save fails.

---

## Performance Metrics

| Flow                   | Avg Latency (p50) | p95 Latency | Bottleneck                         |
| ---------------------- | ----------------- | ----------- | ---------------------------------- |
| Search catalog         | ~2.5s             | ~4s         | LLM API call (1.5-3s)              |
| Add to cart            | ~2s               | ~3.5s       | LLM API call                       |
| View cart              | ~1.8s             | ~3s         | LLM API call (tool has no DB call) |
| Checkout               | ~2.2s             | ~3.8s       | LLM + validation + DB writes       |
| Multi-search (3 items) | ~3s               | ~5s         | LLM + parallel DB queries          |

**Notes**:

- LLM API call: 1.5-3s (OpenAI p50), 2-4s (Gemini p50)
- MongoDB text search: 50-200ms
- Network overhead: 100-300ms

---

## Retry & Error Handling Summary

| Scenario                   | Current Behavior                | Recommended                                |
| -------------------------- | ------------------------------- | ------------------------------------------ |
| LLM rate limit (429)       | ❌ Immediate error to user      | ✅ Retry with exponential backoff          |
| LLM timeout                | ❌ Immediate error to user      | ✅ Retry once, then fail                   |
| LLM quota exceeded         | ❌ Error to user                | ✅ Fallback to alternate provider (Gemini) |
| Tool execution failure     | ❌ Error message in chat        | ✅ Retry tool call, log error              |
| DB connection error        | ❌ Error to user, response lost | ✅ Retry with exponential backoff          |
| DB validation error        | ❌ Error to user                | ✅ Log error, return user-friendly message |
| MongoDB text index missing | ❌ Database error               | ✅ Graceful fallback to keyword search     |

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-10  
**Next Review**: After retry logic implementation
