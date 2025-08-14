import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface ISobraContext {
  lojaId: string;
  usuarioId: string;
}

@Injectable()
export class SobrasService {
  private readonly logger = new Logger(SobrasService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Criar uma nova sobra
   */
  async criarSobra(context: ISobraContext, data: any) {
    try {
      this.logger.log(`Criando sobra para loja ${context.lojaId}`);

      // Gerar código único da sobra
      const codigoSobra = await this.gerarCodigoSobra(context.lojaId);

      // Insert com template tag (parametrizado e seguro)
      await this.prisma.$executeRaw`
        INSERT INTO estoque_sobras (
          id, estoque_id, codigo_sobra, descricao, dimensoes, area, quantidade,
          unidade_medida, material, cor, acabamento, status, origem, data_geracao,
          orcamento_origem, data_aproveitamento, quantidade_aproveitada, economia_gerada,
          loja_id, created_at, updated_at
        ) VALUES (
          UUID(), ${data.estoqueId}, ${codigoSobra}, ${data.descricao}, 
          ${data.dimensoes || null}, ${data.area ? Number(data.area) : null}, ${Number(data.quantidade)},
          ${data.unidadeMedida || data.unidadeCompra}, ${data.material}, ${data.cor || null}, 
          ${data.acabamento || null}, 'DISPONIVEL', ${data.origem || null}, NOW(),
          ${data.orcamentoOrigem || null}, NULL, CAST(0 AS DECIMAL(10,2)), CAST(0 AS DECIMAL(12,2)),
          ${context.lojaId}, NOW(), NOW()
        )
      `;

      // Buscar a última sobra criada para a loja (evita problemas de contagem de parâmetros)
      const sobras = await this.prisma.$queryRaw<any[]>`
        SELECT * FROM estoque_sobras 
        WHERE loja_id = ${context.lojaId}
        ORDER BY created_at DESC LIMIT 1
      `;

      const sobra = sobras[0];
      this.logger.log(`Sobra criada com sucesso: ${sobra.id}`);
      return sobra;
    } catch (error: any) {
      this.logger.error(`Erro ao criar sobra: ${error.message}`);
      // Tabela inexistente: informar erro amigável
      if (
        error?.code === '1146' ||
        /doesn\'t exist/i.test(error?.message || '')
      ) {
        throw new BadRequestException(
          'Tabela de sobras não encontrada. Execute as migrações do estoque.',
        );
      }
      throw error;
    }
  }

  /**
   * Listar sobras com filtros
   */
  async listarSobras(context: ISobraContext, query: any = {}) {
    try {
      this.logger.log(`Listando sobras para loja ${context.lojaId}`);

      const conditions: any[] = [Prisma.sql` s.loja_id = ${context.lojaId} `];
      if (query.status)
        conditions.push(Prisma.sql` s.status = ${query.status} `);
      if (query.material)
        conditions.push(
          Prisma.sql` s.material LIKE ${'%' + query.material + '%'} `,
        );
      if (query.cor)
        conditions.push(Prisma.sql` s.cor LIKE ${'%' + query.cor + '%'} `);

      const where = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;

      const sobras = await this.prisma.$queryRaw<any[]>`
        SELECT 
          s.*,
          i.codigo as item_codigo,
          i.nome as item_nome,
          l.codigo as localizacao_codigo,
          l.nome as localizacao_nome
        FROM estoque_sobras s
        LEFT JOIN itens_estoque i ON s.estoque_id = i.id
        LEFT JOIN localizacoes l ON i.localizacao_id = l.id
        ${where}
        ORDER BY s.created_at DESC
      `;
      return sobras;
    } catch (error: any) {
      this.logger.error(`Erro ao listar sobras: ${error.message}`);
      // Tabela inexistente: retornar vazio ao invés de quebrar
      if (
        error?.code === '1146' ||
        /doesn\'t exist/i.test(error?.message || '')
      ) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Buscar sobra por ID
   */
  async buscarSobraPorId(context: ISobraContext, id: string) {
    try {
      this.logger.log(`Buscando sobra ${id} para loja ${context.lojaId}`);

      const sobras = await this.prisma.$queryRaw`
        SELECT 
          s.*,
          i.codigo as item_codigo,
          i.nome as item_nome,
          l.codigo as localizacao_codigo,
          l.nome as localizacao_nome
        FROM estoque_sobras s
        LEFT JOIN itens_estoque i ON s.estoque_id = i.id
        LEFT JOIN localizacoes l ON i.localizacao_id = l.id
        WHERE s.id = ${id} AND s.loja_id = ${context.lojaId}
      `;

      const sobra = (sobras as any[])[0];
      if (!sobra) {
        throw new Error('Sobra não encontrada');
      }

      return sobra;
    } catch (error) {
      this.logger.error(`Erro ao buscar sobra: ${error.message}`);
      throw error;
    }
  }

  /**
   * Atualizar sobra
   */
  async atualizarSobra(context: ISobraContext, id: string, data: any) {
    try {
      this.logger.log(`Atualizando sobra ${id} para loja ${context.lojaId}`);

      // Construir query de atualização dinamicamente
      const updates = [];
      const values = [];

      if (data.descricao !== undefined) {
        updates.push('descricao = ?');
        values.push(data.descricao);
      }
      if (data.dimensoes !== undefined) {
        updates.push('dimensoes = ?');
        values.push(data.dimensoes);
      }
      if (data.area !== undefined) {
        updates.push('area = ?');
        values.push(data.area);
      }
      if (data.quantidade !== undefined) {
        updates.push('quantidade = ?');
        values.push(data.quantidade);
      }
      if (data.unidadeMedida !== undefined) {
        updates.push('unidade_medida = ?');
        values.push(data.unidadeMedida);
      }
      if (data.material !== undefined) {
        updates.push('material = ?');
        values.push(data.material);
      }
      if (data.cor !== undefined) {
        updates.push('cor = ?');
        values.push(data.cor);
      }
      if (data.acabamento !== undefined) {
        updates.push('acabamento = ?');
        values.push(data.acabamento);
      }
      if (data.status !== undefined) {
        updates.push('status = ?');
        values.push(data.status);
      }
      if (data.origem !== undefined) {
        updates.push('origem = ?');
        values.push(data.origem);
      }
      if (data.orcamentoOrigem !== undefined) {
        updates.push('orcamento_origem = ?');
        values.push(data.orcamentoOrigem);
      }

      updates.push('updated_at = NOW()');
      values.push(id, context.lojaId);

      const updateQuery = `
        UPDATE estoque_sobras 
        SET ${updates.join(', ')}
        WHERE id = ? AND loja_id = ?
      `;

      await this.prisma.$executeRawUnsafe(updateQuery, ...values);

      this.logger.log(`Sobra atualizada com sucesso: ${id}`);
      return await this.buscarSobraPorId(context, id);
    } catch (error) {
      this.logger.error(`Erro ao atualizar sobra: ${error.message}`);
      throw error;
    }
  }

  /**
   * Excluir sobra
   */
  async excluirSobra(context: ISobraContext, id: string) {
    try {
      this.logger.log(`Excluindo sobra ${id} para loja ${context.lojaId}`);

      await this.prisma.$executeRaw`
        DELETE FROM estoque_sobras 
        WHERE id = ${id} AND loja_id = ${context.lojaId}
      `;

      this.logger.log(`Sobra excluída com sucesso: ${id}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Erro ao excluir sobra: ${error.message}`);
      throw error;
    }
  }

  /**
   * Registrar aproveitamento de sobra
   */
  async registrarAproveitamento(
    context: ISobraContext,
    sobraId: string,
    data: any,
  ) {
    try {
      this.logger.log(`Registrando aproveitamento da sobra ${sobraId}`);

      // Buscar sobra
      const sobra = await this.buscarSobraPorId(context, sobraId);

      if (sobra.status !== 'DISPONIVEL') {
        throw new Error('Sobra não está disponível para aproveitamento');
      }

      if (data.quantidadeAproveitada > sobra.quantidade) {
        throw new Error(
          'Quantidade aproveitada maior que quantidade disponível',
        );
      }

      // Criar registro de aproveitamento
      await this.prisma.$executeRaw`
        INSERT INTO estoque_aproveitamentos (
          id, sobra_id, quantidade_aproveitada, projeto_destino, orcamento_destino,
          observacoes, loja_id, created_at
        ) VALUES (
          UUID(), ${sobraId}, ${data.quantidadeAproveitada}, 
          ${data.projetoDestino || null}, ${data.orcamentoDestino || null},
          ${data.observacoes || null}, ${context.lojaId}, NOW()
        )
      `;

      // Atualizar sobra
      const novaQuantidadeAproveitada =
        sobra.quantidade_aproveitada + data.quantidadeAproveitada;
      const novaQuantidade = sobra.quantidade - data.quantidadeAproveitada;
      const statusAtualizado =
        novaQuantidade <= 0 ? 'APROVEITADA' : 'DISPONIVEL';

      await this.prisma.$executeRaw`
        UPDATE estoque_sobras 
        SET quantidade = ${novaQuantidade},
            quantidade_aproveitada = ${novaQuantidadeAproveitada},
            status = ${statusAtualizado},
            data_aproveitamento = NOW(),
            economia_gerada = economia_gerada + ${data.economiaGerada || 0},
            updated_at = NOW()
        WHERE id = ${sobraId}
      `;

      this.logger.log(`Aproveitamento registrado com sucesso`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Erro ao registrar aproveitamento: ${error.message}`);
      throw error;
    }
  }

  /**
   * Buscar sugestões de sobras para um projeto
   */
  async buscarSugestoesSobras(context: ISobraContext, filtros: any) {
    try {
      this.logger.log(
        `Buscando sugestões de sobras para loja ${context.lojaId}`,
      );

      const conditions: Prisma.Sql[] = [
        Prisma.sql` s.loja_id = ${context.lojaId} `,
        Prisma.sql` s.status = 'DISPONIVEL' `,
        Prisma.sql` s.quantidade > 0 `,
      ];
      if (filtros.material) {
        conditions.push(Prisma.sql` s.material LIKE ${'%' + filtros.material + '%'} `);
      }
      if (filtros.cor) {
        conditions.push(Prisma.sql` s.cor LIKE ${'%' + filtros.cor + '%'} `);
      }
      if (filtros.areaMinima) {
        conditions.push(Prisma.sql` s.area >= ${Number(filtros.areaMinima)} `);
      }
      if (filtros.areaMaxima) {
        conditions.push(Prisma.sql` s.area <= ${Number(filtros.areaMaxima)} `);
      }

      const whereClause = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;

      const sobras = await this.prisma.$queryRaw`
        SELECT 
          s.*,
          i.codigo as item_codigo,
          i.nome as item_nome,
          l.codigo as localizacao_codigo,
          l.nome as localizacao_nome
        FROM estoque_sobras s
        LEFT JOIN itens_estoque i ON s.estoque_id = i.id
        LEFT JOIN localizacoes l ON i.localizacao_id = l.id
        ${whereClause}
        ORDER BY s.area DESC, s.quantidade DESC
        LIMIT 20
      `;

      return sobras;
    } catch (error) {
      this.logger.error(`Erro ao buscar sugestões: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calcular métricas de economia
   */
  async calcularMetricasEconomia(context: ISobraContext) {
    try {
      this.logger.log(
        `Calculando métricas de economia para loja ${context.lojaId}`,
      );

      const [totalSobras, sobrasAproveitadas, economiaTotal] =
        await Promise.all([
          this.prisma
            .$queryRaw`SELECT COUNT(*) as count FROM estoque_sobras WHERE loja_id = ${context.lojaId}`,
          this.prisma
            .$queryRaw`SELECT COUNT(*) as count FROM estoque_sobras WHERE loja_id = ${context.lojaId} AND status = 'APROVEITADA'`,
          this.prisma
            .$queryRaw`SELECT SUM(economia_gerada) as total FROM estoque_sobras WHERE loja_id = ${context.lojaId}`,
        ]);

      const total = Number((totalSobras as any[])[0]?.count ?? 0);
      const aproveitadas = Number((sobrasAproveitadas as any[])[0]?.count ?? 0);
      const economia = Number((economiaTotal as any[])[0]?.total ?? 0);
      const taxaAproveitamento = total > 0 ? (aproveitadas / total) * 100 : 0;

      return {
        totalSobras: total,
        sobrasAproveitadas: aproveitadas,
        economiaTotal: economia,
        taxaAproveitamento: Math.round(taxaAproveitamento * 100) / 100,
      };
    } catch (error: any) {
      this.logger.error(`Erro ao calcular métricas: ${error.message}`);
      // Se a tabela ainda não existir, retornar métricas zeradas
      if (
        error?.code === '1146' ||
        /doesn\'t exist/i.test(error?.message || '')
      ) {
        return {
          totalSobras: 0,
          sobrasAproveitadas: 0,
          economiaTotal: 0,
          taxaAproveitamento: 0,
        };
      }
      throw error;
    }
  }

  /**
   * Gerar código único para sobra
   */
  private async gerarCodigoSobra(lojaId: string): Promise<string> {
    const ano = new Date().getFullYear();

    // Contar sobras do ano atual
    const likePattern = `SOB-${ano}-%`;
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count 
      FROM estoque_sobras 
      WHERE loja_id = ${lojaId} 
      AND codigo_sobra LIKE ${likePattern}
    `;

    const count = Number(result[0]?.count ?? 0);
    const numero = (count + 1).toString().padStart(3, '0');
    return `SOB-${ano}-${numero}`;
  }
}
