'use client';

import { Info } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface InfoTooltipProps {
  children: React.ReactNode;
  content: string;
  className?: string;
}

export function InfoTooltip({ children, content, className = "" }: InfoTooltipProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className={`inline-flex items-center gap-1 cursor-help ${className}`}>
          {children}
          <Info className="h-4 w-4 text-muted-foreground" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="max-w-sm">
        <p className="text-sm">{content}</p>
      </PopoverContent>
    </Popover>
  );
} 