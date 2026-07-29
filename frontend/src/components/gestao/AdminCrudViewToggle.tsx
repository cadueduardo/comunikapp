'use client';

import { Grid3X3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type AdminCrudViewMode = 'table' | 'cards';

interface AdminCrudViewToggleProps {
  value: AdminCrudViewMode;
  onChange: (value: AdminCrudViewMode) => void;
}

export function AdminCrudViewToggle({
  value,
  onChange,
}: AdminCrudViewToggleProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
      <Button
        type="button"
        variant={value === 'table' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onChange('table')}
        className="h-8 px-3"
      >
        <List className="mr-1 h-4 w-4" />
        Tabela
      </Button>
      <Button
        type="button"
        variant={value === 'cards' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onChange('cards')}
        className="h-8 px-3"
      >
        <Grid3X3 className="mr-1 h-4 w-4" />
        Cards
      </Button>
    </div>
  );
}
