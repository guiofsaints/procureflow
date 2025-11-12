/**
 * AgentWelcome Component
 *
 * Welcome screen with suggested prompts for the agent chat.
 */

'use client';

import {
  CalendarCheck,
  Database,
  FileBarChart,
  Landmark,
  LayoutDashboard,
  Package,
  RefreshCcw,
  TrendingUp,
} from 'lucide-react';

import { Card } from '@/components/ui/card';

interface AgentWelcomeProps {
  onPromptClick: (prompt: string) => void;
  userName?: string;
}

const suggestedPrompts = [
  {
    icon: Database,
    text: 'Find 10 USB-C cables under $30 each',
  },
  {
    icon: Package,
    text: 'Show me ergonomic keyboards',
  },
  {
    icon: Landmark,
    text: 'I need office furniture for my desk',
  },
  {
    icon: CalendarCheck,
    text: 'Find wireless mice under $40',
  },
  {
    icon: RefreshCcw,
    text: 'Show me laptop stands',
  },
  {
    icon: FileBarChart,
    text: 'I need monitor accessories',
  },
  {
    icon: TrendingUp,
    text: 'Find desk lamps with adjustable brightness',
  },
  {
    icon: LayoutDashboard,
    text: 'Show me all electronics under $50',
  },
];

export function AgentWelcome({
  onPromptClick,
  userName = 'there',
}: AgentWelcomeProps) {
  return (
    <div className='flex h-full flex-col items-center justify-center px-4 py-8'>
      <div className='w-full max-w-4xl space-y-8'>
        {/* Header */}
        <div className='text-center'>
          <h1 className='text-4xl font-bold tracking-tight'>Hi, {userName}</h1>
          <p className='mt-4 text-xl text-muted-foreground'>
            What can I help you with?
          </p>
          <p className='mt-2 text-sm text-muted-foreground'>
            Choose a prompt below or write your own to start chatting with the
            procurement assistant.
          </p>
        </div>

        {/* Suggested Prompts Grid */}
        <div className='grid gap-2 sm:gap-3 sm:grid-cols-2'>
          {suggestedPrompts.map((prompt, index) => {
            const Icon = prompt.icon;
            return (
              <Card
                key={index}
                className='group cursor-pointer transition-all hover:border-primary hover:shadow-md active:scale-[0.98]'
                onClick={() => onPromptClick(prompt.text)}
              >
                <div className='h-auto w-full justify-start gap-2 sm:gap-3 p-3 sm:p-4 text-left font-normal flex min-h-[3rem]'>
                  <Icon className='h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary' />
                  <span className='text-xs sm:text-sm leading-snug'>
                    {prompt.text}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
