# LangChain - Evaluation & Testing Strategy

**Document Version**: 1.0  
**Date**: 2025-11-10  
**Scope**: Test methodology for prompt quality, tool reliability, and LLM behavior determinism

---

## Executive Summary

**Problem**: LLM-based systems are non-deterministic and difficult to test with traditional unit tests. Prompt changes can silently degrade performance.

**Solution**: Multi-layered testing strategy:

1. **Golden Test Sets** - Regression tests for prompt changes (accuracy, tool calling)
2. **Deterministic Mocks** - Seed-controlled LLM responses for unit tests
3. **Load Tests** - Throughput and latency under production traffic
4. **Chaos Tests** - Fault injection (API failures, timeouts, rate limits)
5. **Quality Gates** - Automated checks before deployment (95% tool accuracy, <3s p95 latency)

**Current State**: ❌ **No testing** - only manual QA  
**Target State**: ✅ Automated test suite covering prompt quality, tool execution, performance

---

## Test Strategy Matrix

| Test Layer        | Tool                       | Coverage          | Frequency  | Target               |
| ----------------- | -------------------------- | ----------------- | ---------- | -------------------- |
| Prompt Evaluation | Golden Sets + LangSmith    | 50 test cases     | Per commit | 95% accuracy         |
| Unit Tests        | Jest + Deterministic Mocks | Service layer     | Per commit | 80% coverage         |
| Integration Tests | Jest + Real MongoDB        | API routes        | Daily      | 100% endpoints       |
| Load Tests        | Artillery + k6             | Full stack        | Weekly     | 100 req/min          |
| Chaos Tests       | Custom fault injection     | Provider failures | Weekly     | 0 cascading failures |

---

## 1. Golden Test Sets (Prompt Evaluation)

### Purpose

Validate that prompt changes don't break existing behavior. Catch regressions before deployment.

### Methodology

#### A. Build Golden Test Set

Capture 50+ real user queries with expected outcomes:

```json
{
  "test_cases": [
    {
      "id": "catalog-001",
      "user_message": "Find laptops under $1000",
      "expected_tools": ["search_catalog"],
      "expected_args": {
        "query": "laptops",
        "filters": {
          "maxPrice": 1000
        }
      },
      "expected_response_contains": ["laptop", "price", "$"]
    },
    {
      "id": "cart-001",
      "user_message": "Add 3 Dell Latitude laptops to my cart",
      "expected_tools": ["search_catalog", "add_to_cart"],
      "expected_sequence": ["search_catalog", "add_to_cart"],
      "expected_args": {
        "search_catalog": { "query": "Dell Latitude" },
        "add_to_cart": { "quantity": 3 }
      }
    },
    {
      "id": "checkout-001",
      "user_message": "Proceed to checkout with standard shipping",
      "expected_tools": ["view_cart", "checkout"],
      "expected_args": {
        "checkout": {
          "deliverySpeed": "standard"
        }
      }
    }
  ]
}
```

#### B. Evaluation Script

Location: `packages/web/scripts/eval-golden-set.ts`

