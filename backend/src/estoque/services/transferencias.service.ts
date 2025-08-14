import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { IEstoqueContext } from '../types/estoque-context';
import { PrismaService } from '../../prisma/prisma.service';
import { MovimentacoesService } from './movimentacoes.service';

@Injectable()
export class TransferenciasService {
  private readonly logger = new Logger(TransferenciasService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly movimentacoesService: MovimentacoesService,
  ) {}

  async criarTransferencia(context: IEstoqueContext, data: any) {
    if (!context?.lojaId) throw new BadRequestException('lojaId é obrigatório');
    this.logger.debug(`🔄 [TransferenciasService] criarTransferencia loja=${context.lojaId}`);

    const { itemId, localizacaoOrigemId, localizacaoDestinoId, quantidade, observacoes } = data;

    const itemOrigem = await this.prisma.$queryRaw`
      SELECT id, quantidade, codigo, nome, localizacao_id FROM itens_estoque WHERE id = ${itemId} AND loja_id = ${context.lojaId}
    `;
    if (!(itemOrigem as any[])?.[0]) throw new BadRequestException('Item de estoque não encontrado');
    const item = (itemOrigem as any[])[0];
    if (item.localizacao_id !== localizacaoOrigemId) throw new BadRequestException('Item não está na localização de origem especificada');
    if (Number(item.quantidade) < Number(quantidade)) throw new BadRequestException('Quantidade insuficiente para transferência');

    const localizacaoDestino = await this.prisma.$queryRaw`
      SELECT id, codigo FROM localizacoes WHERE id = ${localizacaoDestinoId} AND loja_id = ${context.lojaId}
    `;
    if (!(localizacaoDestino as any[])?.[0]) throw new BadRequestException('Localização de destino não encontrada');

    if (Number(item.quantidade) !== Number(quantidade)) throw new BadRequestException('No modelo atual de itens, só é possível transferir a quantidade total do item.');

    await this.movimentacoesService.criarMovimentacao(context, {
      estoqueId: itemId,
      tipo: 'SAIDA',
      quantidade,
      motivo: `Transferência para ${(localizacaoDestino as any[])[0].codigo}`,
      observacoes: observacoes || `Transferência para ${(localizacaoDestino as any[])[0].codigo}`,
    });

    await this.prisma.$executeRaw`
      UPDATE itens_estoque SET localizacao_id = ${localizacaoDestinoId}, dataUltimaMov = NOW() WHERE id = ${itemId} AND loja_id = ${context.lojaId}
    `;

    await this.movimentacoesService.criarMovimentacao(context, {
      estoqueId: itemId,
      tipo: 'ENTRADA',
      quantidade,
      motivo: `Transferência de ${item.codigo}`,
      observacoes: observacoes || `Transferência de ${item.codigo}`,
    });

    const transferenciaDb = await this.prisma.$queryRaw`
      SELECT 
        m1.id                               AS id,
        m1.item_id                          AS itemId,
        m1.criado_em                        AS dataTransferencia,
        m1.quantidade                       AS quantidade,
        ie.codigo                           AS itemCodigo,
        ie.nome                             AS itemNome,
        l1.id                               AS localizacaoOrigemId,
        l1.codigo                           AS localizacaoOrigemCodigo,
        l2.id                               AS localizacaoDestinoId,
        l2.codigo                           AS localizacaoDestinoCodigo,
        m1.observacoes                      AS observacoes,
        'CONCLUIDA'                         AS status
      FROM movimentacoes_estoque m1
      LEFT JOIN movimentacoes_estoque m2 ON m2.tipo = 'ENTRADA' 
        AND m2.criado_em = m1.criado_em 
        AND m2.quantidade = m1.quantidade
      LEFT JOIN itens_estoque ie ON m1.item_id = ie.id
      LEFT JOIN localizacoes l1 ON l1.id = ${localizacaoOrigemId}
      LEFT JOIN localizacoes l2 ON l2.id = ${localizacaoDestinoId}
      WHERE m1.id = (SELECT MAX(id) FROM movimentacoes_estoque WHERE item_id = ${itemId} AND tipo = 'SAIDA')
        AND m1.loja_id = ${context.lojaId}
        AND m1.tipo = 'SAIDA'
    `;

    return (transferenciaDb as any[])?.[0] || {
      id: `transf-${Date.now()}`,
      itemId,
      dataTransferencia: new Date(),
      quantidade: Number(quantidade),
      itemCodigo: item.codigo,
      itemNome: item.nome,
      localizacaoOrigemId,
      localizacaoOrigemCodigo: (await this.prisma.$queryRaw`SELECT codigo FROM localizacoes WHERE id = ${localizacaoOrigemId} AND loja_id = ${context.lojaId} LIMIT 1`)?.[0]?.codigo || '',
      localizacaoDestinoId,
      localizacaoDestinoCodigo: (localizacaoDestino as any[])?.[0]?.codigo || '',
      observacoes: observacoes || null,
      status: 'CONCLUIDA',
    } as any;
  }

