'use client';

import React from 'react';

interface CrudPageProps<T> {
  header: React.ReactNode;
  toolbar?: React.ReactNode;
  table: React.ReactNode;
  emptyState?: React.ReactNode;
}

export function CrudPage<T>({ header, toolbar, table, emptyState }: CrudPageProps<T>) {
  return (
    <div className="p-6 space-y-6">
      {header}
      {toolbar && <div>{toolbar}</div>}
      <div>{table || emptyState}</div>
    </div>
  );
}


