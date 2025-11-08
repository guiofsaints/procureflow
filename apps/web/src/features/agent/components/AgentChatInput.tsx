/**
 * AgentChatInput Component
 *
 * Input bar for sending messages to the agent.
 * Simple, rounded design inspired by modern AI chat interfaces.
 */

'use client';

import { Loader2, Send } from 'lucide-react';
import { KeyboardEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AgentChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
}

export function AgentChatInput({
  onSend,
  isLoading = false,
}: AgentChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !isLoading) {
      onSend(trimmedMessage);
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className='border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80'>
      <div className='mx-auto max-w-4xl p-4'>
        <div className='flex gap-2'>
          {/* Input field */}
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Ask a question or make a request...'
            disabled={isLoading}
            className='h-12 rounded-full px-6 text-base'
          />

          {/* Send button */}
          <Button
            onClick={handleSend}
            disabled={!message.trim() || isLoading}
            size='icon'
            className='h-12 w-12 shrink-0 rounded-full'
          >
            {isLoading ? (
              <Loader2 className='h-5 w-5 animate-spin' />
            ) : (
              <Send className='h-5 w-5' />
            )}
            <span className='sr-only'>Send message</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