  async listarTransferencias(context: IEstoqueContext, query: any = {}) {
    if (!context?.lojaId) throw new BadRequestException('lojaId é obrigatório');
    this.logger.debug(`🔄 [TransferenciasService] listarTransferencias loja=${context.lojaId}`);

    const filters: string[] = [
      `m1.loja_id = ?`,
      `m1.tipo = 'SAIDA'`,
    ];
    const whereParams: any[] = [context.lojaId];
    if (query.itemId) {
      filters.push(`m1.item_id = ?`);
      whereParams.push(String(query.itemId));
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (query.dataInicio && dateRegex.test(query.dataInicio)) {
      filters.push(`DATE(m1.criado_em) >= ?`);
      whereParams.push(query.dataInicio);
    }
    if (query.dataFim && dateRegex.test(query.dataFim)) {
      filters.push(`DATE(m1.criado_em) <= ?`);
      whereParams.push(query.dataFim);
    }
    const whereClause = `WHERE ${filters.join(' AND ')}`;

    const sql = `
      SELECT 
        m1.id AS id,
        m1.item_id AS itemId,
        m1.criado_em AS dataTransferencia,
        m1.quantidade AS quantidade,
        ie.codigo AS itemCodigo,
        ie.nome AS itemNome,
        l1.id AS localizacaoOrigemId,
        l1.codigo AS localizacaoOrigemCodigo,
        l2.id AS localizacaoDestinoId,
        l2.codigo AS localizacaoDestinoCodigo,
        m1.observacoes AS observacoes,
        'CONCLUIDA' AS status
      FROM movimentacoes_estoque m1
      LEFT JOIN movimentacoes_estoque m2 ON m2.tipo = 'ENTRADA' AND m2.criado_em = m1.criado_em AND m2.quantidade = m1.quantidade
      LEFT JOIN itens_estoque ie ON m1.item_id = ie.id
      LEFT JOIN localizacoes l1 ON ie.localizacao_id = l1.id
      LEFT JOIN localizacoes l2 ON l2.id = (SELECT localizacao_id FROM itens_estoque WHERE id = m2.item_id AND loja_id = ?)
      ${whereClause}
      ORDER BY m1.criado_em DESC`;

    // A ordem dos parâmetros deve seguir a ordem dos placeholders no SQL
    const rows: any[] = await this.prisma.$queryRawUnsafe(sql, context.lojaId, ...whereParams);
    return rows?.length ? rows : [];
  }

  async buscarTransferenciaPorId(context: IEstoqueContext, id: string) {
    if (!context?.lojaId) throw new BadRequestException('lojaId é obrigatório');
    this.logger.debug(`🔄 [TransferenciasService] buscarTransferenciaPorId id=${id} loja=${context.lojaId}`);
    const rows: any[] = await this.prisma.$queryRaw`
      SELECT 
        m1.id AS id,
        m1.item_id AS itemId,
        m1.criado_em AS dataTransferencia,
        m1.quantidade AS quantidade,
        ie.codigo AS itemCodigo,
        ie.nome AS itemNome,
        l1.id AS localizacaoOrigemId,
        l1.codigo AS localizacaoOrigemCodigo,
        l2.id AS localizacaoDestinoId,
        l2.codigo AS localizacaoDestinoCodigo,
        m1.observacoes AS observacoes,
        'CONCLUIDA' AS status
      FROM movimentacoes_estoque m1
      LEFT JOIN movimentacoes_estoque m2 ON m2.tipo = 'ENTRADA' AND m2.criado_em = m1.criado_em AND m2.quantidade = m1.quantidade
      LEFT JOIN itens_estoque ie ON m1.item_id = ie.id
      LEFT JOIN localizacoes l1 ON ie.localizacao_id = l1.id
      LEFT JOIN localizacoes l2 ON l2.id = (SELECT localizacao_id FROM itens_estoque WHERE id = m2.item_id AND loja_id = ${context.lojaId})
      WHERE m1.id = ${id} AND m1.loja_id = ${context.lojaId} AND m1.tipo = 'SAIDA'
    `;
    return rows?.[0] || null;
  }

  async listarHistoricoPorItem(context: IEstoqueContext, itemId: string) {
    if (!context?.lojaId) throw new BadRequestException('lojaId é obrigatório');
    this.logger.debug(`🔄 [TransferenciasService] listarHistoricoPorItem itemId=${itemId} loja=${context.lojaId}`);
    const rows: any[] = await this.prisma.$queryRaw`
      SELECT 
        m1.id as movimentacaoSaidaId,
        m2.id as movimentacaoEntradaId,
        m1.dataMovimentacao as dataTransferencia,
        m1.quantidade,
        l1.codigo as localizacaoOrigem,
        l2.codigo as localizacaoDestino,
        m1.observacoes
      FROM movimentacoes_estoque m1
      LEFT JOIN movimentacoes_estoque m2 ON m2.tipo = 'ENTRADA' AND m2.dataMovimentacao = m1.dataMovimentacao AND m2.quantidade = m1.quantidade
      LEFT JOIN localizacoes l1 ON l1.id = (SELECT localizacao_id FROM itens_estoque WHERE id = m1.item_id LIMIT 1)
      LEFT JOIN localizacoes l2 ON l2.id = (SELECT localizacao_id FROM itens_estoque WHERE id = m2.item_id AND loja_id = ${context.lojaId})
      WHERE m1.item_id = ${itemId} AND m1.loja_id = ${context.lojaId} AND m1.tipo = 'SAIDA'
      ORDER BY m1.dataMovimentacao DESC
    `;
    return rows;
  }
}


