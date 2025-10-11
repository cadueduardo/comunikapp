import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

interface CampoValidacao {
  campo: string;
  descricao: string;
  tipo: string;
  modulo: string;
  exemplo?: string;
}

@ApiTags('Configurações - Campos de Validação')
@Controller('configuracoes/campos-validacao')
export class CamposValidacaoController {
  
  @Get()
  @ApiOperation({ summary: 'Listar todos os campos disponíveis para validação' })
  listarCampos(): CampoValidacao[] {
    return [
      // ORÇAMENTO
      {
        campo: 'orcamento.id',
        descricao: 'ID do orçamento',
        tipo: 'string',
        modulo: 'Orçamento',
        exemplo: 'abc123'
      },
      {
        campo: 'orcamento.numero',
        descricao: 'Número sequencial do orçamento',
        tipo: 'string',
        modulo: 'Orçamento',
        exemplo: 'ORC-2025-001'
      },
      {
        campo: 'orcamento.valor_total',
        descricao: 'Valor total do orçamento',
        tipo: 'number',
        modulo: 'Orçamento',
        exemplo: '1500.00'
      },
      {
        campo: 'orcamento.valor_materiais',
        descricao: 'Valor total dos materiais',
        tipo: 'number',
        modulo: 'Orçamento',
        exemplo: '800.00'
      },
      {
        campo: 'orcamento.valor_mao_obra',
        descricao: 'Valor total da mão de obra',
        tipo: 'number',
        modulo: 'Orçamento',
        exemplo: '400.00'
      },
      {
        campo: 'orcamento.margem_lucro',
        descricao: 'Margem de lucro aplicada (%)',
        tipo: 'number',
        modulo: 'Orçamento',
        exemplo: '30'
      },
      {
        campo: 'orcamento.data_entrega',
        descricao: 'Data de entrega prevista',
        tipo: 'date',
        modulo: 'Orçamento',
        exemplo: '2025-10-15'
      },
      {
        campo: 'orcamento.prazo_dias',
        descricao: 'Prazo de entrega em dias',
        tipo: 'number',
        modulo: 'Orçamento',
        exemplo: '7'
      },
      {
        campo: 'orcamento.status',
        descricao: 'Status do orçamento',
        tipo: 'string',
        modulo: 'Orçamento',
        exemplo: 'aprovado'
      },
      {
        campo: 'orcamento.produtos.length',
        descricao: 'Quantidade de produtos no orçamento',
        tipo: 'number',
        modulo: 'Orçamento',
        exemplo: '3'
      },

      // ORDEM DE SERVIÇO (OS)
      {
        campo: 'os.id',
        descricao: 'ID da ordem de serviço',
        tipo: 'string',
        modulo: 'Ordem de Serviço',
        exemplo: 'os123'
      },
      {
        campo: 'os.numero',
        descricao: 'Número sequencial da OS',
        tipo: 'string',
        modulo: 'Ordem de Serviço',
        exemplo: 'OS-2025-001'
      },
      {
        campo: 'os.status',
        descricao: 'Status da ordem de serviço',
        tipo: 'string',
        modulo: 'Ordem de Serviço',
        exemplo: 'em_producao'
      },
      {
        campo: 'os.prioridade',
        descricao: 'Prioridade da OS (alta, média, baixa)',
        tipo: 'string',
        modulo: 'Ordem de Serviço',
        exemplo: 'alta'
      },
      {
        campo: 'os.tipo_os',
        descricao: 'Tipo da OS (interna ou direta)',
        tipo: 'string',
        modulo: 'Ordem de Serviço',
        exemplo: 'interna'
      },
      {
        campo: 'os.data_inicio',
        descricao: 'Data de início da produção',
        tipo: 'date',
        modulo: 'Ordem de Serviço',
        exemplo: '2025-10-08'
      },
      {
        campo: 'os.data_fim_prevista',
        descricao: 'Data prevista para conclusão',
        tipo: 'date',
        modulo: 'Ordem de Serviço',
        exemplo: '2025-10-15'
      },
      {
        campo: 'os.data_entrega',
        descricao: 'Data de entrega ao cliente',
        tipo: 'date',
        modulo: 'Ordem de Serviço',
        exemplo: '2025-10-16'
      },
      {
        campo: 'os.nome_servico',
        descricao: 'Nome/descrição do serviço',
        tipo: 'string',
        modulo: 'Ordem de Serviço',
        exemplo: 'Impressão de banner'
      },
      {
        campo: 'os.observacoes',
        descricao: 'Observações da OS',
        tipo: 'string',
        modulo: 'Ordem de Serviço',
        exemplo: 'Cliente pediu urgência'
      },
      {
        campo: 'os.arte_aprovada',
        descricao: 'Arte foi aprovada pelo cliente',
        tipo: 'boolean',
        modulo: 'Ordem de Serviço',
        exemplo: 'true'
      },
      {
        campo: 'os.arquivo_arte',
        descricao: 'Caminho do arquivo de arte',
        tipo: 'string',
        modulo: 'Ordem de Serviço',
        exemplo: '/uploads/arte123.pdf'
      },
      {
        campo: 'os.insumos_calculados.length',
        descricao: 'Quantidade de materiais na OS',
        tipo: 'number',
        modulo: 'Ordem de Serviço',
        exemplo: '5'
      },

      // PRODUTO
      {
        campo: 'produto.nome',
        descricao: 'Nome do produto',
        tipo: 'string',
        modulo: 'Produto',
        exemplo: 'Banner 2x1m'
      },
      {
        campo: 'produto.quantidade',
        descricao: 'Quantidade do produto',
        tipo: 'number',
        modulo: 'Produto',
        exemplo: '10'
      },
      {
        campo: 'produto.largura',
        descricao: 'Largura do produto em cm',
        tipo: 'number',
        modulo: 'Produto',
        exemplo: '200'
      },
      {
        campo: 'produto.altura',
        descricao: 'Altura do produto em cm',
        tipo: 'number',
        modulo: 'Produto',
        exemplo: '100'
      },
      {
        campo: 'produto.area_total',
        descricao: 'Área total do produto em m²',
        tipo: 'number',
        modulo: 'Produto',
        exemplo: '2.0'
      },
      {
        campo: 'produto.perimetro',
        descricao: 'Perímetro do produto em m',
        tipo: 'number',
        modulo: 'Produto',
        exemplo: '6.0'
      },
      {
        campo: 'produto.valor_unitario',
        descricao: 'Valor unitário do produto',
        tipo: 'number',
        modulo: 'Produto',
        exemplo: '150.00'
      },
      {
        campo: 'produto.valor_total',
        descricao: 'Valor total do produto',
        tipo: 'number',
        modulo: 'Produto',
        exemplo: '1500.00'
      },

      // INSUMO / MATERIAL
      {
        campo: 'insumo.nome',
        descricao: 'Nome do insumo',
        tipo: 'string',
        modulo: 'Material',
        exemplo: 'Lona Brilho'
      },
      {
        campo: 'insumo.quantidade_necessaria',
        descricao: 'Quantidade necessária do insumo',
        tipo: 'number',
        modulo: 'Material',
        exemplo: '2.5'
      },
      {
        campo: 'insumo.quantidade_disponivel',
        descricao: 'Quantidade disponível em estoque',
        tipo: 'number',
        modulo: 'Material',
        exemplo: '50'
      },
      {
        campo: 'insumo.custo_unitario',
        descricao: 'Custo unitário do insumo',
        tipo: 'number',
        modulo: 'Material',
        exemplo: '25.00'
      },
      {
        campo: 'insumo.custo_total',
        descricao: 'Custo total do insumo',
        tipo: 'number',
        modulo: 'Material',
        exemplo: '62.50'
      },
      {
        campo: 'insumo.disponivel_estoque',
        descricao: 'Insumo disponível em estoque',
        tipo: 'boolean',
        modulo: 'Material',
        exemplo: 'true'
      },
      {
        campo: 'insumo.unidade',
        descricao: 'Unidade de medida do insumo',
        tipo: 'string',
        modulo: 'Material',
        exemplo: 'm²'
      },

      // CLIENTE
      {
        campo: 'cliente.nome',
        descricao: 'Nome do cliente',
        tipo: 'string',
        modulo: 'Cliente',
        exemplo: 'João Silva'
      },
      {
        campo: 'cliente.email',
        descricao: 'Email do cliente',
        tipo: 'string',
        modulo: 'Cliente',
        exemplo: 'joao@email.com'
      },
      {
        campo: 'cliente.telefone',
        descricao: 'Telefone do cliente',
        tipo: 'string',
        modulo: 'Cliente',
        exemplo: '(11) 98765-4321'
      },
      {
        campo: 'cliente.cpf_cnpj',
        descricao: 'CPF ou CNPJ do cliente',
        tipo: 'string',
        modulo: 'Cliente',
        exemplo: '123.456.789-00'
      },

      // LOJA
      {
        campo: 'loja.nome',
        descricao: 'Nome da loja',
        tipo: 'string',
        modulo: 'Loja',
        exemplo: 'Gráfica XYZ'
      },
      {
        campo: 'loja.cnpj',
        descricao: 'CNPJ da loja',
        tipo: 'string',
        modulo: 'Loja',
        exemplo: '12.345.678/0001-00'
      },

      // PCP
      {
        campo: 'pcp.status',
        descricao: 'Status da tarefa no PCP',
        tipo: 'string',
        modulo: 'PCP',
        exemplo: 'em_andamento'
      },
      {
        campo: 'pcp.centro_trabalho',
        descricao: 'Centro de trabalho responsável',
        tipo: 'string',
        modulo: 'PCP',
        exemplo: 'Impressão Digital'
      },
      {
        campo: 'pcp.tempo_estimado',
        descricao: 'Tempo estimado em minutos',
        tipo: 'number',
        modulo: 'PCP',
        exemplo: '120'
      },
      {
        campo: 'pcp.tempo_real',
        descricao: 'Tempo real gasto em minutos',
        tipo: 'number',
        modulo: 'PCP',
        exemplo: '135'
      },
    ];
  }
}