```typescript
import { handleAgentMessage } from '@/features/agent';
import * as fs from 'fs';

interface GoldenTestCase {
  id: string;
  user_message: string;
  expected_tools: string[];
  expected_args?: Record<string, any>;
  expected_response_contains?: string[];
  expected_sequence?: string[];
}

interface EvalResult {
  test_id: string;
  passed: boolean;
  actual_tools: string[];
  tool_match: boolean;
  args_match: boolean;
  response_match: boolean;
  errors: string[];
}

async function evalGoldenSet(): Promise<void> {
  const testCases: GoldenTestCase[] = JSON.parse(
    fs.readFileSync('scripts/golden-set.json', 'utf-8')
  ).test_cases;

  const results: EvalResult[] = [];

  for (const testCase of testCases) {
    console.log(`\n[${testCase.id}] Testing: "${testCase.user_message}"`);

    // Create test conversation
    const conversationId = 'test-' + testCase.id;

    // Execute agent
    const response = await handleAgentMessage({
      conversationId,
      userId: 'test-user',
      message: testCase.user_message,
    });

    // Extract tool calls
    const actualTools = response.metadata?.tools_called || [];

    // Validate tool names
    const toolMatch =
      JSON.stringify(actualTools.sort()) ===
      JSON.stringify(testCase.expected_tools.sort());

    // Validate arguments (if specified)
    let argsMatch = true;
    if (testCase.expected_args) {
      // Compare actual vs expected args (deep equality)
      argsMatch = deepEqual(
        response.metadata?.tool_args,
        testCase.expected_args
      );
    }

    // Validate response text
    let responseMatch = true;
    if (testCase.expected_response_contains) {
      responseMatch = testCase.expected_response_contains.every((keyword) =>
        response.content.toLowerCase().includes(keyword.toLowerCase())
      );
    }

    const passed = toolMatch && argsMatch && responseMatch;

    results.push({
      test_id: testCase.id,
      passed,
      actual_tools: actualTools,
      tool_match: toolMatch,
      args_match: argsMatch,
      response_match: responseMatch,
      errors: passed
        ? []
        : [
            !toolMatch
              ? `Expected tools ${testCase.expected_tools}, got ${actualTools}`
              : '',
            !argsMatch ? 'Tool arguments mismatch' : '',
            !responseMatch ? 'Response content mismatch' : '',
          ].filter(Boolean),
    });

    console.log(passed ? '✅ PASS' : '❌ FAIL');
    if (!passed) console.log('Errors:', results[results.length - 1].errors);
  }

  // Generate report
  const passRate =
    (results.filter((r) => r.passed).length / results.length) * 100;

  console.log('\n========================================');
  console.log(`GOLDEN SET EVALUATION RESULTS`);
  console.log(`========================================`);
  console.log(`Pass Rate: ${passRate.toFixed(1)}%`);
  console.log(
    `Passed: ${results.filter((r) => r.passed).length}/${results.length}`
  );

  // Save report
  fs.writeFileSync(
    'scripts/eval-report.json',
    JSON.stringify({ passRate, results }, null, 2)
  );

  // Exit with failure if below 95% threshold
  if (passRate < 95) {
    console.error('\n❌ Evaluation failed: Pass rate below 95% threshold');
    process.exit(1);
  }
}

evalGoldenSet().catch(console.error);
```

#### C. CI Integration

Add to GitHub Actions (`.github/workflows/test.yml`):

```yaml
name: Test
on: [push, pull_request]

jobs:
  golden-set-eval:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm docker:up -d # Start MongoDB
      - run: pnpm --filter web db:seed-office-items # Seed test data
      - run: pnpm --filter web eval:golden-set # Run evaluation
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          MONGODB_URI: mongodb://localhost:27017/procureflow
      - uses: actions/upload-artifact@v3
        with:
          name: eval-report
          path: packages/web/scripts/eval-report.json
```

---

## 2. Deterministic LLM Mocks

### Purpose

Enable fast, predictable unit tests without calling real LLM APIs.

### Implementation

#### A. Mock LLM with Seed Control

Location: `packages/web/__tests__/mocks/mockLLM.ts`

```typescript
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AIMessage } from '@langchain/core/messages';
import { seedrandom } from 'seedrandom';

export class MockChatModel extends BaseChatModel {
  seed: string;
  responses: string[];
  callIndex = 0;

  constructor(options: { seed: string; responses: string[] }) {
    super({});
    this.seed = options.seed;
    this.responses = options.responses;
  }

  _llmType(): string {
    return 'mock';
  }

  async _generate(messages: any[]): Promise<any> {
    // Deterministic "randomness" based on seed
    const rng = seedrandom(this.seed + this.callIndex);

    // Cycle through predefined responses
    const response = this.responses[this.callIndex % this.responses.length];
    this.callIndex++;

    // Simulate latency (deterministic based on seed)
    const delay = Math.floor(rng() * 100) + 50; // 50-150ms
    await new Promise((resolve) => setTimeout(resolve, delay));

    return {
      generations: [
        {
          text: response,
          message: new AIMessage({ content: response }),
        },
      ],
    };
  }

  // Function calling mock
  async _generateWithTools(messages: any[], tools: any[]): Promise<any> {
    const rng = seedrandom(this.seed + this.callIndex);
    this.callIndex++;

    // Predefined tool calls for test scenarios
    if (messages[0].content.includes('laptops')) {
      return {
        generations: [
          {
            message: new AIMessage({
              content: '',
              additional_kwargs: {
                function_call: {
                  name: 'search_catalog',
                  arguments: JSON.stringify({ query: 'laptops', limit: 5 }),
                },
              },
            }),
          },
        ],
      };
    }

    // Default response
    return this._generate(messages);
  }
}
```

#### B. Unit Test Example

Location: `packages/web/__tests__/features/agent/agent.service.test.ts`

