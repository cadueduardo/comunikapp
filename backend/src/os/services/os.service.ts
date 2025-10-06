/**
 * Service principal para CRUD de Ordens de Serviço
 * Limite: <= 400 linhas conforme premissas
 * Funcionalidades: CRUD básico, numeração automática, validações
 */

import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OSApprovalPermissionsService } from './os-approval-permissions.service';
import { DocumentCodeService, TipoOS } from '../../documentos/document-code.service';
import { ValidacaoEstoqueService } from '../../orcamentos-v2/services/validacao-estoque.service';
import { AlcadasOrcamentoService } from './alcadas-orcamento.service';
import { EventosAutomaticosService } from './eventos-automaticos.service';
import { CreateOSDto } from '../dto/create-os.dto';
import { UpdateOSDto, AvancarEtapaDto } from '../dto/update-os.dto';
import {
  OrdemServicoData,
  StatusOS,
  TipoMovimentacaoOS,
  ApiResponse,
  PaginatedResponse,
  EstoqueValidacaoDetalhe,
  InsumoCalculado,
} from '../interfaces/os.interfaces';
import { TipoOS as TipoOSInterface, OrigemOS, PrioridadeOS } from '../interfaces/os-direta-interna.interface';

interface OSProdutoValidacao {
  id: string;
  nome: string;
  quantidade: number;
  unidade?: string;
  insumos: Array<{
    insumo_id: string;
    quantidade: number;
    unidade?: string;
    nome?: string;
    quantidade_total?: number;
  }>;
}

interface ValidacaoEstoqueOSResultado {
  materiaisDisponiveis: boolean;
  alertasEstoque: string[];
  recomendacoesEstoque: string[];
  detalhesEstoque: EstoqueValidacaoDetalhe[];
}
@Injectable()
export class OSService {
  private readonly logger = new Logger(OSService.name)
  
  constructor(
    private readonly prisma: PrismaService,
    private readonly documentCodeService: DocumentCodeService,
    private readonly validacaoEstoqueService: ValidacaoEstoqueService,
    private readonly alcadasOrcamentoService: AlcadasOrcamentoService,
    private readonly eventosAutomaticosService: EventosAutomaticosService,
    private readonly osApprovalPermissionsService: OSApprovalPermissionsService,
  ) {}

  // ===== CRUD BÁSICO =====

  async create(lojaId: string, createOSDto: CreateOSDto): Promise<OrdemServicoData> {
    try {
      this.logger.log(`Criando nova OS para loja ${lojaId}`);

      // 1. Gerar numero sequencial
      const numero = await this.gerarNumeroOS(lojaId);

      // 2. Validar dados basicos
      await this.validarDadosOS(lojaId, createOSDto);

      // 3. Validar disponibilidade de estoque (sem bloquear criacao)
      const validacaoEstoque = await this.executarValidacaoEstoque(lojaId, createOSDto);

      // 4. Determinar status inicial baseado no tipo de OS
      let statusInicial = StatusOS.FILA;
      if (createOSDto.tipo_os === TipoOS.COMERCIAL) {
        // OS comercial vai direto para aprovação técnica
        statusInicial = StatusOS.AGUARDANDO_APROVACAO_TECNICA;
      } else if (createOSDto.tipo_os === TipoOS.INTERNA) {
        // OS interna vai direto para aprovação orçamentária
        statusInicial = StatusOS.AGUARDANDO_APROVACAO_ORCAMENTARIA;
      }

      // 5. Criar OS
      const os = await this.prisma.ordemServico.create({
        data: {
          numero,
          loja_id: lojaId,
          cliente_id: createOSDto.cliente_id,
          orcamento_id: createOSDto.orcamento_id,
          nome_servico: createOSDto.nome_servico,
          descricao: createOSDto.descricao,
          quantidade: createOSDto.quantidade,
          parametros_tecnicos: createOSDto.parametros_tecnicos
            ? JSON.stringify(createOSDto.parametros_tecnicos)
            : null,
          // NOTA: Os insumos calculados devem vir já processados pelo Motor de Cálculo V2
          // que aplica corretamente a multiplicação pela quantidade do produto
          insumos_calculados: createOSDto.insumos_calculados
            ? JSON.stringify(createOSDto.insumos_calculados)
            : null,
          data_prazo: createOSDto.data_prazo ? new Date(createOSDto.data_prazo) : null,
          responsavel_id: createOSDto.responsavel_id,
          observacoes: createOSDto.observacoes,
          status: statusInicial,
          materiais_disponivel: validacaoEstoque.materiaisDisponiveis,
          tipo_os: createOSDto.tipo_os || TipoOS.COMERCIAL,
        },
      });

      // 6. Registrar movimentacao inicial
      await this.adicionarMovimentacao(
        os.id,
        TipoMovimentacaoOS.CRIACAO,
        null,
        statusInicial,
        createOSDto.responsavel_id || 'SISTEMA',
        `OS criada no sistema - Status: ${statusInicial}`,
      );

      this.logger.log(`[OK] OS #${numero} criada com sucesso - ID: ${os.id}`);
      return this.formatarOrdemServico(os, {
        alertas_estoque: validacaoEstoque.alertasEstoque,
        recomendacoes_estoque: validacaoEstoque.recomendacoesEstoque,
        detalhes_estoque: validacaoEstoque.detalhesEstoque,
      });
    } catch (error) {
      this.logger.error('Erro ao criar OS:', error);
      throw error;
    }
  }

  async findAll(
    lojaId: string,
    page = 1,
    limit = 20,
    status?: string,
    responsavel?: string,
  ): Promise<PaginatedResponse<OrdemServicoData>> {
    try {
      const skip = (page - 1) * limit;

      // Filtros opcionais
      const where: any = { loja_id: lojaId };
      if (status) where.status = status;
      if (responsavel) where.responsavel_id = responsavel;

      // Buscar com paginação
      const [total, ordens] = await Promise.all([
        this.prisma.ordemServico.count({ where }),
        this.prisma.ordemServico.findMany({
          where,
          skip,
          take: limit,
          orderBy: { criado_em: 'desc' },
          include: {
            cliente: {
              select: {
                id: true,
                nome: true,
                email: true,
                telefone: true,
              },
            },
            itens: true,
            movimentacoes: {
              take: 1,
              orderBy: { data_movimentacao: 'desc' },
            },
          },
        }),
      ]);

      const data = ordens.map(os => this.formatarOrdemServico(os));

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error('Erro ao buscar OS:', error);
      throw error;
    }
  }

  async findOne(id: string, lojaId: string): Promise<OrdemServicoData> {
    try {
      const os = await this.prisma.ordemServico.findFirst({
        where: { id, loja_id: lojaId }, // Isolamento por tenant
        include: {
          cliente: {
            select: {
              id: true,
              nome: true,
              email: true,
              telefone: true,
            },
          },
          orcamento: {
            include: {
              produtos: {
                include: {
                  insumos: {
                    include: {
                      insumo: {
                        include: {
                          categoria: true,
                          tipoMaterial: true
                        }
                      }
                    }
                  },
                  maquinas: {
                    include: {
                      maquina: true
                    }
                  },
                  funcoes: {
                    include: {
                      funcao: true
                    }
                  }
                }
              }
            }
          },
          itens: true,
          movimentacoes: {
            orderBy: { data_movimentacao: 'desc' },
          },
          checklists: {
            orderBy: { ordem: 'asc' },
          },
        },
      });

      if (!os) {
        throw new NotFoundException(`OS com ID ${id} não encontrada`);
      }

      return this.formatarOrdemServico(os);
    } catch (error) {
      this.logger.error(`Erro ao buscar OS ${id}:`, error);
      throw error;
    }
  }

  async findByStatus(lojaId: string, status: StatusOS): Promise<OrdemServicoData[]> {
    try {
      const oss = await this.prisma.ordemServico.findMany({
        where: { loja_id: lojaId, status },
        include: {
          cliente: {
            select: {
              id: true,
              nome: true,
              email: true,
              telefone: true,
            },
          },
          orcamento: {
            include: {
              produtos: true
            }
          }
        },
        orderBy: { criado_em: 'desc' }
      });

      return oss.map(os => this.formatarOrdemServico(os));
    } catch (error) {
      this.logger.error('Erro ao buscar OSs por status:', error);
      throw error;
    }
  }

  async atualizarStatus(id: string, dados: { status: StatusOS }, usuarioId?: string): Promise<OrdemServicoData> {
    try {
      // Buscar OS atual para obter status anterior
      const osAtual = await this.prisma.ordemServico.findUnique({
        where: { id },
        select: { status: true, loja_id: true }
      });

      if (!osAtual) {
        throw new NotFoundException(`OS com ID ${id} não encontrada`);
      }

      const os = await this.prisma.ordemServico.update({
        where: { id },
        data: {
          status: dados.status,
          atualizado_em: new Date()
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
          orcamento: {
            include: {
              produtos: true
            }
          }
        }
      });

      // Notificar mudança de status via eventos automáticos
      await this.eventosAutomaticosService.notificarMudancaStatusOS(
        id,
        osAtual.status,
        dados.status,
        osAtual.loja_id,
        usuarioId
      );

      // Notificar liberação para PCP
      if (dados.status === StatusOS.LIBERADA_PARA_PCP) {
        await this.eventosAutomaticosService.notificarOSLiberadaParaPCP(
          id,
          osAtual.loja_id,
          undefined, // workflowId será definido posteriormente
          usuarioId
        );
      }

      return this.formatarOrdemServico(os);
    } catch (error) {
      this.logger.error(`Erro ao atualizar status da OS ${id}:`, error);
      throw error;
    }
  }

