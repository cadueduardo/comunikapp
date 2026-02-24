import { Controller, Get, Put, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Test - Validações')
@Controller('test-validacoes')
export class TestValidacoesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('regras')
  @ApiOperation({ summary: 'Teste - Listar regras sem autenticação' })
  async listarRegras() {
    try {
      const regras = await this.prisma.regraValidacao.findMany({
        where: { ativo: true },
        orderBy: { prioridade: 'asc' },
      });

      return {
        success: true,
        data: regras.map((regra) => ({
          id: regra.id,
          nome: regra.nome,
          descricao: regra.descricao,
          tipo: regra.tipo,
          categoria: regra.categoria,
          ativo: regra.ativo,
          prioridade: regra.prioridade,
          _count: { execucoes: 0 },
          criado_em: regra.criado_em.toISOString(),
          atualizado_em: regra.atualizado_em.toISOString(),
        })),
        total: regras.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('regras/:id')
  @ApiOperation({ summary: 'Teste - Buscar regra por ID sem autenticação' })
  async buscarRegra(@Param('id') id: string) {
    try {
      const regra = await this.prisma.regraValidacao.findUnique({
        where: { id },
        include: {
          loja: {
            select: { nome: true },
          },
        },
      });

      if (!regra) {
        return {
          success: false,
          error: 'Regra não encontrada',
        };
      }

      return {
        success: true,
        data: {
          id: regra.id,
          nome: regra.nome,
          descricao: regra.descricao,
          tipo: regra.tipo,
          categoria: regra.categoria,
          ativo: regra.ativo,
          prioridade: regra.prioridade,
          loja_id: regra.loja_id,
          condicoes: regra.condicoes,
          acoes: regra.acoes,
          criado_em: regra.criado_em.toISOString(),
          atualizado_em: regra.atualizado_em.toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Put('regras/:id')
  @ApiOperation({ summary: 'Teste - Atualizar regra por ID sem autenticação' })
  async atualizarRegra(@Param('id') id: string, @Body() body: any) {
    try {
      const regra = await this.prisma.regraValidacao.update({
        where: { id },
        data: {
          nome: body.nome,
          descricao: body.descricao,
          tipo: body.tipo,
          categoria: body.categoria,
          ativo: body.ativo,
          prioridade: body.prioridade,
          loja_id: body.loja_id || null,
          condicoes: body.condicoes,
          acoes: body.acoes,
          atualizado_em: new Date(),
        },
      });

      return {
        success: true,
        data: {
          id: regra.id,
          nome: regra.nome,
          descricao: regra.descricao,
          tipo: regra.tipo,
          categoria: regra.categoria,
          ativo: regra.ativo,
          prioridade: regra.prioridade,
          loja_id: regra.loja_id,
          condicoes: regra.condicoes,
          acoes: regra.acoes,
          criado_em: regra.criado_em.toISOString(),
          atualizado_em: regra.atualizado_em.toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Delete('regras/:id')
  @ApiOperation({ summary: 'Teste - Deletar regra por ID sem autenticação' })
  async deletarRegra(@Param('id') id: string) {
    try {
      await this.prisma.regraValidacao.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Regra deletada com sucesso',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Teste - Dashboard sem autenticação' })
  async dashboard() {
    try {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const [totalRegras, regrasAtivas, execucoesHoje, regrasPorCategoria] =
        await Promise.all([
          this.prisma.regraValidacao.count(),
          this.prisma.regraValidacao.count({ where: { ativo: true } }),
          this.prisma.execucaoRegra.count({
            where: { criado_em: { gte: hoje } },
          }),
          this.prisma.regraValidacao.groupBy({
            by: ['categoria'],
            where: { ativo: true },
            _count: { id: true },
          }),
        ]);

      return {
        success: true,
        totalRegras,
        regrasAtivas,
        execucoesHoje,
        taxaSucesso: 100,
        regrasPorCategoria: regrasPorCategoria.map((item) => ({
          categoria: item.categoria,
          total: item._count.id,
          ativas: item._count.id,
        })),
        execucoesRecentes: [],
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
