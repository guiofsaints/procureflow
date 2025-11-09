import { getServerSession } from 'next-auth';

import { AgentChatPageContent } from '@/features/agent/components/AgentChatPageContent';
import { authConfig } from '@/lib/auth/config';

/**
 * Agent Chat page with Conversation ID - Server Component
 * Displays a specific conversation from the history
 */
export default async function AgentConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const session = await getServerSession(authConfig);
  const { conversationId } = await params;

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

  return (
    // Fullscreen layout - takes full height of Main, prevents scrolling on Main
    <div className='absolute inset-0 flex flex-col'>
      <AgentChatPageContent
        userName={getUserFirstName()}
        conversationId={conversationId}
      />
    </div>
  );
}
