import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfiguracaoInstalacaoLoja } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TaxaOcorrenciaLojaSeeder } from '../seeders/taxa-ocorrencia-loja.seeder';

export interface GarantirConfiguracaoInstalacaoResultado {
  configuracao: ConfiguracaoInstalacaoLoja;
  taxas: {
    criadas: string[];
    ignoradas: string[];
  };
}

/**
 * Configuração comercial e operacional do módulo de instalações por loja.
 */
@Injectable()
export class ConfiguracaoInstalacaoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly taxaOcorrenciaSeeder: TaxaOcorrenciaLojaSeeder,
  ) {}

  async obter(lojaId: string): Promise<ConfiguracaoInstalacaoLoja> {
    const configuracao =
      await this.prisma.configuracaoInstalacaoLoja.findUnique({
        where: { loja_id: lojaId },
      });

    if (!configuracao) {
      throw new NotFoundException(
        'Configuração de instalação não encontrada para esta loja.',
      );
    }

    return configuracao;
  }

  async getOrCreate(lojaId: string): Promise<ConfiguracaoInstalacaoLoja> {
    return this.prisma.configuracaoInstalacaoLoja.upsert({
      where: { loja_id: lojaId },
      create: {
        loja_id: lojaId,
        exigir_sinal_producao: false,
      },
      update: {},
    });
  }

  /**
   * Garante configuração da loja e taxas padrão de ocorrências (idempotente).
   * Chamado no onboarding e na criação de novas lojas.
   */
  async garantirConfiguracaoInicial(
    lojaId: string,
  ): Promise<GarantirConfiguracaoInstalacaoResultado> {
    const configuracao = await this.getOrCreate(lojaId);
    const taxas = await this.taxaOcorrenciaSeeder.seed(lojaId);

    return { configuracao, taxas };
  }

  async atualizarExigirSinalProducao(
    lojaId: string,
    exigir: boolean,
  ): Promise<ConfiguracaoInstalacaoLoja> {
    await this.getOrCreate(lojaId);

    return this.prisma.configuracaoInstalacaoLoja.update({
      where: { loja_id: lojaId },
      data: { exigir_sinal_producao: exigir },
    });
  }

  async deveExigirSinalProducao(lojaId: string): Promise<boolean> {
    const configuracao =
      await this.prisma.configuracaoInstalacaoLoja.findUnique({
        where: { loja_id: lojaId },
        select: { exigir_sinal_producao: true },
      });

    return configuracao?.exigir_sinal_producao === true;
  }
}
