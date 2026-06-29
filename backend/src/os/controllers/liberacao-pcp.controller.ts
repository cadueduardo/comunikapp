import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { OSService } from '../services/os.service';
import { WorkflowService } from '../../pcp/services/workflow.service';
import { PrismaService } from '../../prisma/prisma.service';
import { StatusOS } from '../interfaces/os.interfaces';

@ApiTags('Liberação OS para PCP')
@ApiBearerAuth()
@Controller('os')
@UseGuards(JwtAuthGuard)
export class LiberacaoPCPController {
  constructor(
    private readonly osService: OSService,
    private readonly workflowService: WorkflowService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('workflows-disponiveis')
  @ApiOperation({ summary: 'Listar workflows disponíveis para OSs' })
  @ApiResponse({
    status: 200,
    description: 'Lista de workflows disponíveis retornada com sucesso',
  })
  async listarWorkflowsDisponiveis(@Request() req: any) {
    const user = req['user'] || req.user;
    const lojaId = user.loja_id;

    try {
      // Buscar workflows ativos da loja
      const workflows = await this.prisma.workflowOS.findMany({
        where: {
          loja_id: lojaId,
          ativo: true,
        },
        select: {
          id: true,
          nome: true,
          descricao: true,
          etapas: true,
          sequencial: true,
          criado_em: true,
        },
        orderBy: {
          nome: 'asc',
        },
      });

      return {
        workflows: workflows.map((workflow) => ({
          id: workflow.id,
          nome: workflow.nome,
          descricao: workflow.descricao,
          etapas: JSON.parse(workflow.etapas),
          sequencial: workflow.sequencial,
          criado_em: workflow.criado_em,
        })),
      };
    } catch (error) {
      console.error('Erro ao buscar workflows disponíveis:', error);
      return { workflows: [] };
    }
  }

  @Get('liberadas-para-pcp')
  @ApiOperation({ summary: 'Listar OSs liberadas para PCP' })
  @ApiResponse({
    status: 200,
    description: 'Lista de OSs liberadas retornada com sucesso',
  })
  async listarOSsLiberadas(@Request() req: any) {
    const user = req['user'] || req.user;
    const lojaId = user.loja_id;

    const [ossLiberadas, ossParciais, ossEmWorkflow] = await Promise.all([
      this.osService.findByStatus(lojaId, StatusOS.LIBERADA_PARA_PCP),
      this.osService.findByStatus(lojaId, StatusOS.PARCIALMENTE_LIBERADA),
      this.osService.findByStatus(lojaId, StatusOS.EM_WORKFLOW),
    ]);

    const ossCandidatas = [...ossLiberadas, ...ossParciais, ...ossEmWorkflow];

    const ossComStatusWorkflow = await Promise.all(
      ossCandidatas.map(async (os) => {
        const produtosInfo = await this.contarProdutosLiberados(os.id);

        // A OS deve continuar aparecendo enquanto houver itens liberados para PCP,
        // independente de ter workflow atribuído ou não
        // Só remover se não houver NENHUM item liberado
        if (produtosInfo.produtos_liberados_count === 0) {
          return null;
        }

        let workflow: any = null;
        try {
          workflow = await this.workflowService.buscarPorOS(os.id);
        } catch (error) {
          workflow = null;
        }

        return {
          ...os,
          workflow_instanciado: !!workflow,
          workflow_status: workflow?.status || null,
          workflow_progresso: workflow ? this.calcularProgresso(workflow) : 0,
          produtos_liberados_count: produtosInfo.produtos_liberados_count,
          total_produtos: produtosInfo.total_produtos,
          liberacao_completa:
            produtosInfo.liberados_sem_workflow === 0 &&
            produtosInfo.total_produtos > 0,
          produtos_pendentes_workflow: produtosInfo.liberados_sem_workflow,
          itens_sem_workflow_ids: produtosInfo.itens_sem_workflow_ids,
        };
      }),
    );

    return ossComStatusWorkflow.filter((os): os is NonNullable<typeof os> =>
      Boolean(os),
    );
  }

  private async contarProdutosLiberados(osId: string): Promise<{
    produtos_liberados_count: number;
    total_produtos: number;
    liberados_com_workflow: number;
    liberados_sem_workflow: number;
    itens_liberados_ids: string[];
    itens_sem_workflow_ids: string[];
  }> {
    const os = await this.prisma.ordemServico.findUnique({
      where: { id: osId },
      include: { itens: true },
    });

    if (!os || !os.itens) {
      return {
        produtos_liberados_count: 0,
        total_produtos: 0,
        liberados_com_workflow: 0,
        liberados_sem_workflow: 0,
        itens_liberados_ids: [],
        itens_sem_workflow_ids: [],
      };
    }

    const total_produtos = os.itens.length;
    const itensLiberados = os.itens.filter(
      (item: any) =>
        (item.status_liberacao_pcp ?? '').toUpperCase() === 'LIBERADO',
    );
    const produtos_liberados_count = itensLiberados.length;

    const workflowEtapas = await this.prisma.workflowInstanciaSetor.findMany({
      where: {
        workflow_instancia: {
          os_id: osId,
        },
      },
      select: {
        item_os_id: true,
      },
    });

    const possuiEscopoGeral = workflowEtapas.some(
      (etapa) => etapa.item_os_id === null,
    );

    const itensComWorkflow = new Set(
      workflowEtapas
        .map((etapa) => etapa.item_os_id)
        .filter((id): id is string => Boolean(id)),
    );

    const itensLiberadosIds = itensLiberados.map((item: any) => item.id);
    const itensSemWorkflowIds = possuiEscopoGeral
      ? []
      : itensLiberadosIds.filter((id) => !itensComWorkflow.has(id));

    const liberadosComWorkflow = possuiEscopoGeral
      ? itensLiberadosIds.length
      : itensLiberadosIds.length - itensSemWorkflowIds.length;

    return {
      produtos_liberados_count,
      total_produtos,
      liberados_com_workflow: liberadosComWorkflow,
      liberados_sem_workflow: itensSemWorkflowIds.length,
      itens_liberados_ids: itensLiberadosIds,
      itens_sem_workflow_ids: itensSemWorkflowIds,
    };
  }
  @Post(':id/liberar-para-pcp')
  @ApiOperation({ summary: 'Liberar OS para PCP' })
  @ApiResponse({ status: 200, description: 'OS liberada para PCP com sucesso' })
  @ApiResponse({
    status: 400,
    description: 'OS não pode ser liberada para PCP',
  })
  @ApiResponse({ status: 404, description: 'OS não encontrada' })
  async liberarParaPCP(
    @Param('id') osId: string,
    @Body() body: { workflow_id: string },
    @Request() req: any,
  ) {
    const user = req['user'] || req.user;
    const lojaId = user.loja_id;

    // Verificar se OS existe e pertence à loja
    const os = await this.osService.findOne(osId, lojaId);
    if (!os) {
      throw new Error('Ordem de Serviço não encontrada');
    }

    // Verificar se OS está em status válido para liberação
    const statusValidosParaLiberacao = [
      StatusOS.APROVADA_TECNICA,
      StatusOS.APROVADA_ORCAMENTARIA,
      StatusOS.FILA,
    ];

    if (!statusValidosParaLiberacao.includes(os.status)) {
      throw new Error(
        `OS não pode ser liberada para PCP no status atual: ${os.status}`,
      );
    }

    // Atualizar status da OS para LIBERADA_PARA_PCP
    await this.osService.atualizarStatus(osId, {
      status: StatusOS.LIBERADA_PARA_PCP,
    });

    // Criar instância do workflow se workflow_id foi fornecido
    if (body.workflow_id) {
      try {
        await this.workflowService.criarInstancia({
          os_id: osId,
          workflow_id: body.workflow_id,
        });
      } catch (error) {
        // Se falhar ao criar workflow, reverter status da OS
        await this.osService.atualizarStatus(osId, {
          status: os.status,
        });
        throw new Error(
          `Erro ao criar instância do workflow: ${error.message}`,
        );
      }
    }

    return {
      message: 'OS liberada para PCP com sucesso',
      os_id: osId,
      status: StatusOS.LIBERADA_PARA_PCP,
      workflow_instanciado: !!body.workflow_id,
    };
  }

  @Post(':id/retirar-do-pcp')
  @ApiOperation({ summary: 'Retirar OS do PCP' })
  @ApiResponse({ status: 200, description: 'OS retirada do PCP com sucesso' })
  @ApiResponse({ status: 404, description: 'OS não encontrada' })
  async retirarDoPCP(@Param('id') osId: string, @Request() req: any) {
    const user = req['user'] || req.user;
    const lojaId = user.loja_id;

    // Verificar se OS existe e pertence à loja
    const os = await this.osService.findOne(osId, lojaId);
    if (!os) {
      throw new Error('Ordem de Serviço não encontrada');
    }

    // Verificar se OS está em status válido para retirada
    if (
      os.status !== StatusOS.LIBERADA_PARA_PCP &&
      os.status !== StatusOS.EM_WORKFLOW
    ) {
      throw new Error(
        `OS não pode ser retirada do PCP no status atual: ${os.status}`,
      );
    }

    // Remover instância do workflow se existir
    try {
      const workflow = await this.workflowService.buscarPorOS(osId);
      if (workflow) {
        await this.workflowService.deletarInstancia(workflow.id);
      }
    } catch (error) {
      // Log do erro mas não falha a operação
      console.error('Erro ao remover workflow:', error);
    }

    // Atualizar status da OS para FILA
    await this.osService.atualizarStatus(osId, {
      status: StatusOS.FILA,
    });

    return {
      message: 'OS retirada do PCP com sucesso',
      os_id: osId,
      status: StatusOS.FILA,
    };
  }

  private calcularProgresso(workflow: any): number {
    if (!workflow?.etapas) return 0;

    const totalEtapas = workflow.etapas.length;
    const etapasConcluidas = workflow.etapas.filter(
      (etapa: any) => etapa.status === 'CONCLUIDA',
    ).length;

    return totalEtapas > 0
      ? Math.round((etapasConcluidas / totalEtapas) * 100)
      : 0;
  }
}
