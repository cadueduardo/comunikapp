import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
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
import { HomeCacheService } from '../../home-operacional/services/home-cache.service';

/**
 * ServiÃ§o Principal de OrÃ§amentos V2
 * Implementa todas as operaÃ§ÃƒÂµes CRUD usando motor de cÃ¡lculo V2
 *
 * Ã¢Å“â€¦ ARQUIVO Ã¢â€°Â¤ 400 LINHAS (CONFORME PREMISSAS)
 * Ã¢Å“â€¦ INTEGRAÃƒâ€¡ÃƒÆ’O COMPLETA COM MOTOR FUNCIONANDO
 * Ã¢Å“â€¦ FUNCIONALIDADES PRESERVADAS E MELHORADAS
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
    private readonly documentCodeService: DocumentCodeService,
    private readonly mailService: MailService,
    // Fase 6 - Financeiro minimo
    private readonly cobrancasService: CobrancasService,
    private readonly cobrancaVencimentoService: CobrancaVencimentoService,
    private readonly homeCacheService: HomeCacheService,
  ) {}

  /**
   * Cria novo orÃ§amento
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

    this.logger.log(`Ã°Å¸â€œÂ Criando novo orÃ§amento para loja ${lojaId}`);

    try {
      // 1. Validar dados de entrada
      await this.validacaoService.validarDadosCriacao(dados, lojaId);

      // 2. Preparar dados para criaÃ§ÃƒÂ£o
      const dadosPreparados = this.transformacaoService.prepararDadosCriacao(
        dados,
        lojaId,
        usuarioId,
      );
      // Garantir numero sequencial controlado pelo DocumentCodeService
      dadosPreparados.numero =
        await this.documentCodeService.gerarCodigoOrcamento(lojaId);

      // 3. Criar orÃ§amento no banco
      const orcamentoCriado = await this.prisma.orcamento.create({
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
          `Ã°Å¸â€™Â° Calculando custos via motor V2 para novo orcamento: custo_total=${dados.custo_total}, preco_final=${dados.preco_final}`,
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

      // Hotfix determinÃ­stico:
      // Na criaÃ§Ã£o, quando o frontend jÃ¡ enviou custos do preview,
      // persistimos esses valores como fonte da verdade para manter
      // a listagem em sincronia com o que foi visto no formulÃ¡rio.
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

      // 6. Criar histÃ³rico
      await this.criarHistorico(
        orcamentoCriado.id,
        'criacao',
        'OrÃ§amento criado',
        usuarioId,
      );

      // 7. Notificar criaÃ§ÃƒÂ£o
      await this.notificacaoService.notificarCriacao(orcamentoCriado, lojaId);

      this.logger.log(
        `Ã¢Å“â€¦ OrÃ§amento criado com sucesso: ${orcamentoCriado.id}`,
      );
      return await this.buscarOrcamento(orcamentoCriado.id, lojaId);
    } catch (error) {
      this.logger.error(`Ã¢ÂÅ’ Erro ao criar orÃ§amento: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca orÃ§amento por ID
   */
  async buscarOrcamento(
    id: string,
    lojaId: string,
  ): Promise<OrcamentoCompleto> {
    this.logger.log(`Ã°Å¸â€Â Buscando orÃ§amento ${id} na loja ${lojaId}`);

    try {
      const orcamento = await this.prisma.orcamento.findFirst({
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
        },
      });

      if (!orcamento) {
        throw new NotFoundException('OrÃ§amento nÃ£o encontrado');
      }

      // Debug logs removidos para limpar terminal
      // this.logger.log(`Ã°Å¸â€Â Debug - OrÃ§amento encontrado: ID=${orcamento.id}, cliente_id=${orcamento.cliente_id}, temCliente=${!!orcamento.cliente}, temProdutos=${!!orcamento.produtos}, qtdProdutos=${orcamento.produtos?.length || 0}`);
      // this.logger.log(`Ã°Å¸â€Â Debug - Campos do orÃ§amento: titulo=${(orcamento as any).titulo}, nome_servico=${(orcamento as any).nome_servico}, descricao=${(orcamento as any).descricao}, quantidade_produto=${(orcamento as any).quantidade_produto}`);
      // this.logger.log(`Ã°Å¸â€Â Debug - Campos de medida: largura_produto=${(orcamento as any).largura_produto}, altura_produto=${(orcamento as any).altura_produto}, area_produto=${(orcamento as any).area_produto}`);
      // this.logger.log(`Ã°Å¸â€Â Debug - Dados completos do orÃ§amento:`, JSON.stringify(orcamento, null, 2));

      if (orcamento.cliente) {
        this.logger.log(`Ã¢Å“â€¦ Cliente carregado: ${orcamento.cliente.nome}`);
      } else {
        this.logger.log(
          `Ã¢ÂÅ’ Cliente NÃƒÆ’O carregado para cliente_id: ${orcamento.cliente_id}`,
        );
        // Tentar buscar cliente manualmente
        if (orcamento.cliente_id) {
          const clienteManual = await this.prisma.cliente.findUnique({
            where: { id: orcamento.cliente_id },
          });
          if (clienteManual) {
            this.logger.log(
              `Ã¢Å“â€¦ Cliente encontrado manualmente: ${clienteManual.nome}`,
            );
            orcamento.cliente = clienteManual;
          } else {
            this.logger.log(
              `Ã¢ÂÅ’ Cliente nÃ£o encontrado no banco: ${orcamento.cliente_id}`,
            );
          }
        }
      }

      if (orcamento.produtos && orcamento.produtos.length > 0) {
        this.logger.log(
          `Ã¢Å“â€¦ Produtos carregados: ${orcamento.produtos.length} produtos`,
        );
      } else {
        this.logger.log(`Ã¢ÂÅ’ Produtos NÃƒÆ’O carregados`);
        // Tentar buscar produtos manualmente
        const produtosManual = await this.prisma.produtoOrcamento.findMany({
          where: { orcamento_id: orcamento.id },
          include: {
            insumos: true,
            maquinas: true,
            funcoes: true,
            servicos_manuais: true,
            custos_indiretos: true,
          },
        });
        if (produtosManual.length > 0) {
          this.logger.log(
            `Ã¢Å“â€¦ Produtos encontrados manualmente: ${produtosManual.length} produtos`,
          );
          orcamento.produtos = produtosManual;
        } else {
          this.logger.log(
            `Ã¢ÂÅ’ Produtos nÃ£o encontrados no banco para orcamento_id: ${orcamento.id}`,
          );
        }
      }

      return this.transformacaoService.transformarParaInterface(orcamento);
    } catch (error) {
      this.logger.error(`Ã¢ÂÅ’ Erro ao buscar orÃ§amento: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lista orÃ§amentos com filtros
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
    this.logger.log(`Ã°Å¸â€œâ€¹ Listando orÃ§amentos da loja ${lojaId}`);

    try {
      // Construir filtros
      const where = this.construirFiltros(filtros, lojaId);
      const { skip, take } = this.prepararPaginacao(paginacao);

      // Buscar orÃ§amentos
      const [orcamentos, total] = await Promise.all([
        this.prisma.orcamento.findMany({
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

      // Debug: verificar se status_aprovacao estÃ¡ sendo retornado
      this.logger.log(
        `Ã°Å¸â€Â Debug - Total de orÃ§amentos encontrados: ${orcamentos.length}`,
      );

      if (orcamentos.length > 0) {
        this.logger.log(`Ã°Å¸â€Â Debug - Primeiro orÃ§amento - Dados brutos:`, {
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
          this.logger.log(`Ã°Å¸â€Â Debug - Primeiro orÃ§amento - Transformado:`, {
            id: transformado.id,
            status: transformado.status,
            status_aprovacao: transformado.status_aprovacao,
            hasStatusAprovacao: 'status_aprovacao' in transformado,
          });
        }
        return transformado;
      });

      // Debug: verificar se status_aprovacao estÃ¡ sendo retornado na resposta final
      this.logger.log(`Ã°Å¸â€Â Debug - Resposta final - Primeiro orÃ§amento:`, {
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
      this.logger.error(`Ã¢ÂÅ’ Erro ao listar orÃ§amentos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Atualiza orÃ§amento existente
   */
  async atualizarOrcamento(
    id: string,
    dados: any,
    lojaId: string,
    usuarioId: string,
  ): Promise<OrcamentoCompleto> {
    this.logger.log(`Ã¢Å“ÂÃ¯Â¸Â Atualizando orÃ§amento ${id} na loja ${lojaId}`);

    try {
      // 1. Verificar se existe
      const orcamentoExistente = await this.buscarOrcamento(id, lojaId);

      // 1.1. Bloquear alteraÃ§Ãµes em orÃ§amento aprovado
      const orcExistente = orcamentoExistente as unknown as { status?: string; status_aprovacao?: string };
      if (orcExistente.status === 'aprovado' || orcExistente.status_aprovacao === 'APROVADO') {
        throw new BadRequestException(
          'OrÃ§amento aprovado nÃ£o pode ser alterado. Somente visualizaÃ§Ã£o permitida.',
        );
      }

      // 2. Validar dados de atualizaÃ§ÃƒÂ£o
      await this.validacaoService.validarDadosAtualizacao(
        dados,
        orcamentoExistente,
      );

      // 3. Preparar dados para atualizaÃ§ÃƒÂ£o
      const dadosPreparados =
        this.transformacaoService.prepararDadosAtualizacao(
          dados,
          orcamentoExistente,
        );

      // 4. Atualizar no banco
      const orcamentoAtualizado = await this.prisma.orcamento.update({
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

      // 5. Recalcular custos se necessÃ¡rio
      const precisaRecalcular = this.necessitaRecalculo(dados);

      // Verificar se os dados jÃ¡ tÃƒÂªm custos calculados corretamente
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

      // Hotfix determinÃ­stico:
      // Se o frontend enviar custos jÃ¡ calculados no preview, persistir esses valores
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
        this.logger.log(`Ã°Å¸â€â€ž Iniciando recalculo para orcamento ${id}`);
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
          `Ã°Å¸â€™Â° Usando custos calculados do frontend para orÃ§amento ${id}: custo_total=${dados.custo_total}, preco_final=${dados.preco_final}`,
        );

        // Debug: verificar dados recebidos
        this.logger.log(`Ã°Å¸â€Â Debug - Dados recebidos do frontend:`, {
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
          `Ã°Å¸â€Â Debug - Dados que serÃƒÂ£o salvos no banco:`,
          dadosParaSalvar,
        );

        const resultadoUpdate = await this.prisma.orcamento.update({
          where: { id },
          data: dadosParaSalvar,
        });

        this.logger.log(`Ã°Å¸â€Â Debug - Resultado do UPDATE:`, {
          id: resultadoUpdate.id,
          preco_final: resultadoUpdate.preco_final,
          margem_lucro: resultadoUpdate.margem_lucro,
          impostos: resultadoUpdate.impostos,
          custo_total: resultadoUpdate.custo_total,
        });

        this.logger.log(
          `Ã¢Å“â€¦ Custos do frontend salvos no banco para orÃ§amento ${id}`,
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
          `Ã°Å¸â€â€ž Atualizando ${dados.produtos.length} produtos para orÃ§amento ${id}`,
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
              `Ã¢Å“â€¦ Produto ${produtoData.id} atualizado: preco_unitario=${produtoData.preco_unitario}, preco_total=${produtoData.preco_total}`,
            );
          }
        }

        this.logger.log(
          `Ã¢Å“â€¦ Todos os produtos atualizados para orÃ§amento ${id}`,
        );
      }

      // 5.2 Recalcular apÃ³s persistir produtos, para usar dados atualizados
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

      // 6. Criar versÃ£o se mudanÃ§as significativas
      // TEMPORARIAMENTE DESABILITADO - Tabela VersaoOrcamento nÃ£o migrada
      // if (this.mudancasSignificativas(orcamentoExistente, dados)) {
      //   await this.criarNovaVersao(id, orcamentoExistente, dados, usuarioId);
      // }

      // 7. Criar histÃ³rico
      // TEMPORARIAMENTE DESABILITADO - Tabela HistoricoOrcamento nÃ£o migrada
      // await this.criarHistorico(
      //   id,
      //   'edicao',
      //   'OrÃ§amento atualizado',
      //   usuarioId,
      //   { dados_anteriores: orcamentoExistente, dados_novos: dados },
      // );

      // 8. Notificar atualizaÃ§ÃƒÂ£o
      await this.notificacaoService.notificarAtualizacao(
        orcamentoAtualizado,
        lojaId,
      );

      const orcamentoFinal = await this.buscarOrcamento(id, lojaId);
      const orc = orcamentoFinal as unknown as Record<string, unknown>;

      // 9. Enviar e-mail ao cliente se orÃ§amento jÃ¡ foi enviado (status enviado)
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
            orc.nome_servico ?? orc.titulo ?? 'OrÃ§amento',
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
            `ðŸ“§ E-mail de orÃ§amento atualizado enviado para ${orcamentoFinal.cliente.email}`,
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.error(
            `Erro ao enviar e-mail de atualizaÃ§Ã£o para cliente: ${msg}`,
          );
          // NÃ£o falha a atualizaÃ§Ã£o - apenas loga o erro
        }
      }

      this.logger.log(`Ã¢Å“â€¦ OrÃ§amento atualizado com sucesso: ${id}`);
      return orcamentoFinal;
    } catch (error) {
      this.logger.error(`Ã¢ÂÅ’ Erro ao atualizar orÃ§amento: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove orÃ§amento
   */
  async removerOrcamento(
    id: string,
    lojaId: string,
    usuarioId: string,
    motivo?: string,
  ): Promise<void> {
    this.logger.log(`Ã°Å¸â€”â€˜Ã¯Â¸Â Removendo orÃ§amento ${id} da loja ${lojaId}`);

    try {
      // 1. Verificar se existe
      await this.buscarOrcamento(id, lojaId);

      // 2. Validar se pode ser removido
      await this.validacaoService.validarRemocao(id, lojaId);

      // 3. Criar histÃ³rico ANTES de "excluir"
      await this.criarHistorico(
        id,
        'remocao',
        `OrÃ§amento removido${motivo ? `: ${motivo}` : ''}`,
        usuarioId,
        { motivo_exclusao: motivo },
      );

      // 4. Soft delete - marcar como excluÃ­do
      await this.prisma.orcamento.update({
        where: { id },
        data: {
          status: 'EXCLUIDO',
          excluido_em: new Date(),
          excluido_por: usuarioId,
          motivo_exclusao: motivo,
        },
      });

      // 5. Notificar remoÃ§ÃƒÂ£o
      await this.notificacaoService.notificarRemocao(id, lojaId);

      this.logger.log(`Ã¢Å“â€¦ OrÃ§amento removido com sucesso: ${id}`);
    } catch (error) {
      this.logger.error(`Ã¢ÂÅ’ Erro ao remover orÃ§amento: ${error.message}`);
      throw error;
    }
  }

  // MÃ©todos privados auxiliares

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
      `Ã°Å¸â€™Â° Atualizando custos calculados para orÃ§amento ${orcamentoId}: preÃ§o_final=${preco_final}`,
    );

    await this.prisma.orcamento.update({
      where: { id: orcamentoId },
      data: {
        // Campos principais do orÃ§amento (valor_total = preco_final para listagem/relatÃ³rios)
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
        motivo_alteracao: 'AtualizaÃ§ÃƒÂ£o de orÃ§amento',
      },
    });
  }

  private construirFiltros(filtros: any, lojaId: string): any {
    const where: any = {
      loja_id: lojaId,
      status: { not: 'EXCLUIDO' }, // Excluir orÃ§amentos deletados
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
    // Sempre recalcular quando hÃ¡ mudanÃ§as que afetam o cÃ¡lculo
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
      `Ã°Å¸â€Â Debug necessitaRecalculo - Campos que afetam cÃ¡lculo encontrados: [${camposEncontrados.join(', ')}] | Resultado: ${necessita}`,
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
   * Buscar orÃ§amento para visualizaÃ§Ã£o pÃºblica (versÃ£o simplificada)
   */
  async buscarOrcamentoPublico(id: string) {
    this.logger.log(`ðŸ” Buscando orÃ§amento pÃºblico: ${id}`);
    console.log(`ðŸ” [PUBLICO] Buscando orÃ§amento com ID: ${id}`);

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
      console.log(`âŒ [PUBLICO] OrÃ§amento nÃ£o encontrado com ID: ${id}`);
      this.logger.error(`OrÃ§amento nÃ£o encontrado: ${id}`);
      throw new NotFoundException('OrÃ§amento nÃ£o encontrado');
    }

    console.log(
      `âœ… [PUBLICO] OrÃ§amento encontrado: ${orcamento.numero} - ${orcamento.titulo}`,
    );

    // Retornar apenas os dados necessÃ¡rios para visualizaÃ§ÃƒÂ£o pÃºblica do cliente
    return {
      id: orcamento.id,
      numero: orcamento.numero,
      nome_servico: orcamento.titulo,
      descricao: orcamento.descricao,
      quantidade_produto: orcamento.quantidade_produto,
      unidade_medida_produto: orcamento.unidade_medida_produto,
      preco_final: orcamento.preco_final, // APENAS o preÃ§o final, sem detalhes de custos
      status: orcamento.status,
      status_aprovacao: orcamento.status_aprovacao,
      observacoes_cliente: orcamento.observacoes_cliente,
      criado_em: orcamento.data_criacao,

      // Produtos do orÃ§amento
      produtos:
        orcamento.produtos?.map((produto) => {
          console.log(`Ã°Å¸â€Â Debug - Produto pÃºblico: ${produto.nome_servico}`, {
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
            `ðŸ” Debug - custo_total_producao: ${produto.custo_total_producao} (tipo: ${typeof produto.custo_total_producao}) â†’ ${custoTotalProducaoConvertido} (tipo: ${typeof custoTotalProducaoConvertido})`,
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
            // CORREÃ‡ÃƒO: Usar valores corretos salvos no banco
            preco_unitario: Number(produto.preco_unitario) || 0,
            preco_total: Number(produto.preco_total) || 0,
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

      // CondiÃ§ÃƒÂµes comerciais
      prazo_entrega: orcamento.prazo_entrega,
      forma_pagamento: orcamento.forma_pagamento,
      validade_proposta: orcamento.validade_proposta,
      atendente: orcamento.atendente,
      observacoes: orcamento.observacoes_internas,
    };
  }

  /**
   * Gerar cÃ³digo de aprovaÃ§ÃƒÂ£o Ãºnico - BASEADO NO LEGADO
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

      // Verificar se o cÃ³digo jÃ¡ existe
      const existe = await this.prisma.orcamento.findUnique({
        where: { codigo_aprovacao: codigo },
      });

      if (!existe) {
        return codigo;
      }
    } while (tentativas < maxTentativas);

    throw new Error(
      'NÃƒÂ£o foi possÃ­vel gerar um cÃ³digo Ãºnico apÃ³s vÃ¡rias tentativas',
    );
  }

  /**
   * Validar cÃ³digo de aprovaÃ§ÃƒÂ£o - BASEADO NO LEGADO
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
   * Processar aÃ§ÃƒÂ£o do cliente pÃºblico (aprovar/rejeitar/negociar)
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
   * Busca mensagens do chat (pÃºblico)
   */
  async buscarMensagensPublicas(orcamentoId: string) {
    this.logger.log(
      `Ã°Å¸â€Â Buscando mensagens pÃºblicas do orÃ§amento: ${orcamentoId}`,
    );

    try {
      // Verificar se orÃ§amento existe
      const orcamento = await this.buscarOrcamentoPublico(orcamentoId);
      if (!orcamento) {
        throw new Error('OrÃ§amento nÃ£o encontrado');
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

      // Transformar mensagens para formato pÃºblico
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
        `Ã¢ÂÅ’ Erro ao buscar mensagens pÃºblicas: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Buscar mensagens do chat pÃºblico - NATIVO V2
   */
  async buscarMensagensPublicasLegado(orcamentoId: string) {
    this.logger.log(
      `Ã°Å¸â€Â Buscando mensagens pÃºblicas do orÃ§amento legado: ${orcamentoId}`,
    );

    try {
      // Verificar se o orÃ§amento existe
      const orcamento = await this.prisma.orcamento.findUnique({
        where: { id: orcamentoId },
      });

      if (!orcamento) {
        throw new Error('OrÃ§amento nÃ£o encontrado');
      }

      // Buscar mensagens ordenadas por data de criaÃ§ÃƒÂ£o
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
        `Ã°Å¸â€œÅ  Retornando ${mensagensFormatadas.length} mensagens pÃºblicas do legado`,
      );
      return mensagensFormatadas;
    } catch (error) {
      this.logger.error(
        `Ã¢ÂÅ’ Erro ao buscar mensagens pÃºblicas do legado: ${error.message}`,
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
      `Ã°Å¸â€™Â¬ Enviando mensagem no chat V2 para orÃ§amento: ${orcamentoId}`,
    );
    this.logger.log(`Ã°Å¸â€™Â¬ Dados recebidos:`, JSON.stringify(dados, null, 2));

    try {
      // Validar se dados nÃ£o Ã© undefined
      if (!dados) {
        throw new Error('Dados da mensagem nÃ£o fornecidos');
      }

      // Validar tipo de mensagem
      const tiposValidos = ['CLIENTE', 'VENDEDOR', 'SISTEMA'];
      const tipo = dados.tipo || 'VENDEDOR';
      if (!tiposValidos.includes(tipo)) {
        throw new Error(
          `Tipo de mensagem invÃ¡lido. Tipos permitidos: ${tiposValidos.join(', ')}`,
        );
      }

      // Verificar se o orÃ§amento existe e pertence ÃƒÂ  loja
      const orcamento = await this.prisma.orcamento.findFirst({
        where: { id: orcamentoId, loja_id: lojaId },
      });

      if (!orcamento) {
        throw new Error('OrÃ§amento nÃ£o encontrado');
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
            'Tipo de arquivo nÃ£o permitido. Use apenas JPG, PNG, PDF ou ZIP.',
          );
        }

        // Validar tamanho (5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          throw new Error('Arquivo muito grande. Tamanho mÃ¡ximo: 5MB.');
        }

        // Salvar arquivo (em produÃ§ÃƒÂ£o seria para um serviÃ§o de storage)
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

        this.logger.log('Ã°Å¸â€œÅ½ Tentando salvar arquivo em:', caminhoArquivo);
        fs.writeFileSync(caminhoArquivo, file.buffer);
        this.logger.log('Ã°Å¸â€œÅ½ Arquivo salvo com sucesso!');

        anexoInfo = {
          nome_arquivo: file.originalname,
          url_arquivo: `/uploads/anexos/${nomeArquivo}`,
          tipo_arquivo: file.mimetype,
          tamanho: file.size,
        };

        this.logger.log('Ã°Å¸â€œÅ½ Arquivo salvo:', anexoInfo);
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

      this.logger.log(`Ã¢Å“â€¦ Mensagem enviada no chat V2: ${mensagem.id}`);

      // Criar notificaÃ§ÃƒÂ£o para outros usuÃ¡rios da loja
      await this.notificarNovaMensagemLegado(orcamentoId, lojaId, 'Vendedor');

      return mensagem;
    } catch (error) {
      this.logger.error(
        `Ã¢ÂÅ’ Erro ao enviar mensagem no chat V2: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Enviar mensagem no chat pÃºblico - NATIVO V2
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
   * Enviar mensagem no chat pÃºblico com anexo - NATIVO V2
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
      `Ã°Å¸â€™Â¬ Enviando mensagem pÃºblica no chat V2 para orÃ§amento: ${orcamentoId}`,
    );

    try {
      // Validar tipo de mensagem
      const tiposValidos = ['CLIENTE', 'VENDEDOR', 'SISTEMA'];
      const tipo = dados.tipo || 'CLIENTE';
      if (!tiposValidos.includes(tipo)) {
        throw new Error(
          `Tipo de mensagem invÃ¡lido. Tipos permitidos: ${tiposValidos.join(', ')}`,
        );
      }

      // Verificar se o orÃ§amento existe
      const orcamento = await this.prisma.orcamento.findUnique({
        where: { id: orcamentoId },
        include: { cliente: true },
      });

      if (!orcamento) {
        throw new Error('OrÃ§amento nÃ£o encontrado');
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
            'Tipo de arquivo nÃ£o permitido. Use apenas JPG, PNG, PDF ou ZIP.',
          );
        }

        // Validar tamanho (5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          throw new Error('Arquivo muito grande. Tamanho mÃ¡ximo: 5MB.');
        }

        // Salvar arquivo (em produÃ§ÃƒÂ£o seria para um serviÃ§o de storage)
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

        this.logger.log('Ã°Å¸â€œÅ½ Tentando salvar arquivo em:', caminhoArquivo);
        fs.writeFileSync(caminhoArquivo, file.buffer);
        this.logger.log('Ã°Å¸â€œÅ½ Arquivo salvo com sucesso!');

        anexoInfo = {
          nome_arquivo: file.originalname,
          url_arquivo: `/uploads/anexos/${nomeArquivo}`,
          tipo_arquivo: file.mimetype,
          tamanho: file.size,
        };

        this.logger.log('Ã°Å¸â€œÅ½ Arquivo salvo:', anexoInfo);
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
        `Ã¢Å“â€¦ Mensagem pÃºblica enviada no chat V2: ${mensagem.id}`,
      );

      // Criar notificaÃ§ÃƒÂ£o para vendedores da loja
      await this.notificarNovaMensagemLegado(
        orcamentoId,
        orcamento.loja_id,
        dados.autor_nome || 'Cliente',
      );

      return mensagem;
    } catch (error) {
      this.logger.error(
        `Ã¢ÂÅ’ Erro ao enviar mensagem pÃºblica no chat V2: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Alterar status do orÃ§amento - BASEADO NO LEGADO
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
   * Enviar orÃ§amento para o cliente
   */
  async enviarOrcamento(id: string, lojaId: string, userId: string) {
    this.logger.log(`Enviando orÃ§amento ${id} para o cliente`);

    const orcamento = await this.prisma.orcamento.findFirst({
      where: { id, loja_id: lojaId },
      include: {
        cliente: true,
        loja: true,
      },
    });

    if (!orcamento) {
      throw new NotFoundException('OrÃ§amento nÃ£o encontrado');
    }

    // Alterar status para 'enviado' (gera codigo_aprovacao se nÃ£o existir)
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
            'OrÃ§amento',
          precoFinal,
          codigoAprovacao,
          linkPublico,
        );
        emailEnviado = true;
        emailDestinatario = orcamentoAtualizado.cliente.email;
        this.logger.log(
          `ðŸ“§ E-mail de orÃ§amento enviado para ${orcamentoAtualizado.cliente.email}`,
        );
      } catch (error) {
        this.logger.error(
          `Erro ao enviar e-mail para cliente: ${error.message}`,
        );
        emailMotivo = `Erro ao enviar: ${error.message}`;
        // NÃ£o falha o envio do orÃ§amento - apenas loga o erro
      }
    } else {
      this.logger.warn(
        `OrÃ§amento ${id} sem e-mail do cliente - e-mail nÃ£o enviado`,
      );
      emailMotivo = 'Cliente sem e-mail cadastrado';
    }

    return {
      success: true,
      message: 'OrÃ§amento enviado com sucesso',
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
      throw new NotFoundException('OrÃ§amento nÃ£o encontrado');
    }

    const statusBloqueados = ['cancelado', 'rejeitado'];
    if (statusBloqueados.includes(String(orcamento.status).toLowerCase())) {
      throw new BadRequestException(
        'Este orÃ§amento nÃ£o pode ser aprovado no status atual: ' +
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
      },
    });

    if (osExistente) {
      return {
        success: true,
        message: 'OrÃ§amento jÃ¡ estava aprovado e possui OS gerada.',
        orcamento_id: id,
        os_id: osExistente.id,
        os_numero: osExistente.numero,
        status: orcamento.status,
        status_aprovacao: orcamento.status_aprovacao,
      };
    }

    const statusAnterior = orcamento.status;
    const statusAprovacaoAnterior = orcamento.status_aprovacao;
    const observacoesClienteAnterior = (orcamento as any).observacoes_cliente;
    const codigoAprovacaoAnterior = orcamento.codigo_aprovacao;

    const observacaoRegistro =
      observacoes?.trim() ||
      'OrÃ§amento aprovado internamente no sistema pelo usuÃ¡rio ' + userId;

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
        message: 'OrÃ§amento aprovado e OS gerada com sucesso.',
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
          error.message,
      );

      throw new InternalServerErrorException(
        'Falha ao aprovar e gerar OS. O orÃ§amento foi revertido.',
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
   * Registrar log de aÃ§ÃƒÂ£o - BASEADO NO LEGADO
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
        `Ã°Å¸â€œÂ LOG: OrÃ§amento ${orcamentoId} - ${acao}: ${descricao}`,
      );
    } catch (error) {
      this.logger.error(`Ã¢ÂÅ’ Erro ao registrar log: ${error.message}`);
    }
  }

  /**
   * Reenviar cÃ³digo de aprovaÃ§ÃƒÂ£o - BASEADO NO LEGADO
   */
  async reenviarCodigoAprovacao(id: string) {
    this.logger.log(
      `Ã°Å¸â€œÂ§ Reenviando cÃ³digo de aprovaÃ§ÃƒÂ£o para orÃ§amento: ${id}`,
    );

    // Verificar se o orÃ§amento existe
    const orcamento = await this.prisma.orcamento.findUnique({
      where: { id },
      include: {
        cliente: true,
        loja: true,
      },
    });

    if (!orcamento) {
      throw new NotFoundException('OrÃ§amento nÃ£o encontrado');
    }

    // Verificar se jÃ¡ tem cÃ³digo de aprovaÃ§ÃƒÂ£o
    if (!orcamento.codigo_aprovacao) {
      // Gerar novo cÃ³digo se nÃ£o existir
      const codigoAprovacao = await this.gerarCodigoAprovacao();

      await this.prisma.orcamento.update({
        where: { id },
        data: { codigo_aprovacao: codigoAprovacao },
      });

      this.logger.log(
        `Ã°Å¸â€œÂ§ Novo cÃ³digo de aprovaÃ§ÃƒÂ£o gerado: ${codigoAprovacao}`,
      );
      console.log(`Ã°Å¸â€œÂ§ ==========================================`);
      console.log(`Ã°Å¸â€œÂ§ NOVO CÃƒâ€œDIGO DE APROVAÃƒâ€¡ÃƒÆ’O GERADO!`);
      console.log(`Ã°Å¸â€œÂ§ ==========================================`);
      console.log(`Ã°Å¸â€œÂ§ OrÃ§amento: ${orcamento.numero}`);
      console.log(`Ã°Å¸â€œÂ§ Cliente: ${orcamento.cliente.nome}`);
      console.log(`Ã°Å¸â€œÂ§ CÃ³digo: ${codigoAprovacao}`);
      console.log(`Ã°Å¸â€œÂ§ ==========================================`);
    } else {
      this.logger.log(
        `Ã°Å¸â€œÂ§ CÃ³digo de aprovaÃ§ÃƒÂ£o jÃ¡ existe: ${orcamento.codigo_aprovacao}`,
      );
      console.log(`Ã°Å¸â€œÂ§ ==========================================`);
      console.log(`Ã°Å¸â€œÂ§ CÃƒâ€œDIGO DE APROVAÃƒâ€¡ÃƒÆ’O EXISTENTE!`);
      console.log(`Ã°Å¸â€œÂ§ ==========================================`);
      console.log(`Ã°Å¸â€œÂ§ OrÃ§amento: ${orcamento.numero}`);
      console.log(`Ã°Å¸â€œÂ§ Cliente: ${orcamento.cliente.nome}`);
      console.log(`Ã°Å¸â€œÂ§ CÃ³digo: ${orcamento.codigo_aprovacao}`);
      console.log(`Ã°Å¸â€œÂ§ ==========================================`);
    }

    // TODO: Implementar envio de email com o cÃ³digo
    // Por enquanto, apenas retornar sucesso

    return {
      success: true,
      message: 'CÃ³digo de aprovaÃ§ÃƒÂ£o reenviado com sucesso',
      codigo: orcamento.codigo_aprovacao,
    };
  }

  /**
   * Notificar aÃ§ÃƒÂ£o do cliente - BASEADO NO LEGADO
   */
  private async notificarAcaoCliente(
    orcamento: any,
    acao: string,
  ): Promise<void> {
    try {
      // Buscar usuÃ¡rios da loja que devem receber notificaÃ§ÃƒÂ£o
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

      // Filtrar usuÃ¡rios relevantes (vendedores, gerentes, admins)
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

      // Determinar tipo de notificaÃ§ÃƒÂ£o baseado na aÃ§ÃƒÂ£o
      let tipoNotificacao;
      let titulo;
      let mensagem;

      switch (acao) {
        case 'APROVAR':
          tipoNotificacao = TipoNotificacao.ORCAMENTO_APROVADO;
          titulo = 'OrÃ§amento Aprovado';
          mensagem = `O cliente ${orcamento.cliente.nome} aprovou o orÃ§amento #${orcamento.numero}`;
          break;
        case 'REJEITAR':
          tipoNotificacao = TipoNotificacao.ORCAMENTO_REJEITADO;
          titulo = 'OrÃ§amento Rejeitado';
          mensagem = `O cliente ${orcamento.cliente.nome} rejeitou o orÃ§amento #${orcamento.numero}`;
          break;
        case 'NEGOCIAR':
          tipoNotificacao = TipoNotificacao.NOVA_MENSAGEM;
          titulo = 'NegociaÃ§ÃƒÂ£o Iniciada';
          mensagem = `O cliente ${orcamento.cliente.nome} iniciou negociaÃ§ÃƒÂ£o no orÃ§amento #${orcamento.numero}`;
          break;
        default:
          return;
      }

      // Criar notificaÃ§ÃƒÂ£o para cada usuÃ¡rio relevante
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
        `Ã¢Å“â€¦ NotificaÃ§ÃƒÂµes de ${acao} enviadas para ${usuariosRelevantes.length} usuÃ¡rios`,
      );
    } catch (error) {
      this.logger.error(
        `Ã¢ÂÅ’ Erro ao enviar notificaÃ§ÃƒÂµes de ${acao}: ${error.message}`,
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
        `Ã°Å¸â€œÂ¢ Notificando nova mensagem no chat V2 do orÃ§amento ${orcamentoId}`,
      );

      const orcamento = await this.prisma.orcamento.findUnique({
        where: { id: orcamentoId },
        select: { numero: true, nome_servico: true },
      });

      if (!orcamento) return;

      // Criar notificaÃ§ÃƒÂ£o usando o serviÃ§o legado
      await this.notificacoesService.criarNotificacao(
        lojaId,
        TipoNotificacao.NOVA_MENSAGEM,
        'Nova mensagem no orÃ§amento',
        `${autorNome} enviou uma mensagem no orÃ§amento #${orcamento.numero}`,
        orcamentoId,
        { autor_nome: autorNome, numero_orcamento: orcamento.numero },
      );

      this.logger.log(`Ã¢Å“â€¦ NotificaÃ§ÃƒÂ£o criada para nova mensagem no chat V2`);
    } catch (error) {
      this.logger.error(
        `Ã¢ÂÅ’ Erro ao notificar nova mensagem no chat V2: ${error.message}`,
      );
    }
  }

  /**
   * Envia mensagem no chat (pÃºblico)
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
      `Ã°Å¸â€™Â¬ Enviando mensagem pÃºblica no orÃ§amento: ${orcamentoId}`,
    );

    try {
      // Verificar se orÃ§amento existe
      const orcamento = await this.buscarOrcamentoPublico(orcamentoId);
      if (!orcamento) {
        throw new Error('OrÃ§amento nÃ£o encontrado');
      }

      // Criar mensagem
      const mensagem = await this.prisma.mensagemChat.create({
        data: {
          orcamento_id: orcamentoId,
          usuario_id: 'cliente_publico', // ID especial para cliente pÃºblico
          tipo: 'texto',
          conteudo: dados.mensagem,
          anexos: JSON.stringify([]),
          data_envio: new Date(),
          lida: false,
        },
      });

      this.logger.log(
        `Ã°Å¸â€™Â¬ Mensagem pÃºblica criada: ID=${mensagem.id}, ConteÃºdo="${dados.mensagem.substring(0, 50)}...", UsuarioID=${mensagem.usuario_id}`,
      );

      this.logger.log(`Ã¢Å“â€¦ Mensagem pÃºblica enviada: ${mensagem.id}`);

      // Enviar notificaÃ§ÃƒÂ£o para vendedores da loja
      this.logger.log(
        `Ã°Å¸â€œÂ¢ Iniciando notificaÃ§ÃƒÂ£o para mensagem pÃºblica ${mensagem.id}`,
      );
      await this.notificarNovaMensagemChat(orcamento, mensagem, 'cliente');
      this.logger.log(
        `Ã¢Å“â€¦ NotificaÃ§ÃƒÂ£o para mensagem pÃºblica ${mensagem.id} concluÃ­da`,
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
      this.logger.error(`Ã¢ÂÅ’ Erro ao enviar mensagem pÃºblica: ${error.message}`);
      throw error;
    }
  }

  /**
   * Marca mensagem como visualizada (pÃºblico)
   */
  async marcarMensagemVisualizadaPublica(
    orcamentoId: string,
    mensagemId: string,
  ) {
    this.logger.log(`Ã°Å¸â€˜ÂÃ¯Â¸Â Marcando mensagem como visualizada: ${mensagemId}`);

    try {
      // Verificar se orÃ§amento existe
      const orcamento = await this.buscarOrcamentoPublico(orcamentoId);
      if (!orcamento) {
        throw new Error('OrÃ§amento nÃ£o encontrado');
      }

      // Marcar mensagem como visualizada
      await this.prisma.mensagemChat.update({
        where: { id: mensagemId },
        data: { lida: true },
      });

      this.logger.log(`Ã¢Å“â€¦ Mensagem marcada como visualizada: ${mensagemId}`);

      return {
        success: true,
        message: 'Mensagem marcada como visualizada',
        mensagem_id: mensagemId,
      };
    } catch (error) {
      this.logger.error(
        `Ã¢ÂÅ’ Erro ao marcar mensagem como visualizada: ${error.message}`,
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
        `Ã°Å¸â€œÂ¢ Notificando nova mensagem no chat do orÃ§amento ${orcamento.id}`,
      );

      // Buscar usuÃ¡rios da loja que devem receber notificaÃ§ÃƒÂ£o
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
        `Ã°Å¸â€˜Â¥ UsuÃ¡rios encontrados na loja ${orcamento.loja_id}: ${usuariosLoja.length}`,
      );
      this.logger.log(
        `Ã°Å¸â€˜Â¥ UsuÃ¡rios: ${JSON.stringify(
          usuariosLoja.map((u) => ({
            nome: u.nome_completo,
            funcao: u.funcao,
          })),
          null,
          2,
        )}`,
      );

      // Filtrar usuÃ¡rios relevantes (vendedores, gerentes, admins)
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
          `Ã°Å¸â€Â UsuÃ¡rio ${usuario.nome_completo} - FunÃ§ÃƒÂ£o: ${usuario.funcao} (${funcaoLower}) - Relevante: ${isRelevant}`,
        );
        return isRelevant;
      });

      this.logger.log(
        `Ã°Å¸Å½Â¯ UsuÃ¡rios relevantes apÃ³s filtro: ${usuariosRelevantes.length}`,
      );

      // Criar notificaÃ§ÃƒÂ£o para cada usuÃ¡rio relevante
      for (const usuario of usuariosRelevantes) {
        try {
          this.logger.log(
            `Ã°Å¸â€œÂ Criando notificaÃ§ÃƒÂ£o para usuÃ¡rio ${usuario.nome_completo} (${usuario.id})`,
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
                  ? `Cliente enviou mensagem no orÃ§amento "${orcamento.titulo || orcamento.nome_servico || 'OrÃ§amento'}": "${mensagem.conteudo.substring(0, 100)}${mensagem.conteudo.length > 100 ? '...' : ''}"`
                  : `Nova mensagem no orÃ§amento "${orcamento.titulo || orcamento.nome_servico || 'OrÃ§amento'}": "${mensagem.conteudo.substring(0, 100)}${mensagem.conteudo.length > 100 ? '...' : ''}"`,
              orcamento_id: orcamento.id,
              loja_id: orcamento.loja_id || 'qkg2dy5c5', // Fallback para loja padrÃ£o
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
            `âœ… NotificaÃ§Ã£o criada com sucesso: ${notificacao.id} para usuÃ¡rio ${usuario.nome_completo}`,
          );
        } catch (error) {
          this.logger.error(
            `Ã¢ÂÅ’ Erro ao criar notificaÃ§ÃƒÂ£o para usuÃ¡rio ${usuario.id}: ${error.message}`,
          );
          if (process.env.NODE_ENV !== 'production') {
            this.logger.error(`Ã¢ÂÅ’ Debug trace: ${error.stack}`);
          }
        }
      }

      this.logger.log(
        `Ã¢Å“â€¦ NotificaÃ§ÃƒÂµes de chat enviadas para ${usuariosRelevantes.length} usuÃ¡rios`,
      );
    } catch (error) {
      this.logger.error(
        `Ã¢ÂÅ’ Erro ao notificar nova mensagem no chat: ${error.message}`,
      );
    }
  }

  /**
   * Buscar mensagens do chat (autenticado - para vendedores) - NATIVO V2
   */
  async buscarMensagensChatLegado(orcamentoId: string, lojaId: string) {
    this.logger.log(
      `Ã°Å¸â€Â Buscando mensagens do chat V2 para orÃ§amento: ${orcamentoId}`,
    );

    try {
      // Verificar se o orÃ§amento existe e pertence ÃƒÂ  loja
      const orcamento = await this.prisma.orcamento.findFirst({
        where: { id: orcamentoId, loja_id: lojaId },
      });

      if (!orcamento) {
        throw new Error('OrÃ§amento nÃ£o encontrado');
      }

      // Buscar mensagens ordenadas por data de criaÃ§ÃƒÂ£o
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
        `Ã°Å¸â€œÅ  Retornando ${mensagensFormatadas.length} mensagens do chat V2`,
      );
      return mensagensFormatadas;
    } catch (error) {
      this.logger.error(
        `Ã¢ÂÅ’ Erro ao buscar mensagens do chat V2: ${error.message}`,
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
      `Ã°Å¸â€™Â¬ Enviando mensagem no chat autenticado para orÃ§amento ${orcamentoId}`,
    );

    try {
      // Converter string para TipoMensagem ou usar TEXTO como padrÃƒÂ£o
      const tipoMensagem = (tipo as any) || 'texto';
      return await this.chatService.enviarMensagem(
        orcamentoId,
        usuarioId,
        conteudo,
        tipoMensagem,
        anexos,
      );
    } catch (error) {
      this.logger.error(`Ã¢ÂÅ’ Erro ao enviar mensagem no chat: ${error.message}`);
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
      `Ã°Å¸â€˜ÂÃ¯Â¸Â Marcando mensagens do orÃ§amento ${orcamentoId} como visualizadas`,
    );

    try {
      return await this.chatService.marcarMensagensComoLidas(
        orcamentoId,
        usuarioId,
      );
    } catch (error) {
      this.logger.error(
        `Ã¢ÂÅ’ Erro ao marcar mensagens como visualizadas: ${error.message}`,
      );
      throw error;
    }
  }
}
