/**
 * Agent Feature
 * AI-powered procurement assistant with conversational interface
 */

// Types
export type {
  AgentConversationSummary,
  AgentItem,
  AgentMessage,
  AgentRole,
} from './types';

// Mock data and logic
export { mockItems } from './mocks/mockItems';
export {
  findMockItems,
  generateMockAgentResponse,
  parseUserMessage,
} from './mocks/mockAgent';

// Components
export { AgentChatPageContent } from './components/AgentChatPageContent';
export { AgentChatInput } from './components/AgentChatInput';
export { AgentChatMessages } from './components/AgentChatMessages';
export { AgentConversationHistoryList } from './components/AgentConversationHistoryList';
export { AgentProductCard } from './components/AgentProductCard';
export { AgentWelcome } from './components/AgentWelcome';

// Legacy exports (keeping for backward compatibility)
export * from './lib/agent.service';
export { MessageBubble } from './components/MessageBubble';
export { mockMessages } from './mock';
