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
       SELECT id, quantidadeAtual, codigo, nome, localizacaoId FROM estoque_itens WHERE id = ${itemId} AND lojaId = ${context.lojaId}
     `;
    if (!(itemOrigem as any[])?.[0]) throw new BadRequestException('Item de estoque não encontrado');
    const item = (itemOrigem as any[])[0];
    if (item.localizacaoId !== localizacaoOrigemId) throw new BadRequestException('Item não está na localização de origem especificada');
    if (Number(item.quantidadeAtual) < Number(quantidade)) throw new BadRequestException('Quantidade insuficiente para transferência');

    const localizacaoDestino = await this.prisma.$queryRaw`
      SELECT id, codigo FROM estoque_localizacoes WHERE id = ${localizacaoDestinoId} AND lojaId = ${context.lojaId}
    `;
    if (!(localizacaoDestino as any[])?.[0]) throw new BadRequestException('Localização de destino não encontrada');

    if (Number(item.quantidadeAtual) !== Number(quantidade)) throw new BadRequestException('No modelo atual de itens, só é possível transferir a quantidade total do item.');

    // Criar registro na tabela de transferências
    const transferenciaId = `transf-${Date.now()}`;
    await this.prisma.$executeRaw`
      INSERT INTO estoque_transferencias (
        id, estoqueId, localizacaoOrigemId, localizacaoDestinoId, quantidade, 
        observacoes, status, usuarioId, lojaId, dataTransferencia
      ) VALUES (
        ${transferenciaId}, ${itemId}, ${localizacaoOrigemId}, ${localizacaoDestinoId}, ${Number(quantidade)},
        ${observacoes || `Transferência de ${item.codigo} para ${(localizacaoDestino as any[])[0].codigo}`}, 
        'CONCLUIDA', ${context.usuarioId || 'sistema'}, ${context.lojaId}, NOW()
      )
    `;

    // Criar movimentação de TRANSFERENCIA (SAIDA)
    await this.movimentacoesService.criarMovimentacao(context, {
      estoqueId: itemId,
      tipo: 'TRANSFERENCIA',
      quantidade,
      observacoes: `Transferência para ${(localizacaoDestino as any[])[0].codigo}`,
    });

    // Atualizar localização do item
    await this.prisma.$executeRaw`
      UPDATE estoque_itens SET localizacaoId = ${localizacaoDestinoId}, dataUltimaMov = NOW() WHERE id = ${itemId} AND lojaId = ${context.lojaId}
    `;

    // Criar movimentação de TRANSFERENCIA (ENTRADA)
    await this.movimentacoesService.criarMovimentacao(context, {
      estoqueId: itemId,
      tipo: 'TRANSFERENCIA',
      quantidade,
      observacoes: `Transferência de ${item.codigo}`,
    });

    const transferenciaDb = await this.prisma.$queryRaw`
      SELECT 
        m1.id                               AS id,
        m1.estoqueId                        AS itemId,
        m1.dataMovimentacao                 AS dataTransferencia,
        m1.quantidade                       AS quantidade,
        ie.codigo                           AS itemCodigo,
        ie.nome                             AS itemNome,
        l1.id                               AS localizacaoOrigemId,
        l1.codigo                           AS localizacaoOrigemCodigo,
        l2.id                               AS localizacaoDestinoId,
        l2.codigo                           AS localizacaoDestinoCodigo,
        m1.observacoes                      AS observacoes,
        'CONCLUIDA'                         AS status
             FROM estoque_movimentacoes m1
       LEFT JOIN estoque_movimentacoes m2 ON m2.tipo = 'ENTRADA' 
         AND m2.dataMovimentacao = m1.dataMovimentacao 
         AND m2.quantidade = m1.quantidade
       LEFT JOIN estoque_itens ie ON m1.estoqueId = ie.id
             LEFT JOIN estoque_localizacoes l1 ON l1.id = ${localizacaoOrigemId}
       LEFT JOIN estoque_localizacoes l2 ON l2.id = ${localizacaoDestinoId}
             WHERE m1.id = (SELECT MAX(id) FROM estoque_movimentacoes WHERE estoqueId = ${itemId} AND tipo = 'SAIDA')
         AND m1.lojaId = ${context.lojaId}
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
      localizacaoOrigemCodigo: (await this.prisma.$queryRaw`SELECT codigo FROM estoque_localizacoes WHERE id = ${localizacaoOrigemId} AND lojaId = ${context.lojaId} LIMIT 1`)?.[0]?.codigo || '',
      localizacaoDestinoId,
      localizacaoDestinoCodigo: (localizacaoDestino as any[])?.[0]?.codigo || '',
      observacoes: observacoes || null,
      status: 'CONCLUIDA',
    } as any;
  }

  async listarTransferencias(context: IEstoqueContext, query: any = {}) {
    if (!context?.lojaId) throw new BadRequestException('lojaId é obrigatório');
    this.logger.debug(`🔄 [TransferenciasService] listarTransferencias loja=${context.lojaId}`);

    const filters: string[] = [`t.lojaId = ?`];
    const whereParams: any[] = [context.lojaId];
    
    if (query.itemId) {
      filters.push(`t.estoqueId = ?`);
      whereParams.push(String(query.itemId));
    }
    
    if (query.status) {
      filters.push(`t.status = ?`);
      whereParams.push(String(query.status));
    }
    
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (query.dataInicio && dateRegex.test(query.dataInicio)) {
      filters.push(`DATE(t.dataTransferencia) >= ?`);
      whereParams.push(query.dataInicio);
    }
    if (query.dataFim && dateRegex.test(query.dataFim)) {
      filters.push(`DATE(t.dataTransferencia) <= ?`);
      whereParams.push(query.dataFim);
    }
    
    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    const sql = `
      SELECT 
        t.id,
        t.estoqueId AS itemId,
        t.dataTransferencia,
        t.quantidade,
        t.observacoes,
        t.status,
        t.usuarioId,
        t.createdAt,
        ie.codigo AS itemCodigo,
        ie.nome AS itemNome,
        l1.codigo AS localizacaoOrigemCodigo,
        l2.codigo AS localizacaoDestinoCodigo
      FROM estoque_transferencias t
      LEFT JOIN estoque_itens ie ON t.estoqueId = ie.id
      LEFT JOIN estoque_localizacoes l1 ON t.localizacaoOrigemId = l1.id
      LEFT JOIN estoque_localizacoes l2 ON t.localizacaoDestinoId = l2.id
      ${whereClause}
      ORDER BY t.dataTransferencia DESC
    `;
    
    const transferencias = await this.prisma.$queryRawUnsafe(sql, ...whereParams);
    return transferencias;
  }

  async buscarTransferenciaPorId(context: IEstoqueContext, id: string) {
    if (!context?.lojaId) throw new BadRequestException('lojaId é obrigatório');
    this.logger.debug(`🔄 [TransferenciasService] buscarTransferenciaPorId id=${id} loja=${context.lojaId}`);
    
    const rows: any[] = await this.prisma.$queryRaw`
      SELECT 
        t.id,
        t.estoqueId AS itemId,
        t.dataTransferencia,
        t.quantidade,
        t.observacoes,
        t.status,
        t.usuarioId,
        t.createdAt,
        ie.codigo AS itemCodigo,
        ie.nome AS itemNome,
        l1.codigo AS localizacaoOrigemCodigo,
        l2.codigo AS localizacaoDestinoCodigo
      FROM estoque_transferencias t
      LEFT JOIN estoque_itens ie ON t.estoqueId = ie.id
      LEFT JOIN estoque_localizacoes l1 ON t.localizacaoOrigemId = l1.id
      LEFT JOIN estoque_localizacoes l2 ON t.localizacaoDestinoId = l2.id
      WHERE t.id = ${id} AND t.lojaId = ${context.lojaId}
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
             FROM estoque_movimentacoes m1
       LEFT JOIN estoque_movimentacoes m2 ON m2.tipo = 'ENTRADA' AND m2.dataMovimentacao = m1.dataMovimentacao AND m2.quantidade = m1.quantidade
       LEFT JOIN estoque_localizacoes l1 ON l1.id = (SELECT localizacaoId FROM estoque_itens WHERE id = m1.estoqueId LIMIT 1)
       LEFT JOIN estoque_localizacoes l2 ON l2.id = (SELECT localizacaoId FROM estoque_itens WHERE id = m2.estoqueId AND lojaId = ${context.lojaId})
       WHERE m1.estoqueId = ${itemId} AND m1.lojaId = ${context.lojaId} AND m1.tipo = 'SAIDA'
             ORDER BY m1.dataMovimentacao DESC
    `;
    return rows;
  }
}


