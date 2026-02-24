import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateSetorProdutivoDto,
  UpdateSetorProdutivoDto,
} from '../../dto/centros-de-trabalho/setores-produtivos.dto';
import { SetorProdutivo } from '../../../pcp/entities/pcp.entities';

@Injectable()
export class SetoresProdutivosService {
  private readonly logger = new Logger(SetoresProdutivosService.name);

  constructor(private prisma: PrismaService) {}

  async criar(
    lojaId: string,
    dto: CreateSetorProdutivoDto,
  ): Promise<SetorProdutivo> {
    this.logger.log(
      `Tentando criar setor produtivo: ${dto.nome} para loja ${lojaId}`,
    );

    try {
      // Verificar se já existe um setor com o mesmo nome na loja
      const setorExistente = await this.prisma.setorProdutivo.findFirst({
        where: {
          loja_id: lojaId,
          nome: dto.nome,
        },
      });

      if (setorExistente) {
        throw new BadRequestException(
          `Já existe um setor produtivo com o nome "${dto.nome}" nesta loja.`,
        );
      }

      const setor = await this.prisma.setorProdutivo.create({
        data: {
          loja_id: lojaId,
          nome: dto.nome,
          descricao: dto.descricao,
          cor: dto.cor || '#3B82F6',
          ativo: dto.ativo !== undefined ? dto.ativo : true,
          ordem: dto.ordem || 0,
        },
      });

      this.logger.log(`Setor produtivo criado com sucesso: ${setor.id}`);
      return setor;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Erro ao criar setor produtivo: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        'Não foi possível criar o setor produtivo.',
      );
    }
  }

  async listar(lojaId: string, ativo?: boolean): Promise<SetorProdutivo[]> {
    this.logger.log(
      `Listando setores produtivos para loja ${lojaId}, ativo: ${ativo}`,
    );

    const where: any = { loja_id: lojaId };
    if (typeof ativo === 'boolean') {
      where.ativo = ativo;
    }

    const setores = await this.prisma.setorProdutivo.findMany({
      where,
      orderBy: { ordem: 'asc' },
    });

    this.logger.log(`Encontrados ${setores.length} setores produtivos.`);
    return setores;
  }

  async obterPorId(id: string, lojaId: string): Promise<SetorProdutivo> {
    this.logger.log(`Buscando setor produtivo ${id} para loja ${lojaId}`);

    const setor = await this.prisma.setorProdutivo.findFirst({
      where: {
        id,
        loja_id: lojaId,
      },
    });

    if (!setor) {
      throw new NotFoundException(
        `Setor produtivo com ID ${id} não encontrado.`,
      );
    }

    return setor;
  }

  async atualizar(
    id: string,
    lojaId: string,
    dto: UpdateSetorProdutivoDto,
  ): Promise<SetorProdutivo> {
    this.logger.log(`Atualizando setor produtivo ${id} para loja ${lojaId}`);

    // Verificar se existe
    await this.obterPorId(id, lojaId);

    try {
      // Se está alterando o nome, verificar se não conflita
      if (dto.nome) {
        const setorComMesmoNome = await this.prisma.setorProdutivo.findFirst({
          where: {
            loja_id: lojaId,
            nome: dto.nome,
            id: { not: id },
          },
        });

        if (setorComMesmoNome) {
          throw new BadRequestException(
            `Já existe um setor produtivo com o nome "${dto.nome}" nesta loja.`,
          );
        }
      }

      const setorAtualizado = await this.prisma.setorProdutivo.update({
        where: {
          id,
          loja_id: lojaId,
        },
        data: {
          nome: dto.nome,
          descricao: dto.descricao,
          cor: dto.cor,
          ativo: dto.ativo,
          ordem: dto.ordem,
        },
      });

      this.logger.log(`Setor produtivo ${id} atualizado com sucesso.`);
      return setorAtualizado;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Erro ao atualizar setor produtivo ${id}: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        'Não foi possível atualizar o setor produtivo.',
      );
    }
  }

  async deletar(id: string, lojaId: string): Promise<void> {
    this.logger.log(`Deletando setor produtivo ${id} para loja ${lojaId}`);

    // Verificar se existe
    await this.obterPorId(id, lojaId);

    // Verificar se o setor está sendo usado em workflows
    const workflowsUsandoSetor = await this.prisma.workflowSetor.count({
      where: { setor_id: id },
    });

    const instanciasUsandoSetor =
      await this.prisma.workflowInstanciaSetor.count({
        where: { setor_id: id },
      });

    if (workflowsUsandoSetor > 0 || instanciasUsandoSetor > 0) {
      throw new BadRequestException(
        `Não é possível deletar o setor pois ele está sendo usado em ${workflowsUsandoSetor} workflows e ${instanciasUsandoSetor} instâncias ativas.`,
      );
    }

    await this.prisma.setorProdutivo.delete({
      where: {
        id,
        loja_id: lojaId,
      },
    });

    this.logger.log(`Setor produtivo ${id} deletado com sucesso.`);
  }

  async obterPorOperador(operadorId: string): Promise<SetorProdutivo | null> {
    this.logger.log(`Buscando setor produtivo para operador ${operadorId}`);

    // Buscar o operador e suas instâncias ativas
    const operador = await this.prisma.usuario.findUnique({
      where: { id: operadorId },
      include: {
        instancias_setor_operador: {
          where: {
            status: {
              in: ['PENDENTE', 'EM_ANDAMENTO'],
            },
          },
          include: {
            setor: true,
          },
          orderBy: {
            criado_em: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!operador || operador.instancias_setor_operador.length === 0) {
      return null;
    }

    return operador.instancias_setor_operador[0].setor;
  }

  async obterEstatisticasSetor(setorId: string): Promise<{
    total: number;
    pendentes: number;
    em_andamento: number;
    concluidas: number;
    operadores_ativos: number;
  }> {
    this.logger.log(`Obtendo estatísticas do setor ${setorId}`);

    const [total, pendentes, em_andamento, concluidas, operadoresAtivos] =
      await Promise.all([
        this.prisma.workflowInstanciaSetor.count({
          where: { setor_id: setorId },
        }),
        this.prisma.workflowInstanciaSetor.count({
          where: {
            setor_id: setorId,
            status: 'PENDENTE',
          },
        }),
        this.prisma.workflowInstanciaSetor.count({
          where: {
            setor_id: setorId,
            status: 'EM_ANDAMENTO',
          },
        }),
        this.prisma.workflowInstanciaSetor.count({
          where: {
            setor_id: setorId,
            status: 'CONCLUIDA',
          },
        }),
        this.prisma.workflowInstanciaSetor.groupBy({
          by: ['operador_id'],
          where: {
            setor_id: setorId,
            status: 'EM_ANDAMENTO',
            operador_id: { not: null },
          },
        }),
      ]);

    return {
      total,
      pendentes,
      em_andamento,
      concluidas,
      operadores_ativos: operadoresAtivos.length,
    };
  }
}
