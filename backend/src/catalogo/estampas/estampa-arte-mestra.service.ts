import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { createReadStream, existsSync, mkdirSync } from 'fs';
import { readFile, unlink, writeFile } from 'fs/promises';
import { join, resolve } from 'path';
import type { Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import {
  classificarArteMestraEstampa,
  ESTAMPA_ARTE_MESTRA_LIMITE_BYTES,
  sanitizarNomeOriginal,
} from '../../config/multer-estampa-arte-mestra.config';
import { normalizeMultipartFilename } from '../../common/utils/multipart-filename.util';
import { assertEstampaDaLoja } from '../common/utils/catalogo-tenant.util';

interface ArteMestraMeta {
  token: string;
  nome_fisico: string;
  nome_original_sanitizado: string;
  mime_type: string;
  tamanho_bytes: number;
  hash_sha256: string;
  loja_id: string;
  estampa_id: string;
  criado_em: string;
}

@Injectable()
export class EstampaArteMestraService {
  private readonly logger = new Logger(EstampaArteMestraService.name);

  private readonly uploadsRoot = resolve(
    process.env.COMUNIKAPP_UPLOADS_DIR || join(process.cwd(), 'uploads'),
  );

  constructor(private readonly prisma: PrismaService) {}

  async upload(args: {
    estampaId: string;
    lojaId: string;
    arquivo: Express.Multer.File;
  }) {
    const { estampaId, lojaId, arquivo } = args;

    await assertEstampaDaLoja(this.prisma, estampaId, lojaId);

    if (!arquivo) {
      throw new BadRequestException('Nenhum arquivo recebido.');
    }

    const nomeOriginal = normalizeMultipartFilename(arquivo.originalname);
    const extensao = classificarArteMestraEstampa(
      arquivo.mimetype,
      nomeOriginal,
    );

    if (!extensao) {
      throw new BadRequestException(
        'Formato não permitido. Aceitos: PDF, PNG, JPEG e SVG.',
      );
    }

    if (arquivo.size > ESTAMPA_ARTE_MESTRA_LIMITE_BYTES) {
      throw new PayloadTooLargeException(
        'Arte-mestra excede o limite de 15 MB.',
      );
    }

    const lojaDir = this.resolverDiretorioLoja(lojaId);
    if (!existsSync(lojaDir)) {
      mkdirSync(lojaDir, { recursive: true });
    }

    const estampaAtual = await this.prisma.estampa.findFirst({
      where: { id: estampaId, loja_id: lojaId },
      select: { arte_mestra_url: true },
    });

    const token = randomUUID();
    const nomeFisico = `${token}${extensao}`;
    const caminhoFisico = this.resolverCaminhoSeguro(lojaId, nomeFisico);
    const caminhoMeta = join(lojaDir, `${token}.json`);
    const hash = createHash('sha256').update(arquivo.buffer).digest('hex');

    await writeFile(caminhoFisico, arquivo.buffer);

    const meta: ArteMestraMeta = {
      token,
      nome_fisico: nomeFisico,
      nome_original_sanitizado: sanitizarNomeOriginal(nomeOriginal),
      mime_type: arquivo.mimetype,
      tamanho_bytes: arquivo.size,
      hash_sha256: hash,
      loja_id: lojaId,
      estampa_id: estampaId,
      criado_em: new Date().toISOString(),
    };

    await writeFile(caminhoMeta, JSON.stringify(meta, null, 2));

    const urlRelativa = `/catalogo/estampas/arte-mestra/${token}`;

    await this.prisma.estampa.updateMany({
      where: { id: estampaId, loja_id: lojaId },
      data: { arte_mestra_url: urlRelativa },
    });

    await this.removerArquivoAnterior(estampaAtual?.arte_mestra_url, lojaId);

    this.logger.log(
      `Arte-mestra enviada: estampa=${estampaId} loja=${lojaId} token=${token}`,
    );

    return {
      estampa_id: estampaId,
      arte_mestra_url: urlRelativa,
      token,
      tamanho_bytes: arquivo.size,
      mime_type: arquivo.mimetype,
    };
  }

  async servir(token: string, lojaId: string, res: Response) {
    const meta = await this.carregarMeta(token, lojaId);
    const caminhoFisico = this.resolverCaminhoSeguro(
      lojaId,
      meta.nome_fisico,
    );

    if (!existsSync(caminhoFisico)) {
      throw new NotFoundException('Arquivo de arte-mestra não encontrado.');
    }

    res.setHeader('Content-Type', meta.mime_type);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${meta.nome_original_sanitizado}"`,
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');

    if (meta.mime_type === 'image/svg+xml') {
      res.setHeader('Content-Security-Policy', "default-src 'none'");
    }

    createReadStream(caminhoFisico).pipe(res);
  }

  private resolverDiretorioLoja(lojaId: string): string {
    const lojaSanitizada = lojaId.replace(/[^a-zA-Z0-9_-]/g, '');
    if (!lojaSanitizada) {
      throw new BadRequestException('Identificador de loja inválido.');
    }
    return join(this.uploadsRoot, lojaSanitizada, 'estampas');
  }

  private resolverCaminhoSeguro(lojaId: string, nomeFisico: string): string {
    const base = this.resolverDiretorioLoja(lojaId);
    const nomeSeguro = nomeFisico.replace(/[^a-zA-Z0-9._-]/g, '');
    const caminho = resolve(base, nomeSeguro);

    if (!caminho.startsWith(resolve(base))) {
      throw new ForbiddenException('Caminho de arquivo inválido.');
    }

    return caminho;
  }

  private async carregarMeta(
    token: string,
    lojaId: string,
  ): Promise<ArteMestraMeta> {
    const tokenSeguro = token.replace(/[^a-zA-Z0-9-]/g, '');
    const caminhoMeta = join(
      this.resolverDiretorioLoja(lojaId),
      `${tokenSeguro}.json`,
    );

    if (!existsSync(caminhoMeta)) {
      throw new NotFoundException('Arte-mestra não encontrada.');
    }

    const raw = await readFile(caminhoMeta, 'utf8');
    const meta = JSON.parse(raw) as ArteMestraMeta;

    if (meta.loja_id !== lojaId) {
      throw new NotFoundException('Arte-mestra não encontrada.');
    }

    return meta;
  }

  private async removerArquivoAnterior(
    urlAnterior: string | null | undefined,
    lojaId: string,
  ) {
    if (!urlAnterior) return;

    const token = urlAnterior.split('/').pop();
    if (!token) return;

    try {
      const meta = await this.carregarMeta(token, lojaId);
      const caminhoFisico = this.resolverCaminhoSeguro(
        lojaId,
        meta.nome_fisico,
      );
      const caminhoMeta = join(
        this.resolverDiretorioLoja(lojaId),
        `${meta.token}.json`,
      );

      await unlink(caminhoFisico).catch(() => undefined);
      await unlink(caminhoMeta).catch(() => undefined);
    } catch {
      // arquivo anterior já removido ou token inválido — ignorar
    }
  }
}
