'use client';

import { Info, ExternalLink } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface InfoWithExamplesProps {
  children: React.ReactNode;
  tooltipContent: string;
  onShowExamples: () => void;
  className?: string;
}

export function InfoWithExamples({ children, tooltipContent, onShowExamples, className = "" }: InfoWithExamplesProps) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <Popover>
        <PopoverTrigger asChild>
          <div className="inline-flex items-center gap-1 cursor-help">
            {children}
            <Info className="h-4 w-4 text-muted-foreground" />
          </div>
        </PopoverTrigger>
        <PopoverContent className="max-w-sm">
          <p className="text-sm">{tooltipContent}</p>
        </PopoverContent>
      </Popover>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onShowExamples}
        className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
      >
        Exemplos
        <ExternalLink className="h-3 w-3 ml-1" />
      </Button>
    </div>
  );
} 