import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  LojaConexaoStatus,
  LojaConexaoTipo,
} from '../constants/conexao-tipos.enum';
import { GoogleDriveConexaoConfig } from '../interfaces/google-drive-config.interface';
import { FieldEncryptionService } from '../../common/services/field-encryption.service';

export interface LojaConexaoPublica {
  tipo: LojaConexaoTipo;
  status: LojaConexaoStatus;
  google_email?: string;
  google_name?: string;
  connected_at?: string;
  mensagem_erro?: string;
}

@Injectable()
export class LojaConexaoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: FieldEncryptionService,
  ) {}

  async listarPublicas(lojaId: string): Promise<LojaConexaoPublica[]> {
    const registros = await this.prisma.lojaConexao.findMany({
      where: { loja_id: lojaId },
      orderBy: { tipo: 'asc' },
    });

    const tiposConhecidos = Object.values(LojaConexaoTipo);
    const mapa = new Map(registros.map((r) => [r.tipo, r]));

    return tiposConhecidos.map((tipo) => {
      const registro = mapa.get(tipo);
      if (!registro) {
        return {
          tipo,
          status: LojaConexaoStatus.DESCONECTADO,
        };
      }
      return this.formatarPublico(registro);
    });
  }

  async obterPorTipo(lojaId: string, tipo: LojaConexaoTipo) {
    return this.prisma.lojaConexao.findUnique({
      where: {
        loja_id_tipo: { loja_id: lojaId, tipo },
      },
    });
  }

  async obterGoogleDriveConfig(
    lojaId: string,
  ): Promise<GoogleDriveConexaoConfig | null> {
    const registro = await this.obterPorTipo(lojaId, LojaConexaoTipo.GOOGLE_DRIVE);
    if (!registro || registro.status !== LojaConexaoStatus.CONECTADO) {
      return null;
    }
    const json = registro.configuracao_json as unknown as GoogleDriveConexaoConfig | null;
    if (!json?.refresh_token_encrypted) {
      return null;
    }
    return json;
  }

  getRefreshToken(config: GoogleDriveConexaoConfig): string {
    return this.encryption.decrypt(config.refresh_token_encrypted);
  }

  async salvarGoogleDriveConexao(
    lojaId: string,
    params: {
      refreshToken: string;
      googleEmail?: string;
      googleName?: string;
      rootFolderId?: string;
      userId: string;
    },
  ) {
    const configuracao: GoogleDriveConexaoConfig = {
      refresh_token_encrypted: this.encryption.encrypt(params.refreshToken),
      google_email: params.googleEmail,
      google_name: params.googleName,
      root_folder_id: params.rootFolderId,
      connected_at: new Date().toISOString(),
      connected_by_user_id: params.userId,
    };

    return this.prisma.lojaConexao.upsert({
      where: {
        loja_id_tipo: {
          loja_id: lojaId,
          tipo: LojaConexaoTipo.GOOGLE_DRIVE,
        },
      },
      create: {
        loja_id: lojaId,
        tipo: LojaConexaoTipo.GOOGLE_DRIVE,
        status: LojaConexaoStatus.CONECTADO,
        configuracao_json: configuracao as unknown as Prisma.InputJsonValue,
      },
      update: {
        status: LojaConexaoStatus.CONECTADO,
        configuracao_json: configuracao as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async atualizarRootFolderId(lojaId: string, rootFolderId: string) {
    const registro = await this.obterPorTipo(lojaId, LojaConexaoTipo.GOOGLE_DRIVE);
    if (!registro?.configuracao_json) {
      throw new NotFoundException('Conexão Google Drive não encontrada');
    }
    const atual = registro.configuracao_json as unknown as GoogleDriveConexaoConfig;
    const configuracao: GoogleDriveConexaoConfig = {
      ...atual,
      root_folder_id: rootFolderId,
    };
    await this.prisma.lojaConexao.update({
      where: { id: registro.id },
      data: {
        configuracao_json: configuracao as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async desconectar(lojaId: string, tipo: LojaConexaoTipo) {
    await this.prisma.lojaConexao.upsert({
      where: {
        loja_id_tipo: { loja_id: lojaId, tipo },
      },
      create: {
        loja_id: lojaId,
        tipo,
        status: LojaConexaoStatus.DESCONECTADO,
        configuracao_json: Prisma.JsonNull,
      },
      update: {
        status: LojaConexaoStatus.DESCONECTADO,
        configuracao_json: Prisma.JsonNull,
      },
    });
  }

  private formatarPublico(registro: {
    tipo: string;
    status: string;
    configuracao_json: unknown;
  }): LojaConexaoPublica {
    const config = registro.configuracao_json as unknown as GoogleDriveConexaoConfig | null;
    return {
      tipo: registro.tipo as LojaConexaoTipo,
      status: registro.status as LojaConexaoStatus,
      google_email: config?.google_email,
      google_name: config?.google_name,
      connected_at: config?.connected_at,
    };
  }
}
