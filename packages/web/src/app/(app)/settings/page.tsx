import type { Metadata } from 'next';

import { SettingsPageContent } from '@/features/settings/components/SettingsPageContent';

export const metadata: Metadata = {
  title: 'Settings - ProcureFlow',
  description: 'Manage your account settings and preferences',
};

export default async function SettingsPage() {
  return (
    <div className='container mx-auto p-6 max-w-7xl'>
      <SettingsPageContent />
    </div>
  );
}
