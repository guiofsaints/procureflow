'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { TokenUsageAnalytics } from '@/domain/entities';

/**
 * TokenUsageCharts component
 * Displays comprehensive token usage analytics with professional charts
 * - Line chart for cost over time
 * - Pie chart for provider distribution
 * - Bar chart for model comparison
 * - Summary cards and top conversations
 */

const COLORS = [
  'hsl(293 70% 65%)', // Purple - lighter for dark mode
  'hsl(260 70% 70%)', // Blue-purple - lighter
  'hsl(200 80% 60%)', // Cyan - vibrant
  'hsl(150 70% 55%)', // Green - lighter
  'hsl(40 95% 65%)', // Gold/Yellow - brighter
];

export function TokenUsageCharts() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<TokenUsageAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/settings/analytics');
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || 'Failed to fetch analytics');
        }
        const data = await res.json();
        if (mounted) {
          setAnalytics(data.analytics);
        }
      } catch (err) {
        console.error('Error loading analytics:', err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <Card className='py-6'>
        <CardHeader>
          <CardTitle>Token Usage Analytics</CardTitle>
        </CardHeader>
        <CardContent>Loading analytics…</CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className='py-6'>
        <CardHeader>
          <CardTitle>Token Usage Analytics</CardTitle>
        </CardHeader>
        <CardContent className='text-destructive'>
          Error loading analytics: {error}
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card className='py-6'>
        <CardHeader>
          <CardTitle>Token Usage Analytics</CardTitle>
        </CardHeader>
        <CardContent>No analytics available</CardContent>
      </Card>
    );
  }

  const summary = analytics.summary;

  // Check if there's no data at all
  if (summary.requestCount === 0) {
    return (
      <Card className='py-6'>
        <CardHeader>
          <CardTitle>Token Usage Analytics</CardTitle>
        </CardHeader>
        <CardContent className='py-12'>
          <div className='text-center space-y-4'>
            <div className='text-muted-foreground'>
              <svg
                className='mx-auto h-12 w-12 text-muted-foreground/50'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={1.5}
                  d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                />
              </svg>
            </div>
            <div>
              <h3 className='text-lg font-semibold'>No Token Usage Data Yet</h3>
              <p className='text-sm text-muted-foreground mt-2'>
                Start using the AI Agent to generate analytics data.
              </p>
              <p className='text-sm text-muted-foreground mt-1'>
                Token usage will be tracked automatically as you interact with
                the agent.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Summary Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card className='py-6'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Total Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              ${summary.totalCost.toFixed(4)}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              ${summary.averageCostPerRequest.toFixed(6)} per request
            </p>
          </CardContent>
        </Card>

        <Card className='py-6'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Total Tokens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {summary.totalTokens.toLocaleString()}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              {Math.round(summary.averageTokensPerRequest)} avg per request
            </p>
          </CardContent>
        </Card>

        <Card className='py-6'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Prompt Tokens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {summary.totalPromptTokens.toLocaleString()}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              {summary.totalTokens > 0
                ? (
                    (summary.totalPromptTokens / summary.totalTokens) *
                    100
                  ).toFixed(1)
                : 0}
              % of total
            </p>
          </CardContent>
        </Card>

        <Card className='py-6'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{summary.requestCount}</div>
            <p className='text-xs text-muted-foreground mt-1'>
              {summary.totalCompletionTokens.toLocaleString()} completion tokens
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Cost Over Time - Line Chart */}
      {analytics.timeSeries.length > 0 && (
        <Card className='py-6'>
          <CardHeader>
            <CardTitle>Cost Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width='100%' height={300}>
              <LineChart data={analytics.timeSeries}>
                <CartesianGrid
                  strokeDasharray='3 3'
                  stroke='hsl(var(--border))'
                  opacity={0.3}
                />
                <XAxis
                  dataKey='date'
                  tick={{ fill: '#888888', fontSize: 12 }}
                  stroke='#888888'
                />
                <YAxis
                  tick={{ fill: '#888888', fontSize: 12 }}
                  tickFormatter={(value) => `$${value.toFixed(4)}`}
                  stroke='#888888'
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    color: 'hsl(var(--popover-foreground))',
                  }}
                  formatter={(value: number) => [
                    `$${value.toFixed(4)}`,
                    'Cost',
                  ]}
                />
                <Legend />
                <Line
                  type='monotone'
                  dataKey='cost'
                  stroke='hsl(293 70% 65%)'
                  strokeWidth={2}
                  dot={{ fill: 'hsl(293 70% 65%)' }}
                  name='Cost (USD)'
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Provider Distribution - Pie Chart and Bar Chart */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        {analytics.byProvider.length > 0 && (
          <Card className='py-6'>
            <CardHeader>
              <CardTitle>Provider Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width='100%' height={300}>
                <PieChart>
                  <Pie
                    data={analytics.byProvider.map((p) => ({
                      name: p.provider,
                      value: p.cost,
                    }))}
                    cx='50%'
                    cy='50%'
                    label
                    outerRadius={80}
                    fill='#8884d8'
                    dataKey='value'
                  >
                    {analytics.byProvider.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      color: 'hsl(var(--popover-foreground))',
                    }}
                    formatter={(value: number) => `$${value.toFixed(4)}`}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {analytics.byModel.length > 0 && (
          <Card className='py-6'>
            <CardHeader>
              <CardTitle>Cost by Model</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width='100%' height={300}>
                <BarChart data={analytics.byModel.slice(0, 5)}>
                  <CartesianGrid
                    strokeDasharray='3 3'
                    stroke='hsl(var(--border))'
                    opacity={0.3}
                  />
                  <XAxis
                    dataKey='model'
                    tick={{ fill: '#888888', fontSize: 12 }}
                    stroke='#888888'
                  />
                  <YAxis
                    tick={{ fill: '#888888', fontSize: 12 }}
                    tickFormatter={(value) => `$${value.toFixed(4)}`}
                    stroke='#888888'
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      color: 'hsl(var(--popover-foreground))',
                    }}
                    formatter={(value: number) => [
                      `$${value.toFixed(4)}`,
                      'Cost',
                    ]}
                  />
                  <Bar dataKey='cost' fill='hsl(260 70% 70%)' />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top Conversations */}
      {analytics.topConversations.length > 0 && (
        <Card className='py-6'>
          <CardHeader>
            <CardTitle>Top Conversations by Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {analytics.topConversations.map((conv, index) => (
                <div
                  key={conv.conversationId}
                  className='flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors'
                >
                  <div className='flex items-center gap-3 flex-1 min-w-0'>
                    <div className='flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm'>
                      {index + 1}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='text-sm font-medium truncate'>
                        Conversation {conv.conversationId.slice(-8)}
                      </div>
                      <div className='text-xs text-muted-foreground'>
                        {conv.tokens.toLocaleString()} tokens • {conv.requests}{' '}
                        requests
                      </div>
                    </div>
                  </div>
                  <div className='text-right'>
                    <div className='font-semibold'>${conv.cost.toFixed(4)}</div>
                    <div className='text-xs text-muted-foreground'>
                      ${(conv.cost / conv.requests).toFixed(6)}/req
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Model Details Table */}
      {analytics.byModel.length > 0 && (
        <Card className='py-6'>
          <CardHeader>
            <CardTitle>Model Usage Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='overflow-x-auto'>
              <table className='w-full text-sm'>
                <thead>
                  <tr className='border-b'>
                    <th className='text-left p-2 font-medium'>Provider</th>
                    <th className='text-left p-2 font-medium'>Model</th>
                    <th className='text-right p-2 font-medium'>Tokens</th>
                    <th className='text-right p-2 font-medium'>Requests</th>
                    <th className='text-right p-2 font-medium'>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.byModel.map((model, index) => (
                    <tr
                      key={`${model.provider}-${model.model}-${index}`}
                      className='border-b last:border-0'
                    >
                      <td className='p-2'>{model.provider}</td>
                      <td className='p-2 font-mono text-xs'>{model.model}</td>
                      <td className='p-2 text-right'>
                        {model.tokens.toLocaleString()}
                      </td>
                      <td className='p-2 text-right'>{model.requests}</td>
                      <td className='p-2 text-right font-semibold'>
                        ${model.cost.toFixed(4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
