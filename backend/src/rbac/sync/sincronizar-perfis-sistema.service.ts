import { Injectable } from '@nestjs/common';
import { Prisma, usuario_funcao } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { listarManifestos } from '../catalogo/agregador';
import { separarModuloEAcao } from '../catalogo/parser-chave';
import { NOMES_PERFIL_SISTEMA } from '../../vendas/permissions/vendas-permissoes';

type Tx = Prisma.TransactionClient;

export type RelatorioSyncPerfisSistema = {
  customizados: number;
  grantsCustomizados: number;
  perfisSistemaAtivos: number;
  grantsCriados: number;
  grantsPreservados: number;
};

/**
 * Sincronização idempotente de defaults de módulos (exceto Vendas).
 * Perfis `sistema=false` nunca recebem grant novo nem têm decisão alterada.
 * Deny explícito (`permitido=false`) nunca é reaberto.
 * O seed `seed-vendas-rbac.ts` permanece o escritor das chaves `vendas.*`.
 */
@Injectable()
export class SincronizarPerfisSistemaService {
  constructor(private readonly prisma: PrismaService) {}

  async preservarCustomizados(
    lojaId: string,
  ): Promise<RelatorioSyncPerfisSistema> {
    return this.sincronizarLoja(lojaId);
  }

  async sincronizarLoja(lojaId: string): Promise<RelatorioSyncPerfisSistema> {
    return this.prisma.$transaction((tx) => this.sincronizarLojaTx(tx, lojaId));
  }

  private async sincronizarLojaTx(
    tx: Tx,
    lojaId: string,
  ): Promise<RelatorioSyncPerfisSistema> {
    const customizados = await tx.perfil_acesso.findMany({
      where: { loja_id: lojaId, sistema: false },
      select: {
        id: true,
        _count: { select: { permissoes: true } },
      },
    });
    const idsCustomizados = new Set(customizados.map((perfil) => perfil.id));

    const sistemas = await tx.perfil_acesso.findMany({
      where: { loja_id: lojaId, sistema: true, ativo: true },
      include: { permissoes: true },
    });

    let grantsCriados = 0;
    let grantsPreservados = 0;

    for (const perfil of sistemas) {
      if (idsCustomizados.has(perfil.id)) {
        throw new Error(
          'Invariante violado: perfil não pode ser sistema e customizado.',
        );
      }
      const funcao = funcaoDoPerfilSistema(perfil.nome);
      if (!funcao) {
        continue;
      }
      const alvos = listarDefaultsForaDeVendas(funcao);
      for (const chave of alvos) {
        const { modulo, acao } = separarModuloEAcao(chave);
        const existente = perfil.permissoes.find(
          (linha) => linha.modulo === modulo && linha.acao === acao,
        );
        if (existente) {
          grantsPreservados += 1;
          continue;
        }
        await tx.perfil_permissao.create({
          data: {
            perfil_id: perfil.id,
            modulo,
            acao,
            permitido: true,
          },
        });
        grantsCriados += 1;
      }
    }

    return {
      customizados: customizados.length,
      grantsCustomizados: customizados.reduce(
        (acc, perfil) => acc + perfil._count.permissoes,
        0,
      ),
      perfisSistemaAtivos: sistemas.length,
      grantsCriados,
      grantsPreservados,
    };
  }
}

export function funcaoDoPerfilSistema(nome: string): usuario_funcao | null {
  switch (nome) {
    case NOMES_PERFIL_SISTEMA.VENDEDOR:
    case NOMES_PERFIL_SISTEMA.GESTOR:
      return usuario_funcao.VENDAS;
    case NOMES_PERFIL_SISTEMA.FINANCEIRO:
      return usuario_funcao.FINANCEIRO;
    case NOMES_PERFIL_SISTEMA.ADMIN:
      return usuario_funcao.ADMINISTRADOR;
    default:
      return null;
  }
}

export function listarDefaultsForaDeVendas(funcao: usuario_funcao): string[] {
  const chaves = new Set<string>();
  for (const manifesto of listarManifestos()) {
    for (const chave of manifesto.pisoPorFuncao[funcao] ?? []) {
      if (!chave.startsWith('vendas.')) {
        chaves.add(chave);
      }
    }
  }
  return [...chaves].sort();
}
