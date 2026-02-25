import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { loja } from '@prisma/client';

@Injectable()
export class ServicosManuaisService {
  constructor(private readonly prisma: PrismaService) {}

  private toNumber(value: any): number | null {
    if (value === undefined || value === null || value === '') return null;
    if (typeof value === 'number') return value;
    const unified = String(value).trim().replace(/\s+/g, '').replace(',', '.');
    const clean = unified.replace(/[^0-9.\-]/g, '');
    const n = parseFloat(clean);
    return isNaN(n) ? null : n;
  }

  async create(dto: any, lojaCtx: loja) {
    const payload: any = {
      nome: dto.nome,
      descricao: dto.descricao ?? null,
      custo_hora: this.toNumber(dto.custo_hora) ?? 0,
      loja_id: lojaCtx.id,
      tipo_calculo: dto.tipo_calculo ?? 'MANUAL',
      horas_por_m2: this.toNumber(dto.horas_por_m2),
      horas_por_unidade: this.toNumber(dto.horas_por_unidade),
      eficiencia_percent: this.toNumber(dto.eficiencia_percent),
      atualizado_em: new Date(),
    };

    // Adicionar novos campos se fornecidos (compatibilidade com schema futuro)
    if (dto.setup_min !== undefined) {
      payload.setup_min = this.toNumber(dto.setup_min);
    }

    if (dto.categorias !== undefined) {
      payload.categorias = dto.categorias
        ? JSON.stringify(dto.categorias)
        : null;
    }

    if (dto.setor_id !== undefined) {
      payload.setor_id = dto.setor_id || null;
    }

    return this.prisma.servico_manual.create({ data: payload });
  }

  async findAll(lojaCtx: loja) {
    const servicos = await this.prisma.servico_manual.findMany({
      where: { loja_id: lojaCtx.id },
      orderBy: { criado_em: 'desc' },
    });

    // Parse das categorias JSON para objetos
    return servicos.map((servico) => ({
      ...servico,
      categorias: (servico as any).categorias
        ? JSON.parse((servico as any).categorias)
        : null,
    }));
  }

  async findOne(id: string, lojaCtx: loja) {
    const servico = await this.prisma.servico_manual.findFirst({
      where: { id, loja_id: lojaCtx.id },
    });
    if (!servico) return null;

    // Parse das categorias JSON para objeto
    return {
      ...servico,
      categorias: (servico as any).categorias
        ? JSON.parse((servico as any).categorias)
        : null,
    };
  }

  async update(id: string, dto: any, lojaCtx: loja) {
    const data: any = {
      nome: dto.nome,
      descricao: dto.descricao ?? null,
      custo_hora: this.toNumber(dto.custo_hora) ?? undefined,
      tipo_calculo: dto.tipo_calculo,
      horas_por_m2: this.toNumber(dto.horas_por_m2),
      horas_por_unidade: this.toNumber(dto.horas_por_unidade),
      eficiencia_percent: this.toNumber(dto.eficiencia_percent),
      atualizado_em: new Date(),
    };

    // Adicionar novos campos se fornecidos (compatibilidade com schema futuro)
    if (dto.setup_min !== undefined) {
      data.setup_min = this.toNumber(dto.setup_min);
    }

    if (dto.categorias !== undefined) {
      data.categorias = dto.categorias ? JSON.stringify(dto.categorias) : null;
    }

    if (dto.setor_id !== undefined) {
      data.setor_id = dto.setor_id || null;
    }

    return this.prisma.servico_manual.update({ where: { id }, data });
  }

  async remove(id: string, lojaCtx: loja) {
    // Garantir que pertence à loja
    const exists = await this.prisma.servico_manual.findFirst({
      where: { id, loja_id: lojaCtx.id },
    });
    if (!exists) return { ok: true };
    await this.prisma.servico_manual.delete({ where: { id } });
    return { ok: true };
  }
}
