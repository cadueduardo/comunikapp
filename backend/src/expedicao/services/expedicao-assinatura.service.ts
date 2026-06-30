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
  EXPEDICAO_ASSINATURA_LIMITE_BYTES,
  classificarAssinaturaExpedicao,
} from '../../config/multer-expedicao-assinatura.config';

/**
 * Persistência de assinaturas de entrega (PNG/WebP) no disco.
 *
 * Layout: <COMUNIKAPP_ANEXOS_DIR>/expedicao/<loja_id>/<token>.<ext>
 * URL relativa: /expedicao/assinaturas/<token>
 */
@Injectable()
export class ExpedicaoAssinaturaService {
  private readonly logger = new Logger(ExpedicaoAssinaturaService.name);

  private readonly baseDir = resolve(
    process.env.COMUNIKAPP_ANEXOS_DIR ||
      join(process.cwd(), 'uploads', 'anexos'),
    'expedicao',
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

    const extensao = classificarAssinaturaExpedicao(
      arquivo.mimetype,
      arquivo.originalname,
    );
    if (!extensao) {
      throw new BadRequestException(
        'Formato não permitido. Aceitos: PNG e WebP.',
      );
    }

    if (arquivo.size > EXPEDICAO_ASSINATURA_LIMITE_BYTES) {
      throw new PayloadTooLargeException(
        'Assinatura excede o limite de 500 KB.',
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
      JSON.stringify(
        {
          token,
          nome_arquivo: nomeFisico,
          nome_original: arquivo.originalname,
          mime_type: arquivo.mimetype,
          tamanho_bytes: arquivo.size,
          hash_sha256: hash,
          loja_id: lojaId,
          criado_por: usuarioId,
          criado_em: new Date().toISOString(),
        },
        null,
        2,
      ),
    );

    this.logger.log(
      `Assinatura de expedição gravada: loja=${lojaId} token=${token} (${arquivo.size} bytes)`,
    );

    return {
      token,
      url: `/expedicao/assinaturas/${token}`,
    };
  }

  async ler(args: {
    token: string;
    lojaId: string;
  }): Promise<{ buffer: Buffer; mimeType: string; nomeOriginal: string }> {
    const { token, lojaId } = args;
    this.validarToken(token);

    const meta = await this.lerMetadados(token, lojaId);
    const caminho = join(this.baseDir, lojaId, meta.nome_arquivo);
    if (!existsSync(caminho)) {
      throw new NotFoundException('Assinatura não encontrada');
    }

    const buffer = await readFile(caminho);
    return {
      buffer,
      mimeType: meta.mime_type,
      nomeOriginal: meta.nome_original,
    };
  }

  extrairToken(url: string | null | undefined): string | null {
    if (!url) return null;
    const match = url.match(/\/expedicao\/assinaturas\/([0-9a-f-]{36})$/i);
    return match ? match[1] : null;
  }

  private validarToken(token: string): void {
    if (!/^[0-9a-f-]{36}$/i.test(token)) {
      throw new BadRequestException('Token de assinatura inválido');
    }
  }

  private async lerMetadados(
    token: string,
    lojaId: string,
  ): Promise<MetadadosAssinatura> {
    const caminhoMeta = join(this.baseDir, lojaId, `${token}.json`);
    if (!existsSync(caminhoMeta)) {
      if (this.detectarTokenEmOutraLoja(token, lojaId)) {
        throw new ForbiddenException('Assinatura pertence a outra loja');
      }
      throw new NotFoundException('Assinatura não encontrada');
    }

    try {
      const conteudo = await readFile(caminhoMeta, 'utf-8');
      const parsed = JSON.parse(conteudo) as MetadadosAssinatura;
      if (parsed.loja_id !== lojaId) {
        throw new ForbiddenException('Assinatura pertence a outra loja');
      }
      return parsed;
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      throw new NotFoundException('Assinatura inválida');
    }
  }

  private detectarTokenEmOutraLoja(
    token: string,
    lojaIdAtual: string,
  ): boolean {
    try {
      const fs = require('fs') as typeof import('fs');
      const lojas = fs
        .readdirSync(this.baseDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .filter((nome) => nome !== lojaIdAtual);

      for (const loja of lojas) {
        const candidato = join(this.baseDir, loja, `${token}.json`);
        if (existsSync(candidato)) {
          return true;
        }
      }
    } catch {
      // diretório inexistente
    }
    return false;
  }
}

interface MetadadosAssinatura {
  token: string;
  nome_arquivo: string;
  nome_original: string;
  mime_type: string;
  tamanho_bytes: number;
  hash_sha256: string;
  loja_id: string;
  criado_por: string;
  criado_em: string;
}
