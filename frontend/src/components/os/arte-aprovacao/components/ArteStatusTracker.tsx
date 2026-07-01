'use client';

import { cn } from '@/lib/utils';

const ETAPAS_EMPRESA = [
  { status: 'AGUARDANDO_INICIO', label: 'Na fila' },
  { status: 'EM_CRIACAO', label: 'Em criação' },
  { status: 'AGUARDANDO_CLIENTE', label: 'Com cliente' },
  { status: 'REVISAO_SOLICITADA', label: 'Revisão' },
  { status: 'APROVADA', label: 'Aprovada' },
  { status: 'LIBERADA_PCP', label: 'Liberada' },
] as const;

const ORDEM_CLIENTE: Record<string, number> = {
  AGUARDANDO_ARQUIVO_CLIENTE: 0,
  ARQUIVO_RECEBIDO: 1,
  EM_CRIACAO: 1,
  APROVADA: 2,
  LIBERADA_PCP: 2,
};

const ORDEM_EMPRESA: Record<string, number> = {
  AGUARDANDO_INICIO: 0,
  EM_CRIACAO: 1,
  AGUARDANDO_CLIENTE: 2,
  REVISAO_SOLICITADA: 3,
  APROVADA: 4,
  LIBERADA_PCP: 5,
};

interface ArteStatusTrackerProps {
  statusArte: string;
  responsabilidadeArte: string;
  className?: string;
}

export function ArteStatusTracker({
  statusArte,
  responsabilidadeArte,
  className,
}: ArteStatusTrackerProps) {
  const clienteFornece = responsabilidadeArte === 'CLIENTE_FORNECE';
  const etapasEmpresa = ETAPAS_EMPRESA;
  const etapasCliente = [
    { status: 'AGUARDANDO_ARQUIVO_CLIENTE', label: 'Aguardando' },
    { status: 'ARQUIVO_RECEBIDO', label: 'Preflight' },
    { status: 'LIBERADA_PCP', label: 'Liberada' },
  ] as const;
  const etapas = clienteFornece ? etapasCliente : etapasEmpresa;

  const indiceAtual = clienteFornece
    ? (ORDEM_CLIENTE[statusArte] ?? -1)
    : (ORDEM_EMPRESA[statusArte] ?? -1);

  if (statusArte === 'NAO_APLICA' || responsabilidadeArte === 'NAO_APLICAVEL') {
    return null;
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center gap-0.5">
        {etapas.map((etapa, index) => {
          const concluido = indiceAtual >= 0 && index < indiceAtual;
          const atual = indiceAtual >= 0 && index === indiceAtual;

          return (
            <div key={etapa.status} className="flex flex-1 min-w-0 items-center">
              <div className="flex flex-col items-center flex-1 min-w-0">
                <div
                  className={cn(
                    'h-2 w-full rounded-full transition-colors',
                    concluido && 'bg-green-500',
                    atual && 'bg-blue-500 ring-2 ring-blue-200',
                    !concluido && !atual && 'bg-muted',
                  )}
                  title={etapa.label}
                />
                <span
                  className={cn(
                    'text-[9px] mt-1 truncate w-full text-center leading-tight',
                    atual ? 'font-semibold text-blue-700' : 'text-muted-foreground',
                  )}
                >
                  {etapa.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
