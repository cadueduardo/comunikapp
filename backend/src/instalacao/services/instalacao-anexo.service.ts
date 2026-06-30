import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { randomUUID, createHash } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { join, resolve } from 'path';
import {
  INSTALACAO_ANEXO_LIMITE_BYTES,
  classificarAnexoInstalacao,
} from '../../config/multer-instalacao-anexo.config';

/**
 * Persistência de evidências e assinaturas de instalação.
 * Layout: <COMUNIKAPP_ANEXOS_DIR>/instalacao/<loja_id>/<token>.<ext>
 */
@Injectable()
export class InstalacaoAnexoService {
  private readonly logger = new Logger(InstalacaoAnexoService.name);

  private readonly baseDir = resolve(
    process.env.COMUNIKAPP_ANEXOS_DIR ||
      join(process.cwd(), 'uploads', 'anexos'),
    'instalacao',
  );

  constructor() {
    if (!existsSync(this.baseDir)) {
      mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async salvar(args: {
    arquivo: Express.Multer.File;
    lojaId: string;
    usuarioId: string;
  }): Promise<{ token: string; url: string }> {
    const { arquivo, lojaId, usuarioId } = args;

    if (!arquivo?.buffer?.length) {
      throw new BadRequestException('Nenhum arquivo recebido');
    }

    const extensao = classificarAnexoInstalacao(
      arquivo.mimetype,
      arquivo.originalname,
    );
    if (!extensao) {
      throw new BadRequestException(
        'Formato não permitido. Aceitos: PNG, JPEG e WebP.',
      );
    }

    if (arquivo.size > INSTALACAO_ANEXO_LIMITE_BYTES) {
      throw new PayloadTooLargeException(
        'Arquivo excede o limite de 5 MB.',
      );
    }

    const lojaDir = join(this.baseDir, lojaId);
    if (!existsSync(lojaDir)) {
      mkdirSync(lojaDir, { recursive: true });
    }

    const token = randomUUID();
    const nomeFisico = `${token}${extensao}`;
    const caminhoFisico = join(lojaDir, nomeFisico);
    const caminhoMeta = join(lojaDir, `${token}.json`);

    const hash = createHash('sha256').update(arquivo.buffer).digest('hex');

    await writeFile(caminhoFisico, arquivo.buffer);
    await writeFile(
      caminhoMeta,
      JSON.stringify({
        loja_id: lojaId,
        usuario_id: usuarioId,
        nome_original: arquivo.originalname,
        mime_type: arquivo.mimetype,
        tamanho: arquivo.size,
        hash,
        criado_em: new Date().toISOString(),
      }),
      'utf-8',
    );

    const url = `/instalacao/anexos/${token}`;
    this.logger.log(`Anexo de instalação salvo: ${token} (loja ${lojaId})`);

    return { token, url };
  }

  async ler(args: {
    token: string;
    lojaId: string;
  }): Promise<{ buffer: Buffer; mimeType: string; nomeOriginal: string }> {
    const metaPath = join(this.baseDir, args.lojaId, `${args.token}.json`);

    if (!existsSync(metaPath)) {
      throw new NotFoundException('Anexo não encontrado.');
    }

    const metaRaw = await readFile(metaPath, 'utf-8');
    const meta = JSON.parse(metaRaw) as {
      loja_id: string;
      nome_original: string;
      mime_type: string;
    };

    if (meta.loja_id !== args.lojaId) {
      throw new ForbiddenException('Acesso negado ao anexo.');
    }

    const extensoes = ['.png', '.jpg', '.webp'];
    let caminhoFisico: string | null = null;

    for (const ext of extensoes) {
      const candidato = join(this.baseDir, args.lojaId, `${args.token}${ext}`);
      if (existsSync(candidato)) {
        caminhoFisico = candidato;
        break;
      }
    }

    if (!caminhoFisico) {
      throw new NotFoundException('Arquivo físico não encontrado.');
    }

    const buffer = await readFile(caminhoFisico);
    return {
      buffer,
      mimeType: meta.mime_type || 'image/png',
      nomeOriginal: meta.nome_original || `${args.token}.png`,
    };
  }
}
