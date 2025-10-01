import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrdemServicoData, EstoqueValidacaoDetalhe, ParametrosTecnicos, InsumoCalculado, StatusOS } from '../interfaces/os.interfaces';

export class OrdemServicoResponseDto implements OrdemServicoData {
  @ApiProperty({ description: 'ID interno da OS', example: 'cuid_os_123' })
  id!: string;

  @ApiProperty({ description: 'N�mero rastre�vel da OS', example: 'OS-2025-001' })
  numero!: string;

  @ApiProperty({ description: 'ID da loja propriet�ria da OS', example: 'cuid_loja_123' })
  loja_id!: string;

  @ApiProperty({ description: 'ID do cliente vinculado', example: 'cuid_cliente_123' })
  cliente_id!: string;

  @ApiPropertyOptional({ description: 'ID do or�amento de origem', example: 'cuid_orc_123' })
  orcamento_id?: string;

  @ApiProperty({ description: 'Data de abertura da OS' })
  data_abertura!: Date;

  @ApiPropertyOptional({ description: 'Prazo estimado para conclus�o' })
  data_prazo?: Date;

  @ApiProperty({ description: 'Status atual da OS', example: 'FILA' })
  status!: StatusOS;

  @ApiPropertyOptional({ description: 'ID do respons�vel atual' })
  responsavel_id?: string;

  @ApiPropertyOptional({ description: 'Observa��es gerais registradas na OS' })
  observacoes?: string;

  @ApiProperty({ description: 'Nome do servi�o/produto solicitado' })
  nome_servico!: string;

  @ApiPropertyOptional({ description: 'Descri��o detalhada do servi�o/produto' })
  descricao?: string;

  @ApiProperty({ description: 'Quantidade solicitada', example: 2 })
  quantidade!: number;

  @ApiPropertyOptional({ description: 'Par�metros t�cnicos associados (JSON)' })
  parametros_tecnicos?: ParametrosTecnicos;

  @ApiPropertyOptional({ description: 'Lista de insumos calculados (JSON)' })
  insumos_calculados?: InsumoCalculado[];

  @ApiProperty({ description: 'Indica se os materiais est�o dispon�veis' })
  materiais_disponivel!: boolean;

  @ApiProperty({ description: 'Data de cria��o no banco' })
  criado_em!: Date;

  @ApiProperty({ description: 'Data da �ltima atualiza��o no banco' })
  atualizado_em!: Date;

  @ApiPropertyOptional({ description: 'Alertas retornados pela valida��o de estoque', type: [String] })
  alertas_estoque?: string[];

  @ApiPropertyOptional({ description: 'Recomenda��es retornadas pela valida��o de estoque', type: [String] })
  recomendacoes_estoque?: string[];

  @ApiPropertyOptional({
    description: 'Detalhes consolidados da valida��o de estoque',
    type: () => OrdemServicoEstoqueDetalheDto,
  })
  detalhes_estoque?: EstoqueValidacaoDetalhe[];

  // Novos campos para OS Direta/Interna
  @ApiPropertyOptional({ description: 'Tipo da OS (COMERCIAL ou INTERNA)' })
  tipo_os?: string;

  @ApiPropertyOptional({ description: 'Origem da OS (ORCAMENTO, DIRETA, INTERNA)' })
  origem_os?: string;

  @ApiPropertyOptional({ description: 'Prioridade da OS (URGENTE, ALTA, NORMAL, BAIXA)' })
  prioridade?: string;

  @ApiPropertyOptional({ description: 'Departamento solicitante (para OS Interna)' })
  departamento_solicitante?: string;

  @ApiPropertyOptional({ description: 'Centro de custo (para OS Interna)' })
  centro_custo?: string;

  @ApiPropertyOptional({ description: 'Projeto interno (para OS Interna)' })
  projeto_interno?: string;

  @ApiPropertyOptional({ description: 'Status de aprovação gerencial (para OS Interna)' })
  aprovacao_gerencial?: string;

  @ApiPropertyOptional({ description: 'Usuário que aprovou gerencialmente' })
  aprovacao_gerencial_por?: string;

