/**
 * M2.1 — Seed idempotente de perfis e permissões de Vendas.
 *
 * - Upsert apenas de perfis com `sistema=true` (identidade técnica).
 * - Colisão de nome com perfil customizado (`sistema=false`) → aborta sem mutar.
 * - Não reativa perfil inativo; não reabre `permitido=false`.
 * - Transação por loja; defaults = DEFAULTS_CONCEDIDOS_FASE_4 (inclui F2).
 * - Relatório sanitizado (sem e-mail/segredo).
 */
import { PrismaClient, usuario_funcao, Prisma } from '@prisma/client';
import {
  DEFAULTS_CONCEDIDOS_FASE_4,
  NOMES_PERFIL_SISTEMA,
  separarModuloEAcao,
} from '../src/vendas/permissions/vendas-permissoes';

export type RelatorioSeedVendas = {
  lojas_processadas: number;
  perfis_criados: number;
  perfis_atualizados: number;
  perfis_inalterados_inativos: number;
  permissoes_upsert: number;
  vinculos_criados: number;
  vinculos_pulados_ja_tinham_perfil: number;
  usuarios_sem_associacao: Array<{
    usuario_id: string;
    loja_id: string;
    funcao: string;
    motivo: string;
  }>;
  avisos: string[];
  colisoes: Array<{
    loja_id: string;
    perfil_id: string;
    nome: string;
    sistema: boolean;
    motivo: string;
  }>;
};

export class SeedVendasColisaoError extends Error {
  constructor(public readonly relatorio: RelatorioSeedVendas) {
    super(
      `Seed Vendas abortado: ${relatorio.colisoes.length} colisão(ões) de nome com perfil customizado.`,
    );
    this.name = 'SeedVendasColisaoError';
  }
}

const DESCRICOES: Record<string, string> = {
  [NOMES_PERFIL_SISTEMA.VENDEDOR]:
    'Perfil sistema Vendas — opera propostas no escopo da Fase 2.',
  [NOMES_PERFIL_SISTEMA.GESTOR]:
    'Perfil sistema Vendas — gestiona propostas inclusive exclusão/reabertura.',
  [NOMES_PERFIL_SISTEMA.FINANCEIRO]:
    'Perfil sistema Vendas — leitura comercial; sem edição nem módulo financeiro.',
  [NOMES_PERFIL_SISTEMA.ADMIN]:
    'Perfil sistema Vendas — espelho administrativo das permissões comerciais ativas.',
};

function permissoesDoPerfil(nome: string): readonly string[] {
  switch (nome) {
    case NOMES_PERFIL_SISTEMA.VENDEDOR:
      return DEFAULTS_CONCEDIDOS_FASE_4.VENDEDOR;
    case NOMES_PERFIL_SISTEMA.GESTOR:
      return DEFAULTS_CONCEDIDOS_FASE_4.GESTOR;
    case NOMES_PERFIL_SISTEMA.FINANCEIRO:
      return DEFAULTS_CONCEDIDOS_FASE_4.FINANCEIRO;
    case NOMES_PERFIL_SISTEMA.ADMIN:
      return DEFAULTS_CONCEDIDOS_FASE_4.ADMIN;
    default:
      return [];
  }
}

function relatorioVazio(): RelatorioSeedVendas {
  return {
    lojas_processadas: 0,
    perfis_criados: 0,
    perfis_atualizados: 0,
    perfis_inalterados_inativos: 0,
    permissoes_upsert: 0,
    vinculos_criados: 0,
    vinculos_pulados_ja_tinham_perfil: 0,
    usuarios_sem_associacao: [],
    avisos: [],
    colisoes: [],
  };
}

export async function detectarColisoesPerfisSistema(
  prisma: PrismaClient | Prisma.TransactionClient,
): Promise<RelatorioSeedVendas['colisoes']> {
  const nomesSistema = Object.values(NOMES_PERFIL_SISTEMA);
  const rows = await prisma.perfil_acesso.findMany({
    where: { nome: { in: [...nomesSistema] }, sistema: false },
    select: { id: true, loja_id: true, nome: true, sistema: true },
  });
  return rows.map((r) => ({
    loja_id: r.loja_id,
    perfil_id: r.id,
    nome: r.nome,
    sistema: r.sistema,
    motivo: 'nome_sistema_ocupado_por_perfil_customizado',
  }));
}

type Tx = Prisma.TransactionClient;

