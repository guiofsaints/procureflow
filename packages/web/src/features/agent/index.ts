/**
 * Agent Feature
 * AI-powered procurement assistant with conversational interface
 */

// Types
export type {
  AgentCart,
  AgentCartItem,
  AgentConversationSummary,
  AgentItem,
  AgentMessage,
  AgentPurchaseRequest,
  AgentRole,
} from './types';

// Mock data and logic
export { mockItems } from './mocks/mockItems';
export {
  findMockItems,
  generateMockAgentResponse,
  parseUserMessage,
} from './mocks/mockAgent';

// Components (client-safe)
export { AgentCartView } from './components/AgentCartView';
export { AgentChatPageContent } from './components/AgentChatPageContent';
export { AgentChatInput } from './components/AgentChatInput';
export { AgentChatMessages } from './components/AgentChatMessages';
export { AgentCheckoutButton } from './components/AgentCheckoutButton';
export { AgentCheckoutPrompt } from './components/AgentCheckoutPrompt';
export { AgentConversationHistoryList } from './components/AgentConversationHistoryList';
export { AgentProductCard } from './components/AgentProductCard';
export { AgentProductCarousel } from './components/AgentProductCarousel';
export { AgentPurchaseRequestCard } from './components/AgentPurchaseRequestCard';
export { AgentWelcome } from './components/AgentWelcome';

// NOTE: Service functions (agent.service.ts) are NOT exported here
// because they import Node.js-only dependencies (prometheus, mongoose, etc.)
// Import them directly in server-side code:
// import { handleAgentMessage } from '@/features/agent/lib/agent.service';
