import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface ISobraContext {
  lojaId: string;
  usuarioId: string;
}

const STATUS_SOBRA_VALIDOS = [
  'DISPONIVEL',
  'PARCIALMENTE_APROVEITADA',
  'APROVEITADA',
  'DESCARTADA',
] as const;

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

      if (!data.descricao?.trim()) {
        throw new BadRequestException('Descrição da sobra é obrigatória.');
      }

      const quantidade = Number(data.quantidade);
      if (!Number.isFinite(quantidade) || quantidade <= 0) {
        throw new BadRequestException('Quantidade deve ser maior que zero.');
      }

      const insumoId = data.insumoId || data.insumo_id || null;
      if (insumoId) {
        const insumo = await this.prisma.insumo.findFirst({
          where: { id: insumoId, loja_id: context.lojaId },
          select: { id: true },
        });
        if (!insumo) {
          throw new BadRequestException(
            'Insumo não pertence à loja autenticada.',
          );
        }
      }

      if (data.estoqueId) {
        const estoque = await this.prisma.$queryRaw<any[]>`
          SELECT id FROM estoque_itens
          WHERE id = ${data.estoqueId} AND lojaId = ${context.lojaId}
          LIMIT 1
        `;
        if (!estoque[0]) {
          throw new BadRequestException(
            'Item de estoque não pertence à loja autenticada.',
          );
        }
      }

      const codigoSobra = await this.gerarCodigoSobra(context.lojaId);
      const area = data.area != null ? Number(data.area) : null;
      const largura = data.largura != null ? Number(data.largura) : null;
      const altura = data.altura != null ? Number(data.altura) : null;
      const unidadeDimensao =
        data.unidadeDimensao || data.unidade_dimensao || null;
      const origem = data.origem || (insumoId ? 'ORCAMENTO' : null);
      const orcamentoOrigem =
        data.orcamentoOrigem || data.orcamento_origem || null;

      if (insumoId && !data.estoqueId) {
        await this.prisma.$executeRaw`
          INSERT INTO estoque_sobras (
            id, estoque_id, insumo_id, codigo_sobra, descricao, dimensoes,
            largura, altura, unidade_dimensao, area, area_disponivel,
            area_original, quantidade, unidade_medida, material, cor, acabamento,
            status, origem, orcamento_origem, observacao_interna, loja_id,
            created_at, updated_at
          ) VALUES (
            UUID(), NULL, ${insumoId}, ${codigoSobra}, ${data.descricao},
            ${data.dimensoes || null},
            ${largura}, ${altura}, ${unidadeDimensao},
            ${area}, ${area}, ${area},
            ${quantidade},
            ${data.unidadeMedida || data.unidade_medida || 'm²'},
            ${data.material || null}, ${data.cor || null}, ${data.acabamento || null},
            'DISPONIVEL', ${origem}, ${orcamentoOrigem}, ${data.observacaoInterna || data.observacao || null},
            ${context.lojaId}, NOW(), NOW()
          )
        `;
      } else {
        await this.prisma.$executeRaw`
          INSERT INTO estoque_sobras (
            id, estoque_id, insumo_id, codigo_sobra, descricao, dimensoes, area, quantidade,
            unidade_medida, material, cor, acabamento, status, origem, data_geracao,
            orcamento_origem, observacao_interna, data_aproveitamento, quantidade_aproveitada, economia_gerada,
            loja_id, created_at, updated_at
          ) VALUES (
            UUID(), ${data.estoqueId || null}, ${insumoId}, ${codigoSobra}, ${data.descricao}, 
            ${data.dimensoes || null}, ${area}, ${quantidade},
            ${data.unidadeMedida || data.unidadeCompra || 'm²'}, ${data.material}, ${data.cor || null}, 
            ${data.acabamento || null}, 'DISPONIVEL', ${origem || null}, NOW(),
            ${orcamentoOrigem || null}, ${data.observacaoInterna || data.observacao || null},
            NULL, CAST(0 AS DECIMAL(10,2)), CAST(0 AS DECIMAL(12,2)),
            ${context.lojaId}, NOW(), NOW()
          )
        `;
      }

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
          l.descricao as localizacao_nome
        FROM estoque_sobras s
        LEFT JOIN estoque_itens i ON s.estoque_id = i.id
        LEFT JOIN estoque_localizacoes l ON i.localizacaoId = l.id
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
          l.descricao as localizacao_nome
        FROM estoque_sobras s
        LEFT JOIN estoque_itens i ON s.estoque_id = i.id
        LEFT JOIN estoque_localizacoes l ON i.localizacaoId = l.id
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
        if (!STATUS_SOBRA_VALIDOS.includes(data.status)) {
          throw new BadRequestException('Status de sobra inválido.');
        }
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

      if (!['DISPONIVEL', 'PARCIALMENTE_APROVEITADA'].includes(sobra.status)) {
        throw new BadRequestException(
          'Sobra não está disponível para aproveitamento.',
        );
      }

      const quantidadeDisponivel = this.obterQuantidadeDisponivel(sobra);
      const quantidadeAproveitada = Number(
        data.quantidadeAproveitada ?? data.areaAproveitada ?? 0,
      );
      const economiaGerada = Number(data.economiaGerada ?? 0);

      if (
        !Number.isFinite(quantidadeAproveitada) ||
        quantidadeAproveitada <= 0
      ) {
        throw new BadRequestException(
          'Quantidade aproveitada deve ser maior que zero.',
        );
      }

      if (quantidadeAproveitada > quantidadeDisponivel) {
        throw new BadRequestException(
          'Quantidade aproveitada maior que quantidade disponível.',
        );
      }

      if (!Number.isFinite(economiaGerada) || economiaGerada < 0) {
        throw new BadRequestException('Economia gerada não pode ser negativa.');
      }

      await this.validarDestinoAproveitamento(context, data);

      // Criar registro de aproveitamento
      await this.prisma.$executeRaw`
        INSERT INTO estoque_aproveitamentos (
          id, sobra_id, quantidade_aproveitada, projeto_destino, orcamento_destino,
          os_destino_id, item_os_destino_id, insumo_id, area_aproveitada,
          economia_gerada, observacoes, loja_id, usuario_id,
          data_aproveitamento, created_at, updated_at
        ) VALUES (
          UUID(), ${sobraId}, ${quantidadeAproveitada},
          ${data.projetoDestino || null}, ${data.orcamentoDestino || null},
          ${data.osDestinoId || null}, ${data.itemOsDestinoId || null},
          ${sobra.insumo_id || data.insumoId || null}, ${quantidadeAproveitada},
          ${economiaGerada}, ${data.observacoes || null}, ${context.lojaId},
          ${context.usuarioId || null}, NOW(), NOW(), NOW()
        )
      `;

      // Atualizar sobra
      const novaQuantidadeAproveitada =
        Number(sobra.quantidade_aproveitada ?? 0) + quantidadeAproveitada;
      const novaQuantidade = quantidadeDisponivel - quantidadeAproveitada;
      const statusAtualizado =
        novaQuantidade <= 0 ? 'APROVEITADA' : 'PARCIALMENTE_APROVEITADA';

      await this.prisma.$executeRaw`
        UPDATE estoque_sobras 
        SET quantidade = ${novaQuantidade},
            area_disponivel = ${sobra.area_disponivel !== null && sobra.area_disponivel !== undefined ? novaQuantidade : null},
            quantidade_aproveitada = ${novaQuantidadeAproveitada},
            status = ${statusAtualizado},
            data_aproveitamento = NOW(),
            economia_gerada = COALESCE(economia_gerada, 0) + ${economiaGerada},
            updated_at = NOW()
        WHERE id = ${sobraId} AND loja_id = ${context.lojaId}
      `;

      this.logger.log(`Aproveitamento registrado com sucesso`);
      return this.buscarSobraPorId(context, sobraId);
    } catch (error) {
      this.logger.error(`Erro ao registrar aproveitamento: ${error.message}`);
      throw error;
    }
  }

  async descartarSobra(context: ISobraContext, sobraId: string, data: any) {
    const motivo = String(data?.motivo ?? data?.observacoes ?? '').trim();
    if (!motivo) {
      throw new BadRequestException('Informe o motivo do descarte.');
    }

    const sobra = await this.buscarSobraPorId(context, sobraId);
    if (sobra.status === 'APROVEITADA') {
      throw new BadRequestException('Sobra já foi totalmente aproveitada.');
    }

    await this.prisma.$executeRaw`
      UPDATE estoque_sobras
      SET status = 'DESCARTADA',
          observacao_interna = ${motivo},
          updated_at = NOW()
      WHERE id = ${sobraId} AND loja_id = ${context.lojaId}
    `;

    return this.buscarSobraPorId(context, sobraId);
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
        conditions.push(
          Prisma.sql` s.material LIKE ${'%' + filtros.material + '%'} `,
        );
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
      if (filtros.insumoId) {
        conditions.push(Prisma.sql` s.insumo_id = ${filtros.insumoId} `);
      }

      const whereClause = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;

      const sobras = await this.prisma.$queryRaw`
        SELECT 
          s.*,
          i.codigo as item_codigo,
          i.nome as item_nome,
          l.codigo as localizacao_codigo,
          l.descricao as localizacao_nome
        FROM estoque_sobras s
        LEFT JOIN estoque_itens i ON s.estoque_id = i.id
        LEFT JOIN estoque_localizacoes l ON i.localizacaoId = l.id
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

      const [
        totalSobras,
        sobrasAproveitadas,
        economiaTotal,
        disponiveis,
        areaDisponivel,
        economiaRecente,
      ] = await Promise.all([
        this.prisma
          .$queryRaw`SELECT COUNT(*) as count FROM estoque_sobras WHERE loja_id = ${context.lojaId}`,
        this.prisma
          .$queryRaw`SELECT COUNT(*) as count FROM estoque_sobras WHERE loja_id = ${context.lojaId} AND status = 'APROVEITADA'`,
        this.prisma
          .$queryRaw`SELECT SUM(economia_gerada) as total FROM estoque_sobras WHERE loja_id = ${context.lojaId}`,
        this.prisma
          .$queryRaw`SELECT COUNT(*) as count FROM estoque_sobras WHERE loja_id = ${context.lojaId} AND status = 'DISPONIVEL' AND quantidade > 0`,
        this.prisma
          .$queryRaw`SELECT COALESCE(SUM(area * quantidade), 0) as total FROM estoque_sobras WHERE loja_id = ${context.lojaId} AND status = 'DISPONIVEL' AND quantidade > 0`,
        this.prisma
          .$queryRaw`SELECT COALESCE(SUM(economia_gerada), 0) as total FROM estoque_sobras WHERE loja_id = ${context.lojaId} AND status = 'APROVEITADA' AND updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
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
        sobrasDisponiveis: Number((disponiveis as any[])[0]?.count ?? 0),
        areaDisponivelM2:
          Math.round(Number((areaDisponivel as any[])[0]?.total ?? 0) * 100) /
          100,
        economiaUltimos30Dias: Number(
          (economiaRecente as any[])[0]?.total ?? 0,
        ),
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
          sobrasDisponiveis: 0,
          areaDisponivelM2: 0,
          economiaUltimos30Dias: 0,
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

  private obterQuantidadeDisponivel(sobra: any): number {
    const areaDisponivel = Number(sobra.area_disponivel ?? 0);
    if (Number.isFinite(areaDisponivel) && areaDisponivel > 0) {
      return areaDisponivel;
    }

    const quantidade = Number(sobra.quantidade ?? 0);
    return Number.isFinite(quantidade) ? quantidade : 0;
  }

  private async validarDestinoAproveitamento(
    context: ISobraContext,
    data: any,
  ): Promise<void> {
    if (data.osDestinoId) {
      const os = await this.prisma.ordemServico.findFirst({
        where: { id: data.osDestinoId, loja_id: context.lojaId },
        select: { id: true },
      });
      if (!os) {
        throw new NotFoundException('OS de destino não encontrada nesta loja.');
      }
    }

    if (data.itemOsDestinoId) {
      const item = await this.prisma.itemOS.findFirst({
        where: {
          id: data.itemOsDestinoId,
          os: { loja_id: context.lojaId },
        },
        select: { id: true },
      });
      if (!item) {
        throw new NotFoundException(
          'Item da OS de destino não encontrado nesta loja.',
        );
      }
    }
  }
}