async function processarLoja(
  tx: Tx,
  lojaId: string,
  relatorio: RelatorioSeedVendas,
): Promise<void> {
  const nomesSistema = Object.values(NOMES_PERFIL_SISTEMA);

  const candidatos = await tx.perfil_acesso.findMany({
    where: { loja_id: lojaId, nome: { in: [...nomesSistema] } },
    select: { id: true, nome: true, sistema: true, ativo: true },
  });

  const perfisPorNome = new Map<string, { id: string; ativo: boolean }>();

  for (const nome of nomesSistema) {
    const existente = candidatos.find((c) => c.nome === nome);

    if (existente && !existente.ativo) {
      relatorio.perfis_inalterados_inativos += 1;
      perfisPorNome.set(nome, { id: existente.id, ativo: false });
      relatorio.avisos.push(
        `Perfil sistema inativo preservado: loja=${lojaId} nome=${nome}`,
      );
      continue;
    }

    if (existente) {
      await tx.perfil_acesso.update({
        where: { id: existente.id },
        data: {
          descricao: DESCRICOES[nome],
          sistema: true,
        },
      });
      relatorio.perfis_atualizados += 1;
      perfisPorNome.set(nome, { id: existente.id, ativo: true });
    } else {
      const criado = await tx.perfil_acesso.create({
        data: {
          loja_id: lojaId,
          nome,
          descricao: DESCRICOES[nome],
          ativo: true,
          sistema: true,
        },
        select: { id: true },
      });
      relatorio.perfis_criados += 1;
      perfisPorNome.set(nome, { id: criado.id, ativo: true });
    }

    const alvo = perfisPorNome.get(nome)!;
    if (!alvo.ativo) {
      continue;
    }

    for (const permissao of permissoesDoPerfil(nome)) {
      const { modulo, acao } = separarModuloEAcao(permissao);
      if (modulo !== 'vendas') {
        relatorio.avisos.push(
          `Permissão fora de vendas ignorada no seed: ${permissao}`,
        );
        continue;
      }
      await tx.perfil_permissao.upsert({
        where: {
          perfil_id_modulo_acao: {
            perfil_id: alvo.id,
            modulo,
            acao,
          },
        },
        create: {
          perfil_id: alvo.id,
          modulo,
          acao,
          permitido: true,
        },
        update: {},
      });
      relatorio.permissoes_upsert += 1;
    }
  }

  const usuarios = await tx.usuario.findMany({
    where: { loja_id: lojaId, status: 'ATIVO', ativo: true },
    select: {
      id: true,
      loja_id: true,
      funcao: true,
      perfis: { select: { perfil_id: true } },
    },
  });

  for (const usuario of usuarios) {
    if (usuario.perfis.length > 0) {
      relatorio.vinculos_pulados_ja_tinham_perfil += 1;
      continue;
    }

    let nomeAlvo: string | null = null;
    let motivoNegado: string | null = null;

    switch (usuario.funcao) {
      case usuario_funcao.ADMINISTRADOR:
        nomeAlvo = NOMES_PERFIL_SISTEMA.ADMIN;
        break;
      case usuario_funcao.VENDAS:
        nomeAlvo = NOMES_PERFIL_SISTEMA.VENDEDOR;
        break;
      case usuario_funcao.FINANCEIRO:
        nomeAlvo = NOMES_PERFIL_SISTEMA.FINANCEIRO;
        break;
      case usuario_funcao.PRODUCAO:
      case usuario_funcao.ESTOQUE:
        motivoNegado = 'funcao_operacional_sem_acesso_comercial';
        break;
      default:
        motivoNegado = 'funcao_desconhecida_negada_por_padrao';
        break;
    }

    if (motivoNegado || !nomeAlvo) {
      relatorio.usuarios_sem_associacao.push({
        usuario_id: usuario.id,
        loja_id: usuario.loja_id,
        funcao: String(usuario.funcao),
        motivo: motivoNegado ?? 'sem_perfil_alvo',
      });
      continue;
    }

    const perfil = perfisPorNome.get(nomeAlvo);
    if (!perfil || !perfil.ativo) {
      relatorio.avisos.push(
        `Perfil ${nomeAlvo} ausente ou inativo na loja ${lojaId}`,
      );
      relatorio.usuarios_sem_associacao.push({
        usuario_id: usuario.id,
        loja_id: usuario.loja_id,
        funcao: String(usuario.funcao),
        motivo: 'perfil_sistema_ausente_ou_inativo',
      });
      continue;
    }

    await tx.usuario_perfil.create({
      data: { usuario_id: usuario.id, perfil_id: perfil.id },
    });
    relatorio.vinculos_criados += 1;
  }
}

export async function seedVendasPerfisEPermissoes(
  prisma: PrismaClient,
): Promise<RelatorioSeedVendas> {
  const relatorio = relatorioVazio();

  // Pré-checagem global: aborta sem mutação se houver colisão.
  relatorio.colisoes = await detectarColisoesPerfisSistema(prisma);
  if (relatorio.colisoes.length > 0) {
    throw new SeedVendasColisaoError(relatorio);
  }

  const lojas = await prisma.loja.findMany({ select: { id: true } });

  for (const loja of lojas) {
    await prisma.$transaction(async (tx) => {
      await processarLoja(tx, loja.id, relatorio);
      relatorio.lojas_processadas += 1;
    });
  }

  return relatorio;
}
