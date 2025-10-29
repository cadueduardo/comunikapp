import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateWorkflowTemplateDto,
  UpdateWorkflowTemplateDto,
  WorkflowSetorTemplateData,
} from '../interfaces/pcp.interfaces';

@ApiTags('Workflow Templates')
@ApiBearerAuth()
@Controller('pcp/workflow-templates')
@UseGuards(JwtAuthGuard)
export class WorkflowTemplateController {
  constructor(private prisma: PrismaService) {}

  private readonly workflowInclude = {
    workflow_setores: {
      include: {
        setor: true,
      },
      orderBy: {
        ordem: 'asc' as const,
      },
    },
  };

  private mapTemplate(template: any) {
    return {
      id: template.id,
      nome: template.nome,
      descricao: template.descricao,
      etapas: JSON.parse(template.etapas || '[]'),
      ativo: template.ativo,
      sequencial: template.sequencial,
      criado_em: template.criado_em,
      atualizado_em: template.atualizado_em,
      setores:
        template.workflow_setores?.map((setor: any) => ({
          id: setor.id,
          setorId: setor.setor_id,
          nomeSetor: setor.setor?.nome,
          ordem: setor.ordem,
          tempoEstimado: setor.tempo_estimado,
          obrigatorio: setor.obrigatorio,
        })) ?? [],
    };
  }

  private mapSetoresInput(
    setores?: WorkflowSetorTemplateData[],
  ): {
    setor_id: string;
    ordem: number;
    tempo_estimado?: number | null;
    obrigatorio: boolean;
  }[] {
    if (!setores?.length) {
      return [];
    }

    return setores.map((setor, index) => ({
      setor_id: setor.setorId,
      ordem: setor.ordem ?? index,
      tempo_estimado:
        typeof setor.tempoEstimado === 'number'
          ? setor.tempoEstimado
          : setor.tempoEstimado ?? null,
      obrigatorio: setor.obrigatorio ?? true,
    }));
  }

  @Get()
  @ApiOperation({ summary: 'Listar templates de workflow' })
  @ApiResponse({
    status: 200,
    description: 'Lista de templates retornada com sucesso',
  })
  async listarTemplates(@Request() req: any) {
    const user = req['user'] || req.user;
    const lojaId = user.loja_id;

    const templates = await this.prisma.workflowOS.findMany({
      where: { loja_id: lojaId },
      orderBy: { criado_em: 'desc' },
      include: this.workflowInclude,
    });

    return templates.map((template) => this.mapTemplate(template));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar template por ID' })
  @ApiResponse({ status: 200, description: 'Template encontrado' })
  @ApiResponse({ status: 404, description: 'Template não encontrado' })
  async buscarPorId(@Param('id') id: string, @Request() req: any) {
    const user = req['user'] || req.user;
    const lojaId = user.loja_id;

    const template = await this.prisma.workflowOS.findFirst({
      where: { id, loja_id: lojaId },
      include: this.workflowInclude,
    });

    if (!template) {
      throw new BadRequestException('Template não encontrado');
    }

    return this.mapTemplate(template);
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo template de workflow' })
  @ApiResponse({ status: 201, description: 'Template criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async criarTemplate(
    @Body() dto: CreateWorkflowTemplateDto,
    @Request() req: any,
  ) {
    const user = req['user'] || req.user;
    const lojaId = user.loja_id;

    const templateExistente = await this.prisma.workflowOS.findFirst({
      where: { loja_id: lojaId, nome: dto.nome },
    });

    if (templateExistente) {
      throw new BadRequestException('Já existe um template com este nome');
    }

    const setoresData = this.mapSetoresInput(dto.setores);

    const template = await this.prisma.workflowOS.create({
      data: {
        loja_id: lojaId,
        nome: dto.nome,
        descricao: dto.descricao,
        etapas: JSON.stringify(dto.etapas || []),
        ativo: dto.ativo ?? true,
        sequencial: dto.sequencial ?? true,
        workflow_setores: setoresData.length
          ? {
              create: setoresData.map((setor) => ({
                ...setor,
              })),
            }
          : undefined,
      },
      include: this.workflowInclude,
    });

    return this.mapTemplate(template);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar template de workflow' })
  @ApiResponse({ status: 200, description: 'Template atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Template não encontrado' })
  async atualizarTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateWorkflowTemplateDto,
    @Request() req: any,
  ) {
    const user = req['user'] || req.user;
    const lojaId = user.loja_id;

    const template = await this.prisma.workflowOS.findFirst({
      where: { id, loja_id: lojaId },
      include: this.workflowInclude,
    });

    if (!template) {
      throw new BadRequestException('Template não encontrado');
    }

    const setoresData = dto.setores
      ? this.mapSetoresInput(dto.setores)
      : null;

    const resultado = await this.prisma.$transaction(async (tx) => {
      await tx.workflowOS.update({
        where: { id },
        data: {
          nome: dto.nome,
          descricao: dto.descricao,
          etapas: dto.etapas ? JSON.stringify(dto.etapas) : undefined,
          ativo: dto.ativo,
          sequencial: dto.sequencial,
        },
      });

      if (setoresData !== null) {
        await tx.workflowSetor.deleteMany({ where: { workflow_id: id } });

        if (setoresData.length) {
          for (const setor of setoresData) {
            await tx.workflowSetor.create({
              data: {
                workflow_id: id,
                ...setor,
              },
            });
          }
        }
      }

      return tx.workflowOS.findFirst({
        where: { id },
        include: this.workflowInclude,
      });
    });

    if (!resultado) {
      throw new BadRequestException('Erro ao carregar template atualizado');
    }

    return this.mapTemplate(resultado);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar template de workflow' })
  @ApiResponse({ status: 200, description: 'Template deletado com sucesso' })
  @ApiResponse({ status: 404, description: 'Template não encontrado' })
  async deletarTemplate(@Param('id') id: string, @Request() req: any) {
    const user = req['user'] || req.user;
    const lojaId = user.loja_id;

    const template = await this.prisma.workflowOS.findFirst({
      where: { id, loja_id: lojaId },
    });

    if (!template) {
      throw new BadRequestException('Template não encontrado');
    }

    await this.prisma.workflowOS.delete({
      where: { id },
    });

    return { message: 'Template deletado com sucesso' };
  }
}