  async update(
    id: string,
    lojaId: string,
    updateOSDto: UpdateOSDto,
    usuarioId: string,
  ): Promise<OrdemServicoData> {
    try {
      // Verificar se OS existe e pertence à loja
      const osExistente = await this.findOne(id, lojaId);

      // Preparar dados para atualização
      const dadosAtualizacao: any = {};
      
      if (updateOSDto.nome_servico) dadosAtualizacao.nome_servico = updateOSDto.nome_servico;
      if (updateOSDto.descricao) dadosAtualizacao.descricao = updateOSDto.descricao;
      if (updateOSDto.quantidade) dadosAtualizacao.quantidade = updateOSDto.quantidade;
      if (updateOSDto.data_prazo) dadosAtualizacao.data_prazo = new Date(updateOSDto.data_prazo);
      if (updateOSDto.responsavel_id) dadosAtualizacao.responsavel_id = updateOSDto.responsavel_id;
      if (updateOSDto.observacoes) dadosAtualizacao.observacoes = updateOSDto.observacoes;
      
      if (updateOSDto.parametros_tecnicos) {
        dadosAtualizacao.parametros_tecnicos = JSON.stringify(updateOSDto.parametros_tecnicos);
      }

      // Atualizar OS
      const osAtualizada = await this.prisma.ordemServico.update({
        where: { id },
        data: dadosAtualizacao,
      });

      // Registrar movimentação
      await this.adicionarMovimentacao(
        id,
        TipoMovimentacaoOS.ADICIONAR_OBSERVACAO,
        osExistente.status,
        osExistente.status,
        usuarioId,
        'OS atualizada',
      );

      this.logger.log(`[OK] OS #${osAtualizada.numero} atualizada com sucesso`);
      return this.formatarOrdemServico(osAtualizada);
    } catch (error) {
      this.logger.error(`Erro ao atualizar OS ${id}:`, error);
      throw error;
    }
  }

  async remove(id: string, lojaId: string, usuarioId: string): Promise<void> {
    try {
      // Verificar se OS existe e pertence à loja
      const os = await this.findOne(id, lojaId);

      // Validar se pode ser excluída
      if (os.status === StatusOS.FINALIZADA) {
        throw new BadRequestException('Não é possível excluir OS finalizada');
      }

      // Registrar movimentação de cancelamento
      await this.adicionarMovimentacao(
        id,
        TipoMovimentacaoOS.CANCELAR,
        os.status,
        StatusOS.CANCELADA,
        usuarioId,
        'OS cancelada/excluída',
      );

      // Excluir OS (cascade irá remover relacionamentos)
      await this.prisma.ordemServico.delete({
        where: { id },
      });

      this.logger.log(`[OK] OS #${os.numero} excluída com sucesso`);
    } catch (error) {
      this.logger.error(`Erro ao excluir OS ${id}:`, error);
      throw error;
    }
  }

  // ===== MÉTODOS ESPECÍFICOS =====

  async avancarEtapa(
    id: string,
    nova_etapa: string,
    lojaId: string,
    usuarioId: string,
  ): Promise<OrdemServicoData> {
    try {
      const os = await this.findOne(id, lojaId);

      // Validar transição de etapa
      const transicaoValida = await this.validarTransicaoEtapa(
        os.status,
        nova_etapa,
      );

      if (!transicaoValida.valida) {
        throw new BadRequestException(transicaoValida.motivo);
      }

      // Atualizar status da OS
      const osAtualizada = await this.prisma.ordemServico.update({
        where: { id },
        data: { status: nova_etapa },
      });

      // Registrar movimentação
      await this.adicionarMovimentacao(
        id,
        TipoMovimentacaoOS.AVANCAR_ETAPA,
        os.status,
        nova_etapa,
        usuarioId,
        `Etapa avançada para ${nova_etapa}`,
      );

      this.logger.log(`[OK] OS #${os.numero} avançou de ${os.status} para ${nova_etapa}`);
      return this.formatarOrdemServico(osAtualizada);
    } catch (error) {
      this.logger.error(`Erro ao avançar etapa da OS ${id}:`, error);
      throw error;
    }
  }

  async gerarNumeroOS(lojaId: string): Promise<string> {
    try {
      return await this.documentCodeService.gerarCodigoOS(lojaId);
    } catch (error) {
      this.logger.error('Erro ao gerar numero da OS via DocumentCodeService:', error);
      throw error;
    }
  }

  // ===== MÉTODOS ESPECÍFICOS PARA OS DIRETA/INTERNA =====

  /**
   * Criar OS Comercial com validações específicas
   */
  async criarOSComercial(lojaId: string, dados: CreateOSDto, usuarioId: string): Promise<OrdemServicoData> {
    // Garantir que é OS Comercial
    const dadosComercial = { ...dados, tipo_os: TipoOS.COMERCIAL };
    
    // Gerar código específico para OS Comercial
    const codigo = await this.documentCodeService.gerarCodigoOSComercial(lojaId);
    
    // Validar dados específicos de OS Comercial
    await this.validarOSComercial(lojaId, dadosComercial);
    
    // Criar OS com dados comerciais
    const os = await this.prisma.ordemServico.create({
      data: {
        ...dadosComercial,
        numero: codigo,
        loja_id: lojaId,
        criado_por: usuarioId,
        versao: 1,
        materiais_disponivel: false,
        status: 'FILA',
        data_abertura: new Date(),
      } as any,
    });

    this.logger.log(`OS Comercial ${codigo} criada com sucesso`);
    return os as OrdemServicoData;
  }

  /**
   * Criar OS Interna com validações específicas
   */
  async criarOSInterna(lojaId: string, dados: CreateOSDto, usuarioId: string): Promise<OrdemServicoData> {
    // Garantir que é OS Interna
    const dadosInterna = { ...dados, tipo_os: TipoOS.INTERNA };
    
    // Gerar código específico para OS Interna
    const codigo = await this.documentCodeService.gerarCodigoOSInterna(lojaId);
    
    // Validar dados específicos de OS Interna
    await this.validarOSInterna(lojaId, dadosInterna);
    
    // Criar OS com dados internos
    const os = await this.prisma.ordemServico.create({
      data: {
        ...dadosInterna,
        numero: codigo,
        loja_id: lojaId,
        criado_por: usuarioId,
        versao: 1,
        materiais_disponivel: false,
        status: 'FILA',
        data_abertura: new Date(),
        aprovacao_gerencial: 'PENDENTE',
      } as any,
    });

    this.logger.log(`OS Interna ${codigo} criada com sucesso`);
    return os as OrdemServicoData;
  }


  /**
   * Aprovar OS Gerencial (para OS Interna)
   */
  async aprovarOSGerencial(
    osId: string, 
    usuarioId: string, 
    aprovado: boolean, 
    observacoes?: string
  ): Promise<OrdemServicoData> {
    const os = await this.prisma.ordemServico.findUnique({
      where: { id: osId }
    });

    if (!os) {
      throw new NotFoundException(`OS ${osId} não encontrada`);
    }

    if (os.tipo_os !== TipoOS.INTERNA) {
      throw new BadRequestException('Aprovação gerencial só se aplica a OS Interna');
    }

    const statusAprovacao = aprovado ? 'APROVADA' : 'REJEITADA';
    
    const osAtualizada = await this.prisma.ordemServico.update({
      where: { id: osId },
      data: {
        aprovacao_gerencial: statusAprovacao,
        aprovacao_gerencial_por: usuarioId,
        aprovacao_gerencial_em: new Date(),
        aprovacao_gerencial_obs: observacoes,
        modificado_por: usuarioId,
        motivo_modificacao: `Aprovação gerencial ${statusAprovacao.toLowerCase()}`,
        versao: { increment: 1 }
      }
    });

    this.logger.log(`OS ${os.numero} aprovada gerencialmente: ${statusAprovacao}`);
    return osAtualizada as OrdemServicoData;
  }

  /**
   * Agendar instalação (para OS Comercial)
   */
  async agendarInstalacao(
    osId: string,
    dataInstalacao: Date,
    observacoes?: string,
    usuarioId?: string
  ): Promise<OrdemServicoData> {
    const os = await this.prisma.ordemServico.findUnique({
      where: { id: osId }
    });

    if (!os) {
      throw new NotFoundException(`OS ${osId} não encontrada`);
    }

    if (os.tipo_os !== TipoOS.COMERCIAL) {
      throw new BadRequestException('Agendamento de instalação só se aplica a OS Comercial');
    }

    const osAtualizada = await this.prisma.ordemServico.update({
      where: { id: osId },
      data: {
        data_instalacao_agendada: dataInstalacao,
        observacoes_instalacao: observacoes,
        modificado_por: usuarioId,
        motivo_modificacao: 'Agendamento de instalação',
        versao: { increment: 1 }
      }
    });

    this.logger.log(`Instalação agendada para OS ${os.numero}: ${dataInstalacao.toISOString()}`);
    return osAtualizada as OrdemServicoData;
  }

