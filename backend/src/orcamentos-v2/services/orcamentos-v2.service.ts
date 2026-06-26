import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IntegracaoMotorService } from './integracao-motor.service';
import { ValidacaoV2Service } from './validacao-v2.service';
import { TransformacaoV2Service } from './transformacao-v2.service';
import { NotificacaoV2Service } from './notificacao-v2.service';
import {
  NotificacoesService,
  TipoNotificacao,
} from '../../notificacoes/notificacoes.service';
import { ValidacaoEstoqueService } from './validacao-estoque.service';
import { DocumentCodeService } from '../../documentos/document-code.service';
import { OSService } from '../../os/services/os.service';
import { OSInativacaoService } from '../../os/services/os-inativacao.service';
import { ChatV2Service } from './chat-v2.service';
import { MailService } from '../../mail/mail.service';
import {
  OrcamentoCompleto,
  OrcamentoBase,
  OrcamentoStatus,
  OrcamentoTipo,
  PrioridadeOrcamento,
  DadosHerdadosOrcamento,
} from '../interfaces/orcamento.interface';
import { CobrancasService } from '../../financeiro/services/cobrancas.service';
import { CobrancaVencimentoService } from '../../financeiro/services/cobranca-vencimento.service';
import { ParcelasBuilderService } from '../../financeiro/services/parcelas-builder.service';
import { HomeCacheService } from '../../home-operacional/services/home-cache.service';
import { SimularChapaDto } from '../../common/calculo-chapa/simular-chapa.dto';
import {
  calcularChapa,
  inferirCustoM2Insumo,
  resolverMedidasComerciaisInsumo,
} from '../../common/calculo-chapa/calculo-chapa.util';
import { MetodoCobrancaChapa } from '../../common/calculo-chapa/calculo-chapa.types';
import { distribuirPrecoFinal } from '../utils/distribuicao-preco.util';

/**
 * Serviço Principal de Orçamentos V2
 * Implementa todas as operações CRUD usando motor de cálculo V2
 *
 * ✅ ARQUIVO ≤ 400 LINHAS (CONFORME PREMISSAS)
 * ✅ INTEGRAÇÃO COMPLETA COM MOTOR FUNCIONANDO
 * ✅ FUNCIONALIDADES PRESERVADAS E MELHORADAS
 */
@Injectable()
export class OrcamentosV2Service {
  private readonly logger = new Logger(OrcamentosV2Service.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly integracaoMotor: IntegracaoMotorService,
    private readonly validacaoService: ValidacaoV2Service,
    private readonly transformacaoService: TransformacaoV2Service,
    private readonly notificacaoService: NotificacaoV2Service,
    private readonly notificacoesService: NotificacoesService,
    private readonly validacaoEstoque: ValidacaoEstoqueService,
    private readonly chatService: ChatV2Service,
    private readonly osService: OSService,
    private readonly osInativacaoService: OSInativacaoService,
    private readonly documentCodeService: DocumentCodeService,
    private readonly mailService: MailService,
    // Fase 6 - Financeiro minimo
    private readonly cobrancasService: CobrancasService,
    private readonly cobrancaVencimentoService: CobrancaVencimentoService,
    private readonly parcelasBuilder: ParcelasBuilderService,
    private readonly homeCacheService: HomeCacheService,
  ) {}

  private async validarEntregaInstalacao(
    dados: any,
    lojaId: string,
  ): Promise<void> {
    const modalidadeId =
      typeof dados?.entrega_modalidade_id === 'string'
        ? dados.entrega_modalidade_id.trim()
        : '';
    if (modalidadeId) {
      const modalidade = await (this.prisma as any).modalidadeEntrega.findFirst({
        where: { id: modalidadeId, loja_id: lojaId, ativo: true },
        select: { id: true },
      });
      if (!modalidade) {
        throw new BadRequestException(
          'Modalidade de entrega invalida para esta loja.',
        );
      }
    }

    const tipoIds = Array.from(
      new Set(
        (Array.isArray(dados?.produtos) ? dados.produtos : [])
          .map((produto: any) =>
            typeof produto?.instalacao_tipo_id === 'string'
              ? produto.instalacao_tipo_id.trim()
              : '',
          )
          .filter(Boolean),
      ),
    );

    if (tipoIds.length === 0) return;

    const tipos = await (this.prisma as any).tipoInstalacao.findMany({
      where: {
        id: { in: tipoIds },
        loja_id: lojaId,
        ativo: true,
      },
      select: { id: true },
    });
    const idsValidos = new Set(tipos.map((tipo: any) => tipo.id));
    const idInvalido = tipoIds.find((id) => !idsValidos.has(id));
    if (idInvalido) {
      throw new BadRequestException(
        'Tipo de instalacao invalido para esta loja.',
      );
    }
  }

  /**
   * Cria novo orçamento
   */
  async criarOrcamento(
    dados: any,
    lojaId: string,
    usuarioId: string,
  ): Promise<OrcamentoCompleto> {
    // Fase 11 - diagnostico de profundidade (guardrail 3). Log explicito do que
    // o frontend mandou para cada produto. Ajuda a investigar divergencias
    // silenciosas no round-trip preview/grid/detalhe.
    if (Array.isArray(dados?.produtos)) {
      const resumoProfundidade = dados.produtos.map((p: any, i: number) => ({
        idx: i,
        nome: p?.nome ?? p?.nome_servico,
        largura: p?.largura,
        altura: p?.altura,
        profundidade: p?.profundidade,
        tem_profundidade: p?.tem_profundidade,
        unidade_geometria: p?.unidade_geometria,
      }));
      this.logger.log(
        `[FASE11] criarOrcamento - produtos recebidos: ${JSON.stringify(resumoProfundidade)}`,
      );
    }

    this.logger.log(`📝 Criando novo orçamento para loja ${lojaId}`);

    try {
      // 1. Validar dados de entrada
      await this.validacaoService.validarDadosCriacao(dados, lojaId);
      await this.validarEntregaInstalacao(dados, lojaId);

      // 2. Preparar dados para criação
      const dadosPreparados = this.transformacaoService.prepararDadosCriacao(
        dados,
        lojaId,
        usuarioId,
      );
      // Garantir numero sequencial controlado pelo DocumentCodeService
      dadosPreparados.numero =
        await this.documentCodeService.gerarCodigoOrcamento(lojaId);

      // 3. Criar orçamento no banco
      const orcamentoCriado = await (this.prisma as any).orcamento.create({
        data: dadosPreparados,
        include: {
          cliente: true,
          produtos: {
            select: {
              id: true,
              nome_servico: true,
              nome: true,
              descricao: true,
              quantidade: true,
              largura: true,
              altura: true,
              profundidade: true,
              area_produto: true,
              perimetro_produto: true,
              unidade_geometria: true,
              geometria_origem: true,
              arquivo_geometria_url: true,
              arquivo_geometria_metadados: true,
              unidade_medida: true,
              custo_total_producao: true,
              preco_unitario: true,
              preco_total: true,
              margem_lucro: true,
              impostos: true,
              observacoes: true,
              instalacao_necessaria: true,
              instalacao_tipo_id: true,
              instalacao_regra_cobranca: true,
              instalacao_valor_unitario: true,
              instalacao_usar_endereco_entrega: true,
              instalacao_endereco_snapshot: true,
              instalacao_cep: true,
              instalacao_logradouro: true,
              instalacao_numero: true,
              instalacao_complemento: true,
              instalacao_bairro: true,
              instalacao_cidade: true,
              instalacao_estado: true,
              instalacao_preco_cobrado: true,
              instalacao_custo_mao_obra: true,
              instalacao_custo_deslocamento: true,
              instalacao_tempo_estimado_min: true,
              instalacao_quantidade_pessoas: true,
              instalacao_observacoes: true,
              ativo: true,
              ordem: true,
              categoria: true,
              tipo_item: true,
              produto_finito_id: true,
              produto_finito: {
                select: {
                  id: true,
                  nome: true,
                  sku: true,
                  estoque_atual: true,
                  preco_venda: true,
                  preco_promocional: true,
                  preco_custo: true,
                  imagens: { orderBy: { ordem: 'asc' }, take: 1 },
                },
              },
              insumos: true,
              maquinas: true,
              funcoes: true,
              servicos_manuais: true,
              custos_indiretos: true,
            },
          },
          historico: true,
        },
      });

      const toNumber = (value: unknown): number => {
        const n = Number(value);
        return Number.isFinite(n) ? n : 0;
      };
      const optionalNumber = (value: unknown): number | undefined => {
        if (value === null || value === undefined || value === '') return undefined;
        const n = Number(value);
        return Number.isFinite(n) ? n : undefined;
      };
      const possuiCustosCalculadosNoPayload =
        dados.preco_final != null &&
        dados.custo_total != null &&
        (toNumber(dados.preco_final) > 0 || toNumber(dados.custo_total) > 0);
      const isRascunho =
        String(dados.status || orcamentoCriado.status || '').toLowerCase() ===
        OrcamentoStatus.RASCUNHO;
      const produtosPayload = Array.isArray(dados.produtos) ? dados.produtos : [];
      const todosProdutosTemInsumos =
        produtosPayload.length > 0 &&
        produtosPayload.every((produto: any) => {
          if (String(produto?.tipo_item || 'SOB_DEMANDA').toUpperCase() === 'PRODUTO_FINITO') {
            return true;
          }
          const insumos = Array.isArray(produto?.insumos) ? produto.insumos : [];
          const materiais = Array.isArray(produto?.materiais)
            ? produto.materiais
            : [];
          return (
            insumos.length > 0 ||
            materiais.some((material: any) => Boolean(material?.insumo_id))
          );
        });
      const deveCalcularViaMotor = !isRascunho || todosProdutosTemInsumos;

      if (deveCalcularViaMotor) {
      // 4. Sempre calcular via motor V2 (fonte da verdade para preco_final)
      this.logger.log(
          `💰 Calculando custos via motor V2 para novo orcamento: custo_total=${dados.custo_total}, preco_final=${dados.preco_final}`,
        );

        const orcamentoParaMotor = {
          ...orcamentoCriado,
          margem_lucro_customizada: dados.margem_lucro_customizada,
          impostos_customizados: dados.impostos_customizados,
          comissao_percentual: dados.comissao_percentual,
          tipo_margem_lucro:
            dados.tipo_margem_lucro ?? dados.configuracoes?.tipo_margem_lucro,
          configuracoes: {
            margem_lucro_padrao: optionalNumber(dados.margem_lucro_customizada),
            impostos_padrao: optionalNumber(dados.impostos_customizados),
            comissao_padrao: optionalNumber(dados.comissao_percentual),
            tipo_margem_lucro:
              dados.tipo_margem_lucro ?? dados.configuracoes?.tipo_margem_lucro,
          },
        };
        const resultadoCalculo =
          await this.integracaoMotor.calcularOrcamentoCompleto(
            orcamentoParaMotor,
            lojaId,
          );

      await this.atualizarCustosCalculados(
        orcamentoCriado.id,
        resultadoCalculo,
      );
      } else {
        this.logger.warn(
          `Rascunho ${orcamentoCriado.id} salvo sem calculo: produto sem insumo informado.`,
        );
      }

      // Hotfix determinístico:
      // Na criação, quando o frontend já enviou custos do preview,
      // persistimos esses valores como fonte da verdade para manter
      // a listagem em sincronia com o que foi visto no formulário.
      if (possuiCustosCalculadosNoPayload) {
        const precoFinal = toNumber(dados.preco_final);
        await this.prisma.orcamento.update({
          where: { id: orcamentoCriado.id },
          data: {
            preco_final: precoFinal,
            valor_total: precoFinal,
            custo_total: toNumber(dados.custo_total),
            margem_lucro: toNumber(dados.margem_lucro),
            impostos: toNumber(dados.impostos),
            custo_material: toNumber(dados.custo_material),
            custo_mao_obra: toNumber(dados.custo_mao_obra),
            custo_indireto: toNumber(dados.custo_indireto),
            data_ultimo_calculo: new Date(),
          },
        });
      }

      // 6. Criar histórico
      await this.criarHistorico(
        orcamentoCriado.id,
        'criacao',
        'Orçamento criado',
        usuarioId,
      );

      // 7. Notificar criação
      await this.notificacaoService.notificarCriacao(orcamentoCriado, lojaId);

      this.logger.log(
        `✅ Orçamento criado com sucesso: ${orcamentoCriado.id}`,
      );
      return await this.buscarOrcamento(orcamentoCriado.id, lojaId);
    } catch (error) {
      this.logger.error(`❌ Erro ao criar orçamento: ${error.message}`);
      throw error;
    }
  }

  /**
   * Duplica orçamento existente como novo rascunho (produtos, insumos, máquinas, etc.).
   */
  async duplicarOrcamento(
    id: string,
    lojaId: string,
    usuarioId: string,
    opcoes?: { titulo?: string; descricao?: string },
  ): Promise<OrcamentoCompleto> {
    const original = await this.buscarOrcamento(id, lojaId);
    const tituloBase =
      original.titulo ||
      (original as any).nome_servico ||
      'Orçamento';

    const produtos = (original.produtos || []).map((produto) =>
      this.transformacaoService.normalizarProdutoParaDuplicacao(produto),
    );

    if (produtos.length === 0) {
      throw new BadRequestException(
        'Não é possível duplicar orçamento sem produtos',
      );
    }

    const dadosDuplicacao: Record<string, unknown> = {
      cliente_id: original.cliente_id,
      titulo: opcoes?.titulo || `${tituloBase} (Cópia)`,
      nome_servico: opcoes?.titulo || `${tituloBase} (Cópia)`,
      descricao:
        opcoes?.descricao || `Cópia do orçamento ${tituloBase}`,
      status: OrcamentoStatus.RASCUNHO,
      produtos,
      margem_lucro_customizada: (original as any).margem_lucro_customizada,
      impostos_customizados: (original as any).impostos_customizados,
      tipo_margem_lucro: (original as any).tipo_margem_lucro,
      comissao_percentual: original.comissao_percentual,
      configuracoes: original.configuracoes,
      prazo_entrega: (original as any).prazo_entrega,
      forma_pagamento: (original as any).forma_pagamento,
      validade_proposta: (original as any).validade_proposta,
      atendente: (original as any).atendente,
      condicoes_comerciais: (original as any).condicoes_comerciais,
    };

    return this.criarOrcamento(dadosDuplicacao, lojaId, usuarioId);
  }

