import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AssignWorkflowDto } from '../dto/workflow-assignment.dto';
import { StatusOS } from '../../os/interfaces/os.interfaces';

export interface WorkflowSuggestion {
  workflowId: string;
  categoriaId?: string;
  score: number;
  motivos: string[];
}

interface WorkflowContexto {
  prioridade?: string;
  tags: Set<string>;
  palavrasChave: Set<string>;
  tiposMaterial: Set<string>;
  insumoIds: Set<string>;
}

type OrdemServicoComOrcamento = Prisma.OrdemServicoGetPayload<{
  include: {
    orcamento: {
      include: {
        produtos: {
          include: {
            insumos: {
              include: {
                insumo: {
                  include: {
                    tipoMaterial: true;
                  };
                };
              };
            };
          };
        };
      };
    };
    itens: {
      select: {
        id: true;
        produto_servico: true;
        status_liberacao_pcp: true;
        data_prazo_produto: true;
        quantidade: true;
      };
    };
  };
}>;

@Injectable()
export class WorkflowAssignmentService {
  private readonly logger = new Logger(WorkflowAssignmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Sugere o melhor workflow de acordo com as categorias inteligentes.
   */
  async sugerirWorkflow(
    osId: string,
    lojaId: string,
  ): Promise<WorkflowSuggestion | null> {
    const { os, contexto } = await this.carregarContextoOS(osId, lojaId);

    const categorias = await this.prisma.workflowCategoria.findMany({
      where: { loja_id: lojaId, ativo: true },
      include: { regras: true },
      orderBy: [{ prioridade: 'desc' }, { nome: 'asc' }],
    });

    if (!categorias.length) {
      this.logger.debug(
        `[sugerirWorkflow] Nenhuma categoria cadastrada para loja ${lojaId}`,
      );
      return null;
    }

    let melhor: WorkflowSuggestion | null = null;

    for (const categoria of categorias) {
      const { score, motivos, rejeitada } = this.avaliarCategoria(
        categoria,
        contexto,
        os,
      );

      if (!rejeitada && score >= 0) {
        if (!melhor || score > melhor.score) {
          melhor = {
            workflowId: categoria.workflow_id,
            categoriaId: categoria.id,
            score,
            motivos,
          };
        }
      }
    }

    return melhor;
  }

  /**
   * Atribui um workflow à OS. Utiliza detecção inteligente quando possível.
   */
  async atribuirWorkflow(
    lojaId: string,
    dto: AssignWorkflowDto,
  ): Promise<{
    workflowId: string;
    categoriaId?: string;
    instanciaId: string;
    mensagem: string;
  }> {
    const { os } = await this.carregarContextoOS(dto.osId, lojaId);

    // Verificar se já existe instância
    const instanciaExistente = await this.prisma.workflowInstancia.findUnique({
      where: { os_id: dto.osId },
      select: { id: true, workflow_id: true },
    });

    if (
      instanciaExistente &&
      dto.workflowId &&
      instanciaExistente.workflow_id !== dto.workflowId &&
      !dto.forcar
    ) {
      throw new BadRequestException(
        'A OS ja possui um workflow diferente. Ative \"forcar\" para reatribuir outro template.',
      );
    }

    let workflowId = dto.workflowId ?? instanciaExistente?.workflow_id;
    let categoriaId: string | undefined;

    if (!workflowId) {
      const sugestao = await this.sugerirWorkflow(dto.osId, lojaId);
      if (sugestao) {
        workflowId = sugestao.workflowId;
        categoriaId = sugestao.categoriaId;
        this.logger.log(
          `[atribuirWorkflow] Sugestão aplicada para OS ${dto.osId} -> workflow ${workflowId} (categoria ${categoriaId})`,
        );
      }
    }

    if (!workflowId) {
      throw new BadRequestException(
        'Nenhum workflow informado ou sugerido. Cadastre categorias inteligentes ou informe manualmente.',
      );
    }

    const workflow = await this.prisma.workflowOS.findUnique({
      where: { id: workflowId },
      include: { workflow_setores: { orderBy: { ordem: 'asc' } } },
    });

    if (!workflow) {
      throw new NotFoundException('Workflow informado não encontrado.');
    }

    const itensOS = os.itens ?? [];
    const itensLiberados = itensOS.filter(
      (item) =>
        (item.status_liberacao_pcp ?? '').toUpperCase() === 'LIBERADO',
    );

    let itensSelecionados: { id: string | null }[];

    if (dto.itemOsIds?.length) {
      const solicitados = new Set(dto.itemOsIds);
      const encontrados = itensOS.filter((item) => solicitados.has(item.id));

      if (encontrados.length !== solicitados.size) {
        throw new BadRequestException(
          'Alguns produtos informados nao pertencem a esta OS ou nao foram encontrados.',
        );
      }

      const naoLiberados = encontrados.filter(
        (item) =>
          (item.status_liberacao_pcp ?? '').toUpperCase() !== 'LIBERADO',
      );

      if (naoLiberados.length) {
        const nomes = naoLiberados.map((item) => item.produto_servico).join(', ');
        throw new BadRequestException(
          `Os seguintes produtos nao estao liberados para o PCP: ${nomes}`,
        );
      }

      itensSelecionados = encontrados.map((item) => ({ id: item.id }));
    } else if (itensLiberados.length) {
      itensSelecionados = itensLiberados.map((item) => ({ id: item.id }));
    } else if (!itensOS.length) {
      // Compatibilidade com OS que ainda não migraram produtos para itens_os
      itensSelecionados = [{ id: null }];
    } else {
      throw new BadRequestException(
        'Nenhum produto liberado para o PCP foi encontrado para esta OS.',
      );
    }

    if (instanciaExistente && !dto.forcar) {
      const resultado = await this.adicionarItensNaInstancia(
        instanciaExistente.id,
        workflow,
        itensSelecionados,
      );

      if (!resultado.novosItens.length) {
        return {
          workflowId,
          categoriaId,
          instanciaId: instanciaExistente.id,
          mensagem:
            resultado.ignorados.length > 0
              ? 'Os produtos selecionados ja possuem workflow ativo.'
              : 'Nenhum produto valido foi selecionado para receber o workflow.',
        };
      }

      if (os.status === StatusOS.LIBERADA_PARA_PCP) {
        await this.prisma.ordemServico.update({
          where: { id: dto.osId },
          data: {
            status: StatusOS.EM_WORKFLOW,
            atualizado_em: new Date(),
          },
        });
      }

      const mensagemBase =
        resultado.novosItens.length === 1
          ? 'Workflow vinculado a 1 novo produto.'
          : `Workflow vinculado a ${resultado.novosItens.length} novos produtos.`;

      const mensagemComplementar =
        resultado.ignorados.length > 0
          ? resultado.ignorados.length === 1
            ? ' 1 produto selecionado ja possuia workflow e foi ignorado.'
            : ` ${resultado.ignorados.length} produtos selecionados ja possuiam workflow e foram ignorados.`
          : '';

      const mensagemFinal = (mensagemBase + mensagemComplementar).trim();

      return {
        workflowId,
        categoriaId,
        instanciaId: instanciaExistente.id,
        mensagem: mensagemFinal,
      };
    }

    const instancia = await this.criarInstanciaWorkflow(
      this.prisma,
      dto.osId,
      workflow,
      dto.usuarioId,
      dto.forcar ?? false,
      itensSelecionados,
    );

    if (os.status === StatusOS.LIBERADA_PARA_PCP) {
      await this.prisma.ordemServico.update({
        where: { id: dto.osId },
        data: {
          status: StatusOS.EM_WORKFLOW,
          atualizado_em: new Date(),
        },
      });
    }

    return {
      workflowId,
      categoriaId,
      instanciaId: instancia.id,
      mensagem: categoriaId
        ? 'Workflow atribu??do com base em categoria inteligente.'
        : 'Workflow atribu??do manualmente.',
    };
  }

  private async carregarContextoOS(osId: string, lojaId: string) {
      const os = await this.prisma.ordemServico.findFirst({
        where: { id: osId, loja_id: lojaId },
        include: {
          orcamento: {
            include: {
            produtos: {
              include: {
                insumos: {
                  include: {
                    insumo: {
                      include: {
                        tipoMaterial: true,
                      },
                    },
                  },
                },
              },
              },
            },
          },
          itens: {
            select: {
              id: true,
              produto_servico: true,
              status_liberacao_pcp: true,
              data_prazo_produto: true,
              quantidade: true,
            },
          },
        },
      });

    if (!os) {
      throw new NotFoundException('Ordem de Serviço não encontrada.');
    }

    const contexto = this.extrairContexto(os as OrdemServicoComOrcamento);
    return { os: os as OrdemServicoComOrcamento, contexto };
  }

  private extrairContexto(os: OrdemServicoComOrcamento): WorkflowContexto {
    const tiposMaterial = new Set<string>();
    const insumoIds = new Set<string>();
    const tags = new Set<string>();
    const palavrasChave = new Set<string>();

    // Tags do orcamento (string separada por vírgula ou JSON)
    if (os.orcamento?.tags) {
      try {
        const parsed = JSON.parse(os.orcamento.tags);
        if (Array.isArray(parsed)) {
          parsed.forEach((tag) =>
            tags.add(String(tag).trim().toLowerCase()),
          );
        }
      } catch {
        os.orcamento.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean)
          .forEach((tag) => tags.add(tag.toLowerCase()));
      }
    }

    if (os.nome_servico) {
      os.nome_servico
        .split(/\s+/)
        .map((palavra) => palavra.trim().toLowerCase())
        .forEach((palavra) => palavrasChave.add(palavra));
    }

    if (os.descricao) {
      os.descricao
        .split(/\s+/)
        .map((palavra) => palavra.trim().toLowerCase())
        .forEach((palavra) => palavrasChave.add(palavra));
    }

    const insumosCalculados = this.parseJSONSafe(os.insumos_calculados);
    if (Array.isArray(insumosCalculados)) {
      insumosCalculados.forEach((insumo: any) => {
        if (insumo.tipo_material) {
          tiposMaterial.add(String(insumo.tipo_material).toLowerCase());
        }
        if (insumo.tipoMaterialNome) {
          tiposMaterial.add(String(insumo.tipoMaterialNome).toLowerCase());
        }
        if (insumo.insumo_id) {
          insumoIds.add(String(insumo.insumo_id));
        }
      });
    }

    // Produtos do orçamento (quando disponíveis)
    const produtos = os.orcamento?.produtos ?? [];
    produtos.forEach((produto) => {
      if (produto.nome_servico) {
        produto.nome_servico
          .split(/\s+/)
          .map((palavra: string) => palavra.trim().toLowerCase())
          .forEach((palavra: string) => palavrasChave.add(palavra));
      }

      if (Array.isArray(produto.insumos)) {
        produto.insumos.forEach((material) => {
          if (material.insumo?.tipoMaterial?.nome) {
            tiposMaterial.add(
              String(material.insumo.tipoMaterial.nome).toLowerCase(),
            );
          }
          if (material.insumo?.tipoMaterialId) {
            tiposMaterial.add(String(material.insumo.tipoMaterialId));
          }
          if (material.insumo_id) {
            insumoIds.add(String(material.insumo_id));
          }
        });
      }
    });

    return {
      prioridade: os.prioridade || os.orcamento?.prioridade || undefined,
      tags,
      palavrasChave,
      tiposMaterial,
      insumoIds,
    };
  }