```typescript
import { handleAgentMessage } from '@/features/agent';
import { MockChatModel } from '../../mocks/mockLLM';

jest.mock('@/lib/ai/langchainClient', () => ({
  chatCompletionWithTools: jest.fn(),
}));

describe('Agent Service - Tool Calling', () => {
  beforeEach(() => {
    // Reset mock
    jest.clearAllMocks();
  });

  it('should call search_catalog for laptop query', async () => {
    const mockLLM = new MockChatModel({
      seed: 'test-seed-123',
      responses: ['I found 5 laptops for you.'],
    });

    // Mock LLM to return search_catalog tool call
    (chatCompletionWithTools as jest.Mock).mockResolvedValueOnce({
      content: '',
      additional_kwargs: {
        function_call: {
          name: 'search_catalog',
          arguments: JSON.stringify({ query: 'laptops', limit: 5 }),
        },
      },
    });

    const response = await handleAgentMessage({
      conversationId: 'test-conv',
      userId: 'test-user',
      message: 'Find laptops under $1000',
    });

    expect(chatCompletionWithTools).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({ content: 'Find laptops under $1000' }),
        ]),
        tools: expect.arrayContaining([
          expect.objectContaining({ name: 'search_catalog' }),
        ]),
      })
    );

    expect(response.metadata?.tools_called).toContain('search_catalog');
  });

  it('should handle rate limit errors gracefully', async () => {
    (chatCompletionWithTools as jest.Mock).mockRejectedValueOnce(
      new Error('Rate limit exceeded (429)')
    );

    await expect(
      handleAgentMessage({
        conversationId: 'test-conv',
        userId: 'test-user',
        message: 'Find laptops',
      })
    ).rejects.toThrow('Rate limit exceeded');
  });
});
```

---

## 3. Load Testing

### Purpose

Validate system can handle production traffic (target: 100 concurrent users, 1000 req/min).

### Implementation

#### A. Artillery Test Script

Location: `packages/web/tests/load/agent-chat.yml`

```yaml
config:
  target: http://localhost:3000
  phases:
    - duration: 60
      arrivalRate: 10 # 10 users/sec = 600 users/min
      name: Warm-up
    - duration: 300
      arrivalRate: 16 # 16 users/sec = 1000 users/min
      name: Sustained load
    - duration: 60
      arrivalRate: 50 # 50 users/sec = 3000 users/min
      name: Spike test
  processor: './processor.js'

scenarios:
  - name: Agent chat interaction
    flow:
      - post:
          url: /api/auth/signin
          json:
            email: demo@procureflow.com
            password: demo123
          capture:
            - json: $.token
              as: authToken

      - post:
          url: /api/agent/message
          headers:
            Authorization: 'Bearer {{ authToken }}'
          json:
            conversationId: '{{ $randomString() }}'
            message: "{{ pickRandom(['Find laptops under $1000', 'Show me office chairs', 'Add 5 notebooks to cart']) }}"
          capture:
            - json: $.conversationId
              as: conversationId

      - think: 2 # User reads response for 2 seconds

      - post:
          url: /api/agent/message
          headers:
            Authorization: 'Bearer {{ authToken }}'
          json:
            conversationId: '{{ conversationId }}'
            message: 'Add 2 of the first item to my cart'
```

#### B. Processor (Random Data)

Location: `packages/web/tests/load/processor.js`

```javascript
module.exports = {
  pickRandom: (items) => items[Math.floor(Math.random() * items.length)],
};
```

#### C. Run Load Test

```bash
pnpm artillery run tests/load/agent-chat.yml --output load-report.json
pnpm artillery report load-report.json
```

#### D. Success Criteria

- **Throughput**: ≥1000 req/min
- **Latency p95**: <3s
- **Latency p99**: <5s
- **Error Rate**: <1%

---

## 4. Chaos Testing (Fault Injection)

### Purpose

Validate system resilience under failure scenarios (API outages, timeouts, rate limits).

### Test Scenarios

#### A. Scenario 1: OpenAI Rate Limit (429)

