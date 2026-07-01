import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { GoogleDriveStorageService } from '../../../conexoes/services/google-drive-storage.service';
import { LojaConexaoService } from '../../../conexoes/services/loja-conexao.service';

@Injectable()
export class ArteDriveFolderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lojaConexaoService: LojaConexaoService,
    private readonly driveStorage: GoogleDriveStorageService,
  ) {}

  /**
   * Garante pasta Comunikapp/{Cliente}/OS-{numero}/{produto} no Drive da loja.
   */
  async resolverPastaItemVersao(
    lojaId: string,
    versaoId: string,
  ): Promise<string> {
    const versao = await this.prisma.arteVersao.findFirst({
      where: { id: versaoId, loja_id: lojaId, deletado: false },
      select: {
        os_id: true,
        servico_id: true,
      },
    });

    if (!versao) {
      throw new NotFoundException('Versão de arte não encontrada');
    }

    const itemId = versao.servico_id;
    if (!itemId) {
      throw new BadRequestException(
        'Versão sem item de OS vinculado — não é possível resolver pasta no Drive',
      );
    }

    const item = await this.prisma.itemOS.findFirst({
      where: { id: itemId, os_id: versao.os_id },
      select: {
        id: true,
        produto_servico: true,
        arte_drive_folder_id: true,
        os: {
          select: {
            numero: true,
            cliente: { select: { nome: true } },
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Item da OS não encontrado');
    }

    if (item.arte_drive_folder_id) {
      return item.arte_drive_folder_id;
    }

    const config = await this.lojaConexaoService.obterGoogleDriveConfig(lojaId);
    if (!config?.root_folder_id) {
      throw new BadRequestException(
        'Google Drive não conectado. Configure em Configurações → Conexões.',
      );
    }

    const refreshToken = this.lojaConexaoService.getRefreshToken(config);
    const clienteNome = item.os.cliente?.nome ?? 'Cliente';
    const osNumero = item.os.numero ?? versao.os_id.slice(-6);
    const produtoNome = item.produto_servico ?? 'Produto';

    const folderId = await this.driveStorage.ensureFolderPath(
      refreshToken,
      config.root_folder_id,
      [clienteNome, `OS-${osNumero}`, produtoNome],
    );

    await this.prisma.itemOS.update({
      where: { id: item.id },
      data: { arte_drive_folder_id: folderId },
    });

    return folderId;
  }
}