  private avaliarCategoria(
    categoria: Prisma.WorkflowCategoriaGetPayload<{
      include: { regras: true };
    }>,
    contexto: WorkflowContexto,
    os: Prisma.OrdemServicoGetPayload<any>,
  ): { score: number; motivos: string[]; rejeitada: boolean } {
    if (!categoria.regras.length) {
      return {
        score: categoria.prioridade,
        motivos: ['Categoria sem regras (aplicação direta)'],
        rejeitada: false,
      };
    }

    let score = categoria.prioridade;
    const motivos: string[] = [];

    for (const regra of categoria.regras) {
      const corresponde = this.avaliarRegra(regra, contexto, os);

      if (!corresponde && regra.obrigatoria) {
        return { score: -1, motivos: [], rejeitada: true };
      }

      if (corresponde) {
        score += Math.max(regra.prioridade, 1);
        motivos.push(`Regra ${regra.tipo} satisfeita (${regra.valor})`);
      } else {
        motivos.push(`Regra ${regra.tipo} não satisfeita (${regra.valor})`);
      }
    }

    return { score, motivos, rejeitada: false };
  }

  private avaliarRegra(
    regra: Prisma.WorkflowCategoriaRegraGetPayload<{}>,
    contexto: WorkflowContexto,
    os: Prisma.OrdemServicoGetPayload<any>,
  ): boolean {
    const valorComparacao = regra.valor.toLowerCase();

    switch (regra.tipo.toUpperCase()) {
      case 'TIPO_MATERIAL':
        return contexto.tiposMaterial.has(valorComparacao);

      case 'INSUMO_ID':
        return contexto.insumoIds.has(regra.valor);

      case 'TAG_OS':
        return contexto.tags.has(valorComparacao);

      case 'PALAVRA_CHAVE':
        return contexto.palavrasChave.has(valorComparacao);

      case 'PRIORIDADE_OS':
        return (
          contexto.prioridade?.toLowerCase() === valorComparacao ||
          os.prioridade?.toLowerCase() === valorComparacao
        );

      default:
        this.logger.debug(
          `[avaliarRegra] Tipo de regra desconhecido: ${regra.tipo}`,
        );
        return false;
    }
  }

