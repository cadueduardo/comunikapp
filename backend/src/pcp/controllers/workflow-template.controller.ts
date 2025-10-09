import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWorkflowTemplateDto, UpdateWorkflowTemplateDto } from '../interfaces/pcp.interfaces';

@ApiTags('Workflow Templates')
@ApiBearerAuth()
@Controller('pcp/workflow-templates')
@UseGuards(JwtAuthGuard)
export class WorkflowTemplateController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Listar templates de workflow' })
  @ApiResponse({ status: 200, description: 'Lista de templates retornada com sucesso' })
  async listarTemplates(@Request() req: any) {
    const user = req['user'] || req.user;
    const lojaId = user.loja_id;

    const templates = await this.prisma.workflowOS.findMany({
      where: { loja_id: lojaId },
      orderBy: { criado_em: 'desc' }
    });

    return templates.map(template => ({
      id: template.id,
      nome: template.nome,
      descricao: template.descricao,
      etapas: JSON.parse(template.etapas || '[]'),
      ativo: template.ativo,
      sequencial: template.sequencial,
      criado_em: template.criado_em,
      atualizado_em: template.atualizado_em
    }));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar template por ID' })
  @ApiResponse({ status: 200, description: 'Template encontrado' })
  @ApiResponse({ status: 404, description: 'Template não encontrado' })
  async buscarPorId(@Param('id') id: string, @Request() req: any) {
    const user = req['user'] || req.user;
    const lojaId = user.loja_id;

    const template = await this.prisma.workflowOS.findFirst({
      where: { id, loja_id: lojaId }
    });

    if (!template) {
      throw new Error('Template não encontrado');
    }

    return {
      id: template.id,
      nome: template.nome,
      descricao: template.descricao,
      etapas: JSON.parse(template.etapas || '[]'),
      ativo: template.ativo,
      sequencial: template.sequencial,
      criado_em: template.criado_em,
      atualizado_em: template.atualizado_em
    };
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo template de workflow' })
  @ApiResponse({ status: 201, description: 'Template criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async criarTemplate(@Body() dto: CreateWorkflowTemplateDto, @Request() req: any) {
    const user = req['user'] || req.user;
    const lojaId = user.loja_id;

    // Verificar se já existe template com o mesmo nome
    const templateExistente = await this.prisma.workflowOS.findFirst({
      where: { loja_id: lojaId, nome: dto.nome }
    });

    if (templateExistente) {
      throw new Error('Já existe um template com este nome');
    }

    const template = await this.prisma.workflowOS.create({
      data: {
        loja_id: lojaId,
        nome: dto.nome,
        descricao: dto.descricao,
        etapas: JSON.stringify(dto.etapas || []),
        ativo: dto.ativo ?? true,
        sequencial: dto.sequencial ?? true
      }
    });

    return {
      id: template.id,
      nome: template.nome,
      descricao: template.descricao,
      etapas: JSON.parse(template.etapas || '[]'),
      ativo: template.ativo,
      sequencial: template.sequencial,
      criado_em: template.criado_em,
      atualizado_em: template.atualizado_em
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar template de workflow' })
  @ApiResponse({ status: 200, description: 'Template atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Template não encontrado' })
  async atualizarTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateWorkflowTemplateDto,
    @Request() req: any
  ) {
    const user = req['user'] || req.user;
    const lojaId = user.loja_id;

    const template = await this.prisma.workflowOS.findFirst({
      where: { id, loja_id: lojaId }
    });

    if (!template) {
      throw new Error('Template não encontrado');
    }

    const templateAtualizado = await this.prisma.workflowOS.update({
      where: { id },
      data: {
        nome: dto.nome,
        descricao: dto.descricao,
        etapas: dto.etapas ? JSON.stringify(dto.etapas) : undefined,
        ativo: dto.ativo,
        sequencial: dto.sequencial
      }
    });

    return {
      id: templateAtualizado.id,
      nome: templateAtualizado.nome,
      descricao: templateAtualizado.descricao,
      etapas: JSON.parse(templateAtualizado.etapas || '[]'),
      ativo: templateAtualizado.ativo,
      sequencial: templateAtualizado.sequencial,
      criado_em: templateAtualizado.criado_em,
      atualizado_em: templateAtualizado.atualizado_em
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar template de workflow' })
  @ApiResponse({ status: 200, description: 'Template deletado com sucesso' })
  @ApiResponse({ status: 404, description: 'Template não encontrado' })
  async deletarTemplate(@Param('id') id: string, @Request() req: any) {
    const user = req['user'] || req.user;
    const lojaId = user.loja_id;

    const template = await this.prisma.workflowOS.findFirst({
      where: { id, loja_id: lojaId }
    });

    if (!template) {
      throw new Error('Template não encontrado');
    }

    await this.prisma.workflowOS.delete({
      where: { id }
    });

    return { message: 'Template deletado com sucesso' };
  }
}









