/**
 * Service principal para CRUD de Ordens de Serviço
 * Limite: <= 400 linhas conforme premissas
 * Funcionalidades: CRUD básico, numeração automática, validações
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OSApprovalPermissionsService } from './os-approval-permissions.service';
import {
  DocumentCodeService,
  TipoOS,
} from '../../documentos/document-code.service';
import { ValidacaoEstoqueService } from '../../orcamentos-v2/services/validacao-estoque.service';
import { resolverStatusArteInicial } from '../../modules/arte-aprovacao/utils/arte-os-propagacao.util';
import { AlcadasOrcamentoService } from './alcadas-orcamento.service';
import { EventosAutomaticosService } from './eventos-automaticos.service';
import { OSValidacoesService } from './os-validacoes.service';
import { WorkflowAssignmentService } from '../../pcp/services/workflow-assignment.service';
import { ExpedicaoCriacaoService } from '../../expedicao/services/expedicao-criacao.service';
import { ItemOSInstalacaoCriacaoService } from '../../instalacao/services/item-os-instalacao-criacao.service';
import { CreateOSDto } from '../dto/create-os.dto';
import { AnotarSobraDto, RegistrarSobraDto } from '../dto/os-materiais.dto';
import { CorrecaoMateriaisHelper } from '../helpers/correcao-materiais.helper';
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
import {
  computeArteResumoGrid,
  computeLiberacaoResumoGrid,
  computeStatusOSLiberacaoFromItens,
  comTipoItemOrcamento,
  getMotivosBloqueioPcp,
  isElegivelPcp,
  itemRequerFabricaPcp,
  resolveIdsAlvoLiberacao,
} from '../utils/os-liberacao-pcp.util';
import {
  assertProdutoFinitoTenant,
  resolverPropagacaoPersonalizacaoItemOS,
} from '../utils/item-os-personalizacao.util';
import { ArteProducaoService } from '../../catalogo/producao/arte-producao.service';
import { PcpBloqueioSinalService } from '../../instalacao/services/pcp-bloqueio-sinal.service';
import { StatusLiberacaoPcp } from '../../instalacao/constants/pcp-liberacao.constants';
import {
  ModoFulfillmentItem,
  StatusOrdemTerceirizacao,
  StatusInstalacaoOs,
  TipoFornecedor,
} from '@prisma/client';
import {
  TipoOS as TipoOSInterface,
  OrigemOS,
  PrioridadeOS,
} from '../interfaces/os-direta-interna.interface';
import {
  materiaisDisponiveisParaFluxo,
  TIPO_VINCULO_OS_ADITIVA_INSTALACAO,
} from '../utils/os-pular-fluxo.util';
import { calcularAtencaoInstalacaoOs } from '../../instalacao/utils/instalacao-atencao.util';

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
    private readonly alcadasOrcamentoService: AlcadasOrcamentoService,
    private readonly eventosAutomaticosService: EventosAutomaticosService,
    private readonly osApprovalPermissionsService: OSApprovalPermissionsService,
    private readonly osValidacoesService: OSValidacoesService,
    private readonly workflowAssignmentService: WorkflowAssignmentService,
    private readonly expedicaoCriacaoService: ExpedicaoCriacaoService,
    private readonly itemOSInstalacaoCriacaoService: ItemOSInstalacaoCriacaoService,
    private readonly arteProducaoService: ArteProducaoService,
    private readonly pcpBloqueioSinalService: PcpBloqueioSinalService,
  ) {}

  // ===== CRUD BÁSICO =====

  private parseJsonArray<T = any>(valor: unknown, contexto: string): T[] {
    if (!valor) {
      return [];
    }

    if (Array.isArray(valor)) {
      return valor as T[];
    }

    if (typeof valor !== 'string') {
      return [];
    }

    try {
      const parsed = JSON.parse(valor);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      this.logger.warn(`Erro ao processar ${contexto}:`, error);
      return [];
    }
  }

  private serializarInsumosCalculados(
    valor: CreateOSDto['insumos_calculados'],
    quantidadeProduto: number,
  ): string | null {
    if (!valor) {
      return null;
    }

    if (typeof valor === 'string') {
      const insumos = this.parseJsonArray(valor, 'insumos_calculados');
      return JSON.stringify(insumos);
    }

    if (Array.isArray(valor)) {
      const corrigidos = CorrecaoMateriaisHelper.corrigirInsumosCalculados(
        valor as any,
        Number(quantidadeProduto || 1),
      );
      return JSON.stringify(corrigidos);
    }

    return null;
  }

  private serializarParametrosTecnicos(parametros: unknown): string | null {
    if (!parametros) {
      return null;
    }

    return typeof parametros === 'string'
      ? parametros
      : JSON.stringify(parametros);
  }

  /**
   * Normaliza a `prioridade` herdada do orcamento para o enum PrioridadeOS.
   *
   * Os dados antigos do orcamento podem ter valores fora do enum oficial
   * (URGENTE | ALTA | NORMAL | BAIXA), por exemplo "media", "alta", "baixa"
   * ou ate `null`. Aqui:
   * - Convertemos para UPPERCASE.
   * - Mapeamos sinonimos comuns (MEDIA, MEDIO, MEDIUM -> NORMAL).
   * - Aceitamos somente valores listados em PrioridadeOS; qualquer outra
   *   coisa cai para NORMAL com um warning.
   */
  private normalizarPrioridadeOS(valor: unknown): PrioridadeOS {
    if (valor === null || valor === undefined) {
      return PrioridadeOS.NORMAL;
    }

    if (typeof valor !== 'string') {
      this.logger.warn(
        `Prioridade do orcamento nao e string ("${String(valor)}"). Usando NORMAL.`,
      );
      return PrioridadeOS.NORMAL;
    }

    const upper = valor.trim().toUpperCase();
    if (!upper) {
      return PrioridadeOS.NORMAL;
    }

    const sinonimosParaNormal = new Set(['MEDIA', 'MEDIO', 'MEDIUM']);
    if (sinonimosParaNormal.has(upper)) {
      return PrioridadeOS.NORMAL;
    }

    const valoresValidos = Object.values(PrioridadeOS) as string[];
    if (valoresValidos.includes(upper)) {
      return upper as PrioridadeOS;
    }

    this.logger.warn(
      `Prioridade do orcamento fora do enum PrioridadeOS ("${valor}"). Usando NORMAL.`,
    );
    return PrioridadeOS.NORMAL;
  }

  /**
   * Normaliza `data_prazo` aceitando apenas valores parseaveis para Date.
   * Texto livre (ex.: "10 a 15 dias uteis") herdado do orcamento e descartado
   * para nao quebrar o create do Prisma (que exige ISO-8601 DateTime).
   */
  private normalizarDataPrazo(valor: unknown): Date | null {
    if (!valor) {
      return null;
    }

    if (valor instanceof Date) {
      return Number.isNaN(valor.getTime()) ? null : valor;
    }

    if (typeof valor !== 'string') {
      return null;
    }

    const texto = valor.trim();
    if (!texto) {
      return null;
    }

    const data = new Date(texto);
    if (Number.isNaN(data.getTime())) {
      this.logger.warn(
        `data_prazo recebida nao parseavel como ISO-8601: "${texto}". Gravando NULL.`,
      );
      return null;
    }

    return data;
  }

  private parseJsonObject(valor: unknown, contexto: string): any {
    if (!valor) {
      return null;
    }

    if (typeof valor !== 'string') {
      return valor;
    }

    try {
      return JSON.parse(valor);
    } catch (error) {
      this.logger.warn(`Erro ao processar ${contexto}:`, error);
      return null;
    }
  }

  async create(
    lojaId: string,
    createOSDto: CreateOSDto,
  ): Promise<OrdemServicoData> {
    try {
      this.logger.log(`Criando nova OS para loja ${lojaId}`);

      // 1. Numeração: OS herdada do ORC (ORC-AAAA-NNN → OS-AAAA-NNN) ou sequencial avulsa
      const numero = await this.resolverNumeroParaCriacao(lojaId, createOSDto);

      // 2. Validar dados basicos
      await this.validarDadosOS(lojaId, createOSDto);

      // 3. Validar disponibilidade de estoque (sem bloquear criacao)
      const validacaoEstoque = await this.executarValidacaoEstoque(
        lojaId,
        createOSDto,
      );

      // 4. Determinar status inicial baseado no tipo de OS
      let statusInicial = StatusOS.FILA;
      if (createOSDto.tipo_os === TipoOS.COMERCIAL) {
        // OS comercial agora nasce retida no financeiro antes da técnica
        statusInicial = StatusOS.AGUARDANDO_APROVACAO_FINANCEIRA;
      } else if (createOSDto.tipo_os === TipoOS.INTERNA) {
        // OS interna vai direto para aprovação orçamentária
        statusInicial = StatusOS.AGUARDANDO_APROVACAO_ORCAMENTARIA;
      }

      // 5. Preparar insumos calculados com correção inteligente (quando houver)
      const insumosCalculadosSerializados = this.serializarInsumosCalculados(
        createOSDto.insumos_calculados,
        createOSDto.quantidade,
      );

      // 6. Criar OS
      const os = await this.prisma.ordemServico.create({
        data: {
          numero,
          loja_id: lojaId,
          cliente_id: createOSDto.cliente_id,
          orcamento_id: createOSDto.orcamento_id,
          nome_servico: createOSDto.nome_servico,
          descricao: createOSDto.descricao,
          quantidade: createOSDto.quantidade,
          parametros_tecnicos: this.serializarParametrosTecnicos(
            createOSDto.parametros_tecnicos,
          ),
          // NOTA: Os insumos calculados devem vir já processados pelo Motor de Cálculo V2
          // que aplica corretamente a multiplicação pela quantidade do produto
          insumos_calculados: insumosCalculadosSerializados,
          data_prazo: this.normalizarDataPrazo(createOSDto.data_prazo),
          responsavel_id: createOSDto.responsavel_id,
          observacoes: createOSDto.observacoes,
          status: statusInicial,
          materiais_disponivel: validacaoEstoque.materiaisDisponiveis,
          tipo_os: createOSDto.tipo_os || TipoOS.COMERCIAL,
          origem_os: createOSDto.origem_os,
          prioridade: createOSDto.prioridade || PrioridadeOS.NORMAL,
          valor_orcado: createOSDto.valor_orcado,
          criado_por: createOSDto.criado_por,
        },
      });

      // 7. Registrar movimentacao inicial
      await this.adicionarMovimentacao(
        os.id,
        TipoMovimentacaoOS.CRIACAO,
        null,
        statusInicial,
        createOSDto.responsavel_id || 'SISTEMA',
        `OS criada no sistema - Status: ${statusInicial}`,
      );

      // 8. Executar validações automáticas
      try {
        const resultadoValidacoes = await this.osValidacoesService.validarOS(
          os.id,
          lojaId,
        );

        // Aplicar ações automáticas se necessário
        if (resultadoValidacoes.acoes.length > 0) {
          await this.osValidacoesService.aplicarAcoesAutomaticas(
            os.id,
            resultadoValidacoes,
          );
        }

        this.logger.log(`Validações automáticas executadas para OS ${os.id}:`, {
          valida: resultadoValidacoes.valida,
          correcoes: resultadoValidacoes.correcoes_necessarias.length,
          alertas: resultadoValidacoes.alertas.length,
        });
      } catch (error) {
        this.logger.error(
          `Erro ao executar validações automáticas para OS ${os.id}:`,
          error,
        );
        // Não falha a criação da OS por erro nas validações
      }

      // Promoção automática pós-criação caso a cobrança correspondente já esteja liquidada (ex: à vista pago)
      if (statusInicial === StatusOS.AGUARDANDO_APROVACAO_FINANCEIRA) {
        if (createOSDto.orcamento_id) {
          const cobranca = await this.prisma.cobranca.findFirst({
            where: {
              loja_id: lojaId,
              orcamento_id: createOSDto.orcamento_id,
            },
            select: { status: true },
          });

          if (cobranca && cobranca.status === 'LIQUIDADO') {
            await this.prisma.ordemServico.update({
              where: { id: os.id },
              data: { status: StatusOS.AGUARDANDO_APROVACAO_TECNICA },
            });
            os.status = StatusOS.AGUARDANDO_APROVACAO_TECNICA;

            await this.adicionarMovimentacao(
              os.id,
              TipoMovimentacaoOS.APROVACAO_ORCAMENTARIA,
              statusInicial,
              StatusOS.AGUARDANDO_APROVACAO_TECNICA,
              'SISTEMA',
              'OS promovida automaticamente para aprovação técnica (cobrança do orçamento já liquidada)',
            );
          }
        } else {
          // OS Comercial Avulsa/Direta sem orçamento de origem flui direto para a técnica
          await this.prisma.ordemServico.update({
            where: { id: os.id },
            data: { status: StatusOS.AGUARDANDO_APROVACAO_TECNICA },
          });
          os.status = StatusOS.AGUARDANDO_APROVACAO_TECNICA;
        }
      }

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
    ativo: boolean | undefined = true,
  ): Promise<PaginatedResponse<OrdemServicoData>> {
    try {
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = { loja_id: lojaId };
      if (status) where.status = status;
      if (responsavel) where.responsavel_id = responsavel;
      if (ativo !== undefined) where.ativo = ativo;

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

      const data = ordens.map((os) => this.formatarOrdemServico(os));
      await this.enriquecerStatusExpedicaoLista(lojaId, data);
      await this.enriquecerOsAditivaGrid(lojaId, data, ativo);
      await this.enriquecerAtencaoInstalacaoLista(lojaId, data);



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
                          tipoMaterial: true,
                        },
                      },
                    },
                  },
                  maquinas: {
                    include: {
                      maquina: true,
                    },
                  },
                  funcoes: {
                    include: {
                      funcao: true,
                    },
                  },
                },
              },
            },
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

  async findByStatus(
    lojaId: string,
    status: StatusOS,
  ): Promise<OrdemServicoData[]> {
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
              produtos: true,
            },
          },
        },
        orderBy: { criado_em: 'desc' },
      });

      return oss.map((os) => this.formatarOrdemServico(os));
    } catch (error) {
      this.logger.error('Erro ao buscar OSs por status:', error);
      throw error;
    }
  }

  async listarMateriaisOS(osId: string, lojaId: string) {
    const os = await this.prisma.ordemServico.findFirst({
      where: { id: osId, loja_id: lojaId },
      include: {
        itens: true,
      },
    });

    if (!os) {
      throw new NotFoundException(`OS com ID ${osId} não encontrada`);
    }

    const materiaisBase = this.parseJsonArray<any>(
      os.insumos_calculados,
      `insumos_calculados para OS ${os.id}`,
    );
    const materiaisPorInsumo = new Map(
      materiaisBase.map((material) => [material.insumo_id, material]),
    );
    const insumoIds = Array.from(
      new Set(
        [
          ...materiaisBase.map((material) => material.insumo_id),
          ...os.itens.flatMap((item) =>
            this.parseJsonArray<any>(
              item.insumos_necessarios,
              `insumos_necessarios para ItemOS ${item.id}`,
            ).map((material) => material.insumo_id),
          ),
        ].filter(Boolean),
      ),
    );

    const insumos = await this.prisma.insumo.findMany({
      where: { id: { in: insumoIds }, loja_id: lojaId },
      select: {
        id: true,
        nome: true,
        controla_estoque: true,
        permite_registrar_sobra: true,
      },
    });
    const insumosPorId = new Map(insumos.map((insumo) => [insumo.id, insumo]));

    const itens = os.itens.map((item) => {
      const materiaisItem = this.parseJsonArray<any>(
        item.insumos_necessarios,
        `insumos_necessarios para ItemOS ${item.id}`,
      ).map((material) => {
        const materialBase = materiaisPorInsumo.get(material.insumo_id) ?? {};
        const insumo = insumosPorId.get(material.insumo_id);
        const calculoChapa =
          material.calculo_chapa ?? materialBase.calculo_chapa ?? null;

        return {
          item_os_id: item.id,
          produto: item.produto_servico,
          insumo_id: material.insumo_id,
          nome: material.nome ?? insumo?.nome,
          quantidade_necessaria: material.quantidade_necessaria,
          unidade: material.unidade,
          custo_total: material.custo_total,
          controle_estoque: insumo?.controla_estoque
            ? 'UTILIZADO'
            : 'NAO_UTILIZADO',
          permite_registrar_sobra: Boolean(insumo?.permite_registrar_sobra),
          calculo_chapa: calculoChapa,
          area_considerada: calculoChapa?.area_considerada_custo_m2 ?? null,
          aproveitamento_previsto: calculoChapa?.aproveitamento_percent ?? null,
          sobra_estimada: calculoChapa?.sobra_area_m2 ?? null,
          sobra_acao: item.sobra_acao,
          sobra_observacao: item.sobra_observacao,
          sobra_registrada_id: item.sobra_registrada_id,
        };
      });

      return {
        item_os_id: item.id,
        produto: item.produto_servico,
        sobra_acao: item.sobra_acao,
        sobra_observacao: item.sobra_observacao,
        sobra_registrada_id: item.sobra_registrada_id,
        materiais: materiaisItem,
      };
    });

    return {
      os_id: os.id,
      numero: os.numero,
      controle_estoque: insumos.some((insumo) => insumo.controla_estoque)
        ? 'PARCIAL_OU_COMPLETO'
        : 'NAO_UTILIZADO',
      itens,
    };
  }

  async ignorarSobraOS(
    osId: string,
    itemId: string,
    lojaId: string,
    usuarioId?: string,
  ) {
    const item = await this.buscarItemOSDaLoja(osId, itemId, lojaId);
    await this.atualizarDecisaoSobra(
      item.id,
      'IGNORADA',
      'Sobra ignorada pelo usuário.',
      null,
    );
    await this.registrarLogOS(
      osId,
      'SOBRA_IGNORADA',
      `Sobra ignorada no item ${item.produto_servico}.`,
      usuarioId,
    );
    return { success: true, acao: 'IGNORADA' };
  }

  async anotarSobraOS(
    osId: string,
    itemId: string,
    lojaId: string,
    usuarioId: string | undefined,
    dto: AnotarSobraDto,
  ) {
    const item = await this.buscarItemOSDaLoja(osId, itemId, lojaId);
    const observacao =
      dto.observacao?.trim() || 'Sobra anotada para avaliação futura.';
    await this.atualizarDecisaoSobra(item.id, 'ANOTADA', observacao, null);
    await this.registrarLogOS(
      osId,
      'SOBRA_ANOTADA',
      `Sobra anotada no item ${item.produto_servico}.`,
      usuarioId,
    );
    return { success: true, acao: 'ANOTADA', observacao };
  }

  async registrarSobraOS(
    osId: string,
    itemId: string,
    lojaId: string,
    usuarioId: string | undefined,
    dto: RegistrarSobraDto,
  ) {
    const item = await this.buscarItemOSDaLoja(osId, itemId, lojaId);
    const material = this.buscarMaterialDoItemOS(item, dto.insumoId);
    const insumo = await this.prisma.insumo.findFirst({
      where: { id: dto.insumoId, loja_id: lojaId },
      select: { id: true, nome: true, unidade_dimensao: true },
    });

    if (!insumo) {
      throw new BadRequestException('Insumo não pertence à loja autenticada.');
    }

    if (dto.estoqueId) {
      const estoque = await this.prisma.$queryRaw<any[]>`
        SELECT id FROM estoque_itens
        WHERE id = ${dto.estoqueId} AND lojaId = ${lojaId}
        LIMIT 1
      `;
      if (!estoque[0]) {
        throw new BadRequestException(
          'Item de estoque não pertence à loja autenticada.',
        );
      }
    }

    const calculoChapa = material.calculo_chapa ?? null;
    const area = Number(dto.area ?? calculoChapa?.sobra_area_m2 ?? 0);
    if (!Number.isFinite(area) || area <= 0) {
      throw new BadRequestException(
        'Informe uma área de sobra maior que zero.',
      );
    }

    const codigoSobra = await this.gerarCodigoSobraOS(lojaId);
    const largura = dto.largura ?? calculoChapa?.parametros?.largura_chapa;
    const altura = dto.altura ?? calculoChapa?.parametros?.altura_chapa;
    const unidadeDimensao =
      dto.unidadeDimensao ??
      calculoChapa?.unidade_dimensao ??
      insumo.unidade_dimensao ??
      'm';

    await this.prisma.$executeRaw`
      INSERT INTO estoque_sobras (
        id, estoque_id, insumo_id, codigo_sobra, descricao, dimensoes,
        largura, altura, unidade_dimensao, area, area_disponivel,
        area_original, quantidade, unidade_medida, material, status, origem,
        os_origem_id, item_os_origem_id, observacao_interna, loja_id,
        created_at, updated_at
      ) VALUES (
        UUID(), ${dto.estoqueId ?? null}, ${dto.insumoId}, ${codigoSobra},
        ${`Retalho gerado pela OS ${item.os.numero}`},
        ${largura && altura ? `${largura} x ${altura} ${unidadeDimensao}` : null},
        ${largura ?? null}, ${altura ?? null}, ${unidadeDimensao},
        ${area}, ${area}, ${area}, ${area}, 'm2', ${insumo.nome},
        'DISPONIVEL', 'OS', ${osId}, ${itemId}, ${dto.observacao ?? null},
        ${lojaId}, NOW(), NOW()
      )
    `;

    const sobra = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM estoque_sobras
      WHERE codigo_sobra = ${codigoSobra} AND loja_id = ${lojaId}
      LIMIT 1
    `;

    const sobraCriada = sobra[0];
    await this.atualizarDecisaoSobra(
      item.id,
      'REGISTRADA',
      dto.observacao ?? 'Sobra registrada como retalho.',
      sobraCriada?.id ?? null,
    );
    await this.registrarLogOS(
      osId,
      'SOBRA_REGISTRADA',
      `Sobra registrada como retalho no item ${item.produto_servico}.`,
      usuarioId,
      { sobra_id: sobraCriada?.id, codigo_sobra: codigoSobra },
    );

    return { success: true, acao: 'REGISTRADA', sobra: sobraCriada };
  }

  async atualizarStatus(
    id: string,
    dados: { status: StatusOS },
    usuarioId?: string,
  ): Promise<OrdemServicoData> {
    try {
      // Buscar OS atual para obter status anterior
      const osAtual = await this.prisma.ordemServico.findUnique({
        where: { id },
        select: { status: true, loja_id: true, pular_pcp: true },
      });

      if (!osAtual) {
        throw new NotFoundException(`OS com ID ${id} não encontrada`);
      }

      const os = await this.prisma.ordemServico.update({
        where: { id },
        data: {
          status: dados.status,
          atualizado_em: new Date(),
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
              produtos: true,
            },
          },
        },
      });

      // Notificar mudança de status via eventos automáticos
      await this.eventosAutomaticosService.notificarMudancaStatusOS(
        id,
        osAtual.status,
        dados.status,
        osAtual.loja_id,
        usuarioId,
      );

      // Notificar liberação para PCP
      if (dados.status === StatusOS.LIBERADA_PARA_PCP && !osAtual.pular_pcp) {
        await this.eventosAutomaticosService.notificarOSLiberadaParaPCP(
          id,
          osAtual.loja_id,
          undefined, // workflowId será definido posteriormente
          usuarioId,
        );

        try {
          await this.workflowAssignmentService.atribuirWorkflow(
            osAtual.loja_id,
            {
              osId: id,
              usuarioId,
            },
          );
        } catch (error) {
          this.logger.warn(
            `Falha ao atribuir workflow automaticamente para OS ${id}: ${error instanceof Error ? error.message : error}`,
          );
        }
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

      if (osExistente.ativo === false) {
        throw new BadRequestException(
          'OS inativa não pode ser editada. Reative-a primeiro.',
        );
      }

      // Preparar dados para atualização
      const dadosAtualizacao: any = {};

      if (updateOSDto.nome_servico)
        dadosAtualizacao.nome_servico = updateOSDto.nome_servico;
      if (updateOSDto.descricao)
        dadosAtualizacao.descricao = updateOSDto.descricao;
      if (updateOSDto.quantidade)
        dadosAtualizacao.quantidade = updateOSDto.quantidade;
      if (updateOSDto.data_prazo)
        dadosAtualizacao.data_prazo = new Date(updateOSDto.data_prazo);
      if (updateOSDto.responsavel_id)
        dadosAtualizacao.responsavel_id = updateOSDto.responsavel_id;
      if (updateOSDto.observacoes)
        dadosAtualizacao.observacoes = updateOSDto.observacoes;

      if (updateOSDto.parametros_tecnicos) {
        dadosAtualizacao.parametros_tecnicos = JSON.stringify(
          updateOSDto.parametros_tecnicos,
        );
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

      // Executar validações automáticas após atualização
      try {
        const resultadoValidacoes = await this.osValidacoesService.validarOS(
          id,
          lojaId,
        );

        // Aplicar ações automáticas se necessário
        if (resultadoValidacoes.acoes.length > 0) {
          await this.osValidacoesService.aplicarAcoesAutomaticas(
            id,
            resultadoValidacoes,
          );
        }

        this.logger.log(
          `Validações automáticas executadas para OS ${id} após atualização:`,
          {
            valida: resultadoValidacoes.valida,
            correcoes: resultadoValidacoes.correcoes_necessarias.length,
            alertas: resultadoValidacoes.alertas.length,
          },
        );
      } catch (error) {
        this.logger.error(
          `Erro ao executar validações automáticas para OS ${id}:`,
          error,
        );
        // Não falha a atualização da OS por erro nas validações
      }

      this.logger.log(`[OK] OS #${osAtualizada.numero} atualizada com sucesso`);
      return this.formatarOrdemServico(osAtualizada);
    } catch (error) {
      this.logger.error(`Erro ao atualizar OS ${id}:`, error);
      throw error;
    }
  }

  async remove(id: string, lojaId: string, usuarioId: string): Promise<void> {
    throw new BadRequestException(
      'Exclusão física descontinuada. Use PATCH /os/:id/inativar para inativar a OS.',
    );
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

      this.logger.log(
        `[OK] OS #${os.numero} avançou de ${os.status} para ${nova_etapa}`,
      );
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
      this.logger.error(
        'Erro ao gerar numero da OS via DocumentCodeService:',
        error,
      );
      throw error;
    }
  }

  /**
   * ORC-2026-010 → OS-2026-010 quando a OS nasce de orçamento aprovado.
   */
  private async resolverNumeroParaCriacao(
    lojaId: string,
    createOSDto: CreateOSDto,
  ): Promise<string> {
    if (!createOSDto.orcamento_id) {
      return this.gerarNumeroOS(lojaId);
    }

    const orcamento = await this.prisma.orcamento.findFirst({
      where: { id: createOSDto.orcamento_id, loja_id: lojaId },
      select: { numero: true },
    });

    if (!orcamento?.numero) {
      return this.gerarNumeroOS(lojaId);
    }

    const numero = await this.documentCodeService.resolverNumeroOSDeOrcamento(
      lojaId,
      orcamento.numero,
    );

    const conflito = await this.prisma.ordemServico.findFirst({
      where: { loja_id: lojaId, numero },
      select: { id: true, orcamento_id: true, ativo: true },
    });

    if (conflito) {
      if (conflito.orcamento_id === createOSDto.orcamento_id) {
        return numero;
      }

      this.logger.warn(
        `Número ${numero} já usado pela OS ${conflito.id} ` +
          `(orçamento ${conflito.orcamento_id ?? 'n/d'}, ` +
          `ativo=${conflito.ativo ?? true}); ` +
          'usando próximo número sequencial.',
      );
      return this.gerarNumeroOS(lojaId);
    }

    return numero;
  }

  // ===== MÉTODOS ESPECÍFICOS PARA OS DIRETA/INTERNA =====

  /**
   * Criar OS Comercial com validações específicas
   */
  async criarOSComercial(
    lojaId: string,
    dados: CreateOSDto,
    usuarioId: string,
  ): Promise<OrdemServicoData> {
    // Garantir que é OS Comercial
    const dadosComercial = { ...dados, tipo_os: TipoOS.COMERCIAL };

    // Gerar código específico para OS Comercial
    const codigo =
      await this.documentCodeService.gerarCodigoOSComercial(lojaId);

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
  async criarOSInterna(
    lojaId: string,
    dados: CreateOSDto,
    usuarioId: string,
  ): Promise<OrdemServicoData> {
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
    observacoes: string | undefined,
    lojaId: string,
  ): Promise<OrdemServicoData> {
    const os = await this.prisma.ordemServico.findFirst({
      where: { id: osId, loja_id: lojaId },
    });

    if (!os) {
      throw new NotFoundException(`OS ${osId} não encontrada`);
    }

    if (os.tipo_os !== TipoOS.INTERNA) {
      throw new BadRequestException(
        'Aprovação gerencial só se aplica a OS Interna',
      );
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
        versao: { increment: 1 },
      },
    });

    this.logger.log(
      `OS ${os.numero} aprovada gerencialmente: ${statusAprovacao}`,
    );
    return osAtualizada as OrdemServicoData;
  }

  /**
   * Agendar instalação (para OS Comercial)
   */
  async agendarInstalacao(
    osId: string,
    dataInstalacao: Date,
    observacoes: string | undefined,
    usuarioId: string | undefined,
    lojaId: string,
  ): Promise<OrdemServicoData> {
    const os = await this.prisma.ordemServico.findFirst({
      where: { id: osId, loja_id: lojaId },
    });

    if (!os) {
      throw new NotFoundException(`OS ${osId} não encontrada`);
    }

    if (os.tipo_os !== TipoOS.COMERCIAL) {
      throw new BadRequestException(
        'Agendamento de instalação só se aplica a OS Comercial',
      );
    }

    const osAtualizada = await this.prisma.ordemServico.update({
      where: { id: osId },
      data: {
        data_instalacao_agendada: dataInstalacao,
        observacoes_instalacao: observacoes,
        modificado_por: usuarioId,
        motivo_modificacao: 'Agendamento de instalação',
        versao: { increment: 1 },
      },
    });

    this.logger.log(
      `Instalação agendada para OS ${os.numero}: ${dataInstalacao.toISOString()}`,
    );
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
    status?: string,
  ): Promise<PaginatedResponse<OrdemServicoData>> {
    const skip = (page - 1) * limit;

    const where: any = {
      loja_id: lojaId,
      tipo_os: tipoOS,
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
        },
      }),
      this.prisma.ordemServico.count({ where }),
    ]);

    return {
      data: os as OrdemServicoData[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obter estatísticas por tipo de OS
   */
  async obterEstatisticasPorTipo(
    lojaId: string,
    ano?: number,
  ): Promise<{
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
        lte: fimAno,
      },
    };

    const [osComercial, osInterna] = await Promise.all([
      this.prisma.ordemServico.findMany({
        where: { ...where, tipo_os: TipoOS.COMERCIAL },
        select: { status: true },
      }),
      this.prisma.ordemServico.findMany({
        where: { ...where, tipo_os: TipoOS.INTERNA },
        select: { status: true },
      }),
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
        porStatus: contarPorStatus(osComercial),
      },
      interna: {
        total: osInterna.length,
        porStatus: contarPorStatus(osInterna),
      },
    };
  }

  // ===== MÉTODOS AUXILIARES =====

  // Wrapper privado para manter compatibilidade com testes existentes
  // Aplica correção de materiais usando o helper centralizado
  private corrigirInsumosCalculados(
    insumos: any[],
    quantidadeProduto: number,
  ): any[] {
    return CorrecaoMateriaisHelper.corrigirInsumosCalculados(
      insumos as any,
      Number(quantidadeProduto || 1),
    ) as any[];
  }

  private async executarValidacaoEstoque(
    lojaId: string,
    createOSDto: CreateOSDto,
  ): Promise<ValidacaoEstoqueOSResultado> {
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
      const resultado =
        await this.validacaoEstoqueService.validarProdutoEstoque(
          produto,
          lojaId,
        );
      const alertas = Array.isArray(resultado.alertas) ? resultado.alertas : [];
      const recomendacoes = Array.isArray(resultado.recomendacoes)
        ? resultado.recomendacoes
        : [];
      const detalhesBrutos = Array.isArray(resultado.estoque_disponivel)
        ? resultado.estoque_disponivel
        : [];

      return {
        materiaisDisponiveis: alertas.length === 0,
        alertasEstoque: alertas,
        recomendacoesEstoque: recomendacoes,
        detalhesEstoque: detalhesBrutos.map((item) =>
          this.mapearDetalheEstoque(item, produto),
        ),
      };
    } catch (error) {
      this.logger.error('Erro ao validar estoque da OS:', error);
      return {
        materiaisDisponiveis: false,
        alertasEstoque: [`Erro ao validar estoque: ${error.message}`],
        recomendacoesEstoque: [
          'Verifique a disponibilidade no modulo de estoque.',
        ],
        detalhesEstoque: [],
      };
    }
  }

  private prepararProdutoValidacaoEstoque(
    createOSDto: CreateOSDto,
  ): OSProdutoValidacao | null {
    const insumosOrigem = Array.isArray(createOSDto.insumos_calculados)
      ? createOSDto.insumos_calculados
      : [];

    if (insumosOrigem.length === 0) {
      return null;
    }

    const quantidadeBruta = Number(createOSDto.quantidade);
    const quantidade =
      Number.isFinite(quantidadeBruta) && quantidadeBruta > 0
        ? quantidadeBruta
        : 1;

    const insumos = insumosOrigem
      .filter((item) => item && item.insumo_id)
      .map((item) => {
        const totalNecessario = Number(item.quantidade_necessaria) || 0;
        const quantidadePorUnidade =
          quantidade > 0 ? totalNecessario / quantidade : totalNecessario;

        return {
          insumo_id: item.insumo_id,
          quantidade:
            quantidadePorUnidade > 0 ? quantidadePorUnidade : totalNecessario,
          unidade: item.unidade,
          nome: item.nome,
          quantidade_total: totalNecessario,
        };
      })
      .filter((item) => item.quantidade > 0);

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

  private mapearDetalheEstoque(
    item: any,
    produto: OSProdutoValidacao,
  ): EstoqueValidacaoDetalhe {
    const referencia = produto.insumos.find(
      (entrada) => entrada.insumo_id === item?.insumo_id,
    );

    return {
      insumo_id: item?.insumo_id ?? referencia?.insumo_id ?? 'desconhecido',
      nome: item?.nome ?? referencia?.nome,
      categoria: item?.categoria,
      fornecedor: item?.fornecedor,
      estoque_atual: this.parseOptionalNumber(item?.estoque_atual),
      estoque_minimo: this.parseOptionalNumber(item?.estoque_minimo),
      quantidade_necessaria: this.calcularQuantidadeNecessaria(
        item,
        referencia,
        produto,
      ),
      quantidade_disponivel: this.parseOptionalNumber(
        item?.quantidade_disponivel,
      ),
      percentual_disponivel: this.parseOptionalNumber(
        item?.percentual_disponivel,
      ),
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
    const valorInformado = this.parseOptionalNumber(
      item?.quantidade_necessaria,
    );
    if (typeof valorInformado === 'number') {
      return valorInformado;
    }

    const quantidadeTotalReferencia = referencia?.quantidade_total;
    if (
      typeof quantidadeTotalReferencia === 'number' &&
      Number.isFinite(quantidadeTotalReferencia)
    ) {
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

  private async validarDadosOS(
    lojaId: string,
    dados: CreateOSDto,
  ): Promise<void> {
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
  private async validarDadosBasicos(
    lojaId: string,
    dados: CreateOSDto,
  ): Promise<void> {
    // Validar loja
    const loja = await this.prisma.loja.findUnique({
      where: { id: lojaId },
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
        where: { id: dados.responsavel_id },
      });
      if (!responsavel) {
        throw new BadRequestException(
          `Responsável ${dados.responsavel_id} não encontrado`,
        );
      }
    }
  }

  /**
   * Validações específicas para OS Comercial
   */
  private async validarOSComercial(
    lojaId: string,
    dados: CreateOSDto,
  ): Promise<void> {
    // Cliente é obrigatório para OS Comercial
    if (!dados.cliente_id) {
      throw new BadRequestException('Cliente é obrigatório para OS Comercial');
    }

    // Validar se cliente existe e pertence à loja
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: dados.cliente_id },
    });
    if (!cliente) {
      throw new BadRequestException(
        `Cliente ${dados.cliente_id} não encontrado`,
      );
    }

    // Validar orçamento se informado
    if (dados.orcamento_id) {
      const orcamento = await this.prisma.orcamento.findUnique({
        where: { id: dados.orcamento_id },
        include: { produtos: true },
      });

      if (!orcamento) {
        throw new BadRequestException(
          `Orçamento ${dados.orcamento_id} não encontrado`,
        );
      }

      if (orcamento.loja_id !== lojaId) {
        throw new BadRequestException(
          'Orçamento não pertence à loja informada',
        );
      }

      if (orcamento.status_aprovacao !== 'APROVADO') {
        throw new BadRequestException(
          'Orçamento deve estar aprovado para gerar OS',
        );
      }

      if (!orcamento.produtos || orcamento.produtos.length === 0) {
        throw new BadRequestException(
          'Orçamento deve ter pelo menos um produto',
        );
      }
    }

    // Validar valores monetários se informados
    if (dados.valor_orcado !== undefined && dados.valor_orcado < 0) {
      throw new BadRequestException('Valor orçado não pode ser negativo');
    }

    if (dados.satisfacao_cliente !== undefined) {
      if (
        !Number.isInteger(dados.satisfacao_cliente) ||
        dados.satisfacao_cliente < 1 ||
        dados.satisfacao_cliente > 5
      ) {
        throw new BadRequestException(
          'Satisfação do cliente deve ser um número inteiro entre 1 e 5',
        );
      }
    }
  }

  /**
   * Validações específicas para OS Interna
   */
  private async validarOSInterna(
    lojaId: string,
    dados: CreateOSDto,
  ): Promise<void> {
    // Departamento solicitante é obrigatório para OS Interna
    if (
      !dados.departamento_solicitante ||
      dados.departamento_solicitante.trim() === ''
    ) {
      throw new BadRequestException(
        'Departamento solicitante é obrigatório para OS Interna',
      );
    }

    // Centro de custo é obrigatório para OS Interna
    if (!dados.centro_custo || dados.centro_custo.trim() === '') {
      throw new BadRequestException(
        'Centro de custo é obrigatório para OS Interna',
      );
    }

    // Validar formato do centro de custo
    const regexCentroCusto = /^[A-Z]{2,4}-[A-Z0-9-]+$/;
    if (!regexCentroCusto.test(dados.centro_custo)) {
      throw new BadRequestException(
        'Centro de custo deve ter formato válido (ex: CC-001, DEP-2024-001)',
      );
    }

    // Cliente não deve ser informado para OS Interna
    if (dados.cliente_id) {
      throw new BadRequestException(
        'Cliente não deve ser informado para OS Interna',
      );
    }

    // Orçamento não deve ser informado para OS Interna
    if (dados.orcamento_id) {
      throw new BadRequestException(
        'Orçamento não deve ser informado para OS Interna',
      );
    }

    // Validar campos específicos de OS Interna
    if (dados.valor_orcado !== undefined) {
      throw new BadRequestException('Valor orçado não se aplica a OS Interna');
    }

    if (dados.satisfacao_cliente !== undefined) {
      throw new BadRequestException(
        'Satisfação do cliente não se aplica a OS Interna',
      );
    }
  }

  private async validarTransicaoEtapa(
    etapaAtual: string,
    novaEtapa: string,
    os?: any,
    usuarioId?: string,
  ): Promise<{ valida: boolean; motivo?: string }> {
    // Transições válidas por etapa
    const transicoesValidas = {
      FILA: [
        'AGUARDANDO_APROVACAO_TECNICA',
        'AGUARDANDO_APROVACAO_ORCAMENTARIA',
        'CANCELADA',
        'PAUSADA',
      ],
      AGUARDANDO_APROVACAO_TECNICA: ['APROVADA_TECNICA', 'REJEITADA', 'FILA'],
      APROVADA_TECNICA: ['PRODUCAO', 'FILA'],
      AGUARDANDO_APROVACAO_ORCAMENTARIA: [
        'APROVADA_ORCAMENTARIA',
        'REJEITADA',
        'FILA',
      ],
      APROVADA_ORCAMENTARIA: ['PRODUCAO', 'FILA'],
      REJEITADA: ['FILA', 'CANCELADA'],
      PRODUCAO: ['ACABAMENTO', 'PAUSADA', 'AGUARDANDO_MATERIAL'],
      ACABAMENTO: ['FINALIZADA', 'PRODUCAO'], // Pode voltar para produção
      PAUSADA: ['FILA', 'PRODUCAO', 'ACABAMENTO'], // Pode retomar qualquer etapa
      AGUARDANDO_MATERIAL: ['FILA', 'PRODUCAO'], // Quando material chegar
      FINALIZADA: [], // Estado final
      CANCELADA: [], // Estado final
    };

    const transicoesPermitidas = transicoesValidas[etapaAtual] || [];
    const valida = transicoesPermitidas.includes(novaEtapa);

    if (!valida) {
      return {
        valida: false,
        motivo: `Transição de ${etapaAtual} para ${novaEtapa} não é permitida`,
      };
    }

    // Validações condicionais por tipo de OS se os dados estiverem disponíveis
    if (os && usuarioId) {
      if (os.tipo_os === TipoOS.COMERCIAL) {
        return await this.validarTransicaoOSComercial(
          os,
          etapaAtual,
          novaEtapa,
          usuarioId,
        );
      } else if (os.tipo_os === TipoOS.INTERNA) {
        return await this.validarTransicaoOSInterna(
          os,
          etapaAtual,
          novaEtapa,
          usuarioId,
        );
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
    usuarioId: string,
  ): Promise<{ valida: boolean; motivo?: string }> {
    // Transição para AGUARDANDO_APROVACAO_TECNICA
    if (novaEtapa === 'AGUARDANDO_APROVACAO_TECNICA') {
      // Validar se estoque está disponível
      const estoqueOk = await this.validarEstoqueDisponivel(os.id);
      if (!estoqueOk) {
        return {
          valida: false,
          motivo: 'Estoque insuficiente para aprovação técnica',
        };
      }

      // Validar se arte está anexada (se aplicável)
      const arteOk = await this.validarArteAnexada(os.id);
      if (!arteOk) {
        return {
          valida: false,
          motivo: 'Arte deve estar anexada para aprovação técnica',
        };
      }

      // Validar se especificações estão completas
      const especificacoesOk = await this.validarEspecificacoesCompletas(os.id);
      if (!especificacoesOk) {
        return {
          valida: false,
          motivo: 'Especificações técnicas devem estar completas',
        };
      }
    }

    // Transição para APROVADA_TECNICA
    if (novaEtapa === 'APROVADA_TECNICA') {
      const usuario = await this.prisma.usuario.findUnique({
        where: { id: usuarioId },
      });

      if (!usuario) {
        return {
          valida: false,
          motivo: 'Usuário não encontrado',
        };
      }

      const permissaoAprovacao =
        await this.osApprovalPermissionsService.podeAprovarTecnica(
          usuarioId,
          usuario.loja_id,
        );

      if (!permissaoAprovacao.pode) {
        return {
          valida: false,
          motivo:
            permissaoAprovacao.motivo ||
            'Usuário não tem permissão para aprovar tecnicamente',
        };
      }
    }

    // Transição para PRODUCAO
    if (novaEtapa === 'PRODUCAO') {
      if (os.aprovacao_tecnica_status !== 'APROVADA') {
        return {
          valida: false,
          motivo:
            'OS Comercial deve ter aprovação técnica antes de iniciar produção',
        };
      }
    }

    // Transição para FINALIZADA
    if (novaEtapa === 'FINALIZADA') {
      if (!materiaisDisponiveisParaFluxo(os)) {
        return {
          valida: false,
          motivo: 'Materiais devem estar disponíveis para finalizar OS',
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
    usuarioId: string,
  ): Promise<{ valida: boolean; motivo?: string }> {
    // Transição para AGUARDANDO_APROVACAO_ORCAMENTARIA
    if (novaEtapa === 'AGUARDANDO_APROVACAO_ORCAMENTARIA') {
      // Validar se centro de custo está disponível
      const centroCustoOk = await this.validarCentroCustoDisponivel(
        os.centro_custo,
        os.loja_id,
      );
      if (!centroCustoOk) {
        return {
          valida: false,
          motivo: 'Centro de custo não disponível ou inválido',
        };
      }

      // Validar se justificativa está preenchida
      const justificativaOk = await this.validarJustificativaPreenchida(os.id);
      if (!justificativaOk) {
        return {
          valida: false,
          motivo: 'Justificativa deve estar preenchida para OS interna',
        };
      }

      // Validar se alçada é adequada
      const alcadaOk = await this.validarAlcadaAdequada(
        os.valor_orcado,
        os.centro_custo,
        os.loja_id,
      );
      if (!alcadaOk) {
        return {
          valida: false,
          motivo: 'Valor excede a alçada permitida para o centro de custo',
        };
      }
    }

    // Transição para APROVADA_ORCAMENTARIA
    if (novaEtapa === 'APROVADA_ORCAMENTARIA') {
      // Verificar se usuário tem permissão para aprovar
      const usuario = await this.prisma.usuario.findUnique({
        where: { id: usuarioId },
      });

      if (!usuario) {
        return {
          valida: false,
          motivo: 'Usuário não encontrado',
        };
      }

      // Validar alçada do usuário
      const valorEstimado = Number(os.valor_orcado || 0);
      const alcadaPermitida = await this.validarAlcadaUsuario(
        usuario.funcao,
        valorEstimado,
      );
      if (!alcadaPermitida) {
        return {
          valida: false,
          motivo: 'Usuário não tem alçada suficiente para aprovar este valor',
        };
      }
    }

    // Transição para PRODUCAO
    if (novaEtapa === 'PRODUCAO') {
      if (os.aprovacao_gerencial !== 'APROVADA') {
        return {
          valida: false,
          motivo:
            'OS Interna deve ter aprovação orçamentária antes de iniciar produção',
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

  private async buscarItemOSDaLoja(
    osId: string,
    itemId: string,
    lojaId: string,
  ) {
    const item = await this.prisma.itemOS.findFirst({
      where: {
        id: itemId,
        os_id: osId,
        os: { loja_id: lojaId },
      },
      include: {
        os: {
          select: {
            id: true,
            numero: true,
            loja_id: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Item da OS não encontrado nesta loja.');
    }

    return item;
  }

  private buscarMaterialDoItemOS(item: any, insumoId: string) {
    const materiais = this.parseJsonArray<any>(
      item.insumos_necessarios,
      `insumos_necessarios para ItemOS ${item.id}`,
    );
    const material = materiais.find(
      (itemMaterial) => itemMaterial.insumo_id === insumoId,
    );

    if (!material) {
      throw new BadRequestException('Material não previsto neste item da OS.');
    }

    return material;
  }

  private async atualizarDecisaoSobra(
    itemId: string,
    acao: string,
    observacao: string | null,
    sobraId: string | null,
  ) {
    return this.prisma.itemOS.update({
      where: { id: itemId },
      data: {
        sobra_acao: acao,
        sobra_observacao: observacao,
        sobra_registrada_id: sobraId,
      },
    });
  }

  private async registrarLogOS(
    osId: string,
    tipoAcao: string,
    descricao: string,
    usuarioId?: string,
    dadosExtras?: any,
  ): Promise<void> {
    try {
      await this.prisma.ordemServicoLog.create({
        data: {
          os_id: osId,
          tipo_acao: tipoAcao,
          descricao,
          usuario_id: usuarioId ?? null,
          dados_extras: dadosExtras ? JSON.stringify(dadosExtras) : null,
        },
      });
    } catch (error) {
      this.logger.warn(`Erro ao registrar log da OS ${osId}:`, error);
    }
  }

  private async gerarCodigoSobraOS(lojaId: string): Promise<string> {
    const ano = new Date().getFullYear();
    const likePattern = `SOB-${ano}-%`;
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count
      FROM estoque_sobras
      WHERE loja_id = ${lojaId}
        AND codigo_sobra LIKE ${likePattern}
    `;
    const count = Number(result[0]?.count ?? 0);

    return `SOB-${ano}-${(count + 1).toString().padStart(3, '0')}`;
  }

  private formatarOrdemServico(
    os: any,
    extras?: Partial<
      Pick<
        OrdemServicoData,
        'alertas_estoque' | 'recomendacoes_estoque' | 'detalhes_estoque'
      >
    >,
  ): OrdemServicoData {
    // Processar produtos do orçamento
    const produtos = os.orcamento?.produtos || [];
    const insumosOS = this.parseJsonArray<any>(
      os.insumos_calculados,
      `insumos_calculados para OS ${os.id}`,
    );
    const itensOS = Array.isArray(os.itens) ? os.itens : [];
    const produtosFormatados = produtos.map((produto) => ({
      id: produto.id,
      nome: produto.nome,
      descricao: produto.descricao,
      quantidade: produto.quantidade,
      unidade_medida: produto.unidade_medida,
      largura: produto.largura,
      altura: produto.altura,
      profundidade: produto.profundidade,
      area_produto: produto.area_produto,
      perimetro_produto: produto.perimetro_produto,
      unidade_geometria: produto.unidade_geometria,
      geometria_origem: produto.geometria_origem,
      arquivo_geometria_url: produto.arquivo_geometria_url,
      observacoes: produto.observacoes,
      // Materiais por produto - usar dados exatos do orçamento via insumos_calculados
      materiais:
        produto.insumos?.map((itemInsumo) => {
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
            this.logger.warn(
              `Erro ao processar insumos_calculados para OS ${os.id}:`,
              error,
            );
            insumosCalculados = [];
          }

          // Garantir que insumosCalculados é um array
          if (!Array.isArray(insumosCalculados)) {
            insumosCalculados = [];
          }

          const insumoCalculado = insumosOS.find(
            (ic: any) =>
              ic.insumo_id === itemInsumo.insumo.id &&
              ic.produto_nome === produto.nome,
          );

          // Usar dados do orçamento quando disponível, fallback para dados da OS
          let quantidadeFinal = itemInsumo.quantidade;
          let unidadeFinal = itemInsumo.unidade;

          // Se tem dados do orçamento, aplicar lógica inteligente
          let displayFinal = `${quantidadeFinal} ${unidadeFinal}`;
          if (insumoCalculado) {
            const quantidadeInteligente = this.calcularQuantidadeInteligente(
              insumoCalculado,
              produto,
            );
            quantidadeFinal = quantidadeInteligente.quantidade;
            unidadeFinal = quantidadeInteligente.unidade;
            displayFinal = quantidadeInteligente.display;
          }

          return {
            id: itemInsumo.insumo.id,
            nome: itemInsumo.insumo.nome,
            // USAR QUANTIDADE INTELIGENTE CALCULADA
            quantidade: quantidadeFinal,
            unidade: unidadeFinal,
            display: displayFinal,
            categoria: itemInsumo.insumo.categoria?.nome || 'Sem categoria',
            tipo_material: itemInsumo.insumo.tipoMaterial?.nome || null,
            parametros_consumo:
              insumoCalculado?.parametros_consumo ||
              (itemInsumo.insumo.parametros_consumo
                ? typeof itemInsumo.insumo.parametros_consumo === 'string'
                  ? JSON.parse(itemInsumo.insumo.parametros_consumo)
                  : itemInsumo.insumo.parametros_consumo
                : null),
            // Adicionar informações de rastreabilidade
            origem: insumoCalculado?.origem || 'os',
            orcamento_id: insumoCalculado?.orcamento_id || os.orcamento_id,
            data_calculo: insumoCalculado?.data_calculo,
            custo_unitario:
              insumoCalculado?.custo_unitario || itemInsumo.custo_unitario,
            custo_total: insumoCalculado?.custo_total || itemInsumo.custo_total,
            calculo_chapa:
              insumoCalculado?.calculo_chapa ||
              (itemInsumo.calculo_chapa
                ? this.parseJsonObject(
                    itemInsumo.calculo_chapa,
                    'calculo_chapa',
                  )
                : null),
            // Informações de estoque
            disponivel_estoque: insumoCalculado?.disponivel_estoque ?? true,
            quantidade_disponivel: insumoCalculado?.quantidade_disponivel,
            localizacao_estoque: insumoCalculado?.localizacao_estoque,
          };
        }) || [],
      // Máquinas por produto
      maquinas:
        produto.maquinas?.map((itemMaquina) => ({
          id: itemMaquina.maquina.id,
          nome: itemMaquina.maquina.nome,
          horas_uso: itemMaquina.horas_uso,
          custo_hora: itemMaquina.custo_hora,
          custo_total: itemMaquina.custo_total,
        })) || [],
      // Funções por produto
      funcoes:
        produto.funcoes?.map((itemFuncao) => ({
          id: itemFuncao.funcao.id,
          nome: itemFuncao.funcao.nome,
          horas_uso: itemFuncao.horas_uso,
          custo_hora: itemFuncao.custo_hora,
          custo_total: itemFuncao.custo_total,
        })) || [],
    }));

    // Consolidar materiais por tipo (para Materiais Principais)
    const materiaisConsolidados = new Map();
    produtosFormatados.forEach((produto) => {
      produto.materiais.forEach((material) => {
        if (materiaisConsolidados.has(material.id)) {
          const existente = materiaisConsolidados.get(material.id);
          existente.quantidade_total += material.quantidade;
          existente.produtos.push({
            nome: produto.nome,
            quantidade: produto.quantidade,
            quantidade_material: material.quantidade,
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
            produtos: [
              {
                nome: produto.nome,
                quantidade: produto.quantidade,
                quantidade_material: material.quantidade, // Já é a quantidade calculada correta
              },
            ],
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
      parametros_tecnicos: this.parseJsonObject(
        os.parametros_tecnicos,
        `parametros_tecnicos para OS ${os.id}`,
      ),
      insumos_calculados: insumosOS,
      materiais_disponivel: os.materiais_disponivel,
      aprovacao_tecnica_status: os.aprovacao_tecnica_status,
      aprovacao_tecnica_por: os.aprovacao_tecnica_por,
      aprovacao_tecnica_em: os.aprovacao_tecnica_em,
      aprovacao_tecnica_obs: os.aprovacao_tecnica_obs,
      // Campos necessarios para UI de aprovacao da OS no grid (coluna "Aprovacao")
      tipo_os: os.tipo_os,
      origem_os: os.origem_os,
      prioridade: os.prioridade,
      criado_em: os.criado_em,
      atualizado_em: os.atualizado_em,
      ativo: os.ativo !== false,
      inativado_em: os.inativado_em ?? undefined,
      motivo_inativacao: os.motivo_inativacao ?? undefined,
      status_instalacao_os: os.status_instalacao_os ?? null,
      tipo_vinculo_os: os.tipo_vinculo_os ?? null,
      os_pai_id: os.os_pai_id ?? null,
      pular_pcp: os.pular_pcp === true,
      pular_expedicao: os.pular_expedicao === true,
      pular_validacao_estoque: os.pular_validacao_estoque === true,
      valor_orcado:
        os.valor_orcado != null ? Number(os.valor_orcado) : undefined,
      cliente: os.cliente
        ? {
            id: os.cliente.id,
            nome: os.cliente.nome,
            email: os.cliente.email,
            telefone: os.cliente.telefone,
          }
        : null,
      // Campo para compatibilidade com Grid
      cliente_nome: os.cliente?.nome || null,
      // Novos campos estruturados
      produtos: produtosFormatados,
      itens_os: itensOS.map((item: any) => ({
        id: item.id,
        os_id: item.os_id,
        produto_servico: item.produto_servico,
        quantidade: Number(item.quantidade) || 0,
        parametros_tecnicos: this.parseJsonObject(
          item.parametros_tecnicos,
          `parametros_tecnicos para ItemOS ${item.id}`,
        ),
        insumos_necessarios: this.parseJsonArray(
          item.insumos_necessarios,
          `insumos_necessarios para ItemOS ${item.id}`,
        ),
        materiais_disponivel: item.materiais_disponivel,
        observacoes: item.observacoes,
        largura: item.largura ? Number(item.largura) : undefined,
        altura: item.altura ? Number(item.altura) : undefined,
        // Fase 11: profundidade exposta no payload da OS para o frontend (OSTabs ja consome o campo).
        // Number() converte Decimal do Prisma; null/0 viram undefined para esconder na UI.
        profundidade:
          item.profundidade && Number(item.profundidade) > 0
            ? Number(item.profundidade)
            : undefined,
        area: item.area ? Number(item.area) : undefined,
        perimetro: item.perimetro ? Number(item.perimetro) : undefined,
        unidade_medida: item.unidade_medida,
        unidade_geometria: item.unidade_geometria,
        geometria_origem: item.geometria_origem,
        arquivo_geometria_url: item.arquivo_geometria_url,
        arquivo_geometria_metadados: item.arquivo_geometria_metadados,
        data_inicio_producao: item.data_inicio_producao,
        data_prazo_produto: item.data_prazo_produto,
        status_liberacao_pcp: item.status_liberacao_pcp,
        liberado_pcp_por: item.liberado_pcp_por,
        liberado_pcp_em: item.liberado_pcp_em,
        sobra_acao: item.sobra_acao,
        sobra_observacao: item.sobra_observacao,
        sobra_registrada_id: item.sobra_registrada_id,
        prioridade_produto: item.prioridade_produto,
        ordem_producao: item.ordem_producao,
      })),
      materiais_consolidados: Array.from(materiaisConsolidados.values()),
    };

    if (itensOS.length > 0) {
      const ctxItens = itensOS.map((item: any) => ({
        id: item.id,
        produto_servico: item.produto_servico,
        data_prazo_produto: item.data_prazo_produto,
        status_liberacao_pcp: item.status_liberacao_pcp,
        responsabilidade_arte: item.responsabilidade_arte,
        status_arte: item.status_arte,
        materiais_disponivel: item.materiais_disponivel,
      }));
      data.arte_resumo = computeArteResumoGrid(ctxItens);
      data.liberacao_resumo = computeLiberacaoResumoGrid(ctxItens);
    }

    if (extras) {
      if (Object.prototype.hasOwnProperty.call(extras, 'alertas_estoque')) {
        data.alertas_estoque = extras.alertas_estoque;
      }
      if (
        Object.prototype.hasOwnProperty.call(extras, 'recomendacoes_estoque')
      ) {
        data.recomendacoes_estoque = extras.recomendacoes_estoque;
      }
      if (Object.prototype.hasOwnProperty.call(extras, 'detalhes_estoque')) {
        data.detalhes_estoque = extras.detalhes_estoque;
      }
    }

    return data;
  }

  private async enriquecerStatusExpedicaoLista(
    lojaId: string,
    itens: OrdemServicoData[],
  ): Promise<void> {
    if (itens.length === 0) return;

    const osIds = itens.map((item) => item.id);
    const expedicoes = await this.prisma.expedicaoLogistica.findMany({
      where: {
        loja_id: lojaId,
        os_id: { in: osIds },
        status: { not: 'DEVOLVIDA' },
      },
      orderBy: { atualizado_em: 'desc' },
      select: { os_id: true, status: true },
    });

    const porOs = new Map<string, string>();
    for (const exp of expedicoes) {
      if (!porOs.has(exp.os_id)) {
        porOs.set(exp.os_id, exp.status);
      }
    }

    for (const item of itens) {
      item.status_expedicao = porOs.get(item.id) ?? null;
    }
  }

  private async enriquecerOsAditivaGrid(
    lojaId: string,
    itens: OrdemServicoData[],
    ativo: boolean | undefined = true,
  ): Promise<void> {
    if (itens.length === 0) {
      return;
    }

    for (const item of itens) {
      item.materiais_disponivel = materiaisDisponiveisParaFluxo(item);
    }

    const paiIds = itens
      .filter(
        (item) => item.tipo_vinculo_os !== TIPO_VINCULO_OS_ADITIVA_INSTALACAO,
      )
      .map((item) => item.id);

    const filhasPorPai = new Map<string, OrdemServicoData[]>();

    if (paiIds.length > 0) {
      const whereFilhas: Record<string, unknown> = {
        loja_id: lojaId,
        os_pai_id: { in: paiIds },
        tipo_vinculo_os: TIPO_VINCULO_OS_ADITIVA_INSTALACAO,
      };
      if (ativo !== undefined) {
        whereFilhas.ativo = ativo;
      }

      const filhasDb = await this.prisma.ordemServico.findMany({
        where: whereFilhas,
        orderBy: { criado_em: 'asc' },
        include: {
          cliente: {
            select: { id: true, nome: true, email: true, telefone: true },
          },
          itens: true,
        },
      });

      for (const filha of filhasDb) {
        const formatada = this.formatarOrdemServico(filha);
        formatada.materiais_disponivel =
          materiaisDisponiveisParaFluxo(formatada);
        const paiId = filha.os_pai_id;
        if (!paiId) continue;
        const lista = filhasPorPai.get(paiId) ?? [];
        lista.push(formatada);
        filhasPorPai.set(paiId, lista);
      }
    }

    const paiIdsAditivas = [
      ...new Set(
        itens
          .filter(
            (item) =>
              item.tipo_vinculo_os === TIPO_VINCULO_OS_ADITIVA_INSTALACAO &&
              item.os_pai_id,
          )
          .map((item) => item.os_pai_id as string),
      ),
    ];

    const numerosPai = new Map<string, string>();
    if (paiIdsAditivas.length > 0) {
      const pais = await this.prisma.ordemServico.findMany({
        where: { loja_id: lojaId, id: { in: paiIdsAditivas } },
        select: { id: true, numero: true },
      });
      for (const pai of pais) {
        numerosPai.set(pai.id, pai.numero);
      }
    }

    for (const item of itens) {
      if (item.tipo_vinculo_os === TIPO_VINCULO_OS_ADITIVA_INSTALACAO) {
        if (item.os_pai_id) {
          item.os_pai_numero = numerosPai.get(item.os_pai_id) ?? null;
        }
        continue;
      }

      const filhas = filhasPorPai.get(item.id) ?? [];
      if (filhas.length === 0) {
        continue;
      }

      const valorTotal = filhas.reduce(
        (acc, filha) => acc + Number(filha.valor_orcado ?? 0),
        0,
      );

      item.aditivas_filhas = filhas;
      item.aditivas_resumo = {
        quantidade: filhas.length,
        valor_total: Math.round((valorTotal + Number.EPSILON) * 100) / 100,
      };
    }
  }

  private async enriquecerAtencaoInstalacaoLista(
    lojaId: string,
    itens: OrdemServicoData[],
  ): Promise<void> {
    if (itens.length === 0) {
      return;
    }

    const osIds = itens.map((item) => item.id);

    const [lotes, ocorrencias, relatorios] = await Promise.all([
      this.prisma.itemOSInstalacao.findMany({
        where: {
          loja_id: lojaId,
          item_os: { os_id: { in: osIds } },
        },
        select: {
          status_instalacao: true,
          assinatura_url: true,
          atualizado_em: true,
          item_os: { select: { os_id: true } },
        },
      }),
      this.prisma.ocorrenciaInstalacao.findMany({
        where: { loja_id: lojaId, os_id: { in: osIds } },
        select: {
          os_id: true,
          status_financeiro: true,
          criado_em: true,
        },
      }),
      this.prisma.relatorioTecnicoInstalacao.findMany({
        where: { loja_id: lojaId, os_id: { in: osIds } },
        select: { os_id: true },
      }),
    ]);

    const lotesPorOs = new Map<string, typeof lotes>();
    for (const lote of lotes) {
      const osId = lote.item_os.os_id;
      const lista = lotesPorOs.get(osId) ?? [];
      lista.push(lote);
      lotesPorOs.set(osId, lista);
    }

    const ocorrenciasPorOs = new Map<string, typeof ocorrencias>();
    for (const occ of ocorrencias) {
      const lista = ocorrenciasPorOs.get(occ.os_id) ?? [];
      lista.push(occ);
      ocorrenciasPorOs.set(occ.os_id, lista);
    }

    const relatorioPorOs = new Set(relatorios.map((rel) => rel.os_id));

    for (const item of itens) {
      const atencao = calcularAtencaoInstalacaoOs({
        statusInstalacaoOs:
          (item.status_instalacao_os as StatusInstalacaoOs | null) ?? null,
        relatorioEmitido: relatorioPorOs.has(item.id),
        lotes: lotesPorOs.get(item.id) ?? [],
        ocorrencias: ocorrenciasPorOs.get(item.id) ?? [],
      });
      item.requer_atencao_instalacao = atencao.requer_atencao;
      item.ultima_atividade_instalacao = atencao.ultima_atividade_em;
    }
  }

  // ===== MÉTODOS DE CONSULTA =====

  async buscarPorStatus(
    lojaId: string,
    status: StatusOS,
  ): Promise<OrdemServicoData[]> {
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

      return ordens.map((os) => this.formatarOrdemServico(os));
    } catch (error) {
      this.logger.error(`Erro ao buscar OS por status ${status}:`, error);
      throw error;
    }
  }

  async buscarPorResponsavel(
    lojaId: string,
    responsavelId: string,
  ): Promise<OrdemServicoData[]> {
    try {
      const ordens = await this.prisma.ordemServico.findMany({
        where: {
          loja_id: lojaId,
          responsavel_id: responsavelId,
          status: { not: StatusOS.FINALIZADA }, // Apenas OS ativas
        },
        orderBy: { criado_em: 'desc' },
      });

      return ordens.map((os) => this.formatarOrdemServico(os));
    } catch (error) {
      this.logger.error(
        `Erro ao buscar OS por responsável ${responsavelId}:`,
        error,
      );
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

      const filtroAtivo = { loja_id: lojaId, ativo: true };

      const [total, porStatus, prazoVencendo, atrasadas] = await Promise.all([
        this.prisma.ordemServico.count({
          where: {
            ...filtroAtivo,
            status: { notIn: [StatusOS.FINALIZADA, StatusOS.CANCELADA] },
          },
        }),

        this.prisma.ordemServico.groupBy({
          by: ['status'],
          where: filtroAtivo,
          _count: { status: true },
        }),

        this.prisma.ordemServico.count({
          where: {
            ...filtroAtivo,
            data_prazo: { lte: proximaSemana, gte: hoje },
            status: { notIn: [StatusOS.FINALIZADA, StatusOS.CANCELADA] },
          },
        }),

        this.prisma.ordemServico.count({
          where: {
            ...filtroAtivo,
            data_prazo: { lt: hoje },
            status: { notIn: [StatusOS.FINALIZADA, StatusOS.CANCELADA] },
          },
        }),
      ]);

      // Formatar estatísticas por status
      const statusStats = porStatus.reduce(
        (acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        },
        {} as Record<string, number>,
      );

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
    observacoes: string | undefined,
    lojaId: string,
  ): Promise<OrdemServicoData> {
    try {
      const os = await this.prisma.ordemServico.findFirst({
        where: { id: osId, loja_id: lojaId },
      });

      if (!os) {
        throw new NotFoundException(`OS ${osId} não encontrada`);
      }

      // Validar transição
      const validacao = await this.validarTransicaoEtapa(
        os.status,
        novoStatus,
        os,
        usuarioId,
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
          versao: { increment: 1 },
        },
      });

      // Registrar movimentação
      await this.adicionarMovimentacao(
        osId,
        TipoMovimentacaoOS.AVANCAR_ETAPA,
        os.status,
        novoStatus,
        usuarioId,
        observacoes || `OS transicionada para ${novoStatus}`,
      );

      this.logger.log(
        `OS ${os.numero} transicionada de ${os.status} para ${novoStatus}`,
      );

      if (
        novoStatus === StatusOS.FINALIZADA &&
        String(os.tipo_os).toUpperCase() !== TipoOSInterface.INTERNA
      ) {
        try {
          await this.itemOSInstalacaoCriacaoService.processarBaixaProducaoOs(
            os.loja_id,
            osId,
          );
        } catch (error) {
          this.logger.error(
            `Falha ao sincronizar lotes de instalação para OS ${osId} após finalização manual:`,
            error,
          );
        }

        try {
          await this.expedicaoCriacaoService.criarSeElegivel(osId, os.loja_id);
        } catch (error) {
          this.logger.error(
            `Falha ao criar expedição para OS ${osId} após finalização manual:`,
            error,
          );
        }
      }

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
    observacoes?: string,
  ): Promise<OrdemServicoData> {
    try {
      const os = await this.prisma.ordemServico.findUnique({
        where: { id: osId },
      });

      if (!os) {
        throw new NotFoundException(`OS ${osId} não encontrada`);
      }

      if (os.tipo_os !== TipoOS.INTERNA) {
        throw new BadRequestException(
          'Aprovação orçamentária só se aplica a OS Interna',
        );
      }

      if (os.status !== StatusOS.AGUARDANDO_APROVACAO_ORCAMENTARIA) {
        throw new BadRequestException(
          'OS não está aguardando aprovação orçamentária',
        );
      }

      // Verificar permissões do usuário
      const usuario = await this.prisma.usuario.findUnique({
        where: { id: usuarioId },
      });

      if (!usuario) {
        throw new ForbiddenException('Usuário não encontrado');
      }

      // Validar alçada do usuário usando o sistema de alçadas
      const valorEstimado = Number(os.valor_orcado || 0);
      const validacaoAlcada =
        await this.alcadasOrcamentoService.podeAprovarAutomaticamente(
          usuario.funcao,
          valorEstimado,
        );

      if (!validacaoAlcada.pode) {
        throw new ForbiddenException(
          validacaoAlcada.motivo ||
            'Usuário não tem alçada suficiente para aprovar este valor',
        );
      }

      // Validar orçamento disponível no centro de custo
      const validacaoOrcamento =
        await this.alcadasOrcamentoService.validarOrcamentoDisponivel(
          os.centro_custo,
          valorEstimado,
          os.loja_id,
        );

      if (!validacaoOrcamento.pode_aprovar) {
        throw new BadRequestException(
          validacaoOrcamento.motivo_rejeicao ||
            'Orçamento insuficiente no centro de custo',
        );
      }

      const statusAprovacao = aprovado ? 'APROVADA' : 'REJEITADA';
      const novoStatus = aprovado
        ? StatusOS.APROVADA_ORCAMENTARIA
        : StatusOS.REJEITADA;

      // Se aprovada, reservar orçamento
      if (aprovado) {
        const reservaOrcamento =
          await this.alcadasOrcamentoService.reservarOrcamento(
            os.centro_custo,
            valorEstimado,
            os.loja_id,
            osId,
          );

        if (!reservaOrcamento.sucesso) {
          throw new BadRequestException(
            reservaOrcamento.motivo || 'Erro ao reservar orçamento',
          );
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
          versao: { increment: 1 },
        },
      });

      // Registrar movimentação
      await this.adicionarMovimentacao(
        osId,
        TipoMovimentacaoOS.APROVACAO_ORCAMENTARIA,
        StatusOS.AGUARDANDO_APROVACAO_ORCAMENTARIA,
        novoStatus,
        usuarioId,
        observacoes ||
          `Aprovação orçamentária ${statusAprovacao.toLowerCase()}`,
      );

      this.logger.log(
        `OS ${os.numero} aprovada orçamentariamente: ${statusAprovacao}`,
      );
      return this.formatarOrdemServico(osAtualizada);
    } catch (error) {
      this.logger.error(`Erro ao aprovar OS orçamentária ${osId}:`, error);
      throw error;
    }
  }

  /**
   * Aprova OS técnica (workflow comercial)
   *
   * `prazosItens` carrega o par (início, fim) por serviço/item da OS,
   * definidos no modal de aprovação. Em fluxo padrão todos os itens da OS
   * precisam ter `data_prazo_produto`. Em fluxo retroativo o array é
   * opcional. O service também atualiza o prazo guarda-chuva da OS
   * (`data_prazo`) quando ele ainda não existe, usando o maior prazo dos
   * itens.
   */
  async aprovarOSTecnica(
    osId: string,
    usuarioId: string,
    aprovado: boolean,
    observacoes?: string,
    prazosItens?: Array<{
      item_id: string;
      data_inicio_producao?: Date;
      data_prazo_produto?: Date;
    }>,
    itemIds?: string[],
  ): Promise<OrdemServicoData> {
    try {
      const os = await this.prisma.ordemServico.findUnique({
        where: { id: osId },
      });

      if (!os) {
        throw new NotFoundException(`OS ${osId} não encontrada`);
      }

      if (os.tipo_os !== TipoOS.COMERCIAL) {
        throw new BadRequestException(
          'Aprovação técnica só se aplica a OS Comercial',
        );
      }

      // Aceita aprovacao tecnica em qualquer status NAO-terminal. Os terminais
      // (FINALIZADA, CANCELADA, REJEITADA) e os que ja representam decisao
      // (APROVADA_TECNICA) bloqueiam. Isso suporta dois cenarios reais:
      //   a) Fluxo padrao: OS recem-criada (FILA / AGUARDANDO_APROVACAO_TECNICA)
      //      → aprovacao avanca o workflow para APROVADA_TECNICA.
      //   b) Regularizacao: OS legada que avancou no operacional sem passar
      //      pelo checkpoint formal (status = PRODUCAO/ACABAMENTO/etc. com
      //      aprovacao_tecnica_status = PENDENTE). Aprovacao retroativa apenas
      //      registra a decisao no campo de aprovacao SEM retroceder o status.
      const statusBloqueados: string[] = [
        StatusOS.FINALIZADA,
        StatusOS.CANCELADA,
        StatusOS.REJEITADA,
        StatusOS.APROVADA_TECNICA,
      ];
      if (statusBloqueados.includes(os.status)) {
        throw new BadRequestException(
          `OS em status "${os.status}" nao pode receber aprovacao tecnica`,
        );
      }

      // Bloqueia revalidacao quando ja existe decisao registrada no campo
      // de aprovacao tecnica (independente do status operacional).
      const aprovacaoAtual = (
        os.aprovacao_tecnica_status || 'PENDENTE'
      ).toUpperCase();
      if (aprovacaoAtual !== 'PENDENTE') {
        throw new BadRequestException(
          `OS ja possui decisao de aprovacao tecnica: ${aprovacaoAtual}`,
        );
      }

      // Verificar permissões do usuário usando sistema centralizado
      if (!usuarioId) {
        throw new BadRequestException('ID do usuário é obrigatório');
      }

      const usuario = await this.prisma.usuario.findUnique({
        where: { id: usuarioId },
      });

      if (!usuario) {
        throw new BadRequestException('Usuário não encontrado');
      }

      const permissaoAprovacao =
        await this.osApprovalPermissionsService.podeAprovarTecnica(
          usuarioId,
          usuario.loja_id,
        );

      if (!permissaoAprovacao.pode) {
        throw new ForbiddenException(
          permissaoAprovacao.motivo ||
            'Usuário não tem permissão para aprovar tecnicamente',
        );
      }

      const statusFluxoPadrao: string[] = [
        StatusOS.AGUARDANDO_APROVACAO_TECNICA,
        StatusOS.FILA,
        StatusOS.PARCIALMENTE_LIBERADA,
      ];
      const eFluxoPadrao = statusFluxoPadrao.includes(os.status);

      const itensOS = await this.prisma.itemOS.findMany({
        where: { os_id: osId },
      });
      const tipoPorId = await this.carregarTipoItemOrcamentoPorIds(
        itensOS.map((i) => i.id),
      );
      const todosIds = itensOS.map((i) => i.id);
      const idsPrazos = (prazosItens ?? []).map((p) => p.item_id);
      const idsAlvo = resolveIdsAlvoLiberacao(todosIds, itemIds, idsPrazos);
      const eLiberacaoParcial =
        aprovado &&
        eFluxoPadrao &&
        idsAlvo.length > 0 &&
        idsAlvo.length < itensOS.length;

      const prazosPreparados = await this.validarEPrepararPrazosItens(
        osId,
        prazosItens || [],
        eFluxoPadrao && aprovado,
        eLiberacaoParcial ? idsAlvo : itemIds,
      );
      const prazoPorItemId = new Map(
        prazosPreparados.map((p) => [p.item_id, p.data_prazo_produto]),
      );

      if (aprovado && eFluxoPadrao) {
        for (const itemId of idsAlvo) {
          const item = itensOS.find((i) => i.id === itemId);
          if (!item) {
            throw new BadRequestException(`Item ${itemId} não pertence à OS`);
          }
          if (
            (item.status_liberacao_pcp || 'PENDENTE').toUpperCase() ===
            'LIBERADO'
          ) {
            continue;
          }
          const enriquecido = comTipoItemOrcamento(item, tipoPorId);
          const ctx = {
            id: enriquecido.id,
            produto_servico: enriquecido.produto_servico,
            data_prazo_produto:
              prazoPorItemId.get(itemId) ?? enriquecido.data_prazo_produto,
            status_liberacao_pcp: enriquecido.status_liberacao_pcp,
            responsabilidade_arte: enriquecido.responsabilidade_arte,
            status_arte: enriquecido.status_arte,
            materiais_disponivel: enriquecido.materiais_disponivel,
            modo_fulfillment: enriquecido.modo_fulfillment,
            personalizacao_modo: enriquecido.personalizacao_modo,
            tipo_item: enriquecido.tipo_item,
            parametros_tecnicos: enriquecido.parametros_tecnicos,
            insumos_necessarios: enriquecido.insumos_necessarios,
          };

          if (!itemRequerFabricaPcp(ctx)) {
            continue;
          }

          const motivos = getMotivosBloqueioPcp(ctx, os.materiais_disponivel);
          if (motivos.length > 0) {
            throw new BadRequestException(
              `Produto "${item.produto_servico}" não elegível: ${motivos.map((m) => m.mensagem).join('; ')}`,
            );
          }
        }
      }

      let novoStatus: StatusOS;
      let statusAprovacao: string;
      if (!aprovado) {
        novoStatus = StatusOS.REJEITADA;
        statusAprovacao = 'REJEITADA';
      } else if (eFluxoPadrao) {
        novoStatus = eLiberacaoParcial
          ? StatusOS.PARCIALMENTE_LIBERADA
          : StatusOS.LIBERADA_PARA_PCP;
        statusAprovacao = eLiberacaoParcial ? 'PENDENTE' : 'APROVADA';
      } else {
        novoStatus = os.status as StatusOS;
        statusAprovacao = 'APROVADA';
      }

      const motivoModificacao = aprovado
        ? eLiberacaoParcial
          ? 'Liberação parcial de produtos para PCP'
          : eFluxoPadrao
            ? 'Aprovação técnica aprovada e OS liberada para PCP'
            : 'Aprovação técnica aprovada (retroativa)'
        : 'Aprovação técnica rejeitada';

      // Atualiza prazo guarda-chuva da OS se ainda não existir (usa max
      // dos itens). Bloqueia se algum item exceder o prazo atual da OS.
      const dataPrazoOS = this.calcularPrazoGuardaChuvaOS(
        os.data_prazo,
        prazosPreparados,
      );

      const osAtualizada = await this.prisma.ordemServico.update({
        where: { id: osId },
        data: {
          status: novoStatus,
          aprovacao_tecnica_status: statusAprovacao,
          aprovacao_tecnica_por: usuarioId,
          aprovacao_tecnica_em: new Date(),
          aprovacao_tecnica_obs: observacoes,
          modificado_por: usuarioId,
          motivo_modificacao: motivoModificacao,
          versao: { increment: 1 },
          ...(dataPrazoOS !== undefined ? { data_prazo: dataPrazoOS } : {}),
        },
      });

      // Persiste prazos por item em batch (após atualizar a OS).
      if (prazosPreparados.length > 0) {
        await Promise.all(
          prazosPreparados.map((p) =>
            this.prisma.itemOS.update({
              where: { id: p.item_id },
              data: {
                ...(p.data_inicio_producao !== undefined
                  ? { data_inicio_producao: p.data_inicio_producao }
                  : {}),
                ...(p.data_prazo_produto !== undefined
                  ? { data_prazo_produto: p.data_prazo_produto }
                  : {}),
              },
            }),
          ),
        );
      }

      // Registrar movimentação com o status real anterior (pode ser FILA,
      // AGUARDANDO_APROVACAO_TECNICA ou qualquer status intermediário quando
      // for aprovação retroativa)
      await this.adicionarMovimentacao(
        osId,
        TipoMovimentacaoOS.APROVACAO_TECNICA,
        os.status as StatusOS,
        novoStatus,
        usuarioId,
        observacoes || motivoModificacao,
      );

      // Auto-promoção para o PCP no fluxo padrão: libera os itens ainda
      // PENDENTE, notifica os eventos automáticos e tenta atribuir um
      // workflow inteligente. Falhas aqui são apenas registradas em log; não
      // revertem a aprovação técnica.
      if (aprovado && eFluxoPadrao) {
        await this.promoverAprovacaoParaPCP(
          osId,
          os.loja_id,
          usuarioId,
          eLiberacaoParcial ? idsAlvo : undefined,
        );
      }

      this.logger.log(
        `OS ${os.numero} aprovada tecnicamente: ${statusAprovacao}`,
      );
      const osFinal = await this.prisma.ordemServico.findUnique({
        where: { id: osId },
        include: {
          cliente: {
            select: { id: true, nome: true, email: true, telefone: true },
          },
          itens: true,
        },
      });
      return this.formatarOrdemServico(osFinal ?? osAtualizada);
    } catch (error) {
      this.logger.error(`Erro ao aprovar OS técnica ${osId}:`, error);
      throw error;
    }
  }

  /**
   * Promove uma OS recém-aprovada tecnicamente para o PCP. Não faz `update`
   * de status (quem chama já fez); apenas executa os efeitos colaterais que
   * antes só aconteciam quando o usuário clicava em "Liberar para PCP"
   * manualmente:
   *
   *  1. Libera todos os `ItemOS` ainda `PENDENTE` para `LIBERADO`.
   *  2. Dispara `EventosAutomaticosService.notificarOSLiberadaParaPCP`.
   *  3. Tenta atribuir um workflow via `WorkflowAssignmentService` (se houver
   *     categoria inteligente cadastrada, a OS já nasce em `EM_WORKFLOW`).
   *
   * Toda falha aqui é absorvida em `warn` para não reverter a aprovação
   * técnica. Exposto como `public` para que `AprovacaoTecnicaService` (caminho
   * paralelo `POST /os/:id/aprovar-tecnica`) reúse a mesma lógica.
   */
  async promoverAprovacaoParaPCP(
    osId: string,
    lojaId: string,
    usuarioId: string,
    itemIds?: string[],
  ): Promise<void> {
    const os = await this.prisma.ordemServico.findFirst({
      where: { id: osId, loja_id: lojaId },
      include: { itens: true },
    });
    if (!os) return;

    if (os.pular_pcp) {
      this.logger.debug(
        `OS ${osId} com pular_pcp=true — promoção para PCP ignorada`,
      );
      return;
    }

    const materiaisOk = materiaisDisponiveisParaFluxo(os);

    const tipoPorId = await this.carregarTipoItemOrcamentoPorIds(
      os.itens.map((i) => i.id),
    );

    const candidatos = os.itens.filter((item) => {
      if (
        (item.status_liberacao_pcp || 'PENDENTE').toUpperCase() === 'LIBERADO'
      ) {
        return false;
      }
      if ((item.status_liberacao_pcp || '').toUpperCase() === 'NAO_APLICA') {
        return false;
      }
      if (itemIds && itemIds.length > 0) {
        const enriquecido = comTipoItemOrcamento(item, tipoPorId);
        const requerPcp = itemRequerFabricaPcp({
          modo_fulfillment: enriquecido.modo_fulfillment,
          personalizacao_modo: enriquecido.personalizacao_modo,
          responsabilidade_arte: enriquecido.responsabilidade_arte,
          tipo_item: enriquecido.tipo_item,
          parametros_tecnicos: enriquecido.parametros_tecnicos,
          insumos_necessarios: enriquecido.insumos_necessarios,
        });
        if (!requerPcp) {
          return true;
        }
        return itemIds.includes(item.id);
      }
      return true;
    });

    let liberadosPcp = 0;

    try {
      for (const item of candidatos) {
        const enriquecido = comTipoItemOrcamento(item, tipoPorId);
        const ctx = {
          id: enriquecido.id,
          produto_servico: enriquecido.produto_servico,
          data_prazo_produto: enriquecido.data_prazo_produto,
          status_liberacao_pcp: enriquecido.status_liberacao_pcp,
          responsabilidade_arte: enriquecido.responsabilidade_arte,
          status_arte: enriquecido.status_arte,
          materiais_disponivel: enriquecido.materiais_disponivel,
          modo_fulfillment: enriquecido.modo_fulfillment,
          personalizacao_modo: enriquecido.personalizacao_modo,
          tipo_item: enriquecido.tipo_item,
          parametros_tecnicos: enriquecido.parametros_tecnicos,
          insumos_necessarios: enriquecido.insumos_necessarios,
        };

        if (!itemRequerFabricaPcp(ctx)) {
          await this.prisma.itemOS.update({
            where: { id: item.id },
            data: {
              status_liberacao_pcp: 'NAO_APLICA',
              liberado_pcp_em: new Date(),
              liberado_pcp_por: usuarioId,
            },
          });
          continue;
        }

        if (!isElegivelPcp(ctx, materiaisOk)) {
          continue;
        }

        await this.prisma.itemOS.update({
          where: { id: item.id },
          data: {
            status_liberacao_pcp: 'LIBERADO',
            liberado_pcp_por: usuarioId,
            liberado_pcp_em: new Date(),
          },
        });
        liberadosPcp += 1;
      }
    } catch (error) {
      this.logger.warn(
        `Falha ao liberar itens da OS ${osId} após aprovação técnica: ${
          error instanceof Error ? error.message : error
        }`,
      );
    }

    try {
      const temItensExpedicao = os.itens.some((item) => {
        const enriquecido = comTipoItemOrcamento(item, tipoPorId);
        return !itemRequerFabricaPcp({
          modo_fulfillment: enriquecido.modo_fulfillment,
          personalizacao_modo: enriquecido.personalizacao_modo,
          responsabilidade_arte: enriquecido.responsabilidade_arte,
          tipo_item: enriquecido.tipo_item,
          parametros_tecnicos: enriquecido.parametros_tecnicos,
          insumos_necessarios: enriquecido.insumos_necessarios,
        });
      });

      if (temItensExpedicao) {
        await this.expedicaoCriacaoService.criarSeElegivel(osId, lojaId);
      }
    } catch (error) {
      this.logger.warn(
        `Falha ao criar expedição para OS ${osId} após aprovação técnica: ${
          error instanceof Error ? error.message : error
        }`,
      );
    }

    if (liberadosPcp === 0) {
      await this.sincronizarStatusAgregadoLiberacaoPcp(osId);
      return;
    }

    try {
      await this.eventosAutomaticosService.notificarOSLiberadaParaPCP(
        osId,
        lojaId,
        undefined,
        usuarioId,
      );
    } catch (error) {
      this.logger.warn(
        `Falha ao notificar OS ${osId} liberada para PCP após aprovação técnica: ${
          error instanceof Error ? error.message : error
        }`,
      );
    }

    try {
      await this.workflowAssignmentService.atribuirWorkflow(lojaId, {
        osId,
        usuarioId,
      });
    } catch (error) {
      this.logger.warn(
        `Falha ao atribuir workflow automaticamente para OS ${osId} após aprovação técnica: ${
          error instanceof Error ? error.message : error
        }`,
      );
    }

    await this.sincronizarStatusAgregadoLiberacaoPcp(osId);
  }

  private async sincronizarStatusAgregadoLiberacaoPcp(osId: string): Promise<void> {
    const itensOs = await this.prisma.itemOS.findMany({ where: { os_id: osId } });
    if (itensOs.length === 0) {
      return;
    }

    const tipoPorId = await this.carregarTipoItemOrcamentoPorIds(
      itensOs.map((i) => i.id),
    );
    const ctxItens = itensOs.map((item) => {
      const enriquecido = comTipoItemOrcamento(item, tipoPorId);
      return {
        id: enriquecido.id,
        produto_servico: enriquecido.produto_servico,
        data_prazo_produto: enriquecido.data_prazo_produto,
        status_liberacao_pcp: enriquecido.status_liberacao_pcp,
        responsabilidade_arte: enriquecido.responsabilidade_arte,
        status_arte: enriquecido.status_arte,
        materiais_disponivel: enriquecido.materiais_disponivel,
        modo_fulfillment: enriquecido.modo_fulfillment,
        personalizacao_modo: enriquecido.personalizacao_modo,
        tipo_item: enriquecido.tipo_item,
        parametros_tecnicos: enriquecido.parametros_tecnicos,
        insumos_necessarios: enriquecido.insumos_necessarios,
      };
    });

    const agregado = computeStatusOSLiberacaoFromItens(ctxItens);
    if (agregado === 'PARCIAL') {
      await this.prisma.ordemServico.update({
        where: { id: osId },
        data: {
          status: StatusOS.PARCIALMENTE_LIBERADA,
          aprovacao_tecnica_status: 'PENDENTE',
        },
      });
    } else if (agregado === 'COMPLETO') {
      await this.prisma.ordemServico.update({
        where: { id: osId },
        data: {
          status: StatusOS.LIBERADA_PARA_PCP,
          aprovacao_tecnica_status: 'APROVADA',
        },
      });
    }
  }

  /**
   * Valida prazos por item enviados no modal de aprovação. Em fluxo padrão
   * (exigirCompleto=true) todos os itens da OS precisam ter
   * `data_prazo_produto`. Cada par (início, fim) é validado individualmente.
   */
  private async validarEPrepararPrazosItens(
    osId: string,
    prazos: Array<{
      item_id: string;
      data_inicio_producao?: Date;
      data_prazo_produto?: Date;
    }>,
    exigirCompleto: boolean,
    apenasItemIds?: string[],
  ): Promise<
    Array<{
      item_id: string;
      data_inicio_producao?: Date;
      data_prazo_produto?: Date;
    }>
  > {
    const itensDaOS = await this.prisma.itemOS.findMany({
      where: { os_id: osId },
      select: { id: true, produto_servico: true },
    });
    const idsValidos = new Set(itensDaOS.map((i) => i.id));
    const indexPrazos = new Map(prazos.map((p) => [p.item_id, p]));

    if (exigirCompleto) {
      const semPrazo: string[] = [];
      for (const item of itensDaOS) {
        if (apenasItemIds && !apenasItemIds.includes(item.id)) {
          continue;
        }
        const p = indexPrazos.get(item.id);
        if (!p?.data_prazo_produto) {
          semPrazo.push(item.produto_servico);
        }
      }
      if (semPrazo.length > 0) {
        throw new BadRequestException(
          `Defina a data de entrega de cada serviço antes de aprovar: ${semPrazo.join(', ')}`,
        );
      }
    }

    for (const p of prazos) {
      if (!idsValidos.has(p.item_id)) {
        throw new BadRequestException(
          `Item ${p.item_id} não pertence a esta OS`,
        );
      }

      if (
        p.data_inicio_producao &&
        Number.isNaN(p.data_inicio_producao.getTime())
      ) {
        throw new BadRequestException(
          `Data de início inválida no item ${p.item_id}`,
        );
      }
      if (
        p.data_prazo_produto &&
        Number.isNaN(p.data_prazo_produto.getTime())
      ) {
        throw new BadRequestException(
          `Data de entrega inválida no item ${p.item_id}`,
        );
      }
      if (
        p.data_inicio_producao &&
        p.data_prazo_produto &&
        p.data_inicio_producao > p.data_prazo_produto
      ) {
        throw new BadRequestException(
          `Data de início não pode ser posterior à data de entrega (item ${p.item_id})`,
        );
      }
    }

    return prazos;
  }

  /**
   * Calcula o prazo guarda-chuva (`OrdemServico.data_prazo`) com base nos
   * prazos individuais dos itens.
   *  - Se a OS ainda não tem `data_prazo` e algum item tem
   *    `data_prazo_produto`: retorna o maior `data_prazo_produto`.
   *  - Se já tem `data_prazo` e algum item o excede: 400.
   *  - Caso contrário: undefined (não atualizar).
   */
  private calcularPrazoGuardaChuvaOS(
    dataPrazoAtual: Date | null,
    prazosItens: Array<{ data_prazo_produto?: Date }>,
  ): Date | undefined {
    const fins = prazosItens
      .map((p) => p.data_prazo_produto)
      .filter((d): d is Date => !!d);

    if (fins.length === 0) {
      return undefined;
    }

    const maiorFim = fins.reduce((max, d) => (d > max ? d : max));

    if (!dataPrazoAtual) {
      return maiorFim;
    }

    if (maiorFim > dataPrazoAtual) {
      throw new BadRequestException(
        'Algum serviço tem prazo maior que o prazo limite atual da OS. Atualize o prazo da OS antes.',
      );
    }

    return undefined;
  }

  // ===== MÉTODOS DE VALIDAÇÃO PARA WORKFLOW INTERNA =====

  /**
   * Valida se centro de custo está disponível
   */
  private async validarCentroCustoDisponivel(
    centroCusto: string,
    lojaId: string,
  ): Promise<boolean> {
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
        where: { id: osId },
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
  private async validarAlcadaAdequada(
    valorOrcado: number,
    centroCusto: string,
    lojaId: string,
  ): Promise<boolean> {
    try {
      const valor = Number(valorOrcado || 0);

      // Definir limites de alçada
      const limitesAlcada = {
        GERENTE: 2000,
        DIRETOR: 10000,
        SUPERVISOR: 500,
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
  private async validarAlcadaUsuario(
    funcaoUsuario: string,
    valorEstimado: number,
  ): Promise<boolean> {
    try {
      const limitesAlcada = {
        SUPERVISOR: 500,
        GERENTE: 2000,
        DIRETOR: 10000,
        ADMIN: 50000,
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
        where: { id: osId },
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
        where: { id: osId },
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
        where: { id: osId },
      });

      if (!os) {
        return false;
      }

      // Verificar campos obrigatórios
      const camposObrigatorios = [
        'nome_servico',
        'descricao',
        'quantidade',
        'parametros_tecnicos',
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

  private montarParametrosItemOS(produto: any): Record<string, any> {
    return {
      tipo_item: produto.tipo_item || 'SOB_DEMANDA',
      produto_finito_id: produto.produto_finito_id || null,
      largura: produto.largura?.toString?.() ?? produto.largura ?? null,
      altura: produto.altura?.toString?.() ?? produto.altura ?? null,
      profundidade:
        produto.profundidade?.toString?.() ?? produto.profundidade ?? null,
      area: produto.area_produto?.toString?.() ?? produto.area ?? null,
      perimetro:
        produto.perimetro_produto?.toString?.() ??
        produto.perimetro_produto ??
        null,
      unidade_medida: produto.unidade_medida ?? produto.unidade ?? null,
      unidade_geometria: produto.unidade_geometria ?? null,
      geometria_origem: produto.geometria_origem ?? null,
      arquivo_geometria_url: produto.arquivo_geometria_url ?? null,
      categoria: produto.categoria ?? null,
      observacoes: produto.observacoes ?? null,
      maquinas: Array.isArray(produto.maquinas)
        ? produto.maquinas
            .map((itemMaquina: any) => ({
              maquina_id:
                itemMaquina.maquina_id ?? itemMaquina.maquina?.id ?? null,
              nome: itemMaquina.maquina?.nome ?? null,
              horas_utilizadas:
                itemMaquina.horas_uso?.toString?.() ??
                itemMaquina.horas_utilizadas?.toString?.() ??
                null,
            }))
            .filter((maquina: any) => maquina.maquina_id)
        : [],
    };
  }

  private montarItensOSDoOrcamento(
    orcamento: any,
    lojaId: string,
    statusLiberacaoPcpInicial: string = StatusLiberacaoPcp.PENDENTE,
  ): any[] {
    const produtos = Array.isArray(orcamento?.produtos)
      ? orcamento.produtos
      : [];

    return produtos.map((produto: any, index: number) => {
      const arteInicial = resolverStatusArteInicial(
        produto.responsabilidade_arte,
      );

      assertProdutoFinitoTenant(produto.produto_finito, lojaId);

      const propagacao = resolverPropagacaoPersonalizacaoItemOS({
        tipoItem: produto.tipo_item,
        produtoFinito: produto.produto_finito ?? null,
        personalizacao: produto.personalizacao ?? null,
      });
      const modoFulfillment =
        produto.modo_fulfillment ?? propagacao.modo_fulfillment;
      const fornecedorTerceirizado = produto.fornecedor_terceirizado ?? null;

      if (
        (modoFulfillment === ModoFulfillmentItem.OUTSOURCE ||
          modoFulfillment === ModoFulfillmentItem.HIBRIDO) &&
        !fornecedorTerceirizado
      ) {
        throw new BadRequestException(
          'O item terceirizado não possui um parceiro válido vinculado.',
        );
      }

      if (
        (modoFulfillment === ModoFulfillmentItem.OUTSOURCE ||
          modoFulfillment === ModoFulfillmentItem.HIBRIDO) &&
        fornecedorTerceirizado
      ) {
        if (fornecedorTerceirizado.loja_id !== lojaId) {
          throw new ForbiddenException(
            'Fornecedor terceirizado não pertence ao tenant do orçamento.',
          );
        }
        if (fornecedorTerceirizado.tipo === TipoFornecedor.INSUMO) {
          throw new BadRequestException(
            'O fornecedor selecionado não está habilitado para terceirização.',
          );
        }
        if (!fornecedorTerceirizado.ativo) {
          throw new BadRequestException(
            'O fornecedor terceirizado selecionado está inativo.',
          );
        }
      }

      return {
        id: produto.id,
        produto_servico:
          produto.nome || produto.nome_servico || `Produto ${index + 1}`,
        quantidade: produto.quantidade,
        parametros_tecnicos: JSON.stringify(
          this.montarParametrosItemOS(produto),
        ),
        insumos_necessarios: JSON.stringify(
          this.extrairMateriaisDoProdutoOrcamento(orcamento, produto),
        ),
        materiais_disponivel: false,
        observacoes: produto.descricao || produto.observacoes || null,
        largura: produto.largura ?? null,
        altura: produto.altura ?? null,
        profundidade: produto.profundidade ?? null,
        area: produto.area_produto ?? produto.area ?? null,
        perimetro: produto.perimetro_produto ?? null,
        unidade_medida: produto.unidade_medida ?? produto.unidade ?? null,
        unidade_geometria: produto.unidade_geometria ?? null,
        geometria_origem: produto.geometria_origem ?? null,
        arquivo_geometria_url: produto.arquivo_geometria_url ?? null,
        arquivo_geometria_metadados:
          produto.arquivo_geometria_metadados ?? null,
        responsabilidade_arte: produto.responsabilidade_arte ?? 'NAO_APLICAVEL',
        politica_cobranca_arte:
          produto.politica_cobranca_arte ?? 'NAO_APLICAVEL',
        finalidade_anexo: produto.finalidade_anexo ?? null,
        complexidade_arte: produto.complexidade_arte ?? null,
        status_arte: arteInicial.status_arte,
        arte_fila_desde: arteInicial.arte_fila_desde,
        status_liberacao_pcp: statusLiberacaoPcpInicial,
        prioridade_produto: 'NORMAL',
        ordem_producao: index + 1,
        modo_fulfillment: modoFulfillment,
        fornecedor_id:
          modoFulfillment === ModoFulfillmentItem.OUTSOURCE ||
          modoFulfillment === ModoFulfillmentItem.HIBRIDO
            ? produto.fornecedor_terceirizado_id ?? null
            : null,
        personalizacao_modo: propagacao.personalizacao_modo,
        estampa_id: propagacao.estampa_id,
        valores_personalizacao: propagacao.valores_personalizacao,
        grade_distribuicao: propagacao.grade_distribuicao,
        _snapshot_personalizacao_auditoria: propagacao.snapshot_auditoria,
      };
    });
  }

  async criarOSDeOrcamento(
    lojaId: string,
    dadosOrcamento: any,
    usuarioId: string,
  ): Promise<OrdemServicoData> {
    try {
      this.logger.log(
        `Criando OS a partir do orçamento ${dadosOrcamento.orcamento_id}`,
      );

      // 1. Buscar orçamento completo com produtos, personalização e insumos (BOLA: loja_id)
      const orcamentoCompleto = await this.prisma.orcamento.findFirst({
        where: {
          id: dadosOrcamento.orcamento_id,
          loja_id: lojaId,
        },
        include: {
          produtos: {
            include: {
              personalizacao: true,
              produto_finito: {
                select: {
                  id: true,
                  personalizavel: true,
                  fulfillment_padrao: true,
                  loja_id: true,
                },
              },
              fornecedor_terceirizado: {
                select: {
                  id: true,
                  loja_id: true,
                  tipo: true,
                  ativo: true,
                },
              },
              insumos: {
                include: {
                  insumo: {
                    include: {
                      categoria: true,
                      tipoMaterial: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!orcamentoCompleto) {
        throw new NotFoundException(
          `Orçamento ${dadosOrcamento.orcamento_id} não encontrado para esta loja.`,
        );
      }

      // 2. Extrair materiais exatos do orçamento
      const materiaisOrcamento =
        this.extrairMateriaisDoOrcamento(orcamentoCompleto);
      const statusLiberacaoInicial =
        await this.pcpBloqueioSinalService.resolverStatusInicialItem(
          lojaId,
          orcamentoCompleto.id,
        );
      const itensOS = this.montarItensOSDoOrcamento(
        orcamentoCompleto,
        lojaId,
        statusLiberacaoInicial,
      );

      const createDto: CreateOSDto = {
        tipo_os: TipoOS.COMERCIAL, // OS criada a partir de orçamento é sempre comercial
        origem_os: OrigemOS.ORCAMENTO,
        prioridade: this.normalizarPrioridadeOS(dadosOrcamento.prioridade),
        cliente_id: dadosOrcamento.cliente_id,
        orcamento_id: dadosOrcamento.orcamento_id,
        nome_servico: dadosOrcamento.nome_servico,
        descricao: dadosOrcamento.descricao,
        quantidade: dadosOrcamento.quantidade_produto,
        parametros_tecnicos: {
          largura: dadosOrcamento.largura_produto,
          altura: dadosOrcamento.altura_produto,
          area: dadosOrcamento.area_produto,
          perimetro: dadosOrcamento.perimetro_produto,
          unidade_medida: dadosOrcamento.unidade_medida_produto,
          unidade_geometria: dadosOrcamento.unidade_geometria,
          geometria_origem: dadosOrcamento.geometria_origem,
          arquivo_geometria_url: dadosOrcamento.arquivo_geometria_url,
        },
        responsavel_id: dadosOrcamento.responsavel_id,
        data_prazo: dadosOrcamento.prazo_entrega,
        observacoes: dadosOrcamento.observacoes_internas,
        valor_orcado: Number(orcamentoCompleto.preco_final ?? 0),
        criado_por: usuarioId,
        insumos_calculados: JSON.stringify(materiaisOrcamento), // Materiais exatos do orçamento
      };

      const os = await this.create(lojaId, createDto);

      if (itensOS.length > 0) {
        const ordensTerceirizacao = orcamentoCompleto.produtos
          .filter(
            (produto: any) =>
              (produto.modo_fulfillment === ModoFulfillmentItem.OUTSOURCE ||
                produto.modo_fulfillment === ModoFulfillmentItem.HIBRIDO) &&
              produto.fornecedor_terceirizado_id,
          )
          .map((produto: any) => {
            const prazoDias = produto.terceirizacao_prazo_dias ?? null;
            const dataPrevista = prazoDias
              ? new Date(Date.now() + prazoDias * 24 * 60 * 60 * 1000)
              : null;
            return {
              loja_id: lojaId,
              item_os_id: produto.id,
              fornecedor_id: produto.fornecedor_terceirizado_id,
              status:
                Number(produto.terceirizacao_custo_total ?? 0) > 0
                  ? StatusOrdemTerceirizacao.COTADO
                  : StatusOrdemTerceirizacao.A_COTAR,
              custo_unitario: produto.terceirizacao_custo_unitario ?? null,
              custo_setup: produto.terceirizacao_custo_setup ?? null,
              custo_frete: produto.terceirizacao_custo_frete ?? null,
              custo_total: produto.terceirizacao_custo_total ?? null,
              prazo_dias: prazoDias,
              data_prevista: dataPrevista,
              observacoes: produto.terceirizacao_observacoes ?? null,
            };
          });
        const snapshotsAuditoria = itensOS
          .map((item) => ({
            item_os_id: item.id,
            produto_servico: item.produto_servico,
            snapshot: item._snapshot_personalizacao_auditoria,
          }))
          .filter((entry) => entry.snapshot != null);

        const dadosItens = itensOS.map((item) => {
          const { _snapshot_personalizacao_auditoria: _omit, ...dadosItem } =
            item;
          return {
            ...dadosItem,
            os_id: os.id,
          };
        });

        await this.prisma.$transaction(async (tx) => {
          await tx.itemOS.createMany({
            data: dadosItens,
            skipDuplicates: true,
          });

          if (ordensTerceirizacao.length > 0) {
            await tx.ordemTerceirizacao.createMany({
              data: ordensTerceirizacao,
              skipDuplicates: true,
            });
          }

          if (snapshotsAuditoria.length > 0) {
            await tx.ordemServicoLog.create({
              data: {
                os_id: os.id,
                tipo_acao: 'PERSONALIZACAO_MIGRADA_ORCAMENTO',
                descricao:
                  `Snapshots imutáveis de personalização migrados do orçamento ` +
                  `${orcamentoCompleto.id} (${snapshotsAuditoria.length} item(ns)).`,
                usuario_id: usuarioId ?? null,
                dados_extras: JSON.stringify({
                  orcamento_id: orcamentoCompleto.id,
                  orcamento_numero: orcamentoCompleto.numero,
                  loja_id: lojaId,
                  imutavel: true,
                  itens: snapshotsAuditoria,
                }),
              },
            });
          }
        });

        for (const item of dadosItens) {
          if (
            (item.modo_fulfillment === ModoFulfillmentItem.MAKE ||
              item.modo_fulfillment === ModoFulfillmentItem.HIBRIDO) &&
            item.valores_personalizacao
          ) {
            this.arteProducaoService.agendarGeracaoItemOS(
              item.id,
              lojaId,
              usuarioId,
            );
          }
        }
      }

      this.logger.log(
        `[OK] OS #${os.numero} criada automaticamente do orçamento com ${materiaisOrcamento.length} materiais`,
      );
      return await this.findOne(os.id, lojaId);
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
    produto: any,
  ): {
    quantidade: number;
    unidade: string;
    display: string;
    [key: string]: any;
  } {
    const {
      logica_consumo,
      parametros_consumo,
      quantidade_necessaria,
      unidade,
      nome,
    } = insumoCalculado;
    const quantidadeProdutos = parseFloat(produto.quantidade || '1');

    // Lógica específica para bobinas (área em m² + unidades físicas)
    if (
      nome?.toLowerCase().includes('bobina') &&
      nome?.toLowerCase().includes('lona')
    ) {
      // Para bobinas, calcular área em m² e unidades físicas necessárias

      // Extrair dimensões da bobina do nome (ex: 1,40x50m)
      let areaPorBobina = 70; // Default 70m²
      const match = nome.match(/(\d+[,.]?\d*)\s*[x×]\s*(\d+[,.]?\d*)\s*m/i);
      if (match) {
        const largura = parseFloat(match[1].replace(',', '.'));
        const altura = parseFloat(match[2].replace(',', '.'));
        areaPorBobina = largura * altura;
      }

      // Calcular quantas bobinas são necessárias
      const bobinasNecessarias = Math.ceil(
        quantidade_necessaria / areaPorBobina,
      );

      // Retornar informações completas para validação de estoque
      return {
        quantidade: bobinasNecessarias,
        unidade: 'UNID',
        display: `${quantidade_necessaria} M2 - ${bobinasNecessarias} UNID - BOBINA`,
        // Informações adicionais para validação
        bobinas_necessarias: bobinasNecessarias,
        area_por_bobina: areaPorBobina,
        area_total: quantidade_necessaria,
      };
    }

    // Lógica específica para madeira (unidades físicas)
    if (
      nome?.toLowerCase().includes('madeira') ||
      nome?.toLowerCase().includes('cabo')
    ) {
      // Para madeira, calcular unidades físicas necessárias
      // REGRA: Cada banner precisa de uma unidade completa de madeira
      // Se a sobra não é suficiente para outro banner, não considerar otimização

      const cmPorBanner = 100; // 100cm por banner
      const cmDisponivel = 105; // Madeira de 105cm (ou 104cm)
      const sobra = cmDisponivel - cmPorBanner; // 4-5cm de sobra

      // Se a sobra é menor que o tamanho do banner, não pode ser aproveitada
      if (sobra < cmPorBanner) {
        // Cada banner precisa de uma unidade completa
        const unidadesNecessarias = quantidadeProdutos;
        return {
          quantidade: unidadesNecessarias,
          unidade: 'UNID',
          display: `${unidadesNecessarias} UNID`,
        };
      } else {
        // Se a sobra é suficiente para outro banner, pode otimizar
        const unidadesNecessarias = Math.ceil(
          (cmPorBanner * quantidadeProdutos) / cmDisponivel,
        );
        return {
          quantidade: unidadesNecessarias,
          unidade: 'UNID',
          display: `${unidadesNecessarias} UNID`,
        };
      }
    }

    // Lógica específica para cordão (unidades físicas de tubos)
    if (
      nome?.toLowerCase().includes('cordao') ||
      nome?.toLowerCase().includes('cordão')
    ) {
      // Para cordão, calcular unidades físicas de tubos necessárias
      // Cordão vem em tubos (ex: 205m por tubo)

      // Extrair metros por tubo do nome do produto
      let metrosPorTubo = 205; // Default
      const match =
        nome.match(/(\d+)\s*m\s+branco/i) || nome.match(/(\d+)\s*m\s*$/i); // Procura por "205 M Branco" ou "205 M" no final
      if (match) {
        metrosPorTubo = parseInt(match[1]);
      }

      // Calcular metros necessários (ex: 12m por banner)
      const metrosPorBanner = 12; // Assumindo 12m por banner
      const metrosTotaisNecessarios = metrosPorBanner * quantidadeProdutos;

      // Calcular quantos tubos são necessários
      const tubosNecessarios = Math.ceil(
        metrosTotaisNecessarios / metrosPorTubo,
      );

      // Retornar informações completas para validação de estoque
      return {
        quantidade: tubosNecessarios,
        unidade: 'UNID',
        display: `${metrosTotaisNecessarios}M - ${tubosNecessarios} UNID - ROLO`,
        // Informações adicionais para validação
        metros_necessarios: metrosTotaisNecessarios,
        metros_por_tubo: metrosPorTubo,
        metros_por_banner: metrosPorBanner,
      };
    }

    // Lógica específica para ponteiras (unidades)
    if (nome?.toLowerCase().includes('ponteira')) {
      // Para ponteiras, calcular unidades necessárias
      // Exemplo: 2 ponteiras por banner
      const ponteirasPorBanner = 2;
      const unidadesNecessarias = ponteirasPorBanner * quantidadeProdutos;

      return {
        quantidade: unidadesNecessarias,
        unidade: 'UNID',
        display: `${unidadesNecessarias} UNID`,
      };
    }

    // Lógica específica para ilhos (unidades) - IGUAL AO PREVIEW V2
    if (nome?.toLowerCase().includes('ilho')) {
      // Usar a mesma lógica do preview V2: cálculo por perímetro e espaçamento
      const larguraProduto = parseFloat(produto.largura?.toString() || '0');
      const alturaProduto = parseFloat(produto.altura?.toString() || '0');

      if (larguraProduto > 0 && alturaProduto > 0) {
        // Cálculo igual ao preview V2
        const perimetro = 2 * (larguraProduto + alturaProduto);
        const espacamento = 15; // cm entre ilhós (mesmo do preview V2)
        const quantidadeUnitaria = Math.ceil(perimetro / espacamento);
        const unidadesNecessarias = quantidadeUnitaria * quantidadeProdutos;

        return {
          quantidade: unidadesNecessarias,
          unidade: 'UNID',
          display: `${unidadesNecessarias} UNID`,
          perimetro: perimetro,
          espacamento: espacamento,
          quantidade_unitaria: quantidadeUnitaria,
        };
      } else {
        // CORREÇÃO: Usar quantidade original do orçamento se disponível
        // Isso garante que a OS use o mesmo cálculo do preview V2
        if (
          quantidade_necessaria > 0 &&
          quantidade_necessaria !== 4 * quantidadeProdutos
        ) {
          // Se a quantidade original não é 4×produtos, usar ela (vem do preview V2)
          return {
            quantidade: quantidade_necessaria,
            unidade: 'UNID',
            display: `${quantidade_necessaria} UNID`,
            origem: 'preview_v2',
          };
        } else {
          // Fallback: 4 ilhós por banner (lógica antiga)
          const ilhosPorBanner = 4;
          const unidadesNecessarias = ilhosPorBanner * quantidadeProdutos;

          return {
            quantidade: unidadesNecessarias,
            unidade: 'UNID',
            display: `${unidadesNecessarias} UNID`,
          };
        }
      }
    }

    // Lógica genérica baseada na lógica de consumo
    if (logica_consumo === 'area') {
      return {
        quantidade: quantidade_necessaria,
        unidade: 'M2',
        display: `${quantidade_necessaria} M2`,
      };
    }

    if (logica_consumo === 'linear' || logica_consumo === 'quantidade_fixa') {
      return {
        quantidade: quantidade_necessaria,
        unidade: 'UNID',
        display: `${quantidade_necessaria} UNID`,
      };
    }

    // Fallback: retorna quantidade original
    return {
      quantidade: quantidade_necessaria,
      unidade,
      display: `${quantidade_necessaria} ${unidade}`,
    };
  }

  /**
   * Extrai materiais exatos do orçamento para garantir consistência na OS
   */
  private extrairMateriaisDoProdutoOrcamento(
    orcamento: any,
    produto: any,
  ): InsumoCalculado[] {
    if (!produto?.insumos || !Array.isArray(produto.insumos)) {
      return [];
    }

    return produto.insumos
      .filter((itemInsumo: any) => itemInsumo.insumo)
      .map((itemInsumo: any) => ({
        insumo_id: itemInsumo.insumo.id,
        nome: itemInsumo.insumo.nome,
        quantidade_necessaria: parseFloat(itemInsumo.quantidade || '0'),
        unidade: itemInsumo.unidade || itemInsumo.insumo.unidade_uso || 'un',
        display: `${parseFloat(itemInsumo.quantidade || '0')} ${
          itemInsumo.unidade || itemInsumo.insumo.unidade_uso || 'un'
        }`,
        custo_unitario: parseFloat(itemInsumo.custo_unitario || '0'),
        custo_total: parseFloat(itemInsumo.custo_total || '0'),
        produto_nome:
          produto.nome || produto.nome_servico || 'Produto sem nome',
        logica_consumo: itemInsumo.insumo.logica_consumo || 'area',
        parametros_consumo: itemInsumo.insumo.parametros_consumo
          ? this.parseJsonObject(
              itemInsumo.insumo.parametros_consumo,
              'parametros_consumo',
            )
          : null,
        calculo_chapa: itemInsumo.calculo_chapa
          ? this.parseJsonObject(itemInsumo.calculo_chapa, 'calculo_chapa')
          : null,
        origem: 'orcamento' as const,
        orcamento_id: orcamento.id,
        data_calculo: orcamento.data_ultimo_calculo || orcamento.criado_em,
        disponivel_estoque: true,
        quantidade_disponivel: parseFloat(itemInsumo.quantidade || '0'),
        localizacao_estoque: undefined,
      }));
  }

  private extrairMateriaisDoOrcamento(orcamento: any): InsumoCalculado[] {
    const materiais: InsumoCalculado[] = [];

    if (!orcamento.produtos || !Array.isArray(orcamento.produtos)) {
      this.logger.warn('Orçamento sem produtos válidos');
      return materiais;
    }

    orcamento.produtos.forEach((produto) => {
      if (!produto.insumos || !Array.isArray(produto.insumos)) {
        this.logger.warn(`Produto ${produto.nome} sem insumos válidos`);
        return;
      }

      produto.insumos.forEach((itemInsumo) => {
        if (!itemInsumo.insumo) {
          this.logger.warn(`ItemInsumo ${itemInsumo.id} sem insumo associado`);
          return;
        }

        // Usar dados exatos do orçamento
        // Aplicar lógica inteligente para calcular display
        const quantidade_base = parseFloat(itemInsumo.quantidade || '0');
        const unidade =
          itemInsumo.unidade || itemInsumo.insumo.unidade_uso || 'un';
        const quantidadeProdutos = parseFloat(produto.quantidade || '1');
        const nome = itemInsumo.insumo.nome;

        // Verificar se precisa multiplicar pela quantidade do produto
        // IMPORTANTE: Para materiais calculados por área, a quantidade no orçamento
        // já representa o TOTAL de m² necessários, não por unidade
        const logica_consumo = itemInsumo.insumo.logica_consumo || 'area';
        const unidade_uso = itemInsumo.insumo.unidade_uso?.toLowerCase() || '';

        // Determinar se precisa multiplicar pela quantidade do produto
        // Para materiais por m², a quantidade já é o total, NÃO multiplicar
        // Para materiais por unidade (bobina, rolo), pode precisar multiplicar
        const precisaMultiplicar =
          (unidade_uso.includes('un') || unidade_uso.includes('unidade')) &&
          !unidade_uso.includes('m2') &&
          !unidade_uso.includes('m²') &&
          logica_consumo !== 'area';

        // Calcular quantidade necessária total
        const quantidade_necessaria = precisaMultiplicar
          ? quantidade_base * quantidadeProdutos
          : quantidade_base;

        this.logger.debug(`Calculando quantidade para ${nome}:`, {
          quantidade_base,
          quantidadeProdutos,
          precisaMultiplicar,
          quantidade_necessaria,
          logica_consumo,
          unidade_uso,
        });

        // Calcular display baseado no tipo de material
        let display = `${quantidade_necessaria} ${unidade}`;
        if (
          nome?.toLowerCase().includes('bobina') &&
          nome?.toLowerCase().includes('lona')
        ) {
          // Para bobinas, mostrar área + unidades físicas
          let areaPorBobina = 70; // Default
          const match = nome.match(/(\d+[,.]?\d*)\s*[x×]\s*(\d+[,.]?\d*)\s*m/i);
          if (match) {
            const largura = parseFloat(match[1].replace(',', '.'));
            const altura = parseFloat(match[2].replace(',', '.'));
            areaPorBobina = largura * altura;
          }
          const bobinasNecessarias = Math.ceil(
            quantidade_necessaria / areaPorBobina,
          );
          display = `${quantidade_necessaria} M2 - ${bobinasNecessarias} UNID - BOBINA`;
        } else if (
          nome?.toLowerCase().includes('cordao') ||
          nome?.toLowerCase().includes('cordão')
        ) {
          // Para cordão, mostrar metros + unidades físicas
          let metrosPorTubo = 205;
          const match =
            nome.match(/(\d+)\s*m\s+branco/i) || nome.match(/(\d+)\s*m\s*$/i);
          if (match) {
            metrosPorTubo = parseInt(match[1]);
          }
          const metrosPorBanner = 12;
          const metrosTotaisNecessarios = metrosPorBanner * quantidadeProdutos;
          const tubosNecessarios = Math.ceil(
            metrosTotaisNecessarios / metrosPorTubo,
          );
          display = `${metrosTotaisNecessarios}M - ${tubosNecessarios} UNID - ROLO`;
        }

        materiais.push({
          insumo_id: itemInsumo.insumo.id,
          nome: itemInsumo.insumo.nome,
          quantidade_necessaria: quantidade_necessaria,
          unidade: itemInsumo.unidade || itemInsumo.insumo.unidade_uso || 'un',
          display: display,
          custo_unitario: parseFloat(itemInsumo.custo_unitario || '0'),
          custo_total: parseFloat(itemInsumo.custo_total || '0'),
          produto_nome: produto.nome || 'Produto sem nome',
          logica_consumo: itemInsumo.insumo.logica_consumo || 'area',
          parametros_consumo: itemInsumo.insumo.parametros_consumo
            ? typeof itemInsumo.insumo.parametros_consumo === 'string'
              ? JSON.parse(itemInsumo.insumo.parametros_consumo)
              : itemInsumo.insumo.parametros_consumo
            : null,
          calculo_chapa: itemInsumo.calculo_chapa
            ? this.parseJsonObject(itemInsumo.calculo_chapa, 'calculo_chapa')
            : null,
          origem: 'orcamento',
          orcamento_id: orcamento.id,
          data_calculo: orcamento.data_ultimo_calculo || orcamento.criado_em,
          disponivel_estoque: true, // TODO: Implementar validação real de estoque
          quantidade_disponivel: quantidade_necessaria,
          localizacao_estoque: 'A1-B2', // TODO: Implementar localização real
        });
      });
    });

    this.logger.log(
      `Extraídos ${materiais.length} materiais do orçamento ${orcamento.id}`,
    );
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
                    include: { insumo: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!os) {
        throw new Error(`OS ${osId} não encontrada`);
      }

      if (!os.orcamento_id || !os.orcamento) {
        return {
          sincronizada: true,
          diferencas: [],
          alertas: [
            'OS sem orçamento vinculado - não há sincronização necessária',
          ],
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
        this.logger.warn(
          `Erro ao processar insumos_calculados da OS ${osId}:`,
          error,
        );
        return {
          sincronizada: false,
          diferencas: [],
          alertas: ['Erro ao processar materiais da OS'],
        };
      }

      // Extrair materiais do orçamento
      const materiaisOrcamento = this.extrairMateriaisDoOrcamento(os.orcamento);

      // Comparar materiais
      const diferencas = [];
      const alertas = [];

      // Verificar se todos os materiais da OS existem no orçamento
      for (const materialOS of materiaisOS) {
        const materialOrcamento = materiaisOrcamento.find(
          (m) =>
            m.insumo_id === materialOS.insumo_id &&
            m.produto_nome === materialOS.produto_nome,
        );

        if (!materialOrcamento) {
          diferencas.push({
            tipo: 'material_nao_encontrado',
            insumo_id: materialOS.insumo_id,
            produto_nome: materialOS.produto_nome,
            mensagem: 'Material da OS não encontrado no orçamento',
          });
          continue;
        }

        // Comparar quantidades
        if (
          materialOS.quantidade_necessaria !==
          materialOrcamento.quantidade_necessaria
        ) {
          diferencas.push({
            tipo: 'quantidade_diferente',
            insumo_id: materialOS.insumo_id,
            produto_nome: materialOS.produto_nome,
            quantidade_os: materialOS.quantidade_necessaria,
            quantidade_orcamento: materialOrcamento.quantidade_necessaria,
            diferenca:
              materialOS.quantidade_necessaria -
              materialOrcamento.quantidade_necessaria,
          });
        }

        // Comparar custos
        if (
          Math.abs(
            materialOS.custo_unitario - materialOrcamento.custo_unitario,
          ) > 0.01
        ) {
          diferencas.push({
            tipo: 'custo_diferente',
            insumo_id: materialOS.insumo_id,
            produto_nome: materialOS.produto_nome,
            custo_os: materialOS.custo_unitario,
            custo_orcamento: materialOrcamento.custo_unitario,
            diferenca:
              materialOS.custo_unitario - materialOrcamento.custo_unitario,
          });
        }
      }

      // Verificar se todos os materiais do orçamento existem na OS
      for (const materialOrcamento of materiaisOrcamento) {
        const materialOS = materiaisOS.find(
          (m) =>
            m.insumo_id === materialOrcamento.insumo_id &&
            m.produto_nome === materialOrcamento.produto_nome,
        );

        if (!materialOS) {
          diferencas.push({
            tipo: 'material_faltando',
            insumo_id: materialOrcamento.insumo_id,
            produto_nome: materialOrcamento.produto_nome,
            mensagem: 'Material do orçamento não encontrado na OS',
          });
        }
      }

      // Gerar alertas baseados nas diferenças
      if (diferencas.length > 0) {
        alertas.push(
          `Encontradas ${diferencas.length} diferenças entre OS e orçamento`,
        );

        const tiposDiferentes = [...new Set(diferencas.map((d) => d.tipo))];
        tiposDiferentes.forEach((tipo) => {
          const count = diferencas.filter((d) => d.tipo === tipo).length;
          alertas.push(`${count} ${tipo.replace('_', ' ')}`);
        });
      }

      const sincronizada = diferencas.length === 0;

      this.logger.log(
        `Validação de sincronização OS ${osId}: ${sincronizada ? 'SINCRONIZADA' : 'DESINCRONIZADA'} (${diferencas.length} diferenças)`,
      );

      return {
        sincronizada,
        diferencas,
        alertas,
      };
    } catch (error) {
      this.logger.error(`Erro ao validar sincronização OS ${osId}:`, error);
      throw error;
    }
  }

  /**
   * Sincroniza OS com o orçamento (re-extrai materiais exatos)
   */
  async sincronizarComOrcamento(
    osId: string,
    lojaId: string,
  ): Promise<{
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
          loja_id: lojaId,
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
                          tipoMaterial: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
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
      const materiaisAtualizados = this.extrairMateriaisDoOrcamento(
        os.orcamento,
      );

      // Atualizar OS com materiais exatos do orçamento
      await this.prisma.ordemServico.update({
        where: { id: osId },
        data: {
          insumos_calculados: JSON.stringify(materiaisAtualizados),
          atualizado_em: new Date(),
        },
      });

      // Validar sincronização após a atualização
      const validacaoPos = await this.validarSincronizacaoOSOrcamento(osId);

      this.logger.log(
        `Sincronização concluída: OS ${osId} atualizada com ${materiaisAtualizados.length} materiais`,
      );

      return {
        sucesso: true,
        materiais: materiaisAtualizados,
        diferencas: validacaoPos.diferencas,
        alertas: [
          `OS sincronizada com orçamento ${os.orcamento_id}`,
          `Atualizados ${materiaisAtualizados.length} materiais`,
          ...validacaoPos.alertas,
        ],
      };
    } catch (error) {
      this.logger.error(`Erro ao sincronizar OS ${osId}:`, error);
      throw error;
    }
  }

  // ===== HEALTH CHECK =====

  private async carregarTipoItemOrcamentoPorIds(
    itemIds: string[],
  ): Promise<Map<string, string>> {
    if (itemIds.length === 0) {
      return new Map();
    }
    const rows = await this.prisma.produtoOrcamento.findMany({
      where: { id: { in: itemIds } },
      select: { id: true, tipo_item: true },
    });
    return new Map(rows.map((row) => [row.id, row.tipo_item]));
  }

  async liberarFinanceiro(
    osId: string,
    lojaId: string,
    usuarioId: string,
  ): Promise<void> {
    try {
      this.logger.log(`Liberando OS ${osId} financeiramente pelo usuário ${usuarioId}`);

      const os = await this.prisma.ordemServico.findFirst({
        where: { id: osId, loja_id: lojaId },
      });

      if (!os) {
        throw new NotFoundException(`Ordem de Serviço ${osId} não encontrada.`);
      }

      if (os.status !== StatusOS.AGUARDANDO_APROVACAO_FINANCEIRA) {
        throw new BadRequestException(
          `Ordem de Serviço não está aguardando liberação financeira (status atual: ${os.status}).`,
        );
      }

      await this.prisma.ordemServico.update({
        where: { id: osId },
        data: {
          status: StatusOS.AGUARDANDO_APROVACAO_TECNICA,
          atualizado_em: new Date(),
        },
      });

      await this.adicionarMovimentacao(
        osId,
        TipoMovimentacaoOS.APROVACAO_ORCAMENTARIA,
        StatusOS.AGUARDANDO_APROVACAO_FINANCEIRA,
        StatusOS.AGUARDANDO_APROVACAO_TECNICA,
        usuarioId,
        'Ordem de Serviço liberada manualmente para produção pelo financeiro.',
      );

      if (os.orcamento_id) {
        await this.pcpBloqueioSinalService.desbloquearItensPorOrcamento(
          lojaId,
          os.orcamento_id,
        );
      }
    } catch (error) {
      this.logger.error(`Erro ao liberar OS ${osId} financeiramente:`, error);
      throw error;
    }
  }

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
