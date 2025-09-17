'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, LayoutGrid } from 'lucide-react';

interface ViewToggleProps {
  viewMode: 'table' | 'cards';
  onViewModeChange: (mode: 'table' | 'cards') => void;
  className?: string;
}

export function ViewToggle({ viewMode, onViewModeChange, className = '' }: ViewToggleProps) {
  return (
    <div className={`flex items-center gap-1 bg-gray-100 rounded-lg p-1 ${className}`}>
      <Button
        variant={viewMode === 'table' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('table')}
        className="h-8 px-3"
      >
        <Table className="h-4 w-4 mr-1" />
        Tabela
      </Button>
      <Button
        variant={viewMode === 'cards' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('cards')}
        className="h-8 px-3"
      >
        <LayoutGrid className="h-4 w-4 mr-1" />
        Cards
      </Button>
    </div>
  );
}
