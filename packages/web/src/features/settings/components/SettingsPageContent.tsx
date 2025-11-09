'use client';

import { Loader2, MessageSquare, Moon, Sun, Trash2, User } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ConversationSummary } from '@/features/settings';

/**
 * SettingsPageContent component
 * Displays user settings with tabs for Profile, Theme, and Conversations
 */
export function SettingsPageContent() {
  const { data: session, update: updateSession } = useSession();
  const { theme, setTheme } = useTheme();
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isDeletingConversations, setIsDeletingConversations] = useState(false);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [conversationsLoaded, setConversationsLoaded] = useState(false);
  const [name, setName] = useState(session?.user?.name || '');

  // Load conversations when tab is activated
  const handleLoadConversations = async () => {
    if (conversationsLoaded) {
      return;
    }

    try {
      const response = await fetch('/api/settings/conversations');
      if (!response.ok) {
        throw new Error('Failed to load conversations');
      }
      const data = await response.json();
      setConversations(data.conversations || []);
      setConversationsLoaded(true);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Failed to load conversations');
    }
  };

  // Update user name
  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    setIsUpdatingName(true);

    try {
      const response = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update name');
      }

      const data = await response.json();

      // Update session with new user data
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          name: data.user.name,
        },
      });

      toast.success('Name updated successfully');
    } catch (error) {
      console.error('Error updating name:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update name');
    } finally {
      setIsUpdatingName(false);
    }
  };

  // Delete a single conversation
  const handleDeleteConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/settings/conversations/${conversationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete conversation');
      }

      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      toast.success('Conversation deleted');

      // Trigger conversation list refresh in sidebar
      window.dispatchEvent(new Event('conversationUpdated'));
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation');
    }
  };

  // Delete all conversations
  const handleDeleteAllConversations = async () => {
    setIsDeletingConversations(true);

    try {
      const response = await fetch('/api/settings/conversations', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete conversations');
      }

      const data = await response.json();
      setConversations([]);
      toast.success(`Deleted ${data.count} conversation${data.count === 1 ? '' : 's'}`);

      // Trigger conversation list refresh in sidebar
      window.dispatchEvent(new Event('conversationUpdated'));
    } catch (error) {
      console.error('Error deleting conversations:', error);
      toast.error('Failed to delete conversations');
    } finally {
      setIsDeletingConversations(false);
    }
  };

  return (
    <div>
      <div>
        <h1 className='text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2 sm:gap-3'>
          <span>Settings</span>
        </h1>
        <p className='mt-2 text-sm sm:text-base text-muted-foreground'>
          Manage your account settings and preferences
        </p>
      </div>

      <Separator className='mt-10' />

      <Tabs defaultValue="profile" className="space-y-6 mt-2">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="theme">
            {theme === 'dark' ? (
              <Moon className="h-4 w-4 mr-2" />
            ) : (
              <Sun className="h-4 w-4 mr-2" />
            )}
            Theme
          </TabsTrigger>
          <TabsTrigger value="conversations" onClick={handleLoadConversations}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Conversations
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card className='py-6'>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleUpdateName} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={session?.user?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>

                <Button type="submit" disabled={isUpdatingName}>
                  {isUpdatingName && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Theme Tab */}
        <TabsContent value="theme" className="space-y-4">
          <Card className='py-6'>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how the application looks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="flex gap-4">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    onClick={() => setTheme('light')}
                    className="flex-1"
                  >
                    <Sun className="h-4 w-4 mr-2" />
                    Light
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    onClick={() => setTheme('dark')}
                    className="flex-1"
                  >
                    <Moon className="h-4 w-4 mr-2" />
                    Dark
                  </Button>
                  <Button
                    variant={theme === 'system' ? 'default' : 'outline'}
                    onClick={() => setTheme('system')}
                    className="flex-1"
                  >
                    System
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Select your preferred theme. Changes apply immediately.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conversations Tab */}
        <TabsContent value="conversations" className="space-y-4">
          <Card className='py-6'>
            <CardHeader>
              <CardTitle>Conversation History</CardTitle>
              <CardDescription>
                View and manage your AI agent conversations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {conversations.length > 0 ? (
                <>
                  <div className="space-y-2">
                    {conversations.map((conv) => (
                      <div
                        key={conv.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="text-sm font-medium truncate">
                            {conv.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {conv.lastMessagePreview}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {conv.messageCount} message{conv.messageCount === 1 ? '' : 's'} •{' '}
                            {new Date(conv.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteConversation(conv.id)}
                          className="ml-2"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        disabled={isDeletingConversations}
                        className="w-full"
                      >
                        {isDeletingConversations && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete All Conversations
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete all of your
                          conversations and remove the data from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAllConversations}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete All
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No conversations yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
