import type { Metadata } from 'next';

import { SettingsPageContent } from '@/features/settings/components/SettingsPageContent';

export const metadata: Metadata = {
  title: 'Settings - ProcureFlow',
  description: 'Manage your account settings and preferences',
};

export default async function SettingsPage() {
  return (
    <div className='container mx-auto max-w-7xl'>
      <div className='p-3 sm:p-4 md:p-6 lg:p-8'>
        <SettingsPageContent />
      </div>
    </div>
  );
}
