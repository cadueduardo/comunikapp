import { cliente_status_cliente } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * Escopos de carteira (RP §5.2.1 / Fase 4).
 * - `propria`: cliente é responsável comercial OU participante.
 * - `equipe`: sem hierarquia explícita — todos os usuários `usuario_funcao.VENDAS`
 *   ativos da mesma loja, como responsáveis OU participantes (ver
 *   `ClientesService.listarIdsEquipeVendas`).
 * - `todos`: toda a carteira da loja.
 * - `sem_responsavel`: clientes sem `responsavel_comercial_id`.
 */
export const ESCOPOS_CARTEIRA_CLIENTE = [
  'propria',
  'equipe',
  'todos',
  'sem_responsavel',
] as const;

export type EscopoCarteiraCliente = (typeof ESCOPOS_CARTEIRA_CLIENTE)[number];

export const CAMPOS_ORDENACAO_CLIENTE = [
  'nome',
  'criado_em',
  'atualizado_em',
  'responsavel_desde',
] as const;

export type CampoOrdenacaoCliente = (typeof CAMPOS_ORDENACAO_CLIENTE)[number];

const PAGE_SIZE_MAXIMO = 100;
const PAGE_SIZE_PADRAO = 20;

export class ListarClientesQueryDto {
  /** Default aplicado pelo service quando ausente: `propria` (menor privilégio). */
  @IsOptional()
  @IsIn(ESCOPOS_CARTEIRA_CLIENTE)
  escopo?: EscopoCarteiraCliente;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsIn(Object.values(cliente_status_cliente))
  status?: cliente_status_cliente;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) =>
    value === undefined || value === '' ? undefined : value === 'true' || value === true,
  )
  ativo?: boolean;

  @IsOptional()
  @IsIn(CAMPOS_ORDENACAO_CLIENTE)
  orderBy?: CampoOrdenacaoCliente;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  orderDir?: 'asc' | 'desc';

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(PAGE_SIZE_MAXIMO)
  pageSize?: number = PAGE_SIZE_PADRAO;

  /**
   * Compatibilidade com consumidores antigos que esperam array puro em
   * `GET /clientes` (dual-read). Quando `'1'`, a resposta ignora
   * `page`/`pageSize` e retorna até 200 registros, sempre com o mesmo filtro
   * de escopo e permissão do modo paginado.
   */
  @IsOptional()
  @IsIn(['1'])
  legado?: string;
}
