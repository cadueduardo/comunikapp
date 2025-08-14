'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import React from 'react';

interface PageHeaderProps {
  title: string;
  backHref?: string;
  icon?: React.ReactNode;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, backHref, icon, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        {backHref && (
          <Link href={backHref}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
        )}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            {icon}
            {title}
          </h1>
          {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}