  /**
   * Listar OS por tipo
   */
  async listarOSPorTipo(
    lojaId: string,
    tipoOS: TipoOS,
    page: number = 1,
    limit: number = 10,
    status?: string
  ): Promise<PaginatedResponse<OrdemServicoData>> {
    const skip = (page - 1) * limit;
    
    const where: any = {
      loja_id: lojaId,
      tipo_os: tipoOS
    };

    if (status) {
      where.status = status;
    }

    const [os, total] = await Promise.all([
      this.prisma.ordemServico.findMany({
        where,
        skip,
        take: limit,
        orderBy: { data_abertura: 'desc' },
        include: {
          cliente: true,
          orcamento: true,
          loja: true,
        }
      }),
      this.prisma.ordemServico.count({ where })
    ]);

    return {
      data: os as OrdemServicoData[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Obter estatísticas por tipo de OS
   */
  async obterEstatisticasPorTipo(lojaId: string, ano?: number): Promise<{
    comercial: { total: number; porStatus: { [key: string]: number } };
    interna: { total: number; porStatus: { [key: string]: number } };
  }> {
    const anoReferencia = ano || new Date().getFullYear();
    const inicioAno = new Date(anoReferencia, 0, 1);
    const fimAno = new Date(anoReferencia, 11, 31, 23, 59, 59);

    const where = {
      loja_id: lojaId,
      data_abertura: {
        gte: inicioAno,
        lte: fimAno
      }
    };

    const [osComercial, osInterna] = await Promise.all([
      this.prisma.ordemServico.findMany({
        where: { ...where, tipo_os: TipoOS.COMERCIAL },
        select: { status: true }
      }),
      this.prisma.ordemServico.findMany({
        where: { ...where, tipo_os: TipoOS.INTERNA },
        select: { status: true }
      })
    ]);

    const contarPorStatus = (os: any[]) => {
      return os.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {});
    };

    return {
      comercial: {
        total: osComercial.length,
        porStatus: contarPorStatus(osComercial)
      },
      interna: {
        total: osInterna.length,
        porStatus: contarPorStatus(osInterna)
      }
    };
  }

  // ===== MÉTODOS AUXILIARES =====

  private async executarValidacaoEstoque(lojaId: string, createOSDto: CreateOSDto): Promise<ValidacaoEstoqueOSResultado> {
    const resumoPadrao: ValidacaoEstoqueOSResultado = {
      materiaisDisponiveis: true,
      alertasEstoque: [],
      recomendacoesEstoque: [],
      detalhesEstoque: [],
    };

    const produto = this.prepararProdutoValidacaoEstoque(createOSDto);
    if (!produto) {
      return resumoPadrao;
    }

    try {
      const resultado = await this.validacaoEstoqueService.validarProdutoEstoque(produto, lojaId);
      const alertas = Array.isArray(resultado.alertas) ? resultado.alertas : [];
      const recomendacoes = Array.isArray(resultado.recomendacoes) ? resultado.recomendacoes : [];
      const detalhesBrutos = Array.isArray(resultado.estoque_disponivel) ? resultado.estoque_disponivel : [];

      return {
        materiaisDisponiveis: alertas.length === 0,
        alertasEstoque: alertas,
        recomendacoesEstoque: recomendacoes,
        detalhesEstoque: detalhesBrutos.map(item => this.mapearDetalheEstoque(item, produto)),
      };
    } catch (error) {
      this.logger.error('Erro ao validar estoque da OS:', error);
      return {
        materiaisDisponiveis: false,
        alertasEstoque: [`Erro ao validar estoque: ${error.message}`],
        recomendacoesEstoque: ['Verifique a disponibilidade no modulo de estoque.'],
        detalhesEstoque: [],
      };
    }
  }

  private prepararProdutoValidacaoEstoque(createOSDto: CreateOSDto): OSProdutoValidacao | null {
    const insumosOrigem = Array.isArray(createOSDto.insumos_calculados)
      ? createOSDto.insumos_calculados
      : [];

    if (insumosOrigem.length === 0) {
      return null;
    }

    const quantidadeBruta = Number(createOSDto.quantidade);
    const quantidade = Number.isFinite(quantidadeBruta) && quantidadeBruta > 0 ? quantidadeBruta : 1;

    const insumos = insumosOrigem
      .filter(item => item && item.insumo_id)
      .map(item => {
        const totalNecessario = Number(item.quantidade_necessaria) || 0;
        const quantidadePorUnidade = quantidade > 0 ? totalNecessario / quantidade : totalNecessario;

        return {
          insumo_id: item.insumo_id,
          quantidade: quantidadePorUnidade > 0 ? quantidadePorUnidade : totalNecessario,
          unidade: item.unidade,
          nome: item.nome,
          quantidade_total: totalNecessario,
        };
      })
      .filter(item => item.quantidade > 0);

    if (insumos.length === 0) {
      return null;
    }

    return {
      id: createOSDto.orcamento_id ?? 'OS_TEMP',
      nome: createOSDto.nome_servico,
      quantidade,
      unidade: createOSDto.parametros_tecnicos?.unidade_medida,
      insumos,
    };
  }

  private mapearDetalheEstoque(item: any, produto: OSProdutoValidacao): EstoqueValidacaoDetalhe {
    const referencia = produto.insumos.find(entrada => entrada.insumo_id === item?.insumo_id);

    return {
      insumo_id: item?.insumo_id ?? referencia?.insumo_id ?? 'desconhecido',
      nome: item?.nome ?? referencia?.nome,
      categoria: item?.categoria,
      fornecedor: item?.fornecedor,
      estoque_atual: this.parseOptionalNumber(item?.estoque_atual),
      estoque_minimo: this.parseOptionalNumber(item?.estoque_minimo),
      quantidade_necessaria: this.calcularQuantidadeNecessaria(item, referencia, produto),
      quantidade_disponivel: this.parseOptionalNumber(item?.quantidade_disponivel),
      percentual_disponivel: this.parseOptionalNumber(item?.percentual_disponivel),
      unidade: item?.unidade ?? referencia?.unidade,
      alerta_estoque: Boolean(item?.alerta_estoque),
      alerta_estoque_minimo: Boolean(item?.alerta_estoque_minimo),
      alerta_fornecedor: Boolean(item?.alerta_fornecedor),
    };
  }

  private calcularQuantidadeNecessaria(
    item: any,
    referencia: OSProdutoValidacao['insumos'][number] | undefined,
    produto: OSProdutoValidacao,
  ): number | undefined {
    const valorInformado = this.parseOptionalNumber(item?.quantidade_necessaria);
    if (typeof valorInformado === 'number') {
      return valorInformado;
    }

    const quantidadeTotalReferencia = referencia?.quantidade_total;
    if (typeof quantidadeTotalReferencia === 'number' && Number.isFinite(quantidadeTotalReferencia)) {
      return quantidadeTotalReferencia;
    }

    if (referencia) {
      const totalCalculado = referencia.quantidade * produto.quantidade;
      if (Number.isFinite(totalCalculado)) {
        return totalCalculado;
      }
    }

    return undefined;
  }

  private parseOptionalNumber(valor: any): number | undefined {
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : undefined;
  }

  // ===== M�TODOS AUXILIARES =====

  private async validarDadosOS(lojaId: string, dados: CreateOSDto): Promise<void> {
    // Validações básicas comuns
    await this.validarDadosBasicos(lojaId, dados);
    
    // Validações condicionais por tipo de OS
    if (dados.tipo_os === TipoOS.COMERCIAL) {
      await this.validarOSComercial(lojaId, dados);
    } else if (dados.tipo_os === TipoOS.INTERNA) {
      await this.validarOSInterna(lojaId, dados);
    } else {
      throw new BadRequestException(`Tipo de OS inválido: ${dados.tipo_os}`);
    }
  }

  /**
   * Validações básicas aplicáveis a todos os tipos de OS
   */
  private async validarDadosBasicos(lojaId: string, dados: CreateOSDto): Promise<void> {
    // Validar loja
    const loja = await this.prisma.loja.findUnique({
      where: { id: lojaId }
    });
    if (!loja) {
      throw new BadRequestException(`Loja ${lojaId} não encontrada`);
    }

    // Validar campos obrigatórios
    if (!dados.nome_servico || dados.nome_servico.trim() === '') {
      throw new BadRequestException('Nome do serviço é obrigatório');
    }

    if (!dados.quantidade || dados.quantidade <= 0) {
      throw new BadRequestException('Quantidade deve ser maior que zero');
    }

    // Validar prioridade
    const prioridadesValidas = ['URGENTE', 'ALTA', 'NORMAL', 'BAIXA'];
    if (dados.prioridade && !prioridadesValidas.includes(dados.prioridade)) {
      throw new BadRequestException(`Prioridade inválida: ${dados.prioridade}`);
    }

    // Validar responsável se informado
    if (dados.responsavel_id) {
      const responsavel = await this.prisma.usuario.findUnique({
        where: { id: dados.responsavel_id }
      });
      if (!responsavel) {
        throw new BadRequestException(`Responsável ${dados.responsavel_id} não encontrado`);
      }
    }
  }

  /**
   * Validações específicas para OS Comercial
   */
  private async validarOSComercial(lojaId: string, dados: CreateOSDto): Promise<void> {
    // Cliente é obrigatório para OS Comercial
    if (!dados.cliente_id) {
      throw new BadRequestException('Cliente é obrigatório para OS Comercial');
    }

    // Validar se cliente existe e pertence à loja
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: dados.cliente_id }
    });
    if (!cliente) {
      throw new BadRequestException(`Cliente ${dados.cliente_id} não encontrado`);
    }

    // Validar orçamento se informado
    if (dados.orcamento_id) {
      const orcamento = await this.prisma.orcamento.findUnique({
        where: { id: dados.orcamento_id },
        include: { produtos: true }
      });
      
      if (!orcamento) {
        throw new BadRequestException(`Orçamento ${dados.orcamento_id} não encontrado`);
      }

      if (orcamento.loja_id !== lojaId) {
        throw new BadRequestException('Orçamento não pertence à loja informada');
      }

      if (orcamento.status_aprovacao !== 'APROVADO') {
        throw new BadRequestException('Orçamento deve estar aprovado para gerar OS');
      }

      if (!orcamento.produtos || orcamento.produtos.length === 0) {
        throw new BadRequestException('Orçamento deve ter pelo menos um produto');
      }
    }

