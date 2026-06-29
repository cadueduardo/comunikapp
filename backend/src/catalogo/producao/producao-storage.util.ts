import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { createReadStream, existsSync, mkdirSync } from 'fs';
import { readFile, unlink, writeFile } from 'fs/promises';
import { join, resolve } from 'path';
import type { Response } from 'express';
import { ARTE_PRODUCAO_URL_PREFIX } from './arte-producao.constants';

export interface ArteProducaoMeta {
  token: string;
  nome_fisico: string;
  mime_type: string;
  tamanho_bytes: number;
  hash_sha256: string;
  loja_id: string;
  item_os_id: string;
  lote_tamanho: number;
  criado_em: string;
}

export class ProducaoStorageUtil {
  private readonly uploadsRoot = resolve(
    process.env.COMUNIKAPP_UPLOADS_DIR || join(process.cwd(), 'uploads'),
  );

  resolverDiretorioLoja(lojaId: string): string {
    const lojaSanitizada = lojaId.replace(/[^a-zA-Z0-9_-]/g, '');
    if (!lojaSanitizada) {
      throw new BadRequestException('Identificador de loja inválido.');
    }
    return join(this.uploadsRoot, lojaSanitizada, 'producao');
  }

  resolverCaminhoSeguro(lojaId: string, nomeFisico: string): string {
    const base = this.resolverDiretorioLoja(lojaId);
    const nomeSeguro = nomeFisico.replace(/[^a-zA-Z0-9._-]/g, '');
    const caminho = resolve(base, nomeSeguro);

    if (!caminho.startsWith(resolve(base))) {
      throw new ForbiddenException('Caminho de arquivo inválido.');
    }

    return caminho;
  }

  urlInternaRelativa(token: string): string {
    const tokenSeguro = token.replace(/[^a-zA-Z0-9-]/g, '');
    return `${ARTE_PRODUCAO_URL_PREFIX}/${tokenSeguro}`;
  }

  extrairTokenDaUrl(url: string | null | undefined): string | null {
    if (!url?.startsWith(ARTE_PRODUCAO_URL_PREFIX + '/')) {
      return null;
    }
    return url.split('/').pop() ?? null;
  }

  async persistirArquivo(args: {
    lojaId: string;
    itemOsId: string;
    conteudo: Uint8Array;
    loteTamanho: number;
  }): Promise<{ urlRelativa: string; meta: ArteProducaoMeta }> {
    const dir = this.resolverDiretorioLoja(args.lojaId);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    const token = randomUUID();
    const nomeFisico = `prod_${token.replace(/-/g, '')}.pdf`;
    const caminhoFisico = this.resolverCaminhoSeguro(args.lojaId, nomeFisico);
    const caminhoMeta = join(dir, `${token}.json`);
    const hash = createHash('sha256').update(args.conteudo).digest('hex');

    await writeFile(caminhoFisico, args.conteudo);

    const meta: ArteProducaoMeta = {
      token,
      nome_fisico: nomeFisico,
      mime_type: 'application/pdf',
      tamanho_bytes: args.conteudo.length,
      hash_sha256: hash,
      loja_id: args.lojaId,
      item_os_id: args.itemOsId,
      lote_tamanho: args.loteTamanho,
      criado_em: new Date().toISOString(),
    };

    await writeFile(caminhoMeta, JSON.stringify(meta, null, 2));

    return {
      urlRelativa: this.urlInternaRelativa(token),
      meta,
    };
  }

  async carregarMeta(token: string, lojaId: string): Promise<ArteProducaoMeta> {
    const tokenSeguro = token.replace(/[^a-zA-Z0-9-]/g, '');
    const caminhoMeta = join(
      this.resolverDiretorioLoja(lojaId),
      `${tokenSeguro}.json`,
    );

    if (!existsSync(caminhoMeta)) {
      throw new NotFoundException('Arte de produção não encontrada.');
    }

    const raw = await readFile(caminhoMeta, 'utf8');
    const meta = JSON.parse(raw) as ArteProducaoMeta;

    if (meta.loja_id !== lojaId) {
      throw new NotFoundException('Arte de produção não encontrada.');
    }

    return meta;
  }

  async servirArquivo(
    token: string,
    lojaId: string,
    res: Response,
    nomeDownload: string,
  ): Promise<void> {
    const meta = await this.carregarMeta(token, lojaId);
    const caminhoFisico = this.resolverCaminhoSeguro(lojaId, meta.nome_fisico);

    if (!existsSync(caminhoFisico)) {
      throw new NotFoundException('Arquivo de arte de produção não encontrado.');
    }

    res.setHeader('Content-Type', meta.mime_type);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${nomeDownload.replace(/[^a-zA-Z0-9._-]/g, '_')}"`,
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');

    createReadStream(caminhoFisico).pipe(res);
  }

  async removerArquivosPorToken(token: string, lojaId: string): Promise<void> {
    try {
      const meta = await this.carregarMeta(token, lojaId);
      const caminhoFisico = this.resolverCaminhoSeguro(lojaId, meta.nome_fisico);
      const caminhoMeta = join(
        this.resolverDiretorioLoja(lojaId),
        `${meta.token}.json`,
      );
      await unlink(caminhoFisico).catch(() => undefined);
      await unlink(caminhoMeta).catch(() => undefined);
    } catch {
      // idempotente
    }
  }

  async removerArquivoParcial(caminhoFisico: string | null): Promise<void> {
    if (!caminhoFisico) return;
    await unlink(caminhoFisico).catch(() => undefined);
  }
}