```typescript
// packages/web/__tests__/chaos/rate-limit.test.ts
import { handleAgentMessage } from '@/features/agent';
import { chatCompletionWithTools } from '@/lib/ai/langchainClient';

jest.mock('@/lib/ai/langchainClient');

describe('Chaos: Rate Limit Handling', () => {
  it('should fail fast with 429 error', async () => {
    (chatCompletionWithTools as jest.Mock).mockRejectedValueOnce({
      status: 429,
      message: 'Rate limit exceeded',
    });

    const startTime = Date.now();

    await expect(
      handleAgentMessage({
        conversationId: 'test',
        userId: 'test-user',
        message: 'Find laptops',
      })
    ).rejects.toThrow('Rate limit exceeded');

    const elapsed = Date.now() - startTime;

    // Should fail fast (<500ms), not retry for minutes
    expect(elapsed).toBeLessThan(500);
  });
});
```

#### B. Scenario 2: LLM API Timeout

```typescript
describe('Chaos: LLM Timeout', () => {
  it('should timeout after 30s', async () => {
    (chatCompletionWithTools as jest.Mock).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(resolve, 60000)) // 60s delay
    );

    await expect(
      handleAgentMessage({
        conversationId: 'test',
        userId: 'test-user',
        message: 'Find laptops',
      })
    ).rejects.toThrow('Request timeout');
  });
});
```

#### C. Scenario 3: MongoDB Connection Loss

```typescript
describe('Chaos: Database Failure', () => {
  it('should return error without crashing', async () => {
    jest
      .spyOn(AgentConversationModel, 'findOne')
      .mockRejectedValueOnce(new Error('Connection lost'));

    await expect(
      handleAgentMessage({
        conversationId: 'test',
        userId: 'test-user',
        message: 'Find laptops',
      })
    ).rejects.toThrow('Database error');

    // System should still be running (no uncaught exception)
    expect(process.exitCode).toBeUndefined();
  });
});
```

#### D. Scenario 4: Partial Tool Failure

```typescript
describe('Chaos: Tool Execution Failure', () => {
  it('should handle search_catalog failure gracefully', async () => {
    jest
      .spyOn(catalogService, 'searchItems')
      .mockRejectedValueOnce(new Error('Elasticsearch unavailable'));

    (chatCompletionWithTools as jest.Mock).mockResolvedValueOnce({
      content: '',
      additional_kwargs: {
        function_call: {
          name: 'search_catalog',
          arguments: JSON.stringify({ query: 'laptops' }),
        },
      },
    });

    const response = await handleAgentMessage({
      conversationId: 'test',
      userId: 'test-user',
      message: 'Find laptops',
    });

    expect(response.content).toContain('search is temporarily unavailable');
    expect(response.metadata?.errors).toContainEqual(
      expect.objectContaining({ tool: 'search_catalog' })
    );
  });
});
```

---

## 5. Quality Gates (Pre-Deployment Checks)

### Automated Checks Before Merge

#### A. GitHub Actions Workflow

Location: `.github/workflows/quality-gates.yml`

```yaml
name: Quality Gates
on: pull_request

jobs:
  prompt-eval:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: pnpm install
      - run: pnpm --filter web eval:golden-set
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
      - name: Check pass rate
        run: |
          PASS_RATE=$(jq '.passRate' scripts/eval-report.json)
          if (( $(echo "$PASS_RATE < 95" | bc -l) )); then
            echo "❌ Golden set pass rate: $PASS_RATE% (threshold: 95%)"
            exit 1
          fi
          echo "✅ Golden set pass rate: $PASS_RATE%"

  latency-check:
    runs-on: ubuntu-latest
    steps:
      - run: pnpm artillery quick --count 100 --num 10 http://localhost:3000/api/agent/message
      - name: Check p95 latency
        run: |
          P95=$(jq '.aggregate.latency.p95' artillery-report.json)
          if (( $(echo "$P95 > 3000" | bc -l) )); then
            echo "❌ p95 latency: ${P95}ms (threshold: 3000ms)"
            exit 1
          fi

  token-cost-check:
    runs-on: ubuntu-latest
    steps:
      - run: pnpm --filter web test:token-cost
      - name: Check average cost per request
        run: |
          AVG_COST=$(jq '.averageCostPerRequest' token-cost-report.json)
          if (( $(echo "$AVG_COST > 0.005" | bc -l) )); then
            echo "❌ Avg cost: \$$AVG_COST (threshold: \$0.005)"
            exit 1
          fi
```

#### B. Quality Gate Thresholds

| Metric                  | Threshold  | Action if Failed |
| ----------------------- | ---------- | ---------------- |
| Golden set pass rate    | ≥95%       | Block merge      |
| Unit test coverage      | ≥80%       | Block merge      |
| p95 latency             | <3s        | Block merge      |
| Error rate              | <1%        | Block merge      |
| Avg cost per request    | <$0.005    | Warning only     |
| Token usage per request | <5K tokens | Warning only     |