    // Validar valores monetários se informados
    if (dados.valor_orcado !== undefined && dados.valor_orcado < 0) {
      throw new BadRequestException('Valor orçado não pode ser negativo');
    }

    if (dados.satisfacao_cliente !== undefined) {
      if (!Number.isInteger(dados.satisfacao_cliente) || 
          dados.satisfacao_cliente < 1 || 
          dados.satisfacao_cliente > 5) {
        throw new BadRequestException('Satisfação do cliente deve ser um número inteiro entre 1 e 5');
      }
    }
  }

  /**
   * Validações específicas para OS Interna
   */
  private async validarOSInterna(lojaId: string, dados: CreateOSDto): Promise<void> {
    // Departamento solicitante é obrigatório para OS Interna
    if (!dados.departamento_solicitante || dados.departamento_solicitante.trim() === '') {
      throw new BadRequestException('Departamento solicitante é obrigatório para OS Interna');
    }

    // Centro de custo é obrigatório para OS Interna
    if (!dados.centro_custo || dados.centro_custo.trim() === '') {
      throw new BadRequestException('Centro de custo é obrigatório para OS Interna');
    }

    // Validar formato do centro de custo
    const regexCentroCusto = /^[A-Z]{2,4}-[A-Z0-9-]+$/;
    if (!regexCentroCusto.test(dados.centro_custo)) {
      throw new BadRequestException('Centro de custo deve ter formato válido (ex: CC-001, DEP-2024-001)');
    }

    // Cliente não deve ser informado para OS Interna
    if (dados.cliente_id) {
      throw new BadRequestException('Cliente não deve ser informado para OS Interna');
    }

    // Orçamento não deve ser informado para OS Interna
    if (dados.orcamento_id) {
      throw new BadRequestException('Orçamento não deve ser informado para OS Interna');
    }

    // Validar campos específicos de OS Interna
    if (dados.valor_orcado !== undefined) {
      throw new BadRequestException('Valor orçado não se aplica a OS Interna');
    }

    if (dados.satisfacao_cliente !== undefined) {
      throw new BadRequestException('Satisfação do cliente não se aplica a OS Interna');
    }
  }

  private async validarTransicaoEtapa(
    etapaAtual: string,
    novaEtapa: string,
    os?: any,
    usuarioId?: string
  ): Promise<{ valida: boolean; motivo?: string }> {
    
    // Transições válidas por etapa
    const transicoesValidas = {
      'FILA': ['AGUARDANDO_APROVACAO_TECNICA', 'AGUARDANDO_APROVACAO_ORCAMENTARIA', 'CANCELADA', 'PAUSADA'],
      'AGUARDANDO_APROVACAO_TECNICA': ['APROVADA_TECNICA', 'REJEITADA', 'FILA'],
      'APROVADA_TECNICA': ['PRODUCAO', 'FILA'],
      'AGUARDANDO_APROVACAO_ORCAMENTARIA': ['APROVADA_ORCAMENTARIA', 'REJEITADA', 'FILA'],
      'APROVADA_ORCAMENTARIA': ['PRODUCAO', 'FILA'],
      'REJEITADA': ['FILA', 'CANCELADA'],
      'PRODUCAO': ['ACABAMENTO', 'PAUSADA', 'AGUARDANDO_MATERIAL'],
      'ACABAMENTO': ['FINALIZADA', 'PRODUCAO'], // Pode voltar para produção
      'PAUSADA': ['FILA', 'PRODUCAO', 'ACABAMENTO'], // Pode retomar qualquer etapa
      'AGUARDANDO_MATERIAL': ['FILA', 'PRODUCAO'], // Quando material chegar
      'FINALIZADA': [], // Estado final
      'CANCELADA': [], // Estado final
    };

    const transicoesPermitidas = transicoesValidas[etapaAtual] || [];
    const valida = transicoesPermitidas.includes(novaEtapa);

    if (!valida) {
      return {
        valida: false,
        motivo: `Transição de ${etapaAtual} para ${novaEtapa} não é permitida`
      };
    }

    // Validações condicionais por tipo de OS se os dados estiverem disponíveis
    if (os && usuarioId) {
      if (os.tipo_os === TipoOS.COMERCIAL) {
        return await this.validarTransicaoOSComercial(os, etapaAtual, novaEtapa, usuarioId);
      } else if (os.tipo_os === TipoOS.INTERNA) {
        return await this.validarTransicaoOSInterna(os, etapaAtual, novaEtapa, usuarioId);
      }
    }

    return { valida: true };
  }

  /**
   * Validações específicas para transições de OS Comercial
   */
  private async validarTransicaoOSComercial(
    os: any,
    etapaAtual: string,
    novaEtapa: string,
    usuarioId: string
  ): Promise<{ valida: boolean; motivo?: string }> {
    
    // Transição para AGUARDANDO_APROVACAO_TECNICA
    if (novaEtapa === 'AGUARDANDO_APROVACAO_TECNICA') {
      // Validar se estoque está disponível
      const estoqueOk = await this.validarEstoqueDisponivel(os.id);
      if (!estoqueOk) {
        return {
          valida: false,
          motivo: 'Estoque insuficiente para aprovação técnica'
        };
      }

      // Validar se arte está anexada (se aplicável)
      const arteOk = await this.validarArteAnexada(os.id);
      if (!arteOk) {
        return {
          valida: false,
          motivo: 'Arte deve estar anexada para aprovação técnica'
        };
      }

      // Validar se especificações estão completas
      const especificacoesOk = await this.validarEspecificacoesCompletas(os.id);
      if (!especificacoesOk) {
        return {
          valida: false,
          motivo: 'Especificações técnicas devem estar completas'
        };
      }
    }

    // Transição para APROVADA_TECNICA
    if (novaEtapa === 'APROVADA_TECNICA') {
      const usuario = await this.prisma.usuario.findUnique({
        where: { id: usuarioId }
      });
      
      if (!usuario) {
        return {
          valida: false,
          motivo: 'Usuário não encontrado'
        };
      }

      const permissaoAprovacao = await this.osApprovalPermissionsService.podeAprovarTecnica(
        usuarioId, 
        usuario.loja_id
      );

      if (!permissaoAprovacao.pode) {
        return {
          valida: false,
          motivo: permissaoAprovacao.motivo || 'Usuário não tem permissão para aprovar tecnicamente'
        };
      }
    }

    // Transição para PRODUCAO
    if (novaEtapa === 'PRODUCAO') {
      if (os.aprovacao_tecnica_status !== 'APROVADA') {
        return {
          valida: false,
          motivo: 'OS Comercial deve ter aprovação técnica antes de iniciar produção'
        };
      }
    }

    // Transição para FINALIZADA
    if (novaEtapa === 'FINALIZADA') {
      if (!os.materiais_disponivel) {
        return {
          valida: false,
          motivo: 'Materiais devem estar disponíveis para finalizar OS'
        };
      }
    }

    return { valida: true };
  }

  /**
   * Validações específicas para transições de OS Interna
   */
  private async validarTransicaoOSInterna(
    os: any,
    etapaAtual: string,
    novaEtapa: string,
    usuarioId: string
  ): Promise<{ valida: boolean; motivo?: string }> {
    
    // Transição para AGUARDANDO_APROVACAO_ORCAMENTARIA
    if (novaEtapa === 'AGUARDANDO_APROVACAO_ORCAMENTARIA') {
      // Validar se centro de custo está disponível
      const centroCustoOk = await this.validarCentroCustoDisponivel(os.centro_custo, os.loja_id);
      if (!centroCustoOk) {
        return {
          valida: false,
          motivo: 'Centro de custo não disponível ou inválido'
        };
      }

      // Validar se justificativa está preenchida
      const justificativaOk = await this.validarJustificativaPreenchida(os.id);
      if (!justificativaOk) {
        return {
          valida: false,
          motivo: 'Justificativa deve estar preenchida para OS interna'
        };
      }

      // Validar se alçada é adequada
      const alcadaOk = await this.validarAlcadaAdequada(os.valor_orcado, os.centro_custo, os.loja_id);
      if (!alcadaOk) {
        return {
          valida: false,
          motivo: 'Valor excede a alçada permitida para o centro de custo'
        };
      }
    }

    // Transição para APROVADA_ORCAMENTARIA
    if (novaEtapa === 'APROVADA_ORCAMENTARIA') {
      // Verificar se usuário tem permissão para aprovar
      const usuario = await this.prisma.usuario.findUnique({
        where: { id: usuarioId }
      });
      
      if (!usuario) {
        return {
          valida: false,
          motivo: 'Usuário não encontrado'
        };
      }

      // Validar alçada do usuário
      const valorEstimado = Number(os.valor_orcado || 0);
      const alcadaPermitida = await this.validarAlcadaUsuario(usuario.funcao, valorEstimado);
      if (!alcadaPermitida) {
        return {
          valida: false,
          motivo: 'Usuário não tem alçada suficiente para aprovar este valor'
        };
      }
    }

    // Transição para PRODUCAO
    if (novaEtapa === 'PRODUCAO') {
      if (os.aprovacao_gerencial !== 'APROVADA') {
        return {
          valida: false,
          motivo: 'OS Interna deve ter aprovação orçamentária antes de iniciar produção'
        };
      }
    }

    return { valida: true };
  }

  private async adicionarMovimentacao(
    osId: string,
    tipo: TipoMovimentacaoOS,
    etapaAnterior: string | null,
    etapaAtual: string,
    usuarioId: string,
    observacoes?: string,
  ): Promise<void> {
    try {
      await this.prisma.movimentacaoOS.create({
        data: {
          os_id: osId,
          etapa_anterior: etapaAnterior,
          etapa_atual: etapaAtual,
          usuario_id: usuarioId,
          observacoes,
          data_movimentacao: new Date(),
        },
      });
    } catch (error) {
      this.logger.error('Erro ao adicionar movimentação:', error);
      // Não falhar a operação principal por erro no log
    }
  }

  private formatarOrdemServico(
    os: any,
    extras?: Partial<Pick<OrdemServicoData, 'alertas_estoque' | 'recomendacoes_estoque' | 'detalhes_estoque'>>,
  ): OrdemServicoData {
    // Processar produtos do orçamento
    const produtos = os.orcamento?.produtos || [];
    const produtosFormatados = produtos.map(produto => ({
      id: produto.id,
      nome: produto.nome,
      descricao: produto.descricao,
      quantidade: produto.quantidade,
      unidade_medida: produto.unidade_medida,
      largura: produto.largura,
      altura: produto.altura,
      profundidade: produto.profundidade,
      area_produto: produto.area_produto,
      observacoes: produto.observacoes,
      // Materiais por produto - usar dados exatos do orçamento via insumos_calculados
      materiais: produto.insumos?.map(itemInsumo => {
        // Buscar material correspondente nos insumos_calculados (dados do orçamento)
        let insumosCalculados = [];
        try {
          if (os.insumos_calculados) {
            if (typeof os.insumos_calculados === 'string') {
              insumosCalculados = JSON.parse(os.insumos_calculados);
            } else if (Array.isArray(os.insumos_calculados)) {
              insumosCalculados = os.insumos_calculados;
            }
          }
        } catch (error) {
          this.logger.warn(`Erro ao processar insumos_calculados para OS ${os.id}:`, error);
          insumosCalculados = [];
        }
        
        // Garantir que insumosCalculados é um array
        if (!Array.isArray(insumosCalculados)) {
          insumosCalculados = [];
        }
        
        const insumoCalculado = insumosCalculados.find((ic: any) => 
          ic.insumo_id === itemInsumo.insumo.id && ic.produto_nome === produto.nome
        );
        
        // Usar dados do orçamento quando disponível, fallback para dados da OS
        let quantidadeFinal = itemInsumo.quantidade;
        let unidadeFinal = itemInsumo.unidade;
        
        // Se tem dados do orçamento, aplicar lógica inteligente
        if (insumoCalculado) {
          const quantidadeInteligente = this.calcularQuantidadeInteligente(insumoCalculado, produto);
          quantidadeFinal = quantidadeInteligente.quantidade;
          unidadeFinal = quantidadeInteligente.unidade;
        }
        
        return {
          id: itemInsumo.insumo.id,
          nome: itemInsumo.insumo.nome,
          // USAR QUANTIDADE INTELIGENTE CALCULADA
          quantidade: quantidadeFinal,
          unidade: unidadeFinal,
          categoria: itemInsumo.insumo.categoria?.nome || 'Sem categoria',
          tipo_material: itemInsumo.insumo.tipoMaterial?.nome || null,
          // Usar lógica de consumo do orçamento quando disponível
          logica_consumo: insumoCalculado?.logica_consumo || itemInsumo.insumo.logica_consumo,
          parametros_consumo: insumoCalculado?.parametros_consumo || 
            (itemInsumo.insumo.parametros_consumo ? 
              (typeof itemInsumo.insumo.parametros_consumo === 'string' ? 
                JSON.parse(itemInsumo.insumo.parametros_consumo) : 
                itemInsumo.insumo.parametros_consumo) : null),
          // Adicionar informações de rastreabilidade
          origem: insumoCalculado?.origem || 'os',
          orcamento_id: insumoCalculado?.orcamento_id || os.orcamento_id,
          data_calculo: insumoCalculado?.data_calculo,
          custo_unitario: insumoCalculado?.custo_unitario || itemInsumo.custo_unitario,
          custo_total: insumoCalculado?.custo_total || itemInsumo.custo_total
        };
      }) || [],
      // Máquinas por produto
      maquinas: produto.maquinas?.map(itemMaquina => ({
        id: itemMaquina.maquina.id,
        nome: itemMaquina.maquina.nome,
        horas_uso: itemMaquina.horas_uso,
        custo_hora: itemMaquina.custo_hora,
        custo_total: itemMaquina.custo_total
      })) || [],
      // Funções por produto
      funcoes: produto.funcoes?.map(itemFuncao => ({
        id: itemFuncao.funcao.id,
        nome: itemFuncao.funcao.nome,
        horas_uso: itemFuncao.horas_uso,
        custo_hora: itemFuncao.custo_hora,
        custo_total: itemFuncao.custo_total
      })) || []
    }));

    // Consolidar materiais por tipo (para Materiais Principais)
    const materiaisConsolidados = new Map();
    produtosFormatados.forEach(produto => {
      produto.materiais.forEach(material => {
        if (materiaisConsolidados.has(material.id)) {
          const existente = materiaisConsolidados.get(material.id);
          existente.quantidade_total += material.quantidade;
          existente.produtos.push({
            nome: produto.nome,
            quantidade: produto.quantidade,
            quantidade_material: material.quantidade
          });
        } else {
          materiaisConsolidados.set(material.id, {
            id: material.id,
            nome: material.nome,
            quantidade_total: material.quantidade, // Já é a quantidade calculada correta
            unidade: material.unidade,
            categoria: material.categoria,
            tipo_material: material.tipo_material,
            logica_consumo: material.logica_consumo,
            parametros_consumo: material.parametros_consumo,
            produtos: [{
              nome: produto.nome,
              quantidade: produto.quantidade,
              quantidade_material: material.quantidade // Já é a quantidade calculada correta
            }]
          });
        }
      });
    });

    const data: OrdemServicoData = {
      id: os.id,
      numero: os.numero,
      loja_id: os.loja_id,
      cliente_id: os.cliente_id,
      orcamento_id: os.orcamento_id,
      data_abertura: os.data_abertura,
      data_prazo: os.data_prazo,
      status: os.status as StatusOS,
      responsavel_id: os.responsavel_id,
      observacoes: os.observacoes,
      nome_servico: os.nome_servico,
      descricao: os.descricao,
      quantidade: Number(os.quantidade) || 0,
      parametros_tecnicos: os.parametros_tecnicos
        ? JSON.parse(os.parametros_tecnicos)
        : null,
      insumos_calculados: (() => {
        try {
          if (os.insumos_calculados) {
            if (typeof os.insumos_calculados === 'string') {
              return JSON.parse(os.insumos_calculados);
            } else if (Array.isArray(os.insumos_calculados)) {
              return os.insumos_calculados;
            }
          }
          return [];
        } catch (error) {
          this.logger.warn(`Erro ao processar insumos_calculados para OS ${os.id}:`, error);
          return [];
        }
      })(),
      materiais_disponivel: os.materiais_disponivel,
      aprovacao_tecnica_status: os.aprovacao_tecnica_status,
      aprovacao_tecnica_por: os.aprovacao_tecnica_por,
      aprovacao_tecnica_em: os.aprovacao_tecnica_em,
      aprovacao_tecnica_obs: os.aprovacao_tecnica_obs,
      criado_em: os.criado_em,
      atualizado_em: os.atualizado_em,
      cliente: os.cliente ? {
        id: os.cliente.id,
        nome: os.cliente.nome,
        email: os.cliente.email,
        telefone: os.cliente.telefone,
      } : null,
      // Campo para compatibilidade com Grid
      cliente_nome: os.cliente?.nome || null,
      // Novos campos estruturados
      produtos: produtosFormatados,
      materiais_consolidados: Array.from(materiaisConsolidados.values()),
    };

    if (extras) {
      if (Object.prototype.hasOwnProperty.call(extras, 'alertas_estoque')) {
        data.alertas_estoque = extras.alertas_estoque;
      }
      if (Object.prototype.hasOwnProperty.call(extras, 'recomendacoes_estoque')) {
        data.recomendacoes_estoque = extras.recomendacoes_estoque;
      }
      if (Object.prototype.hasOwnProperty.call(extras, 'detalhes_estoque')) {
        data.detalhes_estoque = extras.detalhes_estoque;
      }
    }

    return data;
  }

  // ===== MÉTODOS DE CONSULTA =====

  async buscarPorStatus(lojaId: string, status: StatusOS): Promise<OrdemServicoData[]> {
    try {
      const ordens = await this.prisma.ordemServico.findMany({
        where: { loja_id: lojaId, status },
        orderBy: { criado_em: 'desc' },
        include: {
          movimentacoes: {
            take: 1,
            orderBy: { data_movimentacao: 'desc' },
          },
        },
      });

      return ordens.map(os => this.formatarOrdemServico(os));
    } catch (error) {
      this.logger.error(`Erro ao buscar OS por status ${status}:`, error);
      throw error;
    }
  }

  async buscarPorResponsavel(lojaId: string, responsavelId: string): Promise<OrdemServicoData[]> {
    try {
      const ordens = await this.prisma.ordemServico.findMany({
        where: { 
          loja_id: lojaId, 
          responsavel_id: responsavelId,
          status: { not: StatusOS.FINALIZADA }, // Apenas OS ativas
        },
        orderBy: { criado_em: 'desc' },
      });

      return ordens.map(os => this.formatarOrdemServico(os));
    } catch (error) {
      this.logger.error(`Erro ao buscar OS por responsável ${responsavelId}:`, error);
      throw error;
    }
  }

  async getEstatisticas(lojaId: string): Promise<{
    total: number;
    por_status: Record<string, number>;
    prazo_vencendo: number;
    atrasadas: number;
  }> {
    try {
      const hoje = new Date();
      const proximaSemana = new Date();
      proximaSemana.setDate(hoje.getDate() + 7);

      const [total, porStatus, prazoVencendo, atrasadas] = await Promise.all([
        // Total de OS ativas
        this.prisma.ordemServico.count({
          where: { 
            loja_id: lojaId, 
            status: { notIn: [StatusOS.FINALIZADA, StatusOS.CANCELADA] },
          },
        }),

        // Agrupamento por status
        this.prisma.ordemServico.groupBy({
          by: ['status'],
          where: { loja_id: lojaId },
          _count: { status: true },
        }),

        // Prazo vencendo (próximos 7 dias)
        this.prisma.ordemServico.count({
          where: {
            loja_id: lojaId,
            data_prazo: { lte: proximaSemana, gte: hoje },
            status: { notIn: [StatusOS.FINALIZADA, StatusOS.CANCELADA] },
          },
        }),

        // Atrasadas
        this.prisma.ordemServico.count({
          where: {
            loja_id: lojaId,
            data_prazo: { lt: hoje },
            status: { notIn: [StatusOS.FINALIZADA, StatusOS.CANCELADA] },
          },
        }),
      ]);

      // Formatar estatísticas por status
      const statusStats = porStatus.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<string, number>);

      return {
        total,
        por_status: statusStats,
        prazo_vencendo: prazoVencendo,
        atrasadas,
      };
    } catch (error) {
      this.logger.error('Erro ao buscar estatísticas:', error);
      throw error;
    }
  }

  // ===== MÉTODOS DE TRANSIÇÃO DE ESTADOS =====

  /**
   * Transiciona OS para próximo estado do workflow comercial
   */
  async transicionarEstadoOS(
    osId: string,
    novoStatus: StatusOS,
    usuarioId: string,
    observacoes?: string
  ): Promise<OrdemServicoData> {
    try {
      const os = await this.prisma.ordemServico.findUnique({
        where: { id: osId }
      });

      if (!os) {
        throw new NotFoundException(`OS ${osId} não encontrada`);
      }

      // Validar transição
      const validacao = await this.validarTransicaoEtapa(
        os.status,
        novoStatus,
        os,
        usuarioId
      );

      if (!validacao.valida) {
        throw new BadRequestException(validacao.motivo);
      }

      // Atualizar OS
      const osAtualizada = await this.prisma.ordemServico.update({
        where: { id: osId },
        data: {
          status: novoStatus,
          modificado_por: usuarioId,
          motivo_modificacao: observacoes || `Transição para ${novoStatus}`,
          versao: { increment: 1 }
        }
      });

      // Registrar movimentação
      await this.adicionarMovimentacao(
        osId,
        TipoMovimentacaoOS.AVANCAR_ETAPA,
        os.status,
        novoStatus,
        usuarioId,
        observacoes || `OS transicionada para ${novoStatus}`
      );

      this.logger.log(`OS ${os.numero} transicionada de ${os.status} para ${novoStatus}`);
      return this.formatarOrdemServico(osAtualizada);
    } catch (error) {
      this.logger.error(`Erro ao transicionar OS ${osId}:`, error);
      throw error;
    }
  }

  /**
   * Aprova OS orçamentária (workflow interna)
   */
  async aprovarOSOrcamentaria(
    osId: string,
    usuarioId: string,
    aprovado: boolean,
    observacoes?: string
  ): Promise<OrdemServicoData> {
    try {
      const os = await this.prisma.ordemServico.findUnique({
        where: { id: osId }
      });

      if (!os) {
        throw new NotFoundException(`OS ${osId} não encontrada`);
      }

      if (os.tipo_os !== TipoOS.INTERNA) {
        throw new BadRequestException('Aprovação orçamentária só se aplica a OS Interna');
      }

      if (os.status !== StatusOS.AGUARDANDO_APROVACAO_ORCAMENTARIA) {
        throw new BadRequestException('OS não está aguardando aprovação orçamentária');
      }

      // Verificar permissões do usuário
      const usuario = await this.prisma.usuario.findUnique({
        where: { id: usuarioId }
      });

      if (!usuario) {
        throw new ForbiddenException('Usuário não encontrado');
      }

      // Validar alçada do usuário usando o sistema de alçadas
      const valorEstimado = Number(os.valor_orcado || 0);
      const validacaoAlcada = await this.alcadasOrcamentoService.podeAprovarAutomaticamente(
        usuario.funcao,
        valorEstimado
      );
      
      if (!validacaoAlcada.pode) {
        throw new ForbiddenException(validacaoAlcada.motivo || 'Usuário não tem alçada suficiente para aprovar este valor');
      }

      // Validar orçamento disponível no centro de custo
      const validacaoOrcamento = await this.alcadasOrcamentoService.validarOrcamentoDisponivel(
        os.centro_custo,
        valorEstimado,
        os.loja_id
      );
      
      if (!validacaoOrcamento.pode_aprovar) {
        throw new BadRequestException(validacaoOrcamento.motivo_rejeicao || 'Orçamento insuficiente no centro de custo');
      }

      const statusAprovacao = aprovado ? 'APROVADA' : 'REJEITADA';
      const novoStatus = aprovado ? StatusOS.APROVADA_ORCAMENTARIA : StatusOS.REJEITADA;
      
      // Se aprovada, reservar orçamento
      if (aprovado) {
        const reservaOrcamento = await this.alcadasOrcamentoService.reservarOrcamento(
          os.centro_custo,
          valorEstimado,
          os.loja_id,
          osId
        );
        
        if (!reservaOrcamento.sucesso) {
          throw new BadRequestException(reservaOrcamento.motivo || 'Erro ao reservar orçamento');
        }
      }
      
      const osAtualizada = await this.prisma.ordemServico.update({
        where: { id: osId },
        data: {
          status: novoStatus,
          aprovacao_gerencial: statusAprovacao,
          aprovacao_gerencial_por: usuarioId,
          aprovacao_gerencial_em: new Date(),
          aprovacao_gerencial_obs: observacoes,
          modificado_por: usuarioId,
          motivo_modificacao: `Aprovação orçamentária ${statusAprovacao.toLowerCase()}`,
          versao: { increment: 1 }
        }
      });

      // Registrar movimentação
      await this.adicionarMovimentacao(
        osId,
        TipoMovimentacaoOS.APROVACAO_ORCAMENTARIA,
        StatusOS.AGUARDANDO_APROVACAO_ORCAMENTARIA,
        novoStatus,
        usuarioId,
        observacoes || `Aprovação orçamentária ${statusAprovacao.toLowerCase()}`
      );

      this.logger.log(`OS ${os.numero} aprovada orçamentariamente: ${statusAprovacao}`);
      return this.formatarOrdemServico(osAtualizada);
    } catch (error) {
      this.logger.error(`Erro ao aprovar OS orçamentária ${osId}:`, error);
      throw error;
    }
  }

  /**
   * Aprova OS técnica (workflow comercial)
   */
  async aprovarOSTecnica(
    osId: string,
    usuarioId: string,
    aprovado: boolean,
    observacoes?: string
  ): Promise<OrdemServicoData> {
    try {
      const os = await this.prisma.ordemServico.findUnique({
        where: { id: osId }
      });

      if (!os) {
        throw new NotFoundException(`OS ${osId} não encontrada`);
      }

      if (os.tipo_os !== TipoOS.COMERCIAL) {
        throw new BadRequestException('Aprovação técnica só se aplica a OS Comercial');
      }

      if (os.status !== StatusOS.AGUARDANDO_APROVACAO_TECNICA) {
        throw new BadRequestException('OS não está aguardando aprovação técnica');
      }

      // Verificar permissões do usuário usando sistema centralizado
      if (!usuarioId) {
        throw new BadRequestException('ID do usuário é obrigatório');
      }
      
      const usuario = await this.prisma.usuario.findUnique({
        where: { id: usuarioId }
      });

      if (!usuario) {
        throw new BadRequestException('Usuário não encontrado');
      }

      const permissaoAprovacao = await this.osApprovalPermissionsService.podeAprovarTecnica(
        usuarioId, 
        usuario.loja_id
      );

      if (!permissaoAprovacao.pode) {
        throw new ForbiddenException(permissaoAprovacao.motivo || 'Usuário não tem permissão para aprovar tecnicamente');
      }

      const statusAprovacao = aprovado ? 'APROVADA' : 'REJEITADA';
      const novoStatus = aprovado ? StatusOS.APROVADA_TECNICA : StatusOS.REJEITADA;
      
      const osAtualizada = await this.prisma.ordemServico.update({
        where: { id: osId },
        data: {
          status: novoStatus,
          aprovacao_tecnica_status: statusAprovacao,
          aprovacao_tecnica_por: usuarioId,
          aprovacao_tecnica_em: new Date(),
          aprovacao_tecnica_obs: observacoes,
          modificado_por: usuarioId,
          motivo_modificacao: `Aprovação técnica ${statusAprovacao.toLowerCase()}`,
          versao: { increment: 1 }
        }
      });

      // Registrar movimentação
      await this.adicionarMovimentacao(
        osId,
        TipoMovimentacaoOS.APROVACAO_TECNICA,
        StatusOS.AGUARDANDO_APROVACAO_TECNICA,
        novoStatus,
        usuarioId,
        observacoes || `Aprovação técnica ${statusAprovacao.toLowerCase()}`
      );

      this.logger.log(`OS ${os.numero} aprovada tecnicamente: ${statusAprovacao}`);
      return this.formatarOrdemServico(osAtualizada);
    } catch (error) {
      this.logger.error(`Erro ao aprovar OS técnica ${osId}:`, error);
      throw error;
    }
  }

  // ===== MÉTODOS DE VALIDAÇÃO PARA WORKFLOW INTERNA =====

  /**
   * Valida se centro de custo está disponível
   */
  private async validarCentroCustoDisponivel(centroCusto: string, lojaId: string): Promise<boolean> {
    try {
      // TODO: Implementar validação real de centro de custo
      // Por enquanto, retorna true para não bloquear o desenvolvimento
      return true;
    } catch (error) {
      this.logger.error('Erro ao validar centro de custo:', error);
      return false;
    }
  }

  /**
   * Valida se justificativa está preenchida
   */
  private async validarJustificativaPreenchida(osId: string): Promise<boolean> {
    try {
      const os = await this.prisma.ordemServico.findUnique({
        where: { id: osId }
      });

      if (!os) {
        return false;
      }

      // Verificar se justificativa está preenchida (usando observacoes como fallback)
      return !!(os.observacoes && os.observacoes.trim().length > 0);
    } catch (error) {
      this.logger.error('Erro ao validar justificativa:', error);
      return false;
    }
  }

  /**
   * Valida se alçada é adequada para o valor
   */
  private async validarAlcadaAdequada(valorOrcado: number, centroCusto: string, lojaId: string): Promise<boolean> {
    try {
      const valor = Number(valorOrcado || 0);
      
      // Definir limites de alçada
      const limitesAlcada = {
        'GERENTE': 2000,
        'DIRETOR': 10000,
        'SUPERVISOR': 500
      };

      // TODO: Implementar validação real baseada no centro de custo
      // Por enquanto, valida apenas se valor não excede limite máximo
      return valor <= limitesAlcada['DIRETOR'];
    } catch (error) {
      this.logger.error('Erro ao validar alçada:', error);
      return false;
    }
  }

  /**
   * Valida se usuário tem alçada suficiente para aprovar valor
   */
  private async validarAlcadaUsuario(funcaoUsuario: string, valorEstimado: number): Promise<boolean> {
    try {
      const limitesAlcada = {
        'SUPERVISOR': 500,
        'GERENTE': 2000,
        'DIRETOR': 10000,
        'ADMIN': 50000
      };

      const limiteUsuario = limitesAlcada[funcaoUsuario] || 0;
      return valorEstimado <= limiteUsuario;
    } catch (error) {
      this.logger.error('Erro ao validar alçada do usuário:', error);
      return false;
    }
  }

  // ===== MÉTODOS DE VALIDAÇÃO PARA WORKFLOW COMERCIAL =====

  /**
   * Valida se estoque está disponível para todos os insumos da OS
   */
  private async validarEstoqueDisponivel(osId: string): Promise<boolean> {
    try {
      const os = await this.prisma.ordemServico.findUnique({
        where: { id: osId }
      });

      if (!os) {
        return false;
      }

      // TODO: Implementar validação real de estoque usando ValidacaoEstoqueService
      // Por enquanto, retorna true para não bloquear o desenvolvimento
      return true;
    } catch (error) {
      this.logger.error('Erro ao validar estoque:', error);
      return false;
    }
  }

  /**
   * Valida se arte está anexada (quando aplicável)
   */
  private async validarArteAnexada(osId: string): Promise<boolean> {
    try {
      const os = await this.prisma.ordemServico.findUnique({
        where: { id: osId }
      });

      if (!os) {
        return false;
      }

      // TODO: Implementar validação real de arquivos anexados
      // Por enquanto, retorna true para não bloquear o desenvolvimento
      return true;
    } catch (error) {
      this.logger.error('Erro ao validar arte anexada:', error);
      return false;
    }
  }

  /**
   * Valida se especificações técnicas estão completas
   */
  private async validarEspecificacoesCompletas(osId: string): Promise<boolean> {
    try {
      const os = await this.prisma.ordemServico.findUnique({
        where: { id: osId }
      });

      if (!os) {
        return false;
      }

      // Verificar campos obrigatórios
      const camposObrigatorios = [
        'nome_servico',
        'descricao',
        'quantidade',
        'parametros_tecnicos'
      ];

      for (const campo of camposObrigatorios) {
        if (!os[campo]) {
          return false;
        }
      }

      // Verificar se parâmetros técnicos estão completos
      if (os.parametros_tecnicos) {
        const parametros = os.parametros_tecnicos as any;
        if (!parametros.dimensoes || !parametros.material_principal) {
          return false;
        }
      }

      return true;
    } catch (error) {
      this.logger.error('Erro ao validar especificações:', error);
      return false;
    }
  }

  // ===== MÉTODOS DE INTEGRAÇÃO =====

  async criarOSDeOrcamento(
    lojaId: string,
    dadosOrcamento: any,
    usuarioId: string,
  ): Promise<OrdemServicoData> {
    try {
      this.logger.log(`Criando OS a partir do orçamento ${dadosOrcamento.orcamento_id}`);

      // 1. Buscar orçamento completo com produtos e insumos
      const orcamentoCompleto = await this.prisma.orcamento.findUnique({
        where: { 
          id: dadosOrcamento.orcamento_id,
          loja_id: lojaId 
        },
        include: {
          produtos: {
            include: {
              insumos: {
                include: { 
                  insumo: {
                    include: {
                      categoria: true,
                      tipoMaterial: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!orcamentoCompleto) {
        throw new Error(`Orçamento ${dadosOrcamento.orcamento_id} não encontrado`);
      }

      // 2. Extrair materiais exatos do orçamento
      const materiaisOrcamento = this.extrairMateriaisDoOrcamento(orcamentoCompleto);

      const createDto: CreateOSDto = {
        tipo_os: TipoOS.COMERCIAL, // OS criada a partir de orçamento é sempre comercial
        origem_os: OrigemOS.ORCAMENTO,
        prioridade: PrioridadeOS.NORMAL,
        cliente_id: dadosOrcamento.cliente_id,
        orcamento_id: dadosOrcamento.orcamento_id,
        nome_servico: dadosOrcamento.nome_servico,
        descricao: dadosOrcamento.descricao,
        quantidade: dadosOrcamento.quantidade_produto,
        parametros_tecnicos: {
          largura: dadosOrcamento.largura_produto,
          altura: dadosOrcamento.altura_produto,
          area: dadosOrcamento.area_produto,
          unidade_medida: dadosOrcamento.unidade_medida_produto,
        },
        responsavel_id: dadosOrcamento.responsavel_id,
        insumos_calculados: JSON.stringify(materiaisOrcamento), // Materiais exatos do orçamento
      };

      const os = await this.create(lojaId, createDto);

      this.logger.log(`[OK] OS #${os.numero} criada automaticamente do orçamento com ${materiaisOrcamento.length} materiais`);
      return os;
    } catch (error) {
      this.logger.error('Erro ao criar OS de orçamento:', error);
      throw error;
    }
  }

  /**
   * Calcula quantidade inteligente baseada na lógica de consumo
   */
  private calcularQuantidadeInteligente(
    insumoCalculado: InsumoCalculado,
    produto: any
  ): { quantidade: number; unidade: string } {
    const { logica_consumo, parametros_consumo, quantidade_necessaria, unidade, nome } = insumoCalculado;
    const quantidadeProdutos = parseFloat(produto.quantidade || '1');
    
    // Lógica específica para bobinas (área em m²)
    if (nome?.toLowerCase().includes('bobina') && nome?.toLowerCase().includes('lona')) {
      // Para bobinas, mostrar área em m²
      return { quantidade: quantidade_necessaria, unidade: 'M2' };
    }
    
    // Lógica específica para madeira (unidades físicas)
    if (nome?.toLowerCase().includes('madeira') || nome?.toLowerCase().includes('cabo')) {
      // Para madeira, calcular unidades físicas necessárias
      // Exemplo: 100cm por banner, madeira de 105cm = 1 unidade por banner
      const cmPorBanner = 100; // Assumindo 100cm por banner
      const cmDisponivel = 105; // Madeira de 105cm
      const unidadesNecessarias = Math.ceil((cmPorBanner * quantidadeProdutos) / cmDisponivel);
      
      return { quantidade: unidadesNecessarias, unidade: 'UNID' };
    }
    
    // Lógica específica para cordão (metro linear)
    if (nome?.toLowerCase().includes('cordao') || nome?.toLowerCase().includes('cordão')) {
      // Para cordão, calcular metros lineares necessários
      // Exemplo: 12m por banner (perímetro)
      const metrosPorBanner = 12; // Assumindo 12m por banner
      const metrosNecessarios = metrosPorBanner * quantidadeProdutos;
      
      return { quantidade: metrosNecessarios, unidade: 'M' };
    }
    
    // Lógica específica para ponteiras (unidades)
    if (nome?.toLowerCase().includes('ponteira')) {
      // Para ponteiras, calcular unidades necessárias
      // Exemplo: 2 ponteiras por banner
      const ponteirasPorBanner = 2;
      const unidadesNecessarias = ponteirasPorBanner * quantidadeProdutos;
      
      return { quantidade: unidadesNecessarias, unidade: 'UNID' };
    }
    
    // Lógica específica para ilhos (unidades)
    if (nome?.toLowerCase().includes('ilho')) {
      // Para ilhos, calcular unidades necessárias
      // Exemplo: 4 ilhos por banner
      const ilhosPorBanner = 4;
      const unidadesNecessarias = ilhosPorBanner * quantidadeProdutos;
      
      return { quantidade: unidadesNecessarias, unidade: 'UNID' };
    }

    // Lógica genérica baseada na lógica de consumo
    if (logica_consumo === 'area') {
      return { quantidade: quantidade_necessaria, unidade: 'M2' };
    }
    
    if (logica_consumo === 'linear' || logica_consumo === 'quantidade_fixa') {
      return { quantidade: quantidade_necessaria, unidade: 'UNID' };
    }

    // Fallback: retorna quantidade original
    return { quantidade: quantidade_necessaria, unidade };
  }

  /**
   * Extrai materiais exatos do orçamento para garantir consistência na OS
   */
  private extrairMateriaisDoOrcamento(orcamento: any): InsumoCalculado[] {
    const materiais: InsumoCalculado[] = [];

    if (!orcamento.produtos || !Array.isArray(orcamento.produtos)) {
      this.logger.warn('Orçamento sem produtos válidos');
      return materiais;
    }

    orcamento.produtos.forEach(produto => {
      if (!produto.insumos || !Array.isArray(produto.insumos)) {
        this.logger.warn(`Produto ${produto.nome} sem insumos válidos`);
        return;
      }

      produto.insumos.forEach(itemInsumo => {
        if (!itemInsumo.insumo) {
          this.logger.warn(`ItemInsumo ${itemInsumo.id} sem insumo associado`);
          return;
        }

        // Usar dados exatos do orçamento
        materiais.push({
          insumo_id: itemInsumo.insumo.id,
          nome: itemInsumo.insumo.nome,
          quantidade_necessaria: parseFloat(itemInsumo.quantidade || '0'),
          unidade: itemInsumo.unidade || itemInsumo.insumo.unidade_uso || 'un',
          custo_unitario: parseFloat(itemInsumo.custo_unitario || '0'),
          custo_total: parseFloat(itemInsumo.custo_total || '0'),
          produto_nome: produto.nome || 'Produto sem nome',
          logica_consumo: itemInsumo.insumo.logica_consumo || 'area',
          parametros_consumo: itemInsumo.insumo.parametros_consumo ? 
            (typeof itemInsumo.insumo.parametros_consumo === 'string' ? 
              JSON.parse(itemInsumo.insumo.parametros_consumo) : 
              itemInsumo.insumo.parametros_consumo) : null,
          origem: 'orcamento',
          orcamento_id: orcamento.id,
          data_calculo: orcamento.data_ultimo_calculo || orcamento.criado_em,
          disponivel_estoque: false, // Será calculado posteriormente
          quantidade_disponivel: 0,
          localizacao_estoque: null
        });
      });
    });

    this.logger.log(`Extraídos ${materiais.length} materiais do orçamento ${orcamento.id}`);
    return materiais;
  }

  /**
   * Valida se a OS está sincronizada com o orçamento
   */
  async validarSincronizacaoOSOrcamento(osId: string): Promise<{
    sincronizada: boolean;
    diferencas: any[];
    alertas: string[];
  }> {
    try {
      const os = await this.prisma.ordemServico.findUnique({
        where: { id: osId },
        include: { 
          orcamento: {
            include: {
              produtos: {
                include: {
                  insumos: {
                    include: { insumo: true }
                  }
                }
              }
            }
          }
        }
      });

      if (!os) {
        throw new Error(`OS ${osId} não encontrada`);
      }

      if (!os.orcamento_id || !os.orcamento) {
        return {
          sincronizada: true,
          diferencas: [],
          alertas: ['OS sem orçamento vinculado - não há sincronização necessária']
        };
      }

      // Extrair materiais atuais da OS
      let materiaisOS = [];
      try {
        if (os.insumos_calculados) {
          if (typeof os.insumos_calculados === 'string') {
            materiaisOS = JSON.parse(os.insumos_calculados);
          } else if (Array.isArray(os.insumos_calculados)) {
            materiaisOS = os.insumos_calculados;
          }
        }
      } catch (error) {
        this.logger.warn(`Erro ao processar insumos_calculados da OS ${osId}:`, error);
        return {
          sincronizada: false,
          diferencas: [],
          alertas: ['Erro ao processar materiais da OS']
        };
      }

      // Extrair materiais do orçamento
      const materiaisOrcamento = this.extrairMateriaisDoOrcamento(os.orcamento);

      // Comparar materiais
      const diferencas = [];
      const alertas = [];

      // Verificar se todos os materiais da OS existem no orçamento
      for (const materialOS of materiaisOS) {
        const materialOrcamento = materiaisOrcamento.find(m => 
          m.insumo_id === materialOS.insumo_id && m.produto_nome === materialOS.produto_nome
        );

        if (!materialOrcamento) {
          diferencas.push({
            tipo: 'material_nao_encontrado',
            insumo_id: materialOS.insumo_id,
            produto_nome: materialOS.produto_nome,
            mensagem: 'Material da OS não encontrado no orçamento'
          });
          continue;
        }

        // Comparar quantidades
        if (materialOS.quantidade_necessaria !== materialOrcamento.quantidade_necessaria) {
          diferencas.push({
            tipo: 'quantidade_diferente',
            insumo_id: materialOS.insumo_id,
            produto_nome: materialOS.produto_nome,
            quantidade_os: materialOS.quantidade_necessaria,
            quantidade_orcamento: materialOrcamento.quantidade_necessaria,
            diferenca: materialOS.quantidade_necessaria - materialOrcamento.quantidade_necessaria
          });
        }

        // Comparar custos
        if (Math.abs(materialOS.custo_unitario - materialOrcamento.custo_unitario) > 0.01) {
          diferencas.push({
            tipo: 'custo_diferente',
            insumo_id: materialOS.insumo_id,
            produto_nome: materialOS.produto_nome,
            custo_os: materialOS.custo_unitario,
            custo_orcamento: materialOrcamento.custo_unitario,
            diferenca: materialOS.custo_unitario - materialOrcamento.custo_unitario
          });
        }
      }

      // Verificar se todos os materiais do orçamento existem na OS
      for (const materialOrcamento of materiaisOrcamento) {
        const materialOS = materiaisOS.find(m => 
          m.insumo_id === materialOrcamento.insumo_id && m.produto_nome === materialOrcamento.produto_nome
        );

        if (!materialOS) {
          diferencas.push({
            tipo: 'material_faltando',
            insumo_id: materialOrcamento.insumo_id,
            produto_nome: materialOrcamento.produto_nome,
            mensagem: 'Material do orçamento não encontrado na OS'
          });
        }
      }

      // Gerar alertas baseados nas diferenças
      if (diferencas.length > 0) {
        alertas.push(`Encontradas ${diferencas.length} diferenças entre OS e orçamento`);
        
        const tiposDiferentes = [...new Set(diferencas.map(d => d.tipo))];
        tiposDiferentes.forEach(tipo => {
          const count = diferencas.filter(d => d.tipo === tipo).length;
          alertas.push(`${count} ${tipo.replace('_', ' ')}`);
        });
      }

      const sincronizada = diferencas.length === 0;

      this.logger.log(`Validação de sincronização OS ${osId}: ${sincronizada ? 'SINCRONIZADA' : 'DESINCRONIZADA'} (${diferencas.length} diferenças)`);

      return {
        sincronizada,
        diferencas,
        alertas
      };

    } catch (error) {
      this.logger.error(`Erro ao validar sincronização OS ${osId}:`, error);
      throw error;
    }
  }

  /**
   * Sincroniza OS com o orçamento (re-extrai materiais exatos)
   */
  async sincronizarComOrcamento(osId: string, lojaId: string): Promise<{
    sucesso: boolean;
    materiais: InsumoCalculado[];
    diferencas: any[];
    alertas: string[];
  }> {
    try {
      this.logger.log(`Iniciando sincronização da OS ${osId} com orçamento`);

      const os = await this.prisma.ordemServico.findUnique({
        where: { 
          id: osId,
          loja_id: lojaId 
        },
        include: { 
          orcamento: {
            include: {
              produtos: {
                include: {
                  insumos: {
                    include: { 
                      insumo: {
                        include: {
                          categoria: true,
                          tipoMaterial: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!os) {
        throw new Error(`OS ${osId} não encontrada`);
      }

      if (!os.orcamento_id || !os.orcamento) {
        throw new Error('OS não possui orçamento vinculado');
      }

      // Validar sincronização antes da atualização
      const validacao = await this.validarSincronizacaoOSOrcamento(osId);

      // Re-extrair materiais do orçamento
      const materiaisAtualizados = this.extrairMateriaisDoOrcamento(os.orcamento);

      // Atualizar OS com materiais exatos do orçamento
      await this.prisma.ordemServico.update({
        where: { id: osId },
        data: {
          insumos_calculados: JSON.stringify(materiaisAtualizados),
          atualizado_em: new Date()
        }
      });

      // Validar sincronização após a atualização
      const validacaoPos = await this.validarSincronizacaoOSOrcamento(osId);

      this.logger.log(`Sincronização concluída: OS ${osId} atualizada com ${materiaisAtualizados.length} materiais`);

      return {
        sucesso: true,
        materiais: materiaisAtualizados,
        diferencas: validacaoPos.diferencas,
        alertas: [
          `OS sincronizada com orçamento ${os.orcamento_id}`,
          `Atualizados ${materiaisAtualizados.length} materiais`,
          ...validacaoPos.alertas
        ]
      };

    } catch (error) {
      this.logger.error(`Erro ao sincronizar OS ${osId}:`, error);
      throw error;
    }
  }


  // ===== HEALTH CHECK =====

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      // Verificar conexão com banco
      await this.prisma.$queryRaw`SELECT 1`;
      
      return {
        status: 'OK',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Health check falhou:', error);
      return {
        status: 'ERROR',
        timestamp: new Date().toISOString(),
      };
    }
  }

}

