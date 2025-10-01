/**
 * Service principal para CRUD de Ordens de Serviço
 * Limite: <= 400 linhas conforme premissas
 * Funcionalidades: CRUD básico, numeração automática, validações
 */

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentCodeService, TipoOS } from '../../documentos/document-code.service';
import { ValidacaoEstoqueService } from '../../orcamentos-v2/services/validacao-estoque.service';
import { CreateOSDto } from '../dto/create-os.dto';
import { UpdateOSDto, AvancarEtapaDto } from '../dto/update-os.dto';
import {
  OrdemServicoData,
  StatusOS,
  TipoMovimentacaoOS,
  ApiResponse,
  PaginatedResponse,
  EstoqueValidacaoDetalhe,
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
  private readonly logger = new Logger(OSService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly documentCodeService: DocumentCodeService,
    private readonly validacaoEstoqueService: ValidacaoEstoqueService,
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

      // 4. Criar OS
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
          insumos_calculados: createOSDto.insumos_calculados
            ? JSON.stringify(createOSDto.insumos_calculados)
            : null,
          data_prazo: createOSDto.data_prazo ? new Date(createOSDto.data_prazo) : null,
          responsavel_id: createOSDto.responsavel_id,
          observacoes: createOSDto.observacoes,
          status: StatusOS.FILA,
          materiais_disponivel: validacaoEstoque.materiaisDisponiveis,
        },
      });

      // 5. Registrar movimentacao inicial
      await this.adicionarMovimentacao(
        os.id,
        TipoMovimentacaoOS.CRIACAO,
        null,
        StatusOS.FILA,
        createOSDto.responsavel_id || 'SISTEMA',
        'OS criada no sistema',
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
   * Aprovar OS Técnica (para OS Comercial)
   */
  async aprovarOSTecnica(
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

    if (os.tipo_os !== TipoOS.COMERCIAL) {
      throw new BadRequestException('Aprovação técnica só se aplica a OS Comercial');
    }

    const statusAprovacao = aprovado ? 'APROVADA' : 'REJEITADA';
    
    const osAtualizada = await this.prisma.ordemServico.update({
      where: { id: osId },
      data: {
        aprovacao_tecnica_status: statusAprovacao,
        aprovacao_tecnica_por: usuarioId,
        aprovacao_tecnica_em: new Date(),
        aprovacao_tecnica_obs: observacoes,
        modificado_por: usuarioId,
        motivo_modificacao: `Aprovação técnica ${statusAprovacao.toLowerCase()}`,
        versao: { increment: 1 }
      }
    });

    this.logger.log(`OS ${os.numero} aprovada tecnicamente: ${statusAprovacao}`);
    return osAtualizada as OrdemServicoData;
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
      'FILA': ['PRODUCAO', 'CANCELADA', 'PAUSADA'],
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
    // Para OS Comercial, aprovação técnica é obrigatória antes de PRODUCAO
    if (novaEtapa === 'PRODUCAO') {
      if (os.aprovacao_tecnica_status !== 'APROVADA') {
        return {
          valida: false,
          motivo: 'OS Comercial deve ter aprovação técnica antes de iniciar produção'
        };
      }
    }

    // Para finalização, verificar se materiais estão disponíveis
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
    // Para OS Interna, aprovação gerencial é obrigatória antes de PRODUCAO
    if (novaEtapa === 'PRODUCAO') {
      if (os.aprovacao_gerencial !== 'APROVADA') {
        return {
          valida: false,
          motivo: 'OS Interna deve ter aprovação gerencial antes de iniciar produção'
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
      insumos_calculados: os.insumos_calculados
        ? JSON.parse(os.insumos_calculados)
        : null,
      materiais_disponivel: os.materiais_disponivel,
      criado_em: os.criado_em,
      atualizado_em: os.atualizado_em,
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

  // ===== MÉTODOS DE INTEGRAÇÃO =====

  async criarOSDeOrcamento(
    lojaId: string,
    dadosOrcamento: any,
    usuarioId: string,
  ): Promise<OrdemServicoData> {
    try {
      this.logger.log(`Criando OS a partir do orçamento ${dadosOrcamento.orcamento_id}`);

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
        insumos_calculados: dadosOrcamento.custos_calculados,
      };

      const os = await this.create(lojaId, createDto);

      this.logger.log(`[OK] OS #${os.numero} criada automaticamente do orçamento`);
      return os;
    } catch (error) {
      this.logger.error('Erro ao criar OS de orçamento:', error);
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