---

## 6. LangSmith Integration (Observability)

### Purpose

Debug failed test cases by tracing LLM calls, tool executions, and prompt templates.

### Setup

#### A. Enable Tracing in Tests

```typescript
// packages/web/__tests__/setup.ts
process.env.LANGCHAIN_TRACING_V2 = 'true';
process.env.LANGCHAIN_PROJECT = 'procureflow-tests';
process.env.LANGCHAIN_API_KEY = process.env.LANGSMITH_API_KEY;
```

#### B. Query Failed Traces

```typescript
import { Client } from 'langsmith';

const client = new Client();

async function analyzeFailedTests() {
  const runs = await client.listRuns({
    projectName: 'procureflow-tests',
    filter: 'eq(error, true)',
    limit: 50,
  });

  for (const run of runs) {
    console.log(`Failed Run: ${run.id}`);
    console.log(`Input: ${run.inputs.messages[0].content}`);
    console.log(`Error: ${run.error}`);
    console.log(`Trace: https://smith.langchain.com/o/runs/${run.id}`);
  }
}
```

---

## 7. Test Data Management

### Seed Data for Tests

Location: `packages/web/scripts/seed-test-data.ts`

```typescript
import { connectDB } from '@/lib/db/mongoose';
import { ItemModel } from '@/lib/db/models';

export async function seedTestData(): Promise<void> {
  await connectDB();

  // Delete existing test data
  await ItemModel.deleteMany({ name: /^TEST-/ });

  // Insert predictable test items
  await ItemModel.insertMany([
    {
      name: 'TEST-Laptop-001',
      description: 'Dell Latitude 5420 laptop',
      price: 899,
      category: 'Electronics',
      sku: 'LAPTOP-001',
    },
    {
      name: 'TEST-Chair-001',
      description: 'Ergonomic office chair',
      price: 299,
      category: 'Furniture',
      sku: 'CHAIR-001',
    },
    // ... 50+ test items
  ]);

  console.log('✅ Test data seeded');
}
```

---

## 8. Continuous Evaluation (Production)

### A. Sample 1% of Production Traffic

```typescript
// features/agent/lib/agent.service.ts
import { Client } from 'langsmith';

const langsmithClient = new Client();

export async function handleAgentMessage(params: HandleAgentMessageParams) {
  // ... existing logic

  // Sample 1% of production requests for evaluation
  if (Math.random() < 0.01) {
    await langsmithClient.createRun({
      name: 'production-sample',
      run_type: 'chain',
      inputs: { message: params.message },
      outputs: { response: response.content },
      project_name: 'procureflow-prod-samples',
    });
  }

  return response;
}
```

### B. Weekly Evaluation Report

```bash
pnpm eval:prod-samples --start-date 2025-11-03 --end-date 2025-11-10
```

Output:

- Pass rate for production samples
- Most common failure patterns
- Avg latency, token usage, cost
- Recommended prompt improvements

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2, 16 hours)

1. ✅ Create golden test set (50 cases) - 6 hours
2. ✅ Build evaluation script - 4 hours
3. ✅ Add GitHub Actions workflow - 2 hours
4. ✅ Create deterministic LLM mock - 4 hours

### Phase 2: Load & Chaos (Week 3-4, 12 hours)

5. ✅ Setup Artillery load tests - 4 hours
6. ✅ Write chaos test scenarios - 6 hours
7. ✅ Add quality gates to CI - 2 hours

### Phase 3: Production Monitoring (Week 5-6, 8 hours)

8. ✅ Enable LangSmith tracing - 2 hours
9. ✅ Production sampling (1%) - 3 hours
10. ✅ Weekly evaluation reports - 3 hours

**Total Effort**: 36 hours (~1 sprint)

---

## Success Metrics

| Metric                      | Baseline | Target       | Timeline |
| --------------------------- | -------- | ------------ | -------- |
| Prompt regression detection | 0%       | 95%          | 30 days  |
| Unit test coverage          | 0%       | 80%          | 30 days  |
| Load test throughput        | Unknown  | 1000 req/min | 60 days  |
| Production pass rate        | Unknown  | 98%          | 90 days  |
| Mean time to debug          | 2 hours  | 15 minutes   | 60 days  |

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-10  
**Owner**: QA + Backend Team