  private async criarInstanciaWorkflow(
    prisma: PrismaClient,
    osId: string,
    workflow: Prisma.WorkflowOSGetPayload<{
      include: { workflow_setores: { orderBy: { ordem: 'asc' } } };
    }>,
    usuarioId?: string,
    forcar?: boolean,
    itens?: { id: string | null }[],
  ) {
    return prisma.$transaction(async (tx) => {
      if (forcar) {
        await tx.workflowInstanciaSetor.deleteMany({
          where: { workflow_instancia: { os_id: osId } },
        });
        await tx.workflowInstancia.deleteMany({ where: { os_id: osId } });
      }

      const setoresOrdenados =
        (workflow.workflow_setores ?? []).slice().sort((a, b) => {
          const aOrdem = a.ordem ?? 0;
          const bOrdem = b.ordem ?? 0;
          return aOrdem - bOrdem;
        });
      const menorOrdem =
        setoresOrdenados.length > 0
          ? setoresOrdenados[0].ordem ?? 0
          : 0;
      const primeiroSetorPendende = setoresOrdenados.find(
        (setor) => (setor.ordem ?? 0) === menorOrdem,
      );

      const instancia = await tx.workflowInstancia.create({
        data: {
          os_id: osId,
          workflow_id: workflow.id,
          status: 'ATIVO',
          etapa_atual: primeiroSetorPendende?.setor_id ?? null,
          data_inicio: new Date(),
          criado_em: new Date(),
          atualizado_em: new Date(),
        },
      });

      if (setoresOrdenados.length) {
        const itensParaInstanciar: { id: string | null }[] =
          itens && itens.length ? itens : [{ id: null }];
        const registros: Prisma.WorkflowInstanciaSetorCreateManyInput[] = [];

        setoresOrdenados.forEach((setor, index) => {
          const ordem = setor.ordem ?? index;
          const statusInicial =
            ordem === menorOrdem ? 'PENDENTE' : 'AGUARDANDO';

          itensParaInstanciar.forEach((item) => {
            registros.push({
              workflow_instancia_id: instancia.id,
              setor_id: setor.setor_id,
              item_os_id: item.id,
              status: statusInicial,
              ordem,
              tempo_estimado: setor.tempo_estimado ?? null,
              criado_em: new Date(),
              atualizado_em: new Date(),
            });
          });
        });

        if (registros.length) {
          await tx.workflowInstanciaSetor.createMany({
            data: registros,
          });
        }
      }

      return instancia;
    });
  }

