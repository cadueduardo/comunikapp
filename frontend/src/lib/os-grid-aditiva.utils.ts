import type { OrdemServico } from '@/app/(main)/os/columns';

export const TIPO_VINCULO_OS_ADITIVA_INSTALACAO = 'ADITIVA_INSTALACAO';

export type ModoGridOs = 'agrupado' | 'plano';

export interface LinhaGridOs {
  os: OrdemServico;
  depth: number;
  tipo: 'mae' | 'filha';
  podeExpandir: boolean;
  expandida: boolean;
}

export type OrdemServicoGridRow = OrdemServico & {
  __grid?: LinhaGridOs;
};

export function isOsAditivaInstalacao(
  os: Pick<OrdemServico, 'tipo_vinculo_os'>,
): boolean {
  return os.tipo_vinculo_os === TIPO_VINCULO_OS_ADITIVA_INSTALACAO;
}

function correspondeBusca(os: OrdemServico, termo: string): boolean {
  if (!termo) return true;
  const t = termo.toLowerCase();
  return (
    os.numero.toLowerCase().includes(t) ||
    os.nome_servico.toLowerCase().includes(t) ||
    (os.cliente_nome?.toLowerCase().includes(t) ?? false)
  );
}

function correspondeStatus(os: OrdemServico, statusFilter: string): boolean {
  return !statusFilter || os.status === statusFilter;
}

export function filtrarOrdensParaGrid(
  ordens: OrdemServico[],
  searchTerm: string,
  statusFilter: string,
  modo: ModoGridOs,
): OrdemServico[] {
  if (modo === 'plano') {
    return ordens.filter(
      (os) => correspondeBusca(os, searchTerm) && correspondeStatus(os, statusFilter),
    );
  }

  return ordens
    .filter((os) => !isOsAditivaInstalacao(os))
    .filter((os) => {
      const filhas = os.aditivas_filhas ?? [];
      const matchPropria =
        correspondeBusca(os, searchTerm) && correspondeStatus(os, statusFilter);
      if (matchPropria) return true;
      return filhas.some(
        (filha) =>
          correspondeBusca(filha, searchTerm) &&
          correspondeStatus(filha, statusFilter),
      );
    });
}

export function montarLinhasGridOs(
  ordens: OrdemServico[],
  opts: { modo: ModoGridOs; expandedIds: Set<string> },
): OrdemServicoGridRow[] {
  const linhas: OrdemServicoGridRow[] = [];

  if (opts.modo === 'plano') {
    for (const os of ordens) {
      linhas.push({
        ...os,
        __grid: {
          os,
          depth: isOsAditivaInstalacao(os) ? 1 : 0,
          tipo: isOsAditivaInstalacao(os) ? 'filha' : 'mae',
          podeExpandir: false,
          expandida: false,
        },
      });
    }
    return linhas;
  }

  for (const os of ordens) {
    if (isOsAditivaInstalacao(os)) {
      continue;
    }

    const filhas = os.aditivas_filhas ?? [];
    const temFilhas = filhas.length > 0;
    const expandida = opts.expandedIds.has(os.id);

    linhas.push({
      ...os,
      __grid: {
        os,
        depth: 0,
        tipo: 'mae',
        podeExpandir: temFilhas,
        expandida,
      },
    });

    if (temFilhas && expandida) {
      for (const filha of filhas) {
        linhas.push({
          ...filha,
          __grid: {
            os: filha,
            depth: 1,
            tipo: 'filha',
            podeExpandir: false,
            expandida: false,
          },
        });
      }
    }
  }

  return linhas;
}

export function formatarMoedaBrl(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
