import type { PrismaService } from '../../prisma/prisma.service';
import { StatusExpedicao } from '../../expedicao/enums/status-expedicao.enum';
import type { StatusPrazoResponse } from '../dto/os-prazo.dto';

const STATUS_PRODUCAO_OS = new Set([
  'PRODUCAO',
  'EM_WORKFLOW',
  'ACABAMENTO',
]);

const EXPEDICAO_ATIVA = new Set<string>([
  StatusExpedicao.AGUARDANDO_SEPARACAO,
  StatusExpedicao.PRONTO_PARA_RETIRADA,
  StatusExpedicao.EM_ROTA_DE_ENTREGA,
  StatusExpedicao.AGUARDANDO_INSTALACAO,
  StatusExpedicao.AGUARDANDO_FECHAMENTO,
]);

const MENSAGEM_EXPEDICAO: Record<string, string> = {
  [StatusExpedicao.AGUARDANDO_SEPARACAO]: 'Em expedição — aguardando separação',
  [StatusExpedicao.PRONTO_PARA_RETIRADA]: 'Em expedição — pronto para retirada',
  [StatusExpedicao.EM_ROTA_DE_ENTREGA]: 'Em expedição — em rota de entrega',
  [StatusExpedicao.AGUARDANDO_INSTALACAO]:
    'Em expedição — aguardando instalação',
  [StatusExpedicao.AGUARDANDO_FECHAMENTO]:
    'Expedição aguardando fechamento financeiro',
};

export interface ContextoOperacionalOs {
  statusOs: string;
  statusInstalacaoOs: string | null;
  statusExpedicao: string | null;
  lotesEmAndamento: number;
  lotesAguardando: number;
  lotesTotal: number;
}

export async function carregarContextoOperacionalOs(
  prisma: PrismaService,
  osId: string,
  lojaId: string,
): Promise<ContextoOperacionalOs> {
  const [os, lotes, expedicao] = await Promise.all([
    prisma.ordemServico.findFirst({
      where: { id: osId, loja_id: lojaId },
      select: {
        status: true,
        status_instalacao_os: true,
      },
    }),
    prisma.itemOSInstalacao.findMany({
      where: {
        loja_id: lojaId,
        item_os: { os_id: osId },
      },
      select: { status_instalacao: true },
    }),
    prisma.expedicaoLogistica.findFirst({
      where: {
        loja_id: lojaId,
        os_id: osId,
        status: { not: StatusExpedicao.DEVOLVIDA },
      },
      orderBy: { atualizado_em: 'desc' },
      select: { status: true },
    }),
  ]);

  return {
    statusOs: os?.status ?? '',
    statusInstalacaoOs: os?.status_instalacao_os ?? null,
    statusExpedicao: expedicao?.status ?? null,
    lotesEmAndamento: lotes.filter((l) => l.status_instalacao === 'EM_ANDAMENTO')
      .length,
    lotesAguardando: lotes.filter((l) => l.status_instalacao === 'AGUARDANDO')
      .length,
    lotesTotal: lotes.length,
  };
}

function calcularDiasRestantes(dataPrazo: Date): {
  diasRestantes: number;
  isRetroativo: boolean;
} {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const prazo = new Date(dataPrazo);
  prazo.setHours(0, 0, 0, 0);
  const diff = prazo.getTime() - hoje.getTime();
  return {
    diasRestantes: Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24))),
    isRetroativo: prazo < hoje,
  };
}

/**
 * Quando há atividade operacional (PCP, expedição ou instalação), a mensagem
 * de prazo não deve indicar "aguardando início" só porque a data é futura.
 */
export function resolverStatusPrazoOperacional(
  ctx: ContextoOperacionalOs,
  dataPrazo: Date | null | undefined,
): Pick<
  StatusPrazoResponse,
  'status' | 'mensagem' | 'dias_restantes' | 'is_retroativo'
> | null {
  const { diasRestantes, isRetroativo } = dataPrazo
    ? calcularDiasRestantes(dataPrazo)
    : { diasRestantes: undefined, isRetroativo: false };

  if (ctx.statusInstalacaoOs === 'EM_ANDAMENTO' || ctx.lotesEmAndamento > 0) {
    return {
      status: 'EM_PRODUCAO',
      mensagem: 'Instalação em andamento no campo',
      dias_restantes: diasRestantes,
      is_retroativo: isRetroativo,
    };
  }

  if (ctx.statusInstalacaoOs === 'AGUARDANDO_RELATORIO_TECNICO') {
    return {
      status: 'EM_PRODUCAO',
      mensagem:
        'Instalação concluída — aguardando relatório técnico no financeiro',
      dias_restantes: diasRestantes,
      is_retroativo: isRetroativo,
    };
  }

  if (
    ctx.statusExpedicao &&
    EXPEDICAO_ATIVA.has(ctx.statusExpedicao) &&
    ctx.statusExpedicao !== StatusExpedicao.ENTREGUE_FINALIZADO
  ) {
    return {
      status: 'EM_PRODUCAO',
      mensagem:
        MENSAGEM_EXPEDICAO[ctx.statusExpedicao] ?? 'Em expedição',
      dias_restantes: diasRestantes,
      is_retroativo: isRetroativo,
    };
  }

  if (ctx.lotesTotal > 0 && ctx.lotesAguardando > 0) {
    return {
      status: 'EM_PRODUCAO',
      mensagem: `Instalação agendada (${ctx.lotesAguardando} lote(s) aguardando visita)`,
      dias_restantes: diasRestantes,
      is_retroativo: isRetroativo,
    };
  }

  if (STATUS_PRODUCAO_OS.has(ctx.statusOs)) {
    return {
      status: 'EM_PRODUCAO',
      mensagem: 'Produção em andamento',
      dias_restantes: diasRestantes,
      is_retroativo: isRetroativo,
    };
  }

  return null;
}