  private async adicionarItensNaInstancia(
    instanciaId: string,
    workflow: Prisma.WorkflowOSGetPayload<{
      include: { workflow_setores: { orderBy: { ordem: 'asc' } } };
    }>,
    itens: { id: string | null }[],
  ): Promise<{
    novosItens: string[];
    ignorados: string[];
  }> {
    const idsValidos = Array.from(
      new Set(
        itens
          .map((item) => item.id)
          .filter((id): id is string => Boolean(id)),
      ),
    );

    if (!idsValidos.length) {
      return { novosItens: [], ignorados: [] };
    }

    const possuiEscopoGeral = await this.prisma.workflowInstanciaSetor.findFirst({
      where: {
        workflow_instancia_id: instanciaId,
        item_os_id: null,
      },
      select: { id: true },
    });

    if (possuiEscopoGeral) {
      return { novosItens: [], ignorados: idsValidos };
    }

    const registrosExistentes = await this.prisma.workflowInstanciaSetor.findMany({
      where: {
        workflow_instancia_id: instanciaId,
        item_os_id: { in: idsValidos },
      },
      select: { item_os_id: true },
    });

    const jaAssociados = new Set(
      registrosExistentes
        .map((registro) => registro.item_os_id)
        .filter((id): id is string => Boolean(id)),
    );

    const novosItens = idsValidos.filter((id) => !jaAssociados.has(id));
    const ignorados = idsValidos.filter((id) => jaAssociados.has(id));

    const setoresOrdenados =
      (workflow.workflow_setores ?? []).slice().sort((a, b) => {
        const aOrdem = a.ordem ?? 0;
        const bOrdem = b.ordem ?? 0;
        return aOrdem - bOrdem;
      });

    if (!novosItens.length || !setoresOrdenados.length) {
      return { novosItens: [], ignorados: idsValidos };
    }

    const menorOrdem =
      setoresOrdenados.length > 0 ? setoresOrdenados[0].ordem ?? 0 : 0;

    const primeiroSetorPendende = setoresOrdenados.find(
      (setor) => (setor.ordem ?? 0) === menorOrdem,
    );

    const agora = new Date();

    const registros: Prisma.WorkflowInstanciaSetorCreateManyInput[] = [];

    setoresOrdenados.forEach((setor, index) => {
      const ordem = setor.ordem ?? index;
      const statusInicial =
        ordem === menorOrdem ? 'PENDENTE' : 'AGUARDANDO';

      novosItens.forEach((itemId) => {
        registros.push({
          workflow_instancia_id: instanciaId,
          setor_id: setor.setor_id,
          item_os_id: itemId,
          status: statusInicial,
          ordem,
          tempo_estimado: setor.tempo_estimado ?? null,
          criado_em: agora,
          atualizado_em: agora,
        });
      });
    });

    if (registros.length) {
      await this.prisma.workflowInstanciaSetor.createMany({
        data: registros,
      });
    }

    const instanciaAtual = await this.prisma.workflowInstancia.findUnique({
      where: { id: instanciaId },
      select: {
        status: true,
        etapa_atual: true,
        data_inicio: true,
      },
    });

    if (instanciaAtual) {
      const updateData: Prisma.WorkflowInstanciaUpdateInput = {
        atualizado_em: agora,
      };

      if (instanciaAtual.status !== 'ATIVO') {
        updateData.status = 'ATIVO';
      }

      if (!instanciaAtual.etapa_atual && primeiroSetorPendende?.setor_id) {
        updateData.etapa_atual = primeiroSetorPendende.setor_id;
      }

      if (!instanciaAtual.data_inicio) {
        updateData.data_inicio = agora;
      }

      await this.prisma.workflowInstancia.update({
        where: { id: instanciaId },
        data: updateData,
      });
    }

    return { novosItens, ignorados };
  }
  private parseJSONSafe(value: unknown) {
    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (error) {
        this.logger.warn(`[parseJSONSafe] Falha ao parsear JSON: ${error}`);
      }
    }

    return [];
  }
}









