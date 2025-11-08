import { getServerSession } from 'next-auth';

import { AgentChatPageContent } from '@/features/agent/components/AgentChatPageContent';
import { authConfig } from '@/lib/auth/config';

/**
 * Agent Chat page - Server Component
 * Displays the AI agent chat interface
 */
export default async function AgentPage() {
  const session = await getServerSession(authConfig);

  // Extract first name from user name or email
  const getUserFirstName = () => {
    if (session?.user?.name) {
      return session.user.name.split(' ')[0];
    }
    if (session?.user?.email) {
      return session.user.email.split('@')[0];
    }
    return 'there';
  };

  return <AgentChatPageContent userName={getUserFirstName()} />;
}
