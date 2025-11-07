import type { AgentMessage } from '@/domain/entities';
import { AgentMessageRole } from '@/domain/entities';

/**
 * Mock agent conversation messages for UI development
 * Replace with actual conversation state from API later
 */
export const mockMessages: AgentMessage[] = [
  {
    role: AgentMessageRole.System,
    content:
      'Welcome to ProcureFlow AI Assistant! How can I help you with procurement today?',
    timestamp: new Date('2024-01-15T10:00:00'),
  },
  {
    role: AgentMessageRole.User,
    content: 'I need to find a good laptop for software development',
    timestamp: new Date('2024-01-15T10:01:00'),
  },
  {
    role: AgentMessageRole.Assistant,
    content:
      'I can help you find a suitable laptop for software development. Based on our catalog, I recommend the Dell XPS 15. It features a high-performance Intel i7 processor, 16GB RAM, and 512GB SSD - perfect for development work. Would you like me to add it to your cart?',
    timestamp: new Date('2024-01-15T10:01:30'),
  },
  {
    role: AgentMessageRole.User,
    content: 'Yes, that sounds good. Also, I need a mechanical keyboard.',
    timestamp: new Date('2024-01-15T10:02:00'),
  },
  {
    role: AgentMessageRole.Assistant,
    content:
      "Great! I've added the Dell XPS 15 to your cart. For mechanical keyboards, we have an RGB mechanical keyboard with Cherry MX switches available for $149.99. Would you like me to add that as well?",
    timestamp: new Date('2024-01-15T10:02:30'),
  },
];