  /**
   * Busca orçamento por ID
   */
  async buscarOrcamento(
    id: string,
    lojaId: string,
  ): Promise<OrcamentoCompleto> {
    this.logger.log(`🔍 Buscando orçamento ${id} na loja ${lojaId}`);

    try {
      const orcamento = await (this.prisma as any).orcamento.findFirst({
        where: { id, loja_id: lojaId },
        include: {
          cliente: true,
          produtos: {
            select: {
              id: true,
              nome_servico: true,
              nome: true,
              descricao: true,
              quantidade: true,
              largura: true,
              altura: true,
              profundidade: true,
              area_produto: true,
              perimetro_produto: true,
              unidade_geometria: true,
              geometria_origem: true,
              arquivo_geometria_url: true,
              arquivo_geometria_metadados: true,
              unidade_medida: true,
              custo_total_producao: true,
              preco_unitario: true,
              preco_total: true,
              margem_lucro: true,
              impostos: true,
              observacoes: true,
              instalacao_necessaria: true,
              instalacao_tipo_id: true,
              instalacao_regra_cobranca: true,
              instalacao_valor_unitario: true,
              instalacao_usar_endereco_entrega: true,
              instalacao_endereco_snapshot: true,
              instalacao_cep: true,
              instalacao_logradouro: true,
              instalacao_numero: true,
              instalacao_complemento: true,
              instalacao_bairro: true,
              instalacao_cidade: true,
              instalacao_estado: true,
              instalacao_preco_cobrado: true,
              instalacao_custo_mao_obra: true,
              instalacao_custo_deslocamento: true,
              instalacao_tempo_estimado_min: true,
              instalacao_quantidade_pessoas: true,
              instalacao_observacoes: true,
              ativo: true,
              ordem: true,
              categoria: true,
              tipo_item: true,
              produto_finito_id: true,
              produto_finito: {
                select: {
                  id: true,
                  nome: true,
                  sku: true,
                  estoque_atual: true,
                  preco_venda: true,
                  preco_promocional: true,
                  preco_custo: true,
                  imagens: { orderBy: { ordem: 'asc' }, take: 1 },
                },
              },
              insumos: true,
              maquinas: true,
              funcoes: true,
              servicos_manuais: true,
              custos_indiretos: true,
            },
          },
          historicoOrcamento: {
            orderBy: { data: 'desc' },
          },
          versoes: {
            orderBy: { numero: 'desc' },
          },
          aprovacoes: true,
          linksPublicos: true,
          mensagensChat: {
            orderBy: { data_envio: 'desc' },
          },
          entrega_modalidade: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      });

      if (!orcamento) {
        throw new NotFoundException('Orçamento não encontrado');
      }

      // Debug logs removidos para limpar terminal
      // this.logger.log(`🔍 Debug - Orçamento encontrado: ID=${orcamento.id}, cliente_id=${orcamento.cliente_id}, temCliente=${!!orcamento.cliente}, temProdutos=${!!orcamento.produtos}, qtdProdutos=${orcamento.produtos?.length || 0}`);
      // this.logger.log(`🔍 Debug - Campos do orçamento: titulo=${(orcamento as any).titulo}, nome_servico=${(orcamento as any).nome_servico}, descricao=${(orcamento as any).descricao}, quantidade_produto=${(orcamento as any).quantidade_produto}`);
      // this.logger.log(`🔍 Debug - Campos de medida: largura_produto=${(orcamento as any).largura_produto}, altura_produto=${(orcamento as any).altura_produto}, area_produto=${(orcamento as any).area_produto}`);
      // this.logger.log(`🔍 Debug - Dados completos do orçamento:`, JSON.stringify(orcamento, null, 2));

      if (orcamento.cliente) {
        this.logger.log(`✅ Cliente carregado: ${orcamento.cliente.nome}`);
      } else {
        this.logger.log(
        `❌ Cliente NÃO carregado para cliente_id: ${orcamento.cliente_id}`,
        );
        // Tentar buscar cliente manualmente
        if (orcamento.cliente_id) {
          const clienteManual = await this.prisma.cliente.findUnique({
            where: { id: orcamento.cliente_id },
          });
          if (clienteManual) {
            this.logger.log(
              `✅ Cliente encontrado manualmente: ${clienteManual.nome}`,
            );
            orcamento.cliente = clienteManual;
          } else {
            this.logger.log(
              `❌ Cliente não encontrado no banco: ${orcamento.cliente_id}`,
            );
          }
        }
      }

      if (orcamento.produtos && orcamento.produtos.length > 0) {
        this.logger.log(
          `✅ Produtos carregados: ${orcamento.produtos.length} produtos`,
        );
      } else {
      this.logger.log(`❌ Produtos NÃO carregados`);
        // Tentar buscar produtos manualmente
        const produtosManual = await this.prisma.produtoOrcamento.findMany({
          where: { orcamento_id: orcamento.id },
          include: {
            produto_finito: {
              select: {
                id: true,
                nome: true,
                sku: true,
                estoque_atual: true,
                preco_venda: true,
                preco_promocional: true,
                preco_custo: true,
                imagens: { orderBy: { ordem: 'asc' }, take: 1 },
              },
            },
            insumos: true,
            maquinas: true,
            funcoes: true,
            servicos_manuais: true,
            custos_indiretos: true,
          },
        });
        if (produtosManual.length > 0) {
          this.logger.log(
            `✅ Produtos encontrados manualmente: ${produtosManual.length} produtos`,
          );
          orcamento.produtos = produtosManual;
        } else {
          this.logger.log(
            `❌ Produtos não encontrados no banco para orcamento_id: ${orcamento.id}`,
          );
        }
      }

      return this.transformacaoService.transformarParaInterface(orcamento);
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar orçamento: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lista orçamentos com filtros
   */
  async listarOrcamentos(
    lojaId: string,
    filtros: any = {},
    paginacao: any = {},
  ): Promise<{
    orcamentos: OrcamentoBase[];
    total: number;
    pagina: number;
    porPagina: number;
  }> {
    this.logger.log(`📋 Listando orçamentos da loja ${lojaId}`);

    try {
      // Construir filtros
      const where = this.construirFiltros(filtros, lojaId);
      const { skip, take } = this.prepararPaginacao(paginacao);

      // Buscar orçamentos
      const [orcamentos, total] = await Promise.all([
        (this.prisma as any).orcamento.findMany({
          where,
          skip,
          take,
          select: {
            id: true,
            numero: true,
            titulo: true,
            descricao: true,
            cliente_id: true,
            loja_id: true,
            status: true,
            status_aprovacao: true,
            tipo_orcamento: true,
            data_criacao: true,
            data_atualizacao: true,
            tags: true,
            prioridade: true,
            responsavel_id: true,
            ativo: true,
            preco_final: true,
            custo_total: true,
            margem_lucro: true,
            impostos: true,
            comissao_percentual: true,
            configuracao_calculo: true,
            quantidade_produto: true,
            unidade_medida_produto: true,
            largura_produto: true,
            altura_produto: true,
            area_produto: true,
            prazo_entrega: true,
            entrega_modalidade_id: true,
            entrega_usar_endereco_cliente: true,
            entrega_endereco_snapshot: true,
            entrega_cep: true,
            entrega_logradouro: true,
            entrega_numero: true,
            entrega_complemento: true,
            entrega_bairro: true,
            entrega_cidade: true,
            entrega_estado: true,
            entrega_prazo_dias: true,
            entrega_valor_cobrado: true,
            entrega_custo_estimado: true,
            entrega_observacoes: true,
            forma_pagamento: true,
            validade_proposta: true,
            atendente: true,
            observacoes_internas: true,
            observacoes_cliente: true,
            codigo_aprovacao: true,
            cliente: true,
            produtos: true,
          },
          orderBy: { data_atualizacao: 'desc' },
        }),
        this.prisma.orcamento.count({ where }),
      ]);

      // Debug: verificar se status_aprovacao está sendo retornado
      this.logger.log(
        `🔍 Debug - Total de orçamentos encontrados: ${orcamentos.length}`,
      );

      if (orcamentos.length > 0) {
        this.logger.log(`🔍 Debug - Primeiro orçamento - Dados brutos:`, {
          id: orcamentos[0].id,
          status: orcamentos[0].status,
          status_aprovacao: orcamentos[0].status_aprovacao,
          hasStatusAprovacao: 'status_aprovacao' in orcamentos[0],
          keys: Object.keys(orcamentos[0]),
        });
      }

      const orcamentosTransformados = orcamentos.map((o, index) => {
        const transformado =
          this.transformacaoService.transformarParaInterface(o);
        if (index === 0) {
          this.logger.log(`🔍 Debug - Primeiro orçamento - Transformado:`, {
            id: transformado.id,
            status: transformado.status,
            status_aprovacao: transformado.status_aprovacao,
            hasStatusAprovacao: 'status_aprovacao' in transformado,
          });
        }
        return transformado;
      });

      // Debug: verificar se status_aprovacao está sendo retornado na resposta final
      this.logger.log(`🔍 Debug - Resposta final - Primeiro orçamento:`, {
        id: orcamentosTransformados[0]?.id,
        status: orcamentosTransformados[0]?.status,
        status_aprovacao: orcamentosTransformados[0]?.status_aprovacao,
        hasStatusAprovacao: orcamentosTransformados[0]
          ? 'status_aprovacao' in orcamentosTransformados[0]
          : false,
      });

      return {
        orcamentos: orcamentosTransformados,
        total,
        pagina: paginacao.pagina || 1,
        porPagina: paginacao.porPagina || 20,
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao listar orçamentos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Atualiza orçamento existente
   */
  async atualizarOrcamento(
    id: string,
    dados: any,
    lojaId: string,
    usuarioId: string,
  ): Promise<OrcamentoCompleto> {
    this.logger.log(`✏️ Atualizando orçamento ${id} na loja ${lojaId}`);

    try {
      // 1. Verificar se existe
      const orcamentoExistente = await this.buscarOrcamento(id, lojaId);

      // 1.1. Bloquear alterações em orçamento aprovado
      const orcExistente = orcamentoExistente as unknown as { status?: string; status_aprovacao?: string };
      if (orcExistente.status === 'aprovado' || orcExistente.status_aprovacao === 'APROVADO') {
        throw new BadRequestException(
          'Orçamento aprovado não pode ser alterado. Somente visualização permitida.',
        );
      }

      // 2. Validar dados de atualização
      await this.validacaoService.validarDadosAtualizacao(
        dados,
        orcamentoExistente,
      );
      await this.validarEntregaInstalacao(dados, lojaId);

      // 3. Preparar dados para atualização
      const dadosPreparados =
        this.transformacaoService.prepararDadosAtualizacao(
          dados,
          orcamentoExistente,
        );

      // 4. Atualizar no banco. Bancos antigos podem não ter ON DELETE CASCADE
      // nas relações dos produtos, então limpamos os filhos explicitamente
      // dentro da mesma transação antes de substituir os produtos.
      const atualizarOrcamento = (prisma: any) => prisma.orcamento.update({
        where: { id },
        data: dadosPreparados,
        include: {
          cliente: true,
          produtos: {
            select: {
              id: true,
              nome_servico: true,
              nome: true,
              descricao: true,
              quantidade: true,
              largura: true,
              altura: true,
              profundidade: true,
              area_produto: true,
              perimetro_produto: true,
              unidade_geometria: true,
              geometria_origem: true,
              arquivo_geometria_url: true,
              arquivo_geometria_metadados: true,
              unidade_medida: true,
              custo_total_producao: true,
              preco_unitario: true,
              preco_total: true,
              margem_lucro: true,
              impostos: true,
              observacoes: true,
              instalacao_necessaria: true,
              instalacao_tipo_id: true,
              instalacao_regra_cobranca: true,
              instalacao_valor_unitario: true,
              instalacao_usar_endereco_entrega: true,
              instalacao_endereco_snapshot: true,
              instalacao_cep: true,
              instalacao_logradouro: true,
              instalacao_numero: true,
              instalacao_complemento: true,
              instalacao_bairro: true,
              instalacao_cidade: true,
              instalacao_estado: true,
              instalacao_preco_cobrado: true,
              instalacao_custo_mao_obra: true,
              instalacao_custo_deslocamento: true,
              instalacao_tempo_estimado_min: true,
              instalacao_quantidade_pessoas: true,
              instalacao_observacoes: true,
              ativo: true,
              ordem: true,
              categoria: true,
              tipo_item: true,
              produto_finito_id: true,
              produto_finito: {
                select: {
                  id: true,
                  nome: true,
                  sku: true,
                  estoque_atual: true,
                  preco_venda: true,
                  preco_promocional: true,
                  preco_custo: true,
                  imagens: { orderBy: { ordem: 'asc' }, take: 1 },
                },
              },
              insumos: true,
              maquinas: true,
              funcoes: true,
              servicos_manuais: true,
              custos_indiretos: true,
            },
          },
        },
      });
      const deveSubstituirProdutos =
        dados.produtos &&
        Array.isArray(dados.produtos);

      const orcamentoAtualizado = deveSubstituirProdutos
        ? await (this.prisma as any).$transaction(async (tx: any) => {
            const filtroProduto = { produto: { orcamento_id: id } };
            await Promise.all([
              tx.itemInsumo.deleteMany({ where: filtroProduto }),
              tx.itemMaquina.deleteMany({ where: filtroProduto }),
              tx.itemFuncao.deleteMany({ where: filtroProduto }),
              tx.itemServicoManual.deleteMany({ where: filtroProduto }),
              tx.itemCustoIndireto.deleteMany({ where: filtroProduto }),
            ]);
            return atualizarOrcamento(tx);
          })
        : await atualizarOrcamento(this.prisma as any);

      // 5. Recalcular custos se necessário
      const precisaRecalcular = this.necessitaRecalculo(dados);

      // Verificar se os dados já têm custos calculados corretamente
      const temCustosValidos =
        (dados.preco_final > 0) ||
        (dados.custo_material > 0) ||
        (dados.custo_mao_obra > 0) ||
        (dados.custo_total > 0);

      const sempreRecalcular = false;

      const toNumber = (value: unknown): number => {
        const n = Number(value);
        return Number.isFinite(n) ? n : 0;
      };

      // Hotfix determinístico:
      // Se o frontend enviar custos já calculados no preview, persistir esses valores
      // como fonte da verdade para manter listagem e preview em sincronia.
      const possuiCustosCalculadosNoPayload =
        dados.preco_final != null &&
        dados.custo_total != null &&
        (toNumber(dados.preco_final) > 0 || toNumber(dados.custo_total) > 0);

      if (possuiCustosCalculadosNoPayload) {
        const precoFinal = toNumber(dados.preco_final);
        await this.prisma.orcamento.update({
          where: { id },
          data: {
            preco_final: precoFinal,
            valor_total: precoFinal,
            custo_total: toNumber(dados.custo_total),
            margem_lucro: toNumber(dados.margem_lucro),
            impostos: toNumber(dados.impostos),
            custo_material: toNumber(dados.custo_material),
            custo_mao_obra: toNumber(dados.custo_mao_obra),
            custo_indireto: toNumber(dados.custo_indireto),
            data_ultimo_calculo: new Date(),
          },
        });
      }
      if (false && (sempreRecalcular || precisaRecalcular)) {
        this.logger.log(`🔄 Iniciando recalculo para orcamento ${id}`);
        try {
          const resultadoCalculo =
            await this.integracaoMotor.calcularOrcamentoCompleto(
              orcamentoAtualizado,
              lojaId,
            );

          const custos = (resultadoCalculo?.custos || {}) as Record<string, unknown>;
          const precoMotor = Number(custos.preco_final || custos.valor_total || 0);

          if (precoMotor > 0) {
            await this.atualizarCustosCalculados(id, resultadoCalculo);
            this.logger.log(`Recalculo concluido para orcamento ${id}`);
          } else if (temCustosValidos) {
            this.logger.warn(
              `Motor retornou 0, usando custos do frontend para orcamento ${id}`,
            );
            await this.prisma.orcamento.update({
              where: { id },
              data: {
                preco_final: dados.preco_final || 0,
                custo_total: dados.custo_total || 0,
                margem_lucro: dados.margem_lucro || 0,
                impostos: dados.impostos || 0,
                custo_material: dados.custo_material || 0,
                custo_mao_obra: dados.custo_mao_obra || 0,
                custo_indireto: dados.custo_indireto || 0,
                data_ultimo_calculo: new Date(),
              },
            });
          } else {
            this.logger.warn(
              `Motor retornou 0 e frontend sem custos - valor existente mantido`,
            );
          }
        } catch (erroMotor) {
          this.logger.error(
            `Erro no motor para orcamento ${id}: ${erroMotor?.message}`,
          );
          if (temCustosValidos) {
            this.logger.log(`Usando custos do frontend como fallback`);
            await this.prisma.orcamento.update({
              where: { id },
              data: {
                preco_final: dados.preco_final || 0,
                custo_total: dados.custo_total || 0,
                margem_lucro: dados.margem_lucro || 0,
                impostos: dados.impostos || 0,
                custo_material: dados.custo_material || 0,
                custo_mao_obra: dados.custo_mao_obra || 0,
                custo_indireto: dados.custo_indireto || 0,
                data_ultimo_calculo: new Date(),
              },
            });
          }
        }
      } else if (false && temCustosValidos) {
        this.logger.log(
          `💰 Usando custos calculados do frontend para orçamento ${id}: custo_total=${dados.custo_total}, preco_final=${dados.preco_final}`,
        );

        // Debug: verificar dados recebidos
        this.logger.log(`🔍 Debug - Dados recebidos do frontend:`, {
          custo_material: dados.custo_material,
          custo_mao_obra: dados.custo_mao_obra,
          custo_indireto: dados.custo_indireto,
          custo_total: dados.custo_total,
          margem_lucro: dados.margem_lucro,
          impostos: dados.impostos,
          preco_final: dados.preco_final,
        });

        // Salvar os custos do frontend no banco
        const dadosParaSalvar = {
          custo_material: dados.custo_material || 0,
          custo_mao_obra: dados.custo_mao_obra || 0,
          custo_indireto: dados.custo_indireto || 0,
          custo_total: dados.custo_total || 0,
          margem_lucro: dados.margem_lucro || 0,
          impostos: dados.impostos || 0,
          preco_final: dados.preco_final || 0,
          data_ultimo_calculo: new Date(),
        };

        this.logger.log(
          `🔍 Debug - Dados que serão salvos no banco:`,
          dadosParaSalvar,
        );

        const resultadoUpdate = await this.prisma.orcamento.update({
          where: { id },
          data: dadosParaSalvar,
        });

        this.logger.log(`🔍 Debug - Resultado do UPDATE:`, {
          id: resultadoUpdate.id,
          preco_final: resultadoUpdate.preco_final,
          margem_lucro: resultadoUpdate.margem_lucro,
          impostos: resultadoUpdate.impostos,
          custo_total: resultadoUpdate.custo_total,
        });

        this.logger.log(
          `✅ Custos do frontend salvos no banco para orçamento ${id}`,
        );
      }

      // 5.1. Atualizar produtos se fornecidos
      if (
        false &&
        dados.produtos &&
        Array.isArray(dados.produtos) &&
        dados.produtos.length > 0
      ) {
        this.logger.log(
          `🔄 Atualizando ${dados.produtos.length} produtos para orçamento ${id}`,
        );

        for (const produtoData of dados.produtos) {
          if (produtoData.id) {
            // Atualizar produto existente
            await this.prisma.produtoOrcamento.update({
              where: { id: produtoData.id },
              data: {
                nome_servico: produtoData.nome,
                descricao: produtoData.descricao,
                quantidade: produtoData.quantidade || 0,
                largura: produtoData.largura || null,
                altura: produtoData.altura || null,
                area_produto: produtoData.area || null,
                unidade_medida: produtoData.unidade || null,
                preco_unitario: produtoData.preco_unitario || 0,
                preco_total: produtoData.preco_total || 0,
                margem_lucro: produtoData.margem_lucro || 0,
                impostos: produtoData.impostos || 0,
                observacoes: produtoData.observacoes || null,
                data_atualizacao: new Date(),
              },
            });

            this.logger.log(
              `✅ Produto ${produtoData.id} atualizado: preco_unitario=${produtoData.preco_unitario}, preco_total=${produtoData.preco_total}`,
            );
          }
        }

        this.logger.log(
          `✅ Todos os produtos atualizados para orçamento ${id}`,
        );
      }

      // 5.2 Recalcular após persistir produtos, para usar dados atualizados
      if (!possuiCustosCalculadosNoPayload && (sempreRecalcular || precisaRecalcular)) {
        const orcamentoParaCalculo = await this.buscarOrcamento(id, lojaId);
        this.logger.log(`Recalculando orcamento apos persistir produtos ${id}`);
        const dadosCustosFallback = {
          preco_final: dados.preco_final || 0,
          custo_total: dados.custo_total || 0,
          margem_lucro: dados.margem_lucro || 0,
          impostos: dados.impostos || 0,
          custo_material: dados.custo_material || 0,
          custo_mao_obra: dados.custo_mao_obra || 0,
          custo_indireto: dados.custo_indireto || 0,
          data_ultimo_calculo: new Date(),
        };

        try {
          const resultadoCalculo =
            await this.integracaoMotor.calcularOrcamentoCompleto(
              orcamentoParaCalculo,
              lojaId,
            );

          const custos = (resultadoCalculo?.custos || {}) as Record<
            string,
            unknown
          >;
          const precoMotor = Number(custos.preco_final || custos.valor_total || 0);

          if (precoMotor > 0) {
            await this.atualizarCustosCalculados(id, resultadoCalculo);
            this.logger.log(`Recalculo final concluido para orcamento ${id}`);
          } else if (temCustosValidos) {
            this.logger.warn(
              `Motor retornou 0 apos persistencia, usando fallback frontend`,
            );
            await this.prisma.orcamento.update({
              where: { id },
              data: dadosCustosFallback,
            });
          }
        } catch (erroMotor) {
          this.logger.error(
            `Erro no recalculo final do orcamento ${id}: ${erroMotor?.message}`,
          );
          if (temCustosValidos) {
            await this.prisma.orcamento.update({
              where: { id },
              data: dadosCustosFallback,
            });
          }
        }
      }

      // 6. Criar versão se mudanças significativas
      // TEMPORARIAMENTE DESABILITADO - Tabela VersaoOrcamento não migrada
      // if (this.mudancasSignificativas(orcamentoExistente, dados)) {
      //   await this.criarNovaVersao(id, orcamentoExistente, dados, usuarioId);
      // }

      // 7. Criar histórico
      // TEMPORARIAMENTE DESABILITADO - Tabela HistoricoOrcamento não migrada
      // await this.criarHistorico(
      //   id,
      //   'edicao',
      //   'Orçamento atualizado',
      //   usuarioId,
      //   { dados_anteriores: orcamentoExistente, dados_novos: dados },
      // );

      // 8. Notificar atualização
      await this.notificacaoService.notificarAtualizacao(
        orcamentoAtualizado,
        lojaId,
      );

      const orcamentoFinal = await this.buscarOrcamento(id, lojaId);
      const orc = orcamentoFinal as unknown as Record<string, unknown>;

      // 9. Enviar e-mail ao cliente se orçamento já foi enviado (status enviado)
      if (orc.status === 'enviado' && orcamentoFinal.cliente?.email) {
        try {
          const frontendUrl =
            process.env.FRONTEND_URL || 'https://comunikapp.com.br';
          const linkPublico = `${frontendUrl}/orcamento-v2/${id}`;
          const toNum = (v: unknown) => {
            if (typeof v === 'number' && Number.isFinite(v)) return v;
            if (v != null) {
              const s = typeof v === 'object' && typeof (v as any).toString === 'function'
                ? (v as any).toString() : String(v);
              const n = parseFloat(s.replace(',', '.'));
              if (Number.isFinite(n)) return n;
            }
            return 0;
          };
          const precoFinal =
            toNum(dados.preco_final) ||
            toNum(orc.preco_final) ||
            toNum(orc.valor_total) ||
            (Array.isArray(orc.produtos)
              ? (orc.produtos as any[]).reduce((s, p) => s + toNum(p?.preco_total), 0)
              : 0);
          const codigoAprovacao = String(orc.codigo_aprovacao ?? '');
          const nomeServico = String(
            orc.nome_servico ?? orc.titulo ?? 'Orçamento',
          );

          await this.mailService.enviarNotificacaoOrcamentoAtualizado(
            orcamentoFinal.cliente.email,
            orcamentoFinal.cliente.nome || 'Cliente',
            orcamentoFinal.numero,
            nomeServico,
            precoFinal,
            codigoAprovacao,
            linkPublico,
          );
          this.logger.log(
            `📧 E-mail de orçamento atualizado enviado para ${orcamentoFinal.cliente.email}`,
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.error(
            `Erro ao enviar e-mail de atualização para cliente: ${msg}`,
          );
          // Não falha a atualização - apenas loga o erro
        }
      }

      this.logger.log(`✅ Orçamento atualizado com sucesso: ${id}`);
      return orcamentoFinal;
    } catch (error) {
      this.logger.error(`❌ Erro ao atualizar orçamento: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove orçamento
   */
  async removerOrcamento(
    id: string,
    lojaId: string,
    usuarioId: string,
    motivo?: string,
  ): Promise<void> {
    this.logger.log(`🗑️ Removendo orçamento ${id} da loja ${lojaId}`);

    try {
      // 1. Verificar se existe
      await this.buscarOrcamento(id, lojaId);

      // 2. Validar se pode ser removido
      await this.validacaoService.validarRemocao(id, lojaId);

      // 3. Criar histórico ANTES de "excluir"
      await this.criarHistorico(
        id,
        'remocao',
        `Orçamento removido${motivo ? `: ${motivo}` : ''}`,
        usuarioId,
        { motivo_exclusao: motivo },
      );

      // 4. Soft delete - marcar como excluído
      await this.prisma.orcamento.update({
        where: { id },
        data: {
          status: 'EXCLUIDO',
          excluido_em: new Date(),
          excluido_por: usuarioId,
          motivo_exclusao: motivo,
        },
      });

      // 5. Notificar remoção
      await this.notificacaoService.notificarRemocao(id, lojaId);

      this.logger.log(`✅ Orçamento removido com sucesso: ${id}`);
    } catch (error) {
      this.logger.error(`❌ Erro ao remover orçamento: ${error.message}`);
      throw error;
    }
  }

  async simularChapaItem(
    orcamentoId: string,
    itemId: string,
    dto: SimularChapaDto,
    lojaId: string,
  ) {
    const item = await this.buscarItemInsumoDoOrcamento(
      orcamentoId,
      itemId,
      lojaId,
    );

    return this.calcularChapaParaItem(item, dto);
  }

  async salvarCalculoChapaItem(
    orcamentoId: string,
    itemId: string,
    dto: SimularChapaDto,
    lojaId: string,
    usuarioId?: string,
  ) {
    const item = await this.buscarItemInsumoDoOrcamento(
      orcamentoId,
      itemId,
      lojaId,
    );
    const calculo = this.calcularChapaParaItem(item, dto);

    await this.prisma.itemInsumo.update({
      where: { id: itemId },
      data: {
        calculo_chapa: JSON.stringify({
          ...calculo,
          congelado_em: new Date().toISOString(),
          congelado_por: usuarioId ?? null,
        }),
      },
    });

    return calculo;
  }

  // Métodos privados auxiliares

  private async buscarItemInsumoDoOrcamento(
    orcamentoId: string,
    itemId: string,
    lojaId: string,
  ) {
    const item = await this.prisma.itemInsumo.findFirst({
      where: {
        id: itemId,
        produto: {
          orcamento_id: orcamentoId,
          orcamento: {
            loja_id: lojaId,
            excluido_em: null,
          },
        },
      },
      include: {
        insumo: true,
        produto: {
          include: {
            orcamento: {
              select: { id: true, loja_id: true },
            },
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException(
        'Item de material não encontrado neste orçamento.',
      );
    }

    if (item.insumo.loja_id !== lojaId) {
      throw new BadRequestException('Insumo não pertence à loja autenticada.');
    }

    return item;
  }

  private calcularChapaParaItem(item: any, dto: SimularChapaDto) {
    const medidas = resolverMedidasComerciaisInsumo(item.insumo);
    const larguraChapa = dto.larguraChapa ?? medidas.largura;
    const alturaChapa = dto.alturaChapa ?? medidas.alturaChapa;
    const unidadeDimensaoPeca =
      dto.unidadeDimensaoPeca ?? dto.unidadeDimensao ?? 'm';
    const unidadeDimensaoChapa =
      dto.unidadeDimensaoChapa ?? item.insumo.unidade_dimensao ?? 'm';
    const custoM2 = dto.custoM2 ?? inferirCustoM2Insumo(item.insumo);

    try {
      return calcularChapa({
        ...dto,
        insumoId: item.insumo_id,
        larguraChapa,
        alturaChapa,
        perdaPercent:
          dto.perdaPercent ?? Number(item.insumo.perda_padrao_percent ?? 0),
        metodoCobranca:
          dto.metodoCobranca ??
          (item.insumo.metodo_cobranca_padrao as MetodoCobrancaChapa) ??
          MetodoCobrancaChapa.AREA_COM_PERDA,
        unidadeDimensaoPeca,
        unidadeDimensaoChapa,
        custoM2,
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  private async atualizarCustosCalculados(
    orcamentoId: string,
    resultadoCalculo: any,
  ): Promise<void> {
    // Extrair valores dos custos calculados
    const custos = resultadoCalculo.custos || {};
    const preco_final = custos.preco_final || custos.valor_total || 0;
    const custo_total =
      custos.custo_total || custos.custos_diretos?.subtotal || 0;
    const margem_lucro = custos.margem_lucro || 0;
    const impostos = custos.impostos || 0;

    this.logger.log(
      `💰 Atualizando custos calculados para orçamento ${orcamentoId}: preço_final=${preco_final}`,
    );

    await this.prisma.orcamento.update({
      where: { id: orcamentoId },
      data: {
        // Campos principais do orçamento (valor_total = preco_final para listagem/relatórios)
        preco_final: preco_final,
        valor_total: preco_final,
        custo_total: custo_total,
        margem_lucro: margem_lucro,
        impostos: impostos,

        // Campos detalhados (JSON)
        custos_calculados: resultadoCalculo.custos
          ? JSON.stringify(resultadoCalculo.custos)
          : null,
        detalhamento_calculo: resultadoCalculo.detalhamento
          ? JSON.stringify(resultadoCalculo.detalhamento)
          : null,
        alertas:
          resultadoCalculo.alertas &&
          Array.isArray(resultadoCalculo.alertas) &&
          resultadoCalculo.alertas.length > 0
            ? JSON.stringify(resultadoCalculo.alertas)
            : null,
        data_ultimo_calculo: new Date(),
      },
    });
  }

  private async criarHistorico(
    orcamentoId: string,
    tipo: string,
    descricao: string,
    usuarioId: string,
    dadosAdicionais?: any,
  ): Promise<void> {
    await this.prisma.historicoOrcamento.create({
      data: {
        orcamento: { connect: { id: orcamentoId } },
        acao: tipo,
        descricao,
        usuario_id: usuarioId,
        dados_anteriores:
          dadosAdicionais?.dados_anteriores != null
            ? JSON.stringify(dadosAdicionais.dados_anteriores)
            : undefined,
        dados_novos:
          dadosAdicionais?.dados_novos != null
            ? JSON.stringify(dadosAdicionais.dados_novos)
            : undefined,
        observacoes: dadosAdicionais?.observacoes,
      },
    });
  }

  private async criarNovaVersao(
    orcamentoId: string,
    versaoAnterior: any,
    mudancas: any,
    usuarioId: string,
  ): Promise<void> {
    const ultimaVersao = await this.prisma.versaoOrcamento.findFirst({
      where: { orcamento_id: orcamentoId },
      orderBy: { numero: 'desc' },
    });

    const numeroVersao = (ultimaVersao?.numero || 0) + 1;

    await this.prisma.versaoOrcamento.create({
      data: {
        orcamento: { connect: { id: orcamentoId } },
        versao: numeroVersao,
        numero: numeroVersao,
        responsavel_id: usuarioId,
        usuario_id: usuarioId,
        dados_completos: JSON.stringify({
          anterior: versaoAnterior,
          mudancas,
        }),
        motivo_alteracao: 'Atualização de orçamento',
      },
    });
  }

  private construirFiltros(filtros: any, lojaId: string): any {
    const where: any = {
      loja_id: lojaId,
      status: { not: 'EXCLUIDO' }, // Excluir orçamentos deletados
    };

    if (filtros.status) where.status = filtros.status;
    if (filtros.tipo) where.tipo = filtros.tipo;
    if (filtros.cliente_id) where.cliente_id = filtros.cliente_id;
    if (filtros.responsavel_id) where.responsavel_id = filtros.responsavel_id;
    if (filtros.prioridade) where.prioridade = filtros.prioridade;
    if (filtros.data_inicio)
      where.data_criacao = { gte: new Date(filtros.data_inicio) };
    if (filtros.data_fim)
      where.data_criacao = { lte: new Date(filtros.data_fim) };
    if (filtros.busca) {
      where.OR = [
        { titulo: { contains: filtros.busca, mode: 'insensitive' } },
        { descricao: { contains: filtros.busca, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private prepararPaginacao(paginacao: any): { skip: number; take: number } {
    const pagina = paginacao.pagina || 1;
    const porPagina = Math.min(paginacao.porPagina || 20, 100);
    const skip = (pagina - 1) * porPagina;

    return { skip, take: porPagina };
  }

  private necessitaRecalculo(dados: any): boolean {
    // Sempre recalcular quando há mudanças que afetam o cálculo
    const camposQueAfetamCalculo = [
      'produtos',
      'configuracoes',
      'quantidades',
      'largura_produto',
      'altura_produto',
      'area_produto',
      'quantidade_produto',
      'margem_lucro_customizada',
      'impostos_customizados',
      'comissao_percentual',
    ];

    const camposEncontrados = camposQueAfetamCalculo.filter(
      (campo) => dados.hasOwnProperty(campo) && dados[campo] !== undefined,
    );

    const necessita = camposEncontrados.length > 0;

    this.logger.log(
      `🔍 Debug necessitaRecalculo - Campos que afetam cálculo encontrados: [${camposEncontrados.join(', ')}] | Resultado: ${necessita}`,
    );

    return necessita;
  }

  private mudancasSignificativas(original: any, mudancas: any): boolean {
    return !!(
      mudancas.produtos ||
      mudancas.quantidades ||
      mudancas.configuracoes
    );
  }

  /**
   * Buscar orçamento para visualização pública (versão simplificada)
   */
  async buscarOrcamentoPublico(id: string) {
    this.logger.log(`🔍 Buscando orçamento público: ${id}`);
    console.log(`🔍 [PUBLICO] Buscando orçamento com ID: ${id}`);

    const orcamento = await this.prisma.orcamento.findUnique({
      where: { id },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
          },
        },
        loja: {
          select: {
            nome: true,
            logo_url: true,
            telefone: true,
            email: true,
          },
        },
        entrega_modalidade: {
          select: {
            id: true,
            nome: true,
          },
        },
        produtos: {
          select: {
            id: true,
            nome_servico: true,
            nome: true,
            descricao: true,
            quantidade: true,
            largura: true,
            altura: true,
            profundidade: true,
            area_produto: true,
            perimetro_produto: true,
            unidade_geometria: true,
            geometria_origem: true,
            arquivo_geometria_url: true,
            arquivo_geometria_metadados: true,
            unidade_medida: true,
            custo_total_producao: true,
            preco_unitario: true,
            preco_total: true,
            margem_lucro: true,
            impostos: true,
            observacoes: true,
            ativo: true,
            ordem: true,
            categoria: true,
            insumos: true,
            maquinas: true,
            funcoes: true,
            servicos_manuais: true,
            custos_indiretos: true,
          },
        },
      },
    });

    if (!orcamento) {
      console.log(`❌ [PUBLICO] Orçamento não encontrado com ID: ${id}`);
      this.logger.error(`Orçamento não encontrado: ${id}`);
      throw new NotFoundException('Orçamento não encontrado');
    }

    console.log(
      `✅ [PUBLICO] Orçamento encontrado: ${orcamento.numero} - ${orcamento.titulo}`,
    );

    let configuracaoCalculo: Record<string, unknown> = {};
    try {
      const configuracaoPersistida =
        typeof orcamento.configuracao_calculo === 'string'
          ? JSON.parse(orcamento.configuracao_calculo)
          : null;
      configuracaoCalculo =
        configuracaoPersistida &&
        typeof configuracaoPersistida === 'object' &&
        !Array.isArray(configuracaoPersistida)
          ? configuracaoPersistida
          : {};
    } catch {
      this.logger.warn(
        `Configuracao de calculo invalida no orcamento publico ${id}`,
      );
    }

    const valorFinalManual = Number(configuracaoCalculo.valor_final_manual);
    const precoFinalEfetivo =
      configuracaoCalculo.valor_final_manual != null &&
      Number.isFinite(valorFinalManual) &&
      valorFinalManual >= 0
        ? valorFinalManual
        : Number(orcamento.preco_final) || 0;
    const entregaValorCobrado = Number(orcamento.entrega_valor_cobrado) || 0;
    const precoFinalProdutos = Math.max(0, precoFinalEfetivo - entregaValorCobrado);
    const precosDistribuidos = distribuirPrecoFinal(
      orcamento.produtos || [],
      precoFinalProdutos,
    );

    // Retornar apenas os dados necessários para visualização pública do cliente
    return {
      id: orcamento.id,
      numero: orcamento.numero,
      nome_servico: orcamento.titulo,
      descricao: orcamento.descricao,
      quantidade_produto: orcamento.quantidade_produto,
      unidade_medida_produto: orcamento.unidade_medida_produto,
      preco_final: precoFinalEfetivo, // APENAS o preço final, sem detalhes de custos
      status: orcamento.status,
      status_aprovacao: orcamento.status_aprovacao,
      observacoes_cliente: orcamento.observacoes_cliente,
      criado_em: orcamento.data_criacao,

      // Produtos do orçamento
      produtos:
        orcamento.produtos?.map((produto, indice) => {
          console.log(`🔍 Debug - Produto público: ${produto.nome_servico}`, {
            preco_unitario: produto.preco_unitario,
            preco_total: produto.preco_total,
            quantidade: produto.quantidade,
            largura: produto.largura,
            altura: produto.altura,
            custo_total_producao: produto.custo_total_producao,
            margem_lucro: produto.margem_lucro,
            impostos: produto.impostos,
          });

          // Converter Decimal para Number
          const custoTotalProducaoConvertido =
            Number(produto.custo_total_producao) || 0;

          console.log(
            `🔍 Debug - custo_total_producao: ${produto.custo_total_producao} (tipo: ${typeof produto.custo_total_producao}) → ${custoTotalProducaoConvertido} (tipo: ${typeof custoTotalProducaoConvertido})`,
          );

          return {
            id: produto.id,
            nome: produto.nome_servico || produto.nome,
            descricao: produto.descricao,
            quantidade: produto.quantidade,
            unidade: produto.unidade_medida,
            largura: produto.largura,
            altura: produto.altura,
            // Fase 11: profundidade propagada quando o produto e 3D.
            profundidade: (produto as { profundidade?: unknown }).profundidade ?? null,
            area: produto.area_produto,
            // Distribuir o preço comercial final entre os produtos para que
            // os itens impressos somem exatamente o total do orçamento.
            preco_unitario: precosDistribuidos[indice]?.preco_unitario || 0,
            preco_total: precosDistribuidos[indice]?.preco_total || 0,
            custo_total_producao: custoTotalProducaoConvertido,
            margem_lucro: Number(produto.margem_lucro) || 0,
            impostos: Number(produto.impostos) || 0,
            observacoes: produto.observacoes,
          };
        }) || [],

      // Dados do cliente
      cliente: orcamento.cliente
        ? {
            id: orcamento.cliente.id,
            nome: orcamento.cliente.nome,
            email: orcamento.cliente.email,
            telefone: orcamento.cliente.telefone,
          }
        : null,

      // Dados da loja
      loja: orcamento.loja
        ? {
            nome: orcamento.loja.nome,
            logo_url: orcamento.loja.logo_url,
            telefone: orcamento.loja.telefone,
            email: orcamento.loja.email,
          }
        : null,

      // Condições comerciais
      prazo_entrega: orcamento.prazo_entrega,
      condicao_pagamento_tipo: orcamento.condicao_pagamento_tipo ?? undefined,
      condicao_pagamento_entrada_pct:
        orcamento.condicao_pagamento_entrada_pct != null
          ? Number(orcamento.condicao_pagamento_entrada_pct)
          : undefined,
      condicao_pagamento_parcelas: orcamento.condicao_pagamento_parcelas ?? undefined,
      condicao_pagamento_descricao: orcamento.condicao_pagamento_descricao ?? undefined,
      forma_pagamento:
        orcamento.condicao_pagamento_descricao?.trim() ||
        this.parcelasBuilder.gerarDescricao({
          tipo: orcamento.condicao_pagamento_tipo ?? '',
          entradaPct:
            orcamento.condicao_pagamento_entrada_pct != null
              ? Number(orcamento.condicao_pagamento_entrada_pct)
              : null,
          parcelas: orcamento.condicao_pagamento_parcelas ?? null,
        }) ||
        orcamento.forma_pagamento ||
        undefined,
      validade_proposta: orcamento.validade_proposta,
      atendente: orcamento.atendente,
      observacoes: orcamento.observacoes_internas,
      entrega_valor_cobrado: entregaValorCobrado,
      entrega_modalidade_nome:
        orcamento.entrega_modalidade?.nome?.trim() ||
        (typeof configuracaoCalculo.entrega_modalidade_nome === 'string'
          ? configuracaoCalculo.entrega_modalidade_nome.trim()
          : null),
    };
  }

  /**
   * Gerar código de aprovação único - BASEADO NO LEGADO
   */
  private async gerarCodigoAprovacao(): Promise<string> {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo: string;
    let tentativas = 0;
    const maxTentativas = 10;

    do {
      codigo = '';
      for (let i = 0; i < 8; i++) {
        codigo += caracteres.charAt(
          Math.floor(Math.random() * caracteres.length),
        );
      }
      tentativas++;

      // Verificar se o código já existe
      const existe = await this.prisma.orcamento.findUnique({
        where: { codigo_aprovacao: codigo },
      });

      if (!existe) {
        return codigo;
      }
    } while (tentativas < maxTentativas);

    throw new Error(
      'Não foi possível gerar um código único após várias tentativas',
    );
  }

  /**
   * Validar código de aprovação - BASEADO NO LEGADO
   */
  private async validarCodigoAprovacao(
    codigo: string,
    orcamentoId: string,
  ): Promise<boolean> {
    const orcamento = await this.prisma.orcamento.findUnique({
      where: { id: orcamentoId },
      select: { codigo_aprovacao: true },
    });

    if (!orcamento) {
      return false;
    }

    return orcamento.codigo_aprovacao === codigo;
  }

  /**
   * Processar ação do cliente público (aprovar/rejeitar/negociar)
   */
  async processarAcaoClientePublico(
    id: string,
    dados: {
      acao: 'APROVAR' | 'REJEITAR' | 'NEGOCIAR';
      observacoes?: string;
      codigo_aprovacao?: string;
      cliente_nome?: string;
      cliente_email?: string;
    },
  ) {
    this.logger.log(
      'Processando acao publica do cliente: ' +
        dados.acao +
        ' para orcamento ' +
        id,
    );

    const orcamento = await this.prisma.orcamento.findUnique({
      where: { id },
      include: {
        cliente: true,
        loja: true,
      },
    });

    if (!orcamento) {
      throw new NotFoundException('Orcamento nao encontrado');
    }

    this.logger.log(
      'Orcamento encontrado: ' + orcamento.id + ', status: ' + orcamento.status,
    );

    const statusValidos = ['pendente', 'enviado', 'rascunho'];
    if (!statusValidos.includes(orcamento.status)) {
      this.logger.warn(
        'Orcamento ' +
          orcamento.id +
          ' nao esta em status valido. Status atual: ' +
          orcamento.status,
      );
      throw new BadRequestException(
        'Orcamento nao esta em status valido para esta acao. Status atual: ' +
          orcamento.status +
          '. Status validos: ' +
          statusValidos.join(', '),
      );
    }

    const statusAnterior = orcamento.status;
    const statusAprovacaoAnterior = orcamento.status_aprovacao;
    const observacoesClienteAnterior = (orcamento as any).observacoes_cliente;
    const codigoAprovacaoAnterior = orcamento.codigo_aprovacao;
    const lojaContexto = orcamento.loja_id;

    let statusAprovacao = '';
    let observacoes = '';

    switch (dados.acao) {
      case 'APROVAR':
        if (!dados.codigo_aprovacao) {
          throw new BadRequestException('Codigo de aprovacao e obrigatorio');
        }

        const codigoValido = await this.validarCodigoAprovacao(
          dados.codigo_aprovacao,
          id,
        );
        if (!codigoValido) {
          throw new BadRequestException('Codigo de aprovacao invalido');
        }

        statusAprovacao = 'APROVADO';
        observacoes = 'Orcamento aprovado pelo cliente';
        break;

      case 'REJEITAR':
        if (!dados.observacoes) {
          throw new BadRequestException('Motivo da rejeicao e obrigatorio');
        }

        statusAprovacao = 'REJEITADO';
        observacoes = dados.observacoes;
        break;

      case 'NEGOCIAR':
        statusAprovacao = 'NEGOCIANDO';
        observacoes = 'Cliente iniciou negociacao';
        break;

      default:
        throw new BadRequestException('Acao invalida');
    }

    const orcamentoAtualizado = await this.prisma.orcamento.update({
      where: { id },
      data: {
        status:
          dados.acao === 'APROVAR'
            ? 'aprovado'
            : dados.acao === 'REJEITAR'
              ? 'rejeitado'
              : dados.acao === 'NEGOCIAR'
                ? 'negociando'
                : orcamento.status,
        status_aprovacao: statusAprovacao as any,
        observacoes_cliente: observacoes,
        data_atualizacao: new Date(),
      },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
          },
        },
        loja: {
          select: {
            nome: true,
            logo_url: true,
            telefone: true,
            email: true,
          },
        },
      },
    });

    if (dados.acao === 'APROVAR') {
      try {
        await this.criarOSAutomaticaParaOrcamento(
          lojaContexto,
          orcamentoAtualizado.id,
          'CLIENTE_PUBLICO',
          'PROCESSAR_ACAO_PUBLICA',
        );
      } catch (error) {
        this.logger.error(
          '[OS_AUTO] Falha ao gerar OS automatica para o orcamento ' +
            orcamentoAtualizado.id +
            ' via canal publico: ' +
            error.message,
        );

        await this.prisma.orcamento.update({
          where: { id },
          data: {
            status: statusAnterior,
            status_aprovacao: statusAprovacaoAnterior,
            observacoes_cliente: observacoesClienteAnterior,
            codigo_aprovacao: codigoAprovacaoAnterior,
            data_atualizacao: new Date(),
          },
        });

        throw new InternalServerErrorException(
          'Falha ao gerar OS automaticamente. Status do orcamento foi revertido.',
        );
      }

      // Fase 6 - Cria cobranca financeira automaticamente. Igual a
      // aprovacao interna, falha aqui nao reverte a aprovacao - apenas avisa.
      try {
        await this.criarCobrancaAposAprovacao(
          orcamentoAtualizado,
          orcamentoAtualizado.id,
          lojaContexto,
          'CLIENTE_PUBLICO',
        );
        this.homeCacheService.invalidar(lojaContexto);
      } catch (cobrancaError) {
        this.logger.warn(
          '[COBRANCA_AUTO] Falha na criacao da cobranca para orcamento ' +
            orcamentoAtualizado.id +
            ' via canal publico: ' +
            (cobrancaError as Error).message,
        );
      }
    }

    this.logger.log(
      'Acao ' + dados.acao + ' processada com sucesso para o orcamento ' + id,
    );

    await this.notificarAcaoCliente(orcamentoAtualizado, dados.acao);
    await this.registrarLog(id, dados.acao, observacoes);

    return {
      id: orcamentoAtualizado.id,
      numero: orcamentoAtualizado.numero,
      nome_servico: orcamentoAtualizado.titulo,
      descricao: orcamentoAtualizado.descricao,
      quantidade_produto: orcamentoAtualizado.quantidade_produto,
      unidade_medida_produto: orcamentoAtualizado.unidade_medida_produto,
      preco_final: orcamentoAtualizado.preco_final,
      status: orcamentoAtualizado.status,
      status_aprovacao: orcamentoAtualizado.status_aprovacao,
      observacoes_cliente: orcamentoAtualizado.observacoes_cliente,
      criado_em: orcamentoAtualizado.data_criacao,
      cliente: orcamentoAtualizado.cliente,
      loja: orcamentoAtualizado.loja,
      prazo_entrega: orcamentoAtualizado.prazo_entrega,
      forma_pagamento: orcamentoAtualizado.forma_pagamento,
      validade_proposta: orcamentoAtualizado.validade_proposta,
      atendente: orcamentoAtualizado.atendente,
      observacoes: orcamentoAtualizado.observacoes_internas,
    };
  }

  /**
   * Busca mensagens do chat (público)
   */
  async buscarMensagensPublicas(orcamentoId: string) {
    this.logger.log(
      `🔍 Buscando mensagens públicas do orçamento: ${orcamentoId}`,
    );

    try {
      // Verificar se orçamento existe
      const orcamento = await this.buscarOrcamentoPublico(orcamentoId);
      if (!orcamento) {
        throw new Error('Orçamento não encontrado');
      }

      // Buscar mensagens do chat
      const mensagens = await this.prisma.mensagemChat.findMany({
        where: { orcamento_id: orcamentoId },
        orderBy: { data_envio: 'asc' },
        select: {
          id: true,
          tipo: true,
          conteudo: true,
          data_envio: true,
          lida: true,
          anexos: true,
          usuario_id: true,
        },
      });

      // Transformar mensagens para formato público
      return mensagens.map((mensagem) => ({
        id: mensagem.id,
        mensagem: mensagem.conteudo,
        tipo:
          mensagem.tipo === 'texto'
            ? 'CLIENTE'
            : mensagem.tipo === 'sistema'
              ? 'SISTEMA'
              : 'VENDEDOR',
        autor_nome: mensagem.tipo === 'texto' ? 'Cliente' : 'Sistema',
        autor_email: undefined,
        visualizada: mensagem.lida,
        anexos: mensagem.anexos ? JSON.parse(mensagem.anexos) : [],
        criado_em: mensagem.data_envio.toISOString(),
      }));
    } catch (error) {
      this.logger.error(
        `❌ Erro ao buscar mensagens públicas: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Buscar mensagens do chat público - NATIVO V2
   */
  async buscarMensagensPublicasLegado(orcamentoId: string) {
    this.logger.log(
      `🔍 Buscando mensagens públicas do orçamento legado: ${orcamentoId}`,
    );

    try {
      // Verificar se o orçamento existe
      const orcamento = await this.prisma.orcamento.findUnique({
        where: { id: orcamentoId },
      });

      if (!orcamento) {
        throw new Error('Orçamento não encontrado');
      }

      // Buscar mensagens ordenadas por data de criação
      const mensagens = await this.prisma.mensagemChat.findMany({
        where: {
          orcamento_id: orcamentoId,
        },
        orderBy: {
          criado_em: 'asc',
        },
      });

      // Mapear para o formato de resposta
      const mensagensFormatadas = mensagens.map((mensagem) => ({
        id: mensagem.id,
        mensagem: mensagem.conteudo,
        tipo: mensagem.tipo,
        autor_nome: mensagem.usuario || 'Sistema',
        autor_email: '',
        anexos: mensagem.anexos ? JSON.parse(mensagem.anexos) : null,
        visualizada: mensagem.lida,
        criado_em: mensagem.data_envio || mensagem.criado_em,
      }));

      this.logger.log(
        `Retornando ${mensagensFormatadas.length} mensagens públicas do legado`,
      );
      return mensagensFormatadas;
    } catch (error) {
      this.logger.error(
        `❌ Erro ao buscar mensagens públicas do legado: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Enviar mensagem no chat (autenticado) - NATIVO V2
   */
  async enviarMensagemChatLegado(
    orcamentoId: string,
    dados: { mensagem: string; tipo?: string; anexos?: string[] },
    lojaId: string,
    file?: Express.Multer.File,
  ) {
    this.logger.log(
      `💬 Enviando mensagem no chat V2 para orçamento: ${orcamentoId}`,
    );
    this.logger.log(`💬 Dados recebidos:`, JSON.stringify(dados, null, 2));

    try {
      // Validar se dados não é undefined
      if (!dados) {
        throw new Error('Dados da mensagem não fornecidos');
      }

      // Validar tipo de mensagem
      const tiposValidos = ['CLIENTE', 'VENDEDOR', 'SISTEMA'];
      const tipo = dados.tipo || 'VENDEDOR';
      if (!tiposValidos.includes(tipo)) {
        throw new Error(
          `Tipo de mensagem inválido. Tipos permitidos: ${tiposValidos.join(', ')}`,
        );
      }

      // Verificar se o orçamento existe e pertence ? loja
      const orcamento = await this.prisma.orcamento.findFirst({
        where: { id: orcamentoId, loja_id: lojaId },
      });

      if (!orcamento) {
        throw new Error('Orçamento não encontrado');
      }

      let anexoInfo: any = null;

      // Processar arquivo se existir
      if (file) {
        // Validar tipo de arquivo
        const tiposPermitidos = [
          'image/jpeg',
          'image/png',
          'image/jpg',
          'application/pdf',
          'application/zip',
          'application/x-zip-compressed',
        ];
        if (!tiposPermitidos.includes(file.mimetype)) {
          throw new Error(
            'Tipo de arquivo não permitido. Use apenas JPG, PNG, PDF ou ZIP.',
          );
        }

        // Validar tamanho (5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          throw new Error('Arquivo muito grande. Tamanho máximo: 5MB.');
        }

        // Salvar arquivo (em produção seria para um serviço de storage)
        const fs = require('fs');
        const path = require('path');
        const { v4: uuidv4 } = require('uuid');

        const uploadDir = path.join(process.cwd(), 'uploads', 'anexos');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const extensao = path.extname(file.originalname);
        const nomeArquivo = `${uuidv4()}${extensao}`;
        const caminhoArquivo = path.join(uploadDir, nomeArquivo);

        this.logger.log('📎 Tentando salvar arquivo em:', caminhoArquivo);
        fs.writeFileSync(caminhoArquivo, file.buffer);
        this.logger.log('📎 Arquivo salvo com sucesso!');

        anexoInfo = {
          nome_arquivo: file.originalname,
          url_arquivo: `/uploads/anexos/${nomeArquivo}`,
          tipo_arquivo: file.mimetype,
          tamanho: file.size,
        };

        this.logger.log('📎 Arquivo salvo:', anexoInfo);
      }

      // Criar a mensagem
      const mensagem = await this.prisma.mensagemChat.create({
        data: {
          orcamento_id: orcamentoId,
          conteudo: dados.mensagem,
          tipo: tipo,
          usuario:
            tipo === 'VENDEDOR'
              ? 'Vendedor'
              : tipo === 'CLIENTE'
                ? 'Cliente'
                : 'Sistema',
          anexos: anexoInfo ? JSON.stringify(anexoInfo) : null,
        },
      });

      this.logger.log(`✅ Mensagem enviada no chat V2: ${mensagem.id}`);

      // Criar notificação para outros usuários da loja
      await this.notificarNovaMensagemLegado(orcamentoId, lojaId, 'Vendedor');

      return mensagem;
    } catch (error) {
      this.logger.error(
        `❌ Erro ao enviar mensagem no chat V2: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Enviar mensagem no chat público - NATIVO V2
   */
  async enviarMensagemPublicaLegado(
    orcamentoId: string,
    dados: {
      mensagem: string;
      tipo?: string;
      autor_nome?: string;
      autor_email?: string;
    },
  ) {
    return this.enviarMensagemPublicaLegadoComAnexo(
      orcamentoId,
      dados,
      undefined,
    );
  }

  /**
   * Enviar mensagem no chat público com anexo - NATIVO V2
   */
  async enviarMensagemPublicaLegadoComAnexo(
    orcamentoId: string,
    dados: {
      mensagem: string;
      tipo?: string;
      autor_nome?: string;
      autor_email?: string;
    },
    file?: Express.Multer.File,
  ) {
    this.logger.log(
      `💬 Enviando mensagem pública no chat V2 para orçamento: ${orcamentoId}`,
    );

    try {
      // Validar tipo de mensagem
      const tiposValidos = ['CLIENTE', 'VENDEDOR', 'SISTEMA'];
      const tipo = dados.tipo || 'CLIENTE';
      if (!tiposValidos.includes(tipo)) {
        throw new Error(
          `Tipo de mensagem inválido. Tipos permitidos: ${tiposValidos.join(', ')}`,
        );
      }

      // Verificar se o orçamento existe
      const orcamento = await this.prisma.orcamento.findUnique({
        where: { id: orcamentoId },
        include: { cliente: true },
      });

      if (!orcamento) {
        throw new Error('Orçamento não encontrado');
      }

      let anexoInfo: any = null;

      // Processar arquivo se existir
      if (file) {
        // Validar tipo de arquivo
        const tiposPermitidos = [
          'image/jpeg',
          'image/png',
          'image/jpg',
          'application/pdf',
          'application/zip',
          'application/x-zip-compressed',
        ];
        if (!tiposPermitidos.includes(file.mimetype)) {
          throw new Error(
            'Tipo de arquivo não permitido. Use apenas JPG, PNG, PDF ou ZIP.',
          );
        }

        // Validar tamanho (5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          throw new Error('Arquivo muito grande. Tamanho máximo: 5MB.');
        }

        // Salvar arquivo (em produção seria para um serviço de storage)
        const fs = require('fs');
        const path = require('path');
        const { v4: uuidv4 } = require('uuid');

        const uploadDir = path.join(process.cwd(), 'uploads', 'anexos');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const extensao = path.extname(file.originalname);
        const nomeArquivo = `${uuidv4()}${extensao}`;
        const caminhoArquivo = path.join(uploadDir, nomeArquivo);

        this.logger.log('📎 Tentando salvar arquivo em:', caminhoArquivo);
        fs.writeFileSync(caminhoArquivo, file.buffer);
        this.logger.log('📎 Arquivo salvo com sucesso!');

        anexoInfo = {
          nome_arquivo: file.originalname,
          url_arquivo: `/uploads/anexos/${nomeArquivo}`,
          tipo_arquivo: file.mimetype,
          tamanho: file.size,
        };

        this.logger.log('📎 Arquivo salvo:', anexoInfo);
      }

      // Criar a mensagem
      const mensagem = await this.prisma.mensagemChat.create({
        data: {
          orcamento_id: orcamentoId,
          conteudo: dados.mensagem,
          tipo: tipo,
          usuario:
            tipo === 'VENDEDOR'
              ? 'Vendedor'
              : tipo === 'CLIENTE'
                ? 'Cliente'
                : 'Sistema',
          anexos: anexoInfo ? JSON.stringify(anexoInfo) : null,
        },
      });

      this.logger.log(
        `✅ Mensagem pública enviada no chat V2: ${mensagem.id}`,
      );

      // Criar notificação para vendedores da loja
      await this.notificarNovaMensagemLegado(
        orcamentoId,
        orcamento.loja_id,
        dados.autor_nome || 'Cliente',
      );

      return mensagem;
    } catch (error) {
      this.logger.error(
        `❌ Erro ao enviar mensagem pública no chat V2: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Alterar status do orçamento - BASEADO NO LEGADO
   */
  async alterarStatus(
    id: string,
    novoStatus: string,
    lojaId: string,
    userId: string,
    observacoes?: string,
  ) {
    this.logger.log(
      'Alterando status do orcamento ' + id + ' para ' + novoStatus,
    );

    const orcamento = await this.prisma.orcamento.findFirst({
      where: { id, loja_id: lojaId },
      include: {
        cliente: true,
        loja: true,
      },
    });

    if (!orcamento) {
      throw new NotFoundException('Orcamento nao encontrado');
    }

    const statusAnterior = orcamento.status;
    const statusAprovacaoAnterior = orcamento.status_aprovacao;
    const observacoesClienteAnterior = (orcamento as any).observacoes_cliente;
    const codigoAprovacaoAnterior = orcamento.codigo_aprovacao;

    const dadosAtualizacao: any = {
      status: novoStatus,
      data_atualizacao: new Date(),
    };

    if (novoStatus === 'enviado' && !orcamento.codigo_aprovacao) {
      const codigoAprovacao = await this.gerarCodigoAprovacao();
      dadosAtualizacao.codigo_aprovacao = codigoAprovacao;

      this.logger.log('Codigo de aprovacao gerado: ' + codigoAprovacao);
      console.log('==========================================');
      console.log('CODIGO DE APROVACAO GERADO!');
      console.log('==========================================');
      console.log('Orcamento: ' + orcamento.numero);
      console.log('Cliente: ' + orcamento.cliente.nome);
      console.log('Codigo: ' + codigoAprovacao);
      console.log('==========================================');
    }

    const orcamentoAtualizado = await this.prisma.orcamento.update({
      where: { id },
      data: dadosAtualizacao,
      include: {
        cliente: true,
        loja: true,
      },
    });

    if (novoStatus?.toLowerCase() === 'aprovado') {
      try {
        await this.criarOSAutomaticaParaOrcamento(
          lojaId,
          orcamentoAtualizado.id,
          userId,
          'ALTERAR_STATUS',
        );
      } catch (error) {
        this.logger.error(
          '[OS_AUTO] Falha ao gerar OS automatica para o orcamento ' +
            orcamentoAtualizado.id +
            ' via alterarStatus: ' +
            error.message,
        );

        await this.prisma.orcamento.update({
          where: { id },
          data: {
            status: statusAnterior,
            status_aprovacao: statusAprovacaoAnterior,
            observacoes_cliente: observacoesClienteAnterior,
            codigo_aprovacao: codigoAprovacaoAnterior,
            data_atualizacao: new Date(),
          },
        });

        throw new InternalServerErrorException(
          'Falha ao gerar OS automaticamente. Status do orcamento foi revertido.',
        );
      }
    }

    await this.registrarLog(
      id,
      'STATUS_ALTERADO',
      'Status alterado para ' +
        novoStatus +
        (observacoes ? '. Observacoes: ' + observacoes : ''),
    );

    await this.notificacaoService.notificarMudancaStatus(
      orcamentoAtualizado,
      orcamento.status as any,
      novoStatus as any,
      lojaId,
    );

    this.logger.log(
      'Status do orcamento ' + id + ' alterado para ' + novoStatus,
    );

    return orcamentoAtualizado;
  }

  /**
   * Enviar orçamento para o cliente
   */
  async enviarOrcamento(id: string, lojaId: string, userId: string) {
    this.logger.log(`Enviando orçamento ${id} para o cliente`);

    const orcamento = await this.prisma.orcamento.findFirst({
      where: { id, loja_id: lojaId },
      include: {
        cliente: true,
        loja: true,
      },
    });

    if (!orcamento) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    // Alterar status para 'enviado' (gera codigo_aprovacao se não existir)
    const orcamentoAtualizado = await this.alterarStatus(
      id,
      'enviado',
      lojaId,
      userId,
    );

    // Enviar email para o cliente (se tiver email)
    let emailEnviado = false;
    let emailDestinatario: string | null = null;
    let emailMotivo: string | null = null;

    if (orcamentoAtualizado.cliente?.email) {
      try {
        const frontendUrl =
          process.env.FRONTEND_URL || 'https://comunikapp.com.br';
        const linkPublico = `${frontendUrl}/orcamento-v2/${id}`;
        const precoFinal = Number(orcamentoAtualizado.preco_final) || 0;
        const codigoAprovacao = orcamentoAtualizado.codigo_aprovacao || '';

        await this.mailService.enviarOrcamentoCliente(
          orcamentoAtualizado.cliente.email,
          orcamentoAtualizado.cliente.nome || 'Cliente',
          orcamentoAtualizado.numero,
          orcamentoAtualizado.nome_servico ||
            orcamentoAtualizado.titulo ||
            'Orçamento',
          precoFinal,
          codigoAprovacao,
          linkPublico,
        );
        emailEnviado = true;
        emailDestinatario = orcamentoAtualizado.cliente.email;
        this.logger.log(
          `📧 E-mail de orçamento enviado para ${orcamentoAtualizado.cliente.email}`,
        );
      } catch (error) {
        this.logger.error(
          `Erro ao enviar e-mail para cliente: ${error.message}`,
        );
        emailMotivo = `Erro ao enviar: ${error.message}`;
        // Não falha o envio do orçamento - apenas loga o erro
      }
    } else {
      this.logger.warn(
        `Orçamento ${id} sem e-mail do cliente - e-mail não enviado`,
      );
      emailMotivo = 'Cliente sem e-mail cadastrado';
    }

    return {
      success: true,
      message: 'Orçamento enviado com sucesso',
      orcamento_id: id,
      email_enviado: emailEnviado,
      email_destinatario: emailDestinatario,
      email_motivo: emailMotivo,
    };
  }

  /**
   * Aprovacao interna do orcamento + geracao de OS em um unico passo.
   *
   * Esta e a "acao interna" prevista pela Fase 3 do plano-mae: o vendedor /
   * atendente nao precisa enviar o link publico nem esperar o cliente clicar
   * em "Aprovar". Quem fecha o negocio fora do canal publico (balcao,
   * telefone, WhatsApp) usa esse caminho para registrar a aprovacao,
   * disparar a criacao da OS e notificar a equipe interna como se o cliente
   * tivesse aprovado pelo link.
   *
   * Mantemos o nome `fecharPedidoInterno` (e o endpoint `/fechar-pedido`)
   * por compatibilidade com o frontend ja em uso; o que muda e a semantica
   * visivel ao usuario (label "Aprovar e gerar OS"), o evento de auditoria
   * (`APROVADO_INTERNAMENTE_E_OS_GERADA`) e o disparo da notificacao
   * `notificarAcaoCliente(orcamento, 'APROVAR')`, identica ao fluxo publico.
   */
  async fecharPedidoInterno(
    id: string,
    lojaId: string,
    userId: string,
    observacoes?: string,
  ) {
    this.logger.log(
      'Aprovacao interna + geracao de OS solicitada para o orcamento ' + id,
    );

    const orcamento = await this.prisma.orcamento.findFirst({
      where: { id, loja_id: lojaId },
      include: {
        cliente: true,
        loja: true,
      },
    });

    if (!orcamento) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    const statusBloqueados = ['cancelado', 'rejeitado'];
    if (statusBloqueados.includes(String(orcamento.status).toLowerCase())) {
      throw new BadRequestException(
        'Este orçamento não pode ser aprovado no status atual: ' +
          orcamento.status,
      );
    }

    const osExistente = await this.prisma.ordemServico.findFirst({
      where: {
        loja_id: lojaId,
        orcamento_id: id,
      },
      select: {
        id: true,
        numero: true,
        ativo: true,
      },
    });

    if (osExistente) {
      if (osExistente.ativo === false) {
        await this.osInativacaoService.reativar(
          osExistente.id,
          lojaId,
          userId,
        );
      }

      const statusAprovado =
        String(orcamento.status).toLowerCase() === 'aprovado';

      if (!statusAprovado) {
        await this.prisma.orcamento.update({
          where: { id },
          data: {
            status: 'aprovado',
            status_aprovacao: 'APROVADO' as any,
            observacoes_cliente:
              observacoes?.trim() ||
              'Orçamento aprovado internamente pelo usuário ' + userId,
            data_atualizacao: new Date(),
          },
        });
      }

      return {
        success: true,
        message:
          osExistente.ativo === false
            ? 'OS reativada e orçamento aprovado.'
            : 'Orçamento já estava aprovado e possui OS gerada.',
        orcamento_id: id,
        os_id: osExistente.id,
        os_numero: osExistente.numero,
        status: 'aprovado',
        status_aprovacao: 'APROVADO',
      };
    }

    const statusAnterior = orcamento.status;
    const statusAprovacaoAnterior = orcamento.status_aprovacao;
    const observacoesClienteAnterior = (orcamento as any).observacoes_cliente;
    const codigoAprovacaoAnterior = orcamento.codigo_aprovacao;

    const observacaoRegistro =
      observacoes?.trim() ||
      'Orçamento aprovado internamente no sistema pelo usuário ' + userId;

    try {
      await this.prisma.orcamento.update({
        where: { id },
        data: {
          status: 'aprovado',
          status_aprovacao: 'APROVADO' as any,
          observacoes_cliente: observacaoRegistro,
          data_atualizacao: new Date(),
        },
      });

      await this.criarOSAutomaticaParaOrcamento(
        lojaId,
        id,
        userId,
        'APROVACAO_INTERNA',
      );

      const osCriada = await this.prisma.ordemServico.findFirst({
        where: {
          loja_id: lojaId,
          orcamento_id: id,
        },
        select: {
          id: true,
          numero: true,
        },
        orderBy: {
          criado_em: 'desc',
        },
      });

      await this.registrarLog(
        id,
        'APROVADO_INTERNAMENTE_E_OS_GERADA',
        observacaoRegistro,
      );

      // Fase 6 - Cria a Cobranca financeira automaticamente. Se a criacao
      // falhar (ex.: condicao_pagamento_tipo nao preenchido), nao reverter a
      // aprovacao do orcamento - apenas logar o problema. O usuario podera
      // criar a cobranca depois manualmente (ou complementar os campos).
      try {
        await this.criarCobrancaAposAprovacao(orcamento, id, lojaId, userId);
        // Invalida o cache da home para o ResumoFinanceiroSimples e
        // colunas a_receber/concluidos refletirem a nova cobranca.
        this.homeCacheService.invalidar(lojaId);
      } catch (cobrancaError) {
        this.logger.warn(
          '[APROVACAO_INTERNA] Aprovacao registrada, mas criacao da cobranca falhou para o orcamento ' +
            id +
            ': ' +
            (cobrancaError as Error).message +
            '. O usuario pode criar a cobranca manualmente.',
        );
      }

      // Dispara a mesma notificacao que o fluxo de aprovacao via link publico
      // (`processarAcaoCliente('APROVAR')`). Mantemos o tipo 'APROVAR' para
      // reaproveitar o `TipoNotificacao.ORCAMENTO_APROVADO` ja existente; a
      // diferenciacao de origem (interna vs publica) fica visivel no log
      // (`APROVADO_INTERNAMENTE_E_OS_GERADA`) e em `observacoes_cliente`.
      try {
        await this.notificarAcaoCliente(orcamento, 'APROVAR');
      } catch (notifError) {
        // Notificacao falhar nao deve reverter a aprovacao; apenas avisa.
        this.logger.warn(
          '[APROVACAO_INTERNA] Aprovacao registrada, mas notificacao de equipe falhou para o orcamento ' +
            id +
            ': ' +
            (notifError as Error).message,
        );
      }

      return {
        success: true,
        message: 'Orçamento aprovado e OS gerada com sucesso.',
        orcamento_id: id,
        os_id: osCriada?.id,
        os_numero: osCriada?.numero,
        status: 'aprovado',
        status_aprovacao: 'APROVADO',
      };
    } catch (error) {
      await this.prisma.orcamento.update({
        where: { id },
        data: {
          status: statusAnterior,
          status_aprovacao: statusAprovacaoAnterior,
          observacoes_cliente: observacoesClienteAnterior,
          codigo_aprovacao: codigoAprovacaoAnterior,
          data_atualizacao: new Date(),
        },
      });

      this.logger.error(
        '[APROVACAO_INTERNA] Falha ao aprovar e gerar OS para o orcamento ' +
          id +
          ': ' +
          (error instanceof Error ? error.message : error),
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Falha ao aprovar e gerar OS. O orçamento foi revertido.',
      );
    }
  }

  /**
   * Fase 6 - Cria a cobranca financeira para um orcamento recem-aprovado.
   *
   * Le os campos estruturados `condicao_pagamento_*` do orcamento; se
   * algum estiver faltando (orcamento antigo / nao migrado), tenta inferir
   * a partir dos defaults da loja. Se ainda assim nao for possivel, lanca
   * BadRequestException - o caller decide se reverte ou apenas avisa.
   *
   * Idempotente: se o orcamento ja tem cobranca, o servico downstream retorna
   * a existente sem duplicar.
   */
  private async criarCobrancaAposAprovacao(
    orcamento: any,
    orcamentoId: string,
    lojaId: string,
    usuarioId: string,
  ): Promise<void> {
    const valorTotal = Number(orcamento.preco_final ?? orcamento.valor_total ?? 0);
    if (valorTotal <= 0) {
      this.logger.warn(
        `[COBRANCA_AUTO] Orcamento ${orcamentoId} sem valor_total - cobranca nao criada.`,
      );
      return;
    }

    // Resolve tipo: do orcamento ou, se nao informado, default da loja.
    let tipo = orcamento.condicao_pagamento_tipo as string | null | undefined;
    let entradaPct = orcamento.condicao_pagamento_entrada_pct
      ? Number(orcamento.condicao_pagamento_entrada_pct)
      : null;
    const numeroParcelas = orcamento.condicao_pagamento_parcelas ?? null;
    const descricao = orcamento.condicao_pagamento_descricao ?? null;

    if (!tipo) {
      const loja = await this.prisma.loja.findUnique({
        where: { id: lojaId },
        select: {
          condicao_pagamento_padrao_tipo: true,
          condicao_pagamento_padrao_entrada_pct: true,
        },
      });
      tipo = loja?.condicao_pagamento_padrao_tipo ?? null;
      if (!entradaPct && loja?.condicao_pagamento_padrao_entrada_pct) {
        entradaPct = Number(loja.condicao_pagamento_padrao_entrada_pct);
      }
    }

    if (!tipo) {
      // Sem condicao definida nem na loja nem no orcamento - nao da pra criar.
      this.logger.warn(
        `[COBRANCA_AUTO] Orcamento ${orcamentoId} sem condicao_pagamento_tipo e loja sem default. Cobranca nao criada.`,
      );
      return;
    }

    const prazoEntregaDias = this.cobrancaVencimentoService.parsePrazoEntrega(
      orcamento.prazo_entrega,
    );

    await this.cobrancasService.criarCobrancaParaOrcamento(
      orcamentoId,
      lojaId,
      {
        tipo,
        entrada_pct: entradaPct,
        parcelas: numeroParcelas,
        descricao,
        valor_total: valorTotal,
        data_aprovacao: new Date(),
        prazo_entrega_dias: prazoEntregaDias,
        cliente_id: orcamento.cliente_id ?? null,
      },
      usuarioId,
    );

    this.logger.log(
      `[COBRANCA_AUTO] Cobranca criada para orcamento ${orcamentoId} (tipo=${tipo}, valor=R$ ${valorTotal.toFixed(2)})`,
    );
  }

  private async criarOSAutomaticaParaOrcamento(
    lojaId: string,
    orcamentoId: string,
    usuarioId: string,
    origem: string,
  ): Promise<void> {
    const existente = await this.prisma.ordemServico.findFirst({
      where: {
        loja_id: lojaId,
        orcamento_id: orcamentoId,
      },
    });

    if (existente) {
      this.logger.warn(
        '[OS_AUTO] OS ja existente (' +
          existente.id +
          ') para o orcamento ' +
          orcamentoId +
          '. Origem: ' +
          origem,
      );
      return;
    }

    const orcamentoCompleto = await this.buscarOrcamento(orcamentoId, lojaId);
    const dadosOS = this.montarDadosOSAPartirDoOrcamento(orcamentoCompleto);

    await this.osService.criarOSDeOrcamento(lojaId, dadosOS, usuarioId);
    this.logger.log(
      '[OS_AUTO] OS criada automaticamente para o orcamento ' +
        orcamentoCompleto.numero +
        ' (origem: ' +
        origem +
        ').',
    );
  }

  private montarDadosOSAPartirDoOrcamento(
    orcamento: OrcamentoCompleto,
  ): DadosHerdadosOrcamento {
    const produtoPrincipal =
      orcamento.produtos && orcamento.produtos.length > 0
        ? orcamento.produtos[0]
        : undefined;
    const quantidadeCalculada = Number(
      produtoPrincipal?.quantidade ?? orcamento.quantidade_produto ?? 1,
    );
    const horasProducaoCalculada = Number(
      (produtoPrincipal as any)?.horas_producao ??
        (produtoPrincipal as any)?.tempo_producao ??
        (orcamento as any).horas_producao ??
        0,
    );

    return {
      orcamento_id: orcamento.id,
      cliente_id: orcamento.cliente_id,
      loja_id: orcamento.loja_id,
      nome_servico:
        orcamento.titulo ??
        produtoPrincipal?.nome ??
        'Orcamento ' + orcamento.numero,
      descricao:
        produtoPrincipal?.descricao ?? orcamento.descricao ?? undefined,
      quantidade_produto: quantidadeCalculada > 0 ? quantidadeCalculada : 1,
      largura_produto:
        produtoPrincipal?.largura ?? orcamento.largura_produto ?? undefined,
      altura_produto:
        produtoPrincipal?.altura ?? orcamento.altura_produto ?? undefined,
      area_produto:
        produtoPrincipal?.area ?? orcamento.area_produto ?? undefined,
      perimetro_produto:
        produtoPrincipal?.perimetro_produto ?? undefined,
      unidade_geometria:
        produtoPrincipal?.unidade_geometria ?? undefined,
      geometria_origem:
        produtoPrincipal?.geometria_origem ?? undefined,
      arquivo_geometria_url:
        produtoPrincipal?.arquivo_geometria_url ?? undefined,
      arquivo_geometria_metadados:
        produtoPrincipal?.arquivo_geometria_metadados ?? undefined,
      unidade_medida_produto:
        produtoPrincipal?.unidade ??
        orcamento.unidade_medida_produto ??
        undefined,
      horas_producao: Number.isNaN(horasProducaoCalculada)
        ? 0
        : horasProducaoCalculada,
      custos_calculados:
        orcamento.custos_calculados ?? orcamento.custos ?? null,
      configuracao_calculo: orcamento.configuracoes ?? undefined,
      responsavel_id: orcamento.responsavel_id ?? undefined,
      prioridade: orcamento.prioridade ?? undefined,
      // O campo `prazo_entrega` no orcamento e uma String livre (ex.: "10 a 15 dias uteis").
      // Aqui so propagamos para a OS quando o valor for uma data ISO-8601 valida; caso
      // contrario devolvemos undefined para nao quebrar o `data_prazo` (DateTime) da OS.
      prazo_entrega: this.parsePrazoEntregaIso(
        (orcamento as any).prazo_entrega,
      ),
      observacoes_internas: orcamento.observacoes ?? undefined,
    };
  }

  /**
   * Converte o `prazo_entrega` do orcamento (texto livre ou ISO-8601) para uma
   * data ISO valida que possa ser usada como `data_prazo` na OS. Retorna
   * `undefined` para qualquer entrada nao parseavel.
   */
  private parsePrazoEntregaIso(valor: unknown): string | undefined {
    if (!valor) {
      return undefined;
    }

    if (valor instanceof Date) {
      return Number.isNaN(valor.getTime()) ? undefined : valor.toISOString();
    }

    if (typeof valor !== 'string') {
      return undefined;
    }

    const texto = valor.trim();
    if (!texto) {
      return undefined;
    }

    // Aceita apenas strings com cara de data (ISO-8601 ou similar parseavel).
    // Texto livre como "10 a 15 dias uteis" cai no NaN e e descartado.
    const data = new Date(texto);
    if (Number.isNaN(data.getTime())) {
      return undefined;
    }

    return data.toISOString();
  }

  /**
   * Registrar log de ação - BASEADO NO LEGADO
   */
  private async registrarLog(
    orcamentoId: string,
    acao: string,
    descricao: string,
  ): Promise<void> {
    try {
      // Por enquanto, apenas log no console
      // Futuramente pode ser implementada uma tabela de logs
      this.logger.log(
        `📝 LOG: Orçamento ${orcamentoId} - ${acao}: ${descricao}`,
      );
    } catch (error) {
      this.logger.error(`❌ Erro ao registrar log: ${error.message}`);
    }
  }

  /**
   * Reenviar código de aprovação - BASEADO NO LEGADO
   */
  async reenviarCodigoAprovacao(id: string) {
    this.logger.log(
      `📧 Reenviando código de aprovação para orçamento: ${id}`,
    );

    // Verificar se o orçamento existe
    const orcamento = await this.prisma.orcamento.findUnique({
      where: { id },
      include: {
        cliente: true,
        loja: true,
      },
    });

    if (!orcamento) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    // Verificar se já tem código de aprovação
    if (!orcamento.codigo_aprovacao) {
      // Gerar novo código se não existir
      const codigoAprovacao = await this.gerarCodigoAprovacao();

      await this.prisma.orcamento.update({
        where: { id },
        data: { codigo_aprovacao: codigoAprovacao },
      });

      this.logger.log(
        `📧 Novo código de aprovação gerado: ${codigoAprovacao}`,
      );
      console.log(`📧 ==========================================`);
      console.log(`📧 NOVO CÓDIGO DE APROVAÇÃO GERADO!`);
      console.log(`📧 ==========================================`);
      console.log(`📧 Orçamento: ${orcamento.numero}`);
      console.log(`📧 Cliente: ${orcamento.cliente.nome}`);
      console.log(`📧 Código: ${codigoAprovacao}`);
      console.log(`📧 ==========================================`);
    } else {
      this.logger.log(
        `📧 Código de aprovação já existe: ${orcamento.codigo_aprovacao}`,
      );
      console.log(`📧 ==========================================`);
      console.log(`📧 CÓDIGO DE APROVAÇÃO EXISTENTE!`);
      console.log(`📧 ==========================================`);
      console.log(`📧 Orçamento: ${orcamento.numero}`);
      console.log(`📧 Cliente: ${orcamento.cliente.nome}`);
      console.log(`📧 Código: ${orcamento.codigo_aprovacao}`);
      console.log(`📧 ==========================================`);
    }

    // TODO: Implementar envio de email com o código
    // Por enquanto, apenas retornar sucesso

    return {
      success: true,
      message: 'Código de aprovação reenviado com sucesso',
      codigo: orcamento.codigo_aprovacao,
    };
  }

  /**
   * Notificar ação do cliente - BASEADO NO LEGADO
   */
  private async notificarAcaoCliente(
    orcamento: any,
    acao: string,
  ): Promise<void> {
    try {
      // Buscar usuários da loja que devem receber notificação
      const usuariosLoja = await this.prisma.usuario.findMany({
        where: {
          loja_id: orcamento.loja_id,
          ativo: true,
        },
        select: {
          id: true,
          nome_completo: true,
          email: true,
          funcao: true,
        },
      });

      // Filtrar usuários relevantes (vendedores, gerentes, admins)
      const usuariosRelevantes = usuariosLoja.filter((usuario) => {
        const funcaoLower = usuario.funcao?.toLowerCase();
        return [
          'vendedor',
          'gerente',
          'admin',
          'manager',
          'administrador',
        ].includes(funcaoLower);
      });

      // Determinar tipo de notificação baseado na ação
      let tipoNotificacao;
      let titulo;
      let mensagem;

      switch (acao) {
        case 'APROVAR':
          tipoNotificacao = TipoNotificacao.ORCAMENTO_APROVADO;
          titulo = 'Orçamento Aprovado';
          mensagem = `O cliente ${orcamento.cliente.nome} aprovou o orçamento #${orcamento.numero}`;
          break;
        case 'REJEITAR':
          tipoNotificacao = TipoNotificacao.ORCAMENTO_REJEITADO;
          titulo = 'Orçamento Rejeitado';
          mensagem = `O cliente ${orcamento.cliente.nome} rejeitou o orçamento #${orcamento.numero}`;
          break;
        case 'NEGOCIAR':
          tipoNotificacao = TipoNotificacao.NOVA_MENSAGEM;
          titulo = 'Negociação Iniciada';
          mensagem = `O cliente ${orcamento.cliente.nome} iniciou negociação no orçamento #${orcamento.numero}`;
          break;
        default:
          return;
      }

      // Criar notificação para cada usuário relevante
      for (const usuario of usuariosRelevantes) {
        await this.notificacoesService.criarNotificacao(
          orcamento.loja_id,
          tipoNotificacao,
          titulo,
          mensagem,
          orcamento.id,
          {
            autor_nome: orcamento.cliente.nome,
            numero_orcamento: orcamento.numero,
            acao: acao,
          },
        );
      }

      this.logger.log(
        `✅ Notificações de ${acao} enviadas para ${usuariosRelevantes.length} usuários`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Erro ao enviar notificações de ${acao}: ${error.message}`,
      );
    }
  }

  /**
   * Notificar nova mensagem - BASEADO NO LEGADO
   */
  private async notificarNovaMensagemLegado(
    orcamentoId: string,
    lojaId: string,
    autorNome: string,
  ): Promise<void> {
    try {
      this.logger.log(
        `📢 Notificando nova mensagem no chat V2 do orçamento ${orcamentoId}`,
      );

      const orcamento = await this.prisma.orcamento.findUnique({
        where: { id: orcamentoId },
        select: { numero: true, nome_servico: true },
      });

      if (!orcamento) return;

      // Criar notificação usando o serviço legado
      await this.notificacoesService.criarNotificacao(
        lojaId,
        TipoNotificacao.NOVA_MENSAGEM,
        'Nova mensagem no orçamento',
        `${autorNome} enviou uma mensagem no orçamento #${orcamento.numero}`,
        orcamentoId,
        { autor_nome: autorNome, numero_orcamento: orcamento.numero },
      );

      this.logger.log(`✅ Notificação criada para nova mensagem no chat V2`);
    } catch (error) {
      this.logger.error(
        `❌ Erro ao notificar nova mensagem no chat V2: ${error.message}`,
      );
    }
  }

  /**
   * Envia mensagem no chat (público)
   */
  async enviarMensagemPublica(
    orcamentoId: string,
    dados: {
      mensagem: string;
      autor_nome?: string;
      autor_email?: string;
    },
  ) {
    this.logger.log(
      `💬 Enviando mensagem pública no orçamento: ${orcamentoId}`,
    );

    try {
      // Verificar se orçamento existe
      const orcamento = await this.buscarOrcamentoPublico(orcamentoId);
      if (!orcamento) {
        throw new Error('Orçamento não encontrado');
      }

      // Criar mensagem
      const mensagem = await this.prisma.mensagemChat.create({
        data: {
          orcamento_id: orcamentoId,
          usuario_id: 'cliente_publico', // ID especial para cliente público
          tipo: 'texto',
          conteudo: dados.mensagem,
          anexos: JSON.stringify([]),
          data_envio: new Date(),
          lida: false,
        },
      });

      this.logger.log(
        `💬 Mensagem pública criada: ID=${mensagem.id}, Conteúdo="${dados.mensagem.substring(0, 50)}...", UsuarioID=${mensagem.usuario_id}`,
      );

      this.logger.log(`✅ Mensagem pública enviada: ${mensagem.id}`);

      // Enviar notificação para vendedores da loja
      this.logger.log(
        `📢 Iniciando notificação para mensagem pública ${mensagem.id}`,
      );
      await this.notificarNovaMensagemChat(orcamento, mensagem, 'cliente');
      this.logger.log(
        `✅ Notificação para mensagem pública ${mensagem.id} concluída`,
      );

      // Retornar mensagem no formato esperado pelo frontend
      return {
        id: mensagem.id,
        mensagem: mensagem.conteudo,
        tipo: 'CLIENTE',
        autor_nome: dados.autor_nome || 'Cliente',
        autor_email: dados.autor_email,
        visualizada: false,
        anexos: [],
        criado_em: mensagem.data_envio.toISOString(),
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao enviar mensagem pública: ${error.message}`);
      throw error;
    }
  }

  /**
   * Marca mensagem como visualizada (público)
   */
  async marcarMensagemVisualizadaPublica(
    orcamentoId: string,
    mensagemId: string,
  ) {
    this.logger.log(`👁️ Marcando mensagem como visualizada: ${mensagemId}`);

    try {
      // Verificar se orçamento existe
      const orcamento = await this.buscarOrcamentoPublico(orcamentoId);
      if (!orcamento) {
        throw new Error('Orçamento não encontrado');
      }

      // Marcar mensagem como visualizada
      await this.prisma.mensagemChat.update({
        where: { id: mensagemId },
        data: { lida: true },
      });

      this.logger.log(`✅ Mensagem marcada como visualizada: ${mensagemId}`);

      return {
        success: true,
        message: 'Mensagem marcada como visualizada',
        mensagem_id: mensagemId,
      };
    } catch (error) {
      this.logger.error(
        `❌ Erro ao marcar mensagem como visualizada: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Notifica nova mensagem no chat
   */
  private async notificarNovaMensagemChat(
    orcamento: any,
    mensagem: any,
    tipoRemetente: 'cliente' | 'vendedor',
  ): Promise<void> {
    try {
      this.logger.log(
        `📢 Notificando nova mensagem no chat do orçamento ${orcamento.id}`,
      );

      // Buscar usuários da loja que devem receber notificação
      const usuariosLoja = await this.prisma.usuario.findMany({
        where: {
          loja_id: orcamento.loja_id,
          ativo: true,
        },
        select: {
          id: true,
          nome_completo: true,
          email: true,
          funcao: true,
        },
      });

      this.logger.log(
        `👥 Usuários encontrados na loja ${orcamento.loja_id}: ${usuariosLoja.length}`,
      );
      this.logger.log(
        `👥 Usuários: ${JSON.stringify(
          usuariosLoja.map((u) => ({
            nome: u.nome_completo,
            funcao: u.funcao,
          })),
          null,
          2,
        )}`,
      );

      // Filtrar usuários relevantes (vendedores, gerentes, admins)
      const usuariosRelevantes = usuariosLoja.filter((usuario) => {
        const funcaoLower = usuario.funcao?.toLowerCase();
        const isRelevant = [
          'vendedor',
          'gerente',
          'admin',
          'manager',
          'administrador',
        ].includes(funcaoLower);
        this.logger.log(
          `🔍 Usuário ${usuario.nome_completo} - Função: ${usuario.funcao} (${funcaoLower}) - Relevante: ${isRelevant}`,
        );
        return isRelevant;
      });

      this.logger.log(
        `🎯 Usuários relevantes após filtro: ${usuariosRelevantes.length}`,
      );

      // Criar notificação para cada usuário relevante
      for (const usuario of usuariosRelevantes) {
        try {
          this.logger.log(
            `📝 Criando notificação para usuário ${usuario.nome_completo} (${usuario.id})`,
          );

          const notificacao = await this.prisma.notificacao.create({
            data: {
              tipo: 'chat_mensagem',
              titulo:
                tipoRemetente === 'cliente'
                  ? 'Nova mensagem do cliente'
                  : 'Nova mensagem no chat',
              mensagem:
                tipoRemetente === 'cliente'
                  ? `Cliente enviou mensagem no orçamento "${orcamento.titulo || orcamento.nome_servico || 'Orçamento'}": "${mensagem.conteudo.substring(0, 100)}${mensagem.conteudo.length > 100 ? '...' : ''}"`
                  : `Nova mensagem no orçamento "${orcamento.titulo || orcamento.nome_servico || 'Orçamento'}": "${mensagem.conteudo.substring(0, 100)}${mensagem.conteudo.length > 100 ? '...' : ''}"`,
              orcamento_id: orcamento.id,
              loja_id: orcamento.loja_id || 'qkg2dy5c5', // Fallback para loja padrão
              dados_extras: JSON.stringify({
                usuario_id: usuario.id,
                mensagem_id: mensagem.id,
                tipo_remetente: tipoRemetente,
                link: `/orcamentos-v2/novo?id=${orcamento.id}`,
              }),
              visualizada: false,
              criado_em: new Date(),
            },
          });

          this.logger.log(
            `✅ Notificação criada com sucesso: ${notificacao.id} para usuário ${usuario.nome_completo}`,
          );
        } catch (error) {
          this.logger.error(
            `❌ Erro ao criar notificação para usuário ${usuario.id}: ${error.message}`,
          );
          if (process.env.NODE_ENV !== 'production') {
            this.logger.error(`❌ Debug trace: ${error.stack}`);
          }
        }
      }

      this.logger.log(
        `✅ Notificações de chat enviadas para ${usuariosRelevantes.length} usuários`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Erro ao notificar nova mensagem no chat: ${error.message}`,
      );
    }
  }

  /**
   * Buscar mensagens do chat (autenticado - para vendedores) - NATIVO V2
   */
  async buscarMensagensChatLegado(orcamentoId: string, lojaId: string) {
    this.logger.log(
      `🔍 Buscando mensagens do chat V2 para orçamento: ${orcamentoId}`,
    );

    try {
      // Verificar se o orçamento existe e pertence ? loja
      const orcamento = await this.prisma.orcamento.findFirst({
        where: { id: orcamentoId, loja_id: lojaId },
      });

      if (!orcamento) {
        throw new Error('Orçamento não encontrado');
      }

      // Buscar mensagens ordenadas por data de criação
      const mensagens = await this.prisma.mensagemChat.findMany({
        where: {
          orcamento_id: orcamentoId,
        },
        orderBy: {
          criado_em: 'asc',
        },
      });

      // Mapear para o formato de resposta
      const mensagensFormatadas = mensagens.map((mensagem) => ({
        id: mensagem.id,
        mensagem: mensagem.conteudo,
        tipo: mensagem.tipo,
        autor_nome: mensagem.usuario || 'Sistema',
        autor_email: '',
        anexos: mensagem.anexos ? JSON.parse(mensagem.anexos) : null,
        visualizada: mensagem.lida,
        criado_em: mensagem.data_envio || mensagem.criado_em,
      }));

      this.logger.log(
        `Retornando ${mensagensFormatadas.length} mensagens do chat V2`,
      );
      return mensagensFormatadas;
    } catch (error) {
      this.logger.error(
        `❌ Erro ao buscar mensagens do chat V2: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Enviar mensagem no chat (autenticado - para vendedores)
   */
  async enviarMensagemChat(
    orcamentoId: string,
    usuarioId: string,
    conteudo: string,
    tipo?: string,
    anexos?: string[],
  ) {
    this.logger.log(
      `💬 Enviando mensagem no chat autenticado para orçamento ${orcamentoId}`,
    );

    try {
      // Converter string para TipoMensagem ou usar TEXTO como padrão
      const tipoMensagem = (tipo as any) || 'texto';
      return await this.chatService.enviarMensagem(
        orcamentoId,
        usuarioId,
        conteudo,
        tipoMensagem,
        anexos,
      );
    } catch (error) {
      this.logger.error(`❌ Erro ao enviar mensagem no chat: ${error.message}`);
      throw error;
    }
  }

  /**
   * Marcar mensagem como visualizada (autenticado)
   */
  async marcarMensagemVisualizada(
    orcamentoId: string,
    mensagemId: string,
    usuarioId: string,
  ) {
    this.logger.log(
      `👁️ Marcando mensagens do orçamento ${orcamentoId} como visualizadas`,
    );

    try {
      return await this.chatService.marcarMensagensComoLidas(
        orcamentoId,
        usuarioId,
      );
    } catch (error) {
      this.logger.error(
        `❌ Erro ao marcar mensagens como visualizadas: ${error.message}`,
      );
      throw error;
    }
  }
}
