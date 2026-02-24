import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { ValidacoesAutomaticasService } from '../../configuracoes/services/validacoes-automaticas.service';

@ApiTags('Debug - Validações')
@Controller('debug/validacoes')
export class DebugValidacoesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly validacoesService: ValidacoesAutomaticasService,
  ) {}

  @Get('os/:id')
  @ApiOperation({ summary: 'Debug completo de validações para uma OS' })
  async debugOS(@Param('id') osId: string) {
    try {
      // 1. Buscar OS
      const os = await this.prisma.ordemServico.findUnique({
        where: { id: osId },
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
          loja: true,
        },
      });

      if (!os) {
        return { error: 'OS não encontrada' };
      }

      // 2. Buscar regras ativas
      const regras = await this.prisma.regraValidacao.findMany({
        where: {
          ativo: true,
          OR: [{ loja_id: os.loja_id }, { loja_id: null }],
        },
        orderBy: { prioridade: 'asc' },
      });

      // 3. Executar validações
      const resultadoValidacoes = await this.validacoesService.validarOS(
        osId,
        os.loja_id,
      );

      // 4. Buscar execuções recentes
      const execucoes = await this.prisma.execucaoRegra.findMany({
        where: { os_id: osId },
        include: {
          regra: {
            select: {
              nome: true,
              categoria: true,
              tipo: true,
            },
          },
        },
        orderBy: { criado_em: 'desc' },
        take: 10,
      });

      // 5. Verificar estoque
      const insumosCalculados = os.insumos_calculados
        ? JSON.parse(os.insumos_calculados)
        : [];
      const detalhesEstoque = [];

      for (const insumo of insumosCalculados) {
        const estoque = await this.prisma.estoque.findFirst({
          where: { insumo_id: insumo.insumo_id },
          select: { quantidade_atual: true },
        });

        detalhesEstoque.push({
          insumo_id: insumo.insumo_id,
          nome: insumo.nome,
          quantidade_necessaria: insumo.quantidade_necessaria,
          estoque_disponivel: estoque?.quantidade_atual || 0,
          suficiente:
            (estoque?.quantidade_atual || 0) >= insumo.quantidade_necessaria,
        });
      }

      return {
        os: {
          id: os.id,
          numero: os.numero,
          status: os.status,
          loja_id: os.loja_id,
          loja_nome: os.loja?.nome,
        },
        regras: regras.map((r) => ({
          id: r.id,
          nome: r.nome,
          categoria: r.categoria,
          tipo: r.tipo,
          ativo: r.ativo,
          prioridade: r.prioridade,
          condicoes: r.condicoes,
          acoes: r.acoes,
        })),
        resultado_validacoes: resultadoValidacoes,
        execucoes_recentes: execucoes.map((e) => ({
          id: e.id,
          regra_nome: e.regra?.nome,
          resultado: e.resultado,
          mensagem: e.mensagem,
          tempo_execucao: e.tempo_execucao,
          criado_em: e.criado_em,
        })),
        detalhes_estoque: detalhesEstoque,
        resumo: {
          total_regras: regras.length,
          regras_ativas: regras.filter((r) => r.ativo).length,
          validacoes_executadas: execucoes.length,
          valida: resultadoValidacoes.valida,
          correcoes_necessarias:
            resultadoValidacoes.correcoes_necessarias.length,
          alertas: resultadoValidacoes.alertas.length,
          materiais_suficientes: detalhesEstoque.filter((e) => e.suficiente)
            .length,
          materiais_insuficientes: detalhesEstoque.filter((e) => !e.suficiente)
            .length,
        },
      };
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack,
      };
    }
  }
}
