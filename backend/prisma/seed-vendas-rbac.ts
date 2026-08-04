/**
 * M2.1 — Seed idempotente de perfis e permissões de Vendas.
 *
 * - Upsert por (loja_id, nome) e (perfil_id, modulo, acao)
 * - Não remove permissões/perfis customizados
 * - Não concede módulo financeiro
 * - Defaults = DEFAULTS_CONCEDIDOS_FASE_2 apenas
 * - Associa usuários ativos sem perfil conforme usuario_funcao
 * - Relatório sanitizado (sem e-mail/segredo)
 */
import { PrismaClient, usuario_funcao } from '@prisma/client';
import {
  DEFAULTS_CONCEDIDOS_FASE_2,
  NOMES_PERFIL_SISTEMA,
  separarModuloEAcao,
} from '../src/vendas/permissions/vendas-permissoes';

export type RelatorioSeedVendas = {
  lojas_processadas: number;
  perfis_criados: number;
  perfis_atualizados: number;
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
};

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
      return DEFAULTS_CONCEDIDOS_FASE_2.VENDEDOR;
    case NOMES_PERFIL_SISTEMA.GESTOR:
      return DEFAULTS_CONCEDIDOS_FASE_2.GESTOR;
    case NOMES_PERFIL_SISTEMA.FINANCEIRO:
      return DEFAULTS_CONCEDIDOS_FASE_2.FINANCEIRO;
    case NOMES_PERFIL_SISTEMA.ADMIN:
      return DEFAULTS_CONCEDIDOS_FASE_2.ADMIN;
    default:
      return [];
  }
}

export async function seedVendasPerfisEPermissoes(
  prisma: PrismaClient,
): Promise<RelatorioSeedVendas> {
  const relatorio: RelatorioSeedVendas = {
    lojas_processadas: 0,
    perfis_criados: 0,
    perfis_atualizados: 0,
    permissoes_upsert: 0,
    vinculos_criados: 0,
    vinculos_pulados_ja_tinham_perfil: 0,
    usuarios_sem_associacao: [],
    avisos: [],
  };

  const lojas = await prisma.loja.findMany({ select: { id: true } });
  const nomesSistema = Object.values(NOMES_PERFIL_SISTEMA);

  for (const loja of lojas) {
    relatorio.lojas_processadas += 1;
    const perfisPorNome = new Map<string, string>();

    for (const nome of nomesSistema) {
      const existente = await prisma.perfil_acesso.findUnique({
        where: { loja_id_nome: { loja_id: loja.id, nome } },
        select: { id: true },
      });

      const perfil = await prisma.perfil_acesso.upsert({
        where: { loja_id_nome: { loja_id: loja.id, nome } },
        create: {
          loja_id: loja.id,
          nome,
          descricao: DESCRICOES[nome],
          ativo: true,
          sistema: true,
        },
        update: {
          descricao: DESCRICOES[nome],
          ativo: true,
          sistema: true,
        },
        select: { id: true },
      });

      if (existente) {
        relatorio.perfis_atualizados += 1;
      } else {
        relatorio.perfis_criados += 1;
      }
      perfisPorNome.set(nome, perfil.id);

      for (const permissao of permissoesDoPerfil(nome)) {
        const { modulo, acao } = separarModuloEAcao(permissao);
        if (modulo !== 'vendas') {
          relatorio.avisos.push(
            `Permissão fora de vendas ignorada no seed: ${permissao}`,
          );
          continue;
        }
        // update vazio: não reabre permissão revogada localmente (permitido=false).
        await prisma.perfil_permissao.upsert({
          where: {
            perfil_id_modulo_acao: {
              perfil_id: perfil.id,
              modulo,
              acao,
            },
          },
          create: {
            perfil_id: perfil.id,
            modulo,
            acao,
            permitido: true,
          },
          update: {},
        });
        relatorio.permissoes_upsert += 1;
      }
    }

    const usuarios = await prisma.usuario.findMany({
      where: { loja_id: loja.id, status: 'ATIVO', ativo: true },
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

      const perfilId = perfisPorNome.get(nomeAlvo);
      if (!perfilId) {
        relatorio.avisos.push(
          `Perfil ${nomeAlvo} ausente na loja ${loja.id}`,
        );
        continue;
      }

      await prisma.usuario_perfil.create({
        data: { usuario_id: usuario.id, perfil_id: perfilId },
      });
      relatorio.vinculos_criados += 1;
    }
  }

  return relatorio;
}
