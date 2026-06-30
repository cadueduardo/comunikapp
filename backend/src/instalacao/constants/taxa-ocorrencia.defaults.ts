import { TipoOcorrencia } from '@prisma/client';

export interface TaxaOcorrenciaDefault {
  tipo: TipoOcorrencia;
  custo_padrao: number;
  preco_padrao: number;
}

/**
 * Taxas padrão aplicadas na criação da loja (seeder idempotente).
 * VISITA_IMPRODUTIVA segue o exemplo da especificação (R$ 250,00 repasse ao cliente).
 */
export const TAXAS_OCORRENCIA_PADRAO: TaxaOcorrenciaDefault[] = [
  {
    tipo: TipoOcorrencia.VISITA_IMPRODUTIVA,
    custo_padrao: 150,
    preco_padrao: 250,
  },
  {
    tipo: TipoOcorrencia.MATERIAL_EXTRA,
    custo_padrao: 0,
    preco_padrao: 0,
  },
  {
    tipo: TipoOcorrencia.SERVICO_ADICIONAL,
    custo_padrao: 0,
    preco_padrao: 0,
  },
  {
    tipo: TipoOcorrencia.RETRABALHO,
    custo_padrao: 0,
    preco_padrao: 0,
  },
];
