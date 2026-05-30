'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { IconRoute } from '@tabler/icons-react';

export interface WorkflowCardInfoProps {
  workflowId?: string;
  workflowNome?: string;
  setoresNomes?: string[];
  compact?: boolean;
}

export function WorkflowCardInfo({
  workflowId,
  workflowNome,
  setoresNomes = [],
  compact = false,
}: WorkflowCardInfoProps) {
  if (!workflowNome) {
    return null;
  }

  const setoresTexto =
    setoresNomes.length > 0 ? setoresNomes.join(' → ') : 'Sem setores vinculados';

  return (
    <div
      className={`rounded-md border border-slate-200 bg-slate-50/80 ${
        compact ? 'px-2 py-1.5' : 'px-2.5 py-2'
      }`}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      role="presentation"
    >
      <div className="flex flex-wrap items-center gap-2">
        <IconRoute className="h-3.5 w-3.5 text-slate-600" />
        <span className={`font-medium text-slate-800 ${compact ? 'text-[11px]' : 'text-xs'}`}>
          Workflow:
        </span>
        {workflowId ? (
          <Link
            href={`/pcp/workflows/${workflowId}`}
            className={`text-blue-700 hover:underline ${compact ? 'text-[11px]' : 'text-xs'}`}
            onClick={(event) => event.stopPropagation()}
          >
            {workflowNome}
          </Link>
        ) : (
          <span className={`text-slate-800 ${compact ? 'text-[11px]' : 'text-xs'}`}>
            {workflowNome}
          </span>
        )}
      </div>
      <p
        className={`mt-1 text-slate-600 ${compact ? 'text-[10px] leading-snug' : 'text-[11px] leading-snug'}`}
      >
        Fluxo: {setoresTexto}
      </p>
      {setoresNomes.length === 0 && workflowId ? (
        <Link
          href={`/pcp/workflows/${workflowId}`}
          className="mt-1 inline-block"
          onClick={(event) => event.stopPropagation()}
        >
          <Badge
            variant="outline"
            className="cursor-pointer text-[10px] text-amber-800 border-amber-300 hover:bg-amber-50"
          >
            Configure setores no workflow
          </Badge>
        </Link>
      ) : setoresNomes.length === 0 ? (
        <Badge variant="outline" className="mt-1 text-[10px] text-amber-800 border-amber-300">
          Configure setores no workflow
        </Badge>
      ) : null}
    </div>
  );
}
