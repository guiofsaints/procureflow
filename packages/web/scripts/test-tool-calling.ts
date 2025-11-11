/**
 * Standalone Tool Calling Test
 * 
 * Tests OpenAI function calling with the providerAdapter
 * Run with: pnpm tsx scripts/test-tool-calling.ts
 * 
 * Note: Requires OPENAI_API_KEY and AI_PROVIDER env vars
 */

import { HumanMessage } from '@langchain/core/messages';

import { invokeChat } from '../src/lib/ai/providerAdapter';

const SEARCH_TOOL = {
  name: 'search_catalog',
  description: 'Search for products in the catalog by keyword. Returns matching items with details.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query or keyword (e.g., "laptop", "office supplies")',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return (default: 10)',
      },
    },
    required: ['query'],
  },
};

async function testToolCalling() {
  console.warn('\n========================================');
  console.warn('🔬 Tool Calling Test Started');
  console.warn('========================================\n');

  try {
    const messages = [
      new HumanMessage('Find me laptops under $500'),
    ];

    console.warn('📤 Sending request to LLM with tools...');
    console.warn('Messages:', messages.map(m => ({ role: m._getType(), content: m.content })));
    console.warn('Tools:', [SEARCH_TOOL]);

    const result = await invokeChat({
      messages,
      tools: [SEARCH_TOOL],
    });

    console.warn('\n✅ Response received!');
    console.warn('========================================');
    console.warn('Response:', JSON.stringify(result, null, 2));
    console.warn('========================================\n');

    if (result.toolCalls && result.toolCalls.length > 0) {
      console.warn('✅ SUCCESS: Tool calls detected!');
      console.warn('Tool Calls:', result.toolCalls);
    } else {
      console.warn('❌ PROBLEM: No tool calls in response');
      console.warn('Content:', result.content);
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error);
  }

  console.warn('\n========================================');
  console.warn('🔬 Tool Calling Test Complete');
  console.warn('========================================\n');
}

testToolCalling();
