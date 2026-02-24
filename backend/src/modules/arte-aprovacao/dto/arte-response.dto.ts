import { ApiProperty } from '@nestjs/swagger';
import { ArteStatus, ComentarioTipo } from '@prisma/client';

export class ArteArquivoResponseDto {
  @ApiProperty({ description: 'ID do arquivo' })
  id: string;

  @ApiProperty({ description: 'Nome do arquivo' })
  nome_arquivo: string;

  @ApiProperty({ description: 'Nome original do arquivo' })
  nome_original: string;

  @ApiProperty({ description: 'Tipo do arquivo' })
  tipo_arquivo: string;

  @ApiProperty({ description: 'Tamanho do arquivo em bytes' })
  tamanho: number;

  @ApiProperty({ description: 'URL do arquivo' })
  url_arquivo: string;

  @ApiProperty({ description: 'URL do thumbnail', required: false })
  url_thumbnail?: string;

  @ApiProperty({ description: 'Provedor de storage' })
  storage_provider: string;

  @ApiProperty({ description: 'Data do upload' })
  data_upload: Date;
}

export class ArteComentarioResponseDto {
  @ApiProperty({ description: 'ID do comentário' })
  id: string;

  @ApiProperty({ description: 'ID do usuário que comentou' })
  usuario_id: string;

  @ApiProperty({ description: 'Nome do usuário' })
  usuario_nome: string;

  @ApiProperty({ description: 'Conteúdo do comentário' })
  comentario: string;

  @ApiProperty({ description: 'Tipo do comentário', enum: ComentarioTipo })
  tipo: ComentarioTipo;

  @ApiProperty({ description: 'Data do comentário' })
  data_comentario: Date;
}

export class ArteVersaoResponseDto {
  @ApiProperty({ description: 'ID da versão' })
  id: string;

  @ApiProperty({ description: 'ID da OS' })
  os_id: string;

  @ApiProperty({ description: 'ID do serviço', required: false })
  servico_id?: string;

  @ApiProperty({ description: 'Versão da arte' })
  versao: string;

  @ApiProperty({ description: 'Status da arte', enum: ArteStatus })
  status: ArteStatus;

  @ApiProperty({ description: 'ID do autor' })
  autor_id: string;

  @ApiProperty({ description: 'Nome do autor' })
  autor_nome: string;

  @ApiProperty({ description: 'Descrição da versão', required: false })
  descricao?: string;

  @ApiProperty({ description: 'Observações', required: false })
  observacoes?: string;

  @ApiProperty({ description: 'Data de criação' })
  data_criacao: Date;

  @ApiProperty({ description: 'Data de aprovação', required: false })
  data_aprovacao?: Date;

  @ApiProperty({ description: 'ID do aprovador', required: false })
  aprovado_por?: string;

  @ApiProperty({ description: 'Nome do aprovador', required: false })
  aprovador_nome?: string;

  @ApiProperty({ description: 'Aprovado pelo cliente' })
  aprovado_por_cliente: boolean;

  @ApiProperty({
    description: 'Liberado para PCP após verificação do designer',
  })
  liberado_para_pcp: boolean;

  @ApiProperty({
    description: 'Data em que foi liberado para PCP',
    required: false,
  })
  liberado_em?: Date;

  @ApiProperty({ description: 'ID do designer que liberou', required: false })
  liberado_por?: string;

  @ApiProperty({ description: 'Nome do designer que liberou', required: false })
  liberador_nome?: string;

  @ApiProperty({
    description: 'Arquivos da versão',
    type: [ArteArquivoResponseDto],
  })
  arquivos: ArteArquivoResponseDto[];

  @ApiProperty({
    description: 'Comentários da versão',
    type: [ArteComentarioResponseDto],
  })
  comentarios: ArteComentarioResponseDto[];
}

export class ArteVersaoListResponseDto {
  @ApiProperty({
    description: 'Lista de versões',
    type: [ArteVersaoResponseDto],
  })
  versoes: ArteVersaoResponseDto[];

  @ApiProperty({ description: 'Total de versões' })
  total: number;
}
