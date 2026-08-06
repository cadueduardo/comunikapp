import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  calcularHashMaterial,
  montarSnapshotVersao,
} from '../domain/versao-orcamento';
import {
  DiffVersaoOrcamento,
  gerarDiffVersoes,
  sanitizarObjetoSnapshot,
} from '../domain/diff-versao-orcamento';

@Injectable()
export class VersaoOrcamentoService {
  private readonly logger = new Logger(VersaoOrcamentoService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Congela o snapshot completo e imutável no momento do envio da proposta (Fase 1 / M1.2 & Fase 6 / 6.4).
   * Se já existir uma versão exatamente com o mesmo hash material, vincula a versão existente.
   */
  async congelarVersaoNoEnvio(
    orcamentoId: string,
    lojaId: string,
    usuarioId: string,
  ): Promise<{ id: string; versao: number; hashMaterial: string }> {
    const atual = await this.prisma.orcamento.findFirst({
      where: { id: orcamentoId, loja_id: lojaId, excluido_em: null },
      include: {
        produtos: {
          include: {
            insumos: true,
            maquinas: true,
            funcoes: true,
            servicos_manuais: true,
            custos_indiretos: true,
          },
        },
        cliente: true,
        contato: true,
        entrega_modalidade: true,
      },
    });

    if (!atual) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    const snapshot = montarSnapshotVersao({ atual });
    const hashMaterial = calcularHashMaterial(snapshot);

    const ultimaVersao = await this.prisma.versaoOrcamento.findFirst({
      where: { orcamento_id: orcamentoId },
      orderBy: [{ numero: 'desc' }, { versao: 'desc' }],
    });

    let versaoAlvo = ultimaVersao;

    // Se não existir versão ou a última versão tiver hash diferente, cria uma nova versão imutável
    if (!ultimaVersao || ultimaVersao.hash_material !== hashMaterial) {
      const proximaVersaoNum = (ultimaVersao?.numero || ultimaVersao?.versao || 0) + 1;
      versaoAlvo = await this.prisma.versaoOrcamento.create({
        data: {
          orcamento: { connect: { id: orcamentoId } },
          versao: proximaVersaoNum,
          numero: proximaVersaoNum,
          usuario_id: usuarioId,
          responsavel_id: usuarioId,
          dados_completos: JSON.stringify(snapshot),
          snapshot: snapshot as Prisma.InputJsonValue,
          hash_material: hashMaterial,
          motivo_alteracao: 'Congelamento de versão no envio da proposta',
        },
      });
    }

    const enviadoEm = new Date();

    await this.prisma.orcamento.updateMany({
      where: { id: orcamentoId, loja_id: lojaId },
      data: {
        versao_enviada_id: versaoAlvo.id,
        enviado_em: enviadoEm,
      },
    });

    return {
      id: versaoAlvo.id,
      versao: versaoAlvo.versao ?? versaoAlvo.numero ?? 1,
      hashMaterial,
    };
  }

  /**
   * Obtém uma versão sanitizada garantindo isolamento multi-tenant por loja e orçamento.
   */
  async obterVersaoSanitizada(
    versaoId: string,
    orcamentoId: string,
    lojaId: string,
    ePublico = true,
  ) {
    const versao = await this.prisma.versaoOrcamento.findFirst({
      where: {
        id: versaoId,
        orcamento_id: orcamentoId,
        orcamento: { loja_id: lojaId },
      },
    });

    if (!versao) {
      throw new NotFoundException('Versão do orçamento não encontrada');
    }

    const snapshotFormatado = ePublico
      ? sanitizarObjetoSnapshot(versao.snapshot)
      : versao.snapshot;

    return {
      id: versao.id,
      orcamentoId: versao.orcamento_id,
      versao: versao.versao,
      numero: versao.numero,
      hashMaterial: versao.hash_material,
      motivoAlteracao: versao.motivo_alteracao,
      criadoEm: versao.criado_em,
      snapshot: snapshotFormatado,
    };
  }

  /**
   * Calcula o diff legível entre duas versões (ou entre uma versão enviada e o rascunho atual).
   */
  async calcularDiffVersoes(
    orcamentoId: string,
    lojaId: string,
    versaoIdOrigem: string,
    versaoIdDestino?: string,
    ePublico = true,
  ): Promise<DiffVersaoOrcamento> {
    const versaoOrigem = await this.prisma.versaoOrcamento.findFirst({
      where: {
        id: versaoIdOrigem,
        orcamento_id: orcamentoId,
        orcamento: { loja_id: lojaId },
      },
    });

    if (!versaoOrigem) {
      throw new NotFoundException('Versão de origem não encontrada');
    }

    let snapshotDestino: unknown;

    if (versaoIdDestino) {
      const versaoDestino = await this.prisma.versaoOrcamento.findFirst({
        where: {
          id: versaoIdDestino,
          orcamento_id: orcamentoId,
          orcamento: { loja_id: lojaId },
        },
      });

      if (!versaoDestino) {
        throw new NotFoundException('Versão de destino não encontrada');
      }
      snapshotDestino = versaoDestino.snapshot;
    } else {
      // Comparação contra o estado rascunho atual no banco
      const estadoAtual = await this.prisma.orcamento.findFirst({
        where: { id: orcamentoId, loja_id: lojaId },
        include: {
          produtos: true,
          cliente: true,
          entrega_modalidade: true,
        },
      });

      if (!estadoAtual) {
        throw new NotFoundException('Orçamento não encontrado');
      }

      snapshotDestino = montarSnapshotVersao({ atual: estadoAtual });
    }

    return gerarDiffVersoes(versaoOrigem.snapshot, snapshotDestino, ePublico);
  }

  /**
   * Valida se o aceite apontará para a versão enviada vigente e se ela pertence ao mesmo tenant/orçamento.
   */
  async validarVersaoParaAceite(
    orcamentoId: string,
    lojaId: string,
    versaoEnviadaIdParaAceite: string,
  ): Promise<boolean> {
    const orcamento = await this.prisma.orcamento.findFirst({
      where: { id: orcamentoId, loja_id: lojaId, excluido_em: null },
      select: { versao_enviada_id: true },
    });

    if (!orcamento) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    if (!orcamento.versao_enviada_id) {
      throw new BadRequestException('Orçamento não possui uma versão enviada congelada.');
    }

    if (orcamento.versao_enviada_id !== versaoEnviadaIdParaAceite) {
      throw new BadRequestException(
        'A versão apresentada para aceite não corresponde à versão enviada vigente.',
      );
    }

    const versaoValida = await this.prisma.versaoOrcamento.findFirst({
      where: {
        id: versaoEnviadaIdParaAceite,
        orcamento_id: orcamentoId,
        orcamento: { loja_id: lojaId },
      },
    });

    if (!versaoValida) {
      throw new BadRequestException('Versão enviada inválida ou pertencente a outro tenant/orçamento.');
    }

    return true;
  }
}
