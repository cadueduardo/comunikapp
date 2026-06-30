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
import { unlink, readFile, writeFile } from 'fs/promises';
import { extname, join, resolve } from 'path';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import {
  classificarImagemProdutoFinito,
  PRODUTO_FINITO_IMAGEM_LIMITE_BYTES,
  PRODUTO_FINITO_MAX_IMAGENS,
} from '../config/multer-produto-finito-imagem.config';

@Injectable()
export class ProdutoFinitoImagemService {
  private readonly logger = new Logger(ProdutoFinitoImagemService.name);

  private readonly baseDir = resolve(
    process.env.COMUNIKAPP_ANEXOS_DIR ||
      join(process.cwd(), 'uploads', 'anexos'),
    'produtos-finitos',
  );

  constructor(private readonly prisma: PrismaService) {
    if (!existsSync(this.baseDir)) {
      mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async upload(args: {
    produtoId: string;
    lojaId: string;
    usuarioId: string;
    arquivo: Express.Multer.File;
  }) {
    const { produtoId, lojaId, usuarioId, arquivo } = args;

    const produto = await this.prisma.produtoFinito.findFirst({
      where: { id: produtoId, loja_id: lojaId },
      include: { imagens: { orderBy: { ordem: 'asc' } } },
    });

    if (!produto) {
      throw new NotFoundException('Produto não encontrado.');
    }

    if (produto.imagens.length >= PRODUTO_FINITO_MAX_IMAGENS) {
      throw new BadRequestException(
        `Limite de ${PRODUTO_FINITO_MAX_IMAGENS} imagens por produto atingido.`,
      );
    }

    if (!arquivo) {
      throw new BadRequestException('Nenhum arquivo recebido.');
    }

    const extensao = classificarImagemProdutoFinito(
      arquivo.mimetype,
      arquivo.originalname,
    );
    if (!extensao) {
      throw new BadRequestException(
        'Formato não permitido. Aceitos: PNG, JPG, JPEG, WEBP e GIF.',
      );
    }

    if (arquivo.size > PRODUTO_FINITO_IMAGEM_LIMITE_BYTES) {
      throw new PayloadTooLargeException('Imagem excede o limite de 5 MB.');
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
          nome_fisico: nomeFisico,
          mime_type: arquivo.mimetype,
          tamanho_bytes: arquivo.size,
          hash_sha256: hash,
          loja_id: lojaId,
          produto_finito_id: produtoId,
          criado_por: usuarioId,
          criado_em: new Date().toISOString(),
        },
        null,
        2,
      ),
    );

    const proximaOrdem =
      produto.imagens.length > 0
        ? Math.max(...produto.imagens.map((img) => img.ordem)) + 1
        : 0;

    const urlImagem = `/produtos-finitos/imagens/${token}`;
    const imagem = await this.prisma.galeriaProdutoFinito.create({
      data: {
        produto_finito_id: produtoId,
        url_imagem: urlImagem,
        ordem: proximaOrdem,
      },
    });

    this.logger.log(
      `Imagem de produto gravada: loja=${lojaId} produto=${produtoId} token=${token}`,
    );

    return {
      ...imagem,
      url: urlImagem,
      token,
    };
  }

  async servirImagem(token: string, lojaId: string, res: Response) {
    const metadados = await this.lerMetadados(token, lojaId);
    const caminhoFisico = join(
      this.baseDir,
      lojaId,
      metadados.nome_fisico as string,
    );

    if (!existsSync(caminhoFisico)) {
      throw new NotFoundException('Arquivo de imagem não encontrado.');
    }

    res.setHeader(
      'Content-Type',
      String(metadados.mime_type || 'application/octet-stream'),
    );
    res.setHeader('Cache-Control', 'private, max-age=3600');

    return new Promise<void>((resolvePromise, reject) => {
      const stream = createReadStream(caminhoFisico);
      stream.on('error', reject);
      stream.on('end', () => resolvePromise());
      stream.pipe(res);
    });
  }

  async removerImagem(args: {
    produtoId: string;
    imagemId: string;
    lojaId: string;
  }) {
    const produto = await this.prisma.produtoFinito.findFirst({
      where: { id: args.produtoId, loja_id: args.lojaId },
    });
    if (!produto) {
      throw new NotFoundException('Produto não encontrado.');
    }

    const imagem = await this.prisma.galeriaProdutoFinito.findFirst({
      where: { id: args.imagemId, produto_finito_id: args.produtoId },
    });
    if (!imagem) {
      throw new NotFoundException('Imagem não encontrada.');
    }

    const token = this.extrairTokenDaUrl(imagem.url_imagem);
    if (token) {
      await this.removerArquivosFisicos(token, args.lojaId);
    }

    await this.prisma.galeriaProdutoFinito.delete({
      where: { id: imagem.id },
    });

    return { sucesso: true };
  }

  async reordenarImagens(args: {
    produtoId: string;
    lojaId: string;
    imagemIds: string[];
  }) {
    const produto = await this.prisma.produtoFinito.findFirst({
      where: { id: args.produtoId, loja_id: args.lojaId },
      include: { imagens: true },
    });
    if (!produto) {
      throw new NotFoundException('Produto não encontrado.');
    }

    const idsExistentes = new Set(produto.imagens.map((img) => img.id));
    if (
      args.imagemIds.length !== produto.imagens.length ||
      !args.imagemIds.every((id) => idsExistentes.has(id))
    ) {
      throw new BadRequestException(
        'Lista de imagens inválida para reordenação.',
      );
    }

    await this.prisma.$transaction(
      args.imagemIds.map((imagemId, ordem) =>
        this.prisma.galeriaProdutoFinito.update({
          where: { id: imagemId },
          data: { ordem },
        }),
      ),
    );

    return this.prisma.galeriaProdutoFinito.findMany({
      where: { produto_finito_id: args.produtoId },
      orderBy: { ordem: 'asc' },
    });
  }

  private async lerMetadados(
    token: string,
    lojaId: string,
  ): Promise<Record<string, unknown>> {
    const caminhoMeta = join(this.baseDir, lojaId, `${token}.json`);
    if (!existsSync(caminhoMeta)) {
      throw new NotFoundException('Imagem não encontrada.');
    }

    const conteudo = await readFile(caminhoMeta, 'utf8');
    const metadados = JSON.parse(conteudo) as Record<string, unknown>;

    if (metadados.loja_id !== lojaId) {
      throw new ForbiddenException('Acesso negado à imagem.');
    }

    return metadados;
  }

  private extrairTokenDaUrl(url: string): string | null {
    const partes = url.split('/').filter(Boolean);
    return partes.length ? partes[partes.length - 1] : null;
  }

  private async removerArquivosFisicos(token: string, lojaId: string) {
    try {
      const metadados = await this.lerMetadados(token, lojaId);
      const lojaDir = join(this.baseDir, lojaId);
      const nomeFisico = String(metadados.nome_fisico || `${token}`);
      await unlink(join(lojaDir, nomeFisico)).catch(() => undefined);
      await unlink(join(lojaDir, `${token}.json`)).catch(() => undefined);
    } catch (error) {
      this.logger.warn(
        `Falha ao remover arquivos físicos da imagem ${token}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
}
