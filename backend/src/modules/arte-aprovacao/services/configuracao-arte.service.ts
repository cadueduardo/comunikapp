import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  ModeloPrecificacaoArte,
  PoliticaCobrancaArte,
  SERVICO_ARTE_SISTEMA_NOME,
} from '../constants/arte.enums';
import { ARTE_MSG } from '../constants/arte-mensagens';
import { UpsertConfiguracaoArteDto } from '../dto/upsert-configuracao-arte.dto';
import { AuthenticatedUser } from '../../../auth/auth.service';

@Injectable()
export class ConfiguracaoArteService {
  constructor(private readonly prisma: PrismaService) {}

  async obter(lojaId: string) {
    const config = await this.getOrCreate(lojaId);
    const servico = config.servico_arte_id
      ? await this.prisma.servico_manual.findFirst({
          where: { id: config.servico_arte_id, loja_id: lojaId },
        })
      : null;

    return {
      ...config,
      servico_arte: servico,
      configurado: this.isConfigurado(config, servico),
    };
  }

  async obterStatus(lojaId: string) {
    const config = await this.getOrCreate(lojaId);
    const servico = config.servico_arte_id
      ? await this.prisma.servico_manual.findFirst({
          where: { id: config.servico_arte_id, loja_id: lojaId },
        })
      : null;
    const configurado = this.isConfigurado(config, servico);

    return {
      configurado,
      alerta: configurado ? undefined : ARTE_MSG.ALERTA_CUSTO_ZERO,
    };
  }

  async upsert(
    lojaId: string,
    dto: UpsertConfiguracaoArteDto,
    usuario?: AuthenticatedUser,
  ) {
    if (usuario && usuario.funcao !== 'ADMINISTRADOR') {
      throw new ForbiddenException(ARTE_MSG.APENAS_ADMIN_CONFIG);
    }

    const servicoId = await this.ensureServicoSistema(
      lojaId,
      dto.custo_hora_servico,
    );

    const config = await this.prisma.configuracaoArteLoja.upsert({
      where: { loja_id: lojaId },
      create: {
        loja_id: lojaId,
        ativo: dto.ativo,
        modelo_precificacao: dto.modelo_precificacao,
        servico_arte_id: servicoId,
        cobranca_padrao: dto.cobranca_padrao,
        horas_padrao_criacao: dto.horas_padrao_criacao,
        horas_padrao_adaptacao: dto.horas_padrao_adaptacao,
        exibir_linha_pdf: dto.exibir_linha_pdf,
        permitir_edicao_orcamentista: dto.permitir_edicao_orcamentista,
      },
      update: {
        ativo: dto.ativo,
        modelo_precificacao: dto.modelo_precificacao,
        servico_arte_id: servicoId,
        cobranca_padrao: dto.cobranca_padrao,
        horas_padrao_criacao: dto.horas_padrao_criacao,
        horas_padrao_adaptacao: dto.horas_padrao_adaptacao,
        exibir_linha_pdf: dto.exibir_linha_pdf,
        permitir_edicao_orcamentista: dto.permitir_edicao_orcamentista,
        atualizado_em: new Date(),
      },
      include: { servico_arte: true },
    });

    if (dto.custo_hora_servico !== undefined && servicoId) {
      await this.prisma.servico_manual.updateMany({
        where: { id: servicoId, loja_id: lojaId },
        data: {
          custo_hora: dto.custo_hora_servico,
          atualizado_em: new Date(),
        },
      });
    }

    return {
      ...config,
      configurado: this.isConfigurado(config, config.servico_arte),
    };
  }

  async getOrCreate(lojaId: string) {
    const loja = await this.prisma.loja.findUnique({
      where: { id: lojaId },
      select: { id: true },
    });
    if (!loja) {
      throw new NotFoundException(ARTE_MSG.LOJA_NAO_ENCONTRADA);
    }

    let config = await this.prisma.configuracaoArteLoja.findUnique({
      where: { loja_id: lojaId },
      include: { servico_arte: true },
    });

    if (!config) {
      const servicoId = await this.ensureServicoSistema(lojaId);
      config = await this.prisma.configuracaoArteLoja.create({
        data: {
          loja_id: lojaId,
          modelo_precificacao: ModeloPrecificacaoArte.HORA,
          cobranca_padrao: PoliticaCobrancaArte.INCLUIDA_NO_PRODUTO,
          servico_arte_id: servicoId,
        },
        include: { servico_arte: true },
      });
    }

    return config;
  }

  async ensureServicoSistema(
    lojaId: string,
    custoHora?: number,
  ): Promise<string> {
    const existente = await this.prisma.servico_manual.findFirst({
      where: {
        loja_id: lojaId,
        sistema: true,
        nome: SERVICO_ARTE_SISTEMA_NOME,
      },
    });

    if (existente) {
      if (custoHora !== undefined) {
        await this.prisma.servico_manual.update({
          where: { id: existente.id },
          data: { custo_hora: custoHora, atualizado_em: new Date() },
        });
      }
      return existente.id;
    }

    const criado = await this.prisma.servico_manual.create({
      data: {
        nome: SERVICO_ARTE_SISTEMA_NOME,
        descricao:
          'Serviço sistêmico para precificação automática de criação de arte nos orçamentos.',
        custo_hora: custoHora ?? 0,
        loja_id: lojaId,
        sistema: true,
        ativo: true,
        tipo_calculo: 'MANUAL',
        atualizado_em: new Date(),
      },
    });

    return criado.id;
  }

  isConfigurado(
    config: { servico_arte_id: string | null; ativo: boolean },
    servico: { custo_hora: unknown } | null | undefined,
  ): boolean {
    if (!config.ativo || !config.servico_arte_id || !servico) {
      return false;
    }
    const custo = Number(servico.custo_hora);
    return Number.isFinite(custo) && custo > 0;
  }
}