  @ApiPropertyOptional({ description: 'Data da aprovação gerencial' })
  aprovacao_gerencial_em?: Date;

  @ApiPropertyOptional({ description: 'Observações da aprovação gerencial' })
  aprovacao_gerencial_obs?: string;

  @ApiPropertyOptional({ description: 'Valor orçado (para OS Comercial)' })
  valor_orcado?: number;

  @ApiPropertyOptional({ description: 'Valor realizado (para OS Comercial)' })
  valor_realizado?: number;

  @ApiPropertyOptional({ description: 'Margem de lucro real (para OS Comercial)' })
  margem_lucro_real?: number;

  @ApiPropertyOptional({ description: 'Data de entrega ao cliente' })
  data_entrega_cliente?: Date;

  @ApiPropertyOptional({ description: 'Satisfação do cliente (1-5)' })
  satisfacao_cliente?: number;

  @ApiPropertyOptional({ description: 'Observações do cliente' })
  observacoes_cliente?: string;

  @ApiPropertyOptional({ description: 'Usuário que criou a OS' })
  criado_por?: string;

  @ApiPropertyOptional({ description: 'Usuário que modificou por último' })
  modificado_por?: string;

  @ApiPropertyOptional({ description: 'Motivo da última modificação' })
  motivo_modificacao?: string;

  @ApiPropertyOptional({ description: 'Versão da OS' })
  versao?: number;

  @ApiPropertyOptional({ description: 'Status de aprovação técnica (para OS Comercial)' })
  aprovacao_tecnica_status?: string;

  @ApiPropertyOptional({ description: 'Usuário que aprovou tecnicamente' })
  aprovacao_tecnica_por?: string;

  @ApiPropertyOptional({ description: 'Data da aprovação técnica' })
  aprovacao_tecnica_em?: Date;

  @ApiPropertyOptional({ description: 'Observações da aprovação técnica' })
  aprovacao_tecnica_obs?: string;

  @ApiPropertyOptional({ description: 'Data agendada para instalação' })
  data_instalacao_agendada?: Date;

  @ApiPropertyOptional({ description: 'Observações da instalação' })
  observacoes_instalacao?: string;

  static fromDomain(data: OrdemServicoData): OrdemServicoResponseDto {
    const dto = new OrdemServicoResponseDto();
    Object.assign(dto, data);
    return dto;
  }
}

class OrdemServicoEstoqueDetalheDto implements EstoqueValidacaoDetalhe {
  @ApiProperty({ description: 'ID do insumo analisado', example: 'cuid_insumo_123' })
  insumo_id!: string;

  @ApiPropertyOptional({ description: 'Nome do insumo' })
  nome?: string;

  @ApiPropertyOptional({ description: 'Categoria do insumo' })
  categoria?: string;

  @ApiPropertyOptional({ description: 'Fornecedor associado' })
  fornecedor?: string;

  @ApiPropertyOptional({ description: 'Estoque atual dispon�vel', example: 15 })
  estoque_atual?: number;

  @ApiPropertyOptional({ description: 'Estoque m�nimo configurado', example: 5 })
  estoque_minimo?: number;

  @ApiPropertyOptional({ description: 'Quantidade necess�ria para a OS', example: 12 })
  quantidade_necessaria?: number;

  @ApiPropertyOptional({ description: 'Quantidade dispon�vel ap�s reservar para a OS', example: 3 })
  quantidade_disponivel?: number;

  @ApiPropertyOptional({ description: 'Percentual dispon�vel em rela��o ao estoque atual', example: 25 })
  percentual_disponivel?: number;

  @ApiPropertyOptional({ description: 'Unidade de medida do insumo', example: 'm2' })
  unidade?: string;

  @ApiPropertyOptional({ description: 'Indica se h� alerta de estoque insuficiente' })
  alerta_estoque?: boolean;

  @ApiPropertyOptional({ description: 'Indica se ficar� abaixo do estoque m�nimo' })
  alerta_estoque_minimo?: boolean;

  @ApiPropertyOptional({ description: 'Indica se o fornecedor est� inativo' })
  alerta_fornecedor?: boolean;
}

