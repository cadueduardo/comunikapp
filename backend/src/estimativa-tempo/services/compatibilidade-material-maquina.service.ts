import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type NivelCompatibilidade = 'compativel' | 'alerta' | 'bloqueado';

export interface ResultadoCompatibilidade {
  insumo_id: string;
  maquina_id: string;
  nivel: NivelCompatibilidade;
  motivos: string[];
  regras_avaliadas: string[];
}

interface CondicaoCompatibilidade {
  // Filtro do lado do insumo
  insumo_tipo_material_nome?: string | string[];
  insumo_logica_consumo?: string | string[];
  // Filtro do lado da maquina
  maquina_tipo?: string | string[];
  maquina_modo_producao?: 'M2_H' | 'ML_H' | 'MANUAL' | Array<'M2_H' | 'ML_H' | 'MANUAL'>;
}

/**
 * Verifica se um insumo pode ser processado por uma maquina específica.
 *
 * Estratégia: reaproveita o modelo RegraValidacao já existente (categoria
 * 'compatibilidade_material_maquina'). Cada regra tem `tipo` (BLOQUEIO |
 * ALERTA | INFO) e `condicoes` em JSON com os filtros descritos em
 * CondicaoCompatibilidade.
 *
 * Quando a regra "casa" com o par insumo×máquina:
 * - tipo BLOQUEIO -> nivel "bloqueado"
 * - tipo ALERTA -> nivel "alerta"
 * - tipo INFO -> não muda o nível final, mas adiciona motivo informativo.
 *
 * O nível final é o pior encontrado. Se nenhuma regra casa, retorna
 * "compativel".
 *
 * Esta versão NÃO cria regras automaticamente; o usuário cadastra via
 * tela de configurações (Fase 2.C frontend, futura).
 */
@Injectable()
export class CompatibilidadeMaterialMaquinaService {
  private readonly CATEGORIA = 'compatibilidade_material_maquina';

  constructor(private readonly prisma: PrismaService) {}

  async verificar(
    lojaId: string,
    insumoId: string,
    maquinaId: string,
  ): Promise<ResultadoCompatibilidade> {
    const [insumo, maquina, regras] = await Promise.all([
      this.prisma.insumo.findUnique({
        where: { id: insumoId },
        select: {
          id: true,
          nome: true,
          loja_id: true,
          logica_consumo: true,
          tipoMaterial: { select: { nome: true } },
        },
      }),
      this.prisma.maquina.findUnique({
        where: { id: maquinaId },
        select: {
          id: true,
          nome: true,
          loja_id: true,
          tipo: true,
          modo_producao: true,
        },
      }),
      this.prisma.regraValidacao.findMany({
        where: {
          loja_id: lojaId,
          categoria: this.CATEGORIA,
          ativo: true,
        },
        orderBy: { prioridade: 'asc' },
      }),
    ]);

    if (!insumo) throw new NotFoundException('Insumo não encontrado.');
    if (insumo.loja_id !== lojaId) throw new ForbiddenException('Insumo não pertence a esta loja.');
    if (!maquina) throw new NotFoundException('Máquina não encontrada.');
    if (maquina.loja_id !== lojaId) throw new ForbiddenException('Máquina não pertence a esta loja.');

    const contexto = {
      insumo_tipo_material_nome: insumo.tipoMaterial?.nome ?? null,
      insumo_logica_consumo: String(insumo.logica_consumo),
      maquina_tipo: maquina.tipo,
      maquina_modo_producao: maquina.modo_producao,
    };

    let nivelFinal: NivelCompatibilidade = 'compativel';
    const motivos: string[] = [];
    const regrasAvaliadas: string[] = [];

    for (const regra of regras) {
      regrasAvaliadas.push(regra.nome);
      let condicao: CondicaoCompatibilidade;
      try {
        condicao = typeof regra.condicoes === 'string'
          ? (JSON.parse(regra.condicoes) as CondicaoCompatibilidade)
          : (regra.condicoes as unknown as CondicaoCompatibilidade);
      } catch {
        continue;
      }

      if (!this.condicaoCasaContexto(condicao, contexto)) continue;

      const tipo = (regra.tipo ?? 'INFO').toUpperCase();
      if (tipo === 'BLOQUEIO') {
        nivelFinal = 'bloqueado';
        motivos.push(regra.mensagem);
      } else if (tipo === 'ALERTA') {
        if (nivelFinal !== 'bloqueado') nivelFinal = 'alerta';
        motivos.push(regra.mensagem);
      } else {
        motivos.push(regra.mensagem);
      }
    }

    return {
      insumo_id: insumo.id,
      maquina_id: maquina.id,
      nivel: nivelFinal,
      motivos,
      regras_avaliadas: regrasAvaliadas,
    };
  }

  private condicaoCasaContexto(
    condicao: CondicaoCompatibilidade,
    contexto: {
      insumo_tipo_material_nome: string | null;
      insumo_logica_consumo: string;
      maquina_tipo: string;
      maquina_modo_producao: string;
    },
  ): boolean {
    if (
      condicao.insumo_tipo_material_nome !== undefined &&
      !this.valorCasaFiltro(contexto.insumo_tipo_material_nome, condicao.insumo_tipo_material_nome)
    ) {
      return false;
    }
    if (
      condicao.insumo_logica_consumo !== undefined &&
      !this.valorCasaFiltro(contexto.insumo_logica_consumo, condicao.insumo_logica_consumo)
    ) {
      return false;
    }
    if (
      condicao.maquina_tipo !== undefined &&
      !this.valorCasaFiltro(contexto.maquina_tipo, condicao.maquina_tipo)
    ) {
      return false;
    }
    if (
      condicao.maquina_modo_producao !== undefined &&
      !this.valorCasaFiltro(contexto.maquina_modo_producao, condicao.maquina_modo_producao)
    ) {
      return false;
    }
    return true;
  }

  private valorCasaFiltro(
    valor: string | null,
    filtro: string | string[],
  ): boolean {
    if (valor === null || valor === undefined) return false;
    if (Array.isArray(filtro)) {
      return filtro.map((v) => String(v).toLowerCase()).includes(String(valor).toLowerCase());
    }
    return String(filtro).toLowerCase() === String(valor).toLowerCase();
  }
}
