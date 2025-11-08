import { Plus } from 'lucide-react';

import { Button } from '@/components';

import { useCatalog } from './catalog-provider';

export function CatalogPrimaryButtons() {
  const { setOpen } = useCatalog();

  return (
    <Button className='space-x-1' onClick={() => setOpen('create')}>
      <span>Create</span> <Plus size={18} />
    </Button>
  );
}
