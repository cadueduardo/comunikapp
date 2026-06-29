import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { randomUUID, createHash } from 'crypto';
import { existsSync, mkdirSync, statSync } from 'fs';
import { readFile, unlink, writeFile } from 'fs/promises';
import { extname, join, resolve } from 'path';
import {
  CategoriaAnexoGeometria,
  classificarAnexoGeometria,
  limiteBytesPorCategoria,
  MENSAGEM_FORMATOS_ANEXO_GEOMETRIA,
  rotuloCategoriaAnexoGeometria,
} from '../../config/multer-anexo-geometria.config';
import { DxfExtraido, DxfParserService } from './dxf-parser.service';
import {
  DxfSugestaoInsumoService,
  SugestoesPorCamada,
} from './dxf-sugestao-insumo.service';

/**
 * Service responsável pela persistência física dos anexos de geometria
 * (imagem colada/upload OU arquivo DXF) usados no produto do Orçamento V2.
 *
 * Layout no disco:
 *
 *   <COMUNIKAPP_ANEXOS_DIR>/geometria/<loja_id>/<token>.<ext>
 *   <COMUNIKAPP_ANEXOS_DIR>/geometria/<loja_id>/<token>.json   (metadados)
 *
 * O arquivo é gravado já com o "destino definitivo" — não há fase temporária
 * dependente do produto_id. Isso simplifica o caso comum de orçamento novo,
 * em que o produto só recebe `id` no momento do save final do orçamento.
 *
 * A URL retornada para o frontend é relativa, segue o padrão das demais
 * rotas autenticadas do backend:
 *
 *   /orcamentos-v2/anexos-geometria/<token>
 *
 * E é persistida em `ProdutoOrcamento.arquivo_geometria_url` (campo existente
 * desde a Fase 2). A propagação para `ItemOS.arquivo_geometria_url` continua
 * sendo feita pela Fase 3 (ao gerar a OS a partir do orçamento aprovado).
 *
 * O isolamento multi-tenant é garantido pelo metadado `loja_id` gravado ao
 * lado do arquivo: o GET recusa servir o arquivo se o JWT em uso pertencer a
 * uma loja diferente.
 */
@Injectable()
export class AnexoGeometriaService {
  private readonly logger = new Logger(AnexoGeometriaService.name);

  private readonly baseDir = resolve(
    process.env.COMUNIKAPP_ANEXOS_DIR ||
      join(process.cwd(), 'uploads', 'anexos'),
    'geometria',
  );

  constructor(
    private readonly dxfParser: DxfParserService,
    private readonly dxfSugestao: DxfSugestaoInsumoService,
  ) {
    if (!existsSync(this.baseDir)) {
      mkdirSync(this.baseDir, { recursive: true });
    }
  }

  /**
   * Persiste o arquivo recebido via multipart e devolve a URL relativa que
   * o frontend deve gravar em `arquivo_geometria_url`, junto com os
   * metadados que entram em `arquivo_geometria_metadados`.
   */
  async salvar(args: {
    arquivo: Express.Multer.File;
    lojaId: string;
    usuarioId: string;
  }): Promise<{
    token: string;
    url: string;
    metadados: Record<string, unknown>;
    categoria: CategoriaAnexoGeometria;
    dxf_extraido: DxfExtraido | null;
    sugestoes_insumo: SugestoesPorCamada[];
  }> {
    const { arquivo, lojaId, usuarioId } = args;

    if (!arquivo) {
      throw new BadRequestException('Nenhum arquivo recebido');
    }

    const categoria = classificarAnexoGeometria(
      arquivo.mimetype,
      arquivo.originalname,
    );
    if (!categoria) {
      throw new BadRequestException(MENSAGEM_FORMATOS_ANEXO_GEOMETRIA);
    }

    const limiteCategoria = limiteBytesPorCategoria(categoria);

    if (arquivo.size > limiteCategoria) {
      const limiteMb = (limiteCategoria / (1024 * 1024)).toFixed(0);
      throw new PayloadTooLargeException(
        `Arquivo excede o limite de ${limiteMb} MB para ${rotuloCategoriaAnexoGeometria(categoria)}.`,
      );
    }

    const lojaDir = join(this.baseDir, lojaId);
    if (!existsSync(lojaDir)) {
      mkdirSync(lojaDir, { recursive: true });
    }

    const token = randomUUID();
    const extensao = this.extensaoSegura(arquivo.originalname, categoria);
    const nomeFisico = `${token}${extensao}`;
    const caminhoFisico = join(lojaDir, nomeFisico);
    const caminhoMeta = join(lojaDir, `${token}.json`);

    const hash = createHash('sha256').update(arquivo.buffer).digest('hex');

    await writeFile(caminhoFisico, arquivo.buffer);

    // Sub-fase 7.B: se o anexo for DXF, roda o parser determinístico para
    // extrair $PROJECTNAME, dimensões do bounding box, perímetro por camada
    // e área aproximada. Persistimos o resultado no JSON de metadados para
    // que uma releitura (GET) consiga repor os valores na UI sem reparsear.
    let dxfExtraido: DxfExtraido | null = null;
    if (categoria === 'DXF') {
      try {
        dxfExtraido = this.dxfParser.parse(arquivo.buffer);
      } catch (error) {
        // O parser já é defensivo (devolve alertas em vez de lançar), mas
        // mantemos o try/catch para garantir que um bug nunca derruba o
        // upload do arquivo em si.
        this.logger.error(
          `Falha inesperada no DxfParserService: ${error instanceof Error ? error.message : error}`,
        );
        dxfExtraido = null;
      }
    }

    const metadados: Record<string, unknown> = {
      token,
      categoria,
      nome_arquivo: nomeFisico,
      nome_original: arquivo.originalname,
      mime_type: arquivo.mimetype,
      tamanho_bytes: arquivo.size,
      hash_sha256: hash,
      loja_id: lojaId,
      criado_por: usuarioId,
      criado_em: new Date().toISOString(),
    };
    if (dxfExtraido) {
      metadados.dxf_extraido = dxfExtraido;
    }

    await writeFile(caminhoMeta, JSON.stringify(metadados, null, 2));

    this.logger.log(
      `Anexo de geometria gravado: loja=${lojaId} token=${token} categoria=${categoria} (${arquivo.size} bytes)`,
    );

    // Sugestões de insumo são recalculadas on-demand (não persistidas), para
    // que cadastros novos de insumo passem a sugerir sem reupload do DXF.
    let sugestoesInsumo: SugestoesPorCamada[] = [];
    if (dxfExtraido) {
      try {
        sugestoesInsumo = await this.dxfSugestao.sugerir({
          dxfExtraido,
          lojaId,
        });
      } catch (error) {
        this.logger.warn(
          `Falha ao gerar sugestões de insumo no upload: ${error instanceof Error ? error.message : error}`,
        );
        sugestoesInsumo = [];
      }
    }

    return {
      token,
      url: `/orcamentos-v2/anexos-geometria/${token}`,
      metadados,
      categoria,
      dxf_extraido: dxfExtraido,
      sugestoes_insumo: sugestoesInsumo,
    };
  }

  /**
   * Lê apenas os metadados persistidos do anexo, sem entregar o arquivo
   * bruto. Usado pela rota GET .../dxf-extraido para reler o resultado do
   * parser de um DXF já enviado.
   *
   * As sugestões de insumo são recalculadas a cada chamada (não persistidas)
   * para refletir mudanças no catálogo da loja.
   */
  async lerDxfExtraido(args: {
    token: string;
    lojaId: string;
  }): Promise<{
    dxf_extraido: DxfExtraido | null;
    sugestoes_insumo: SugestoesPorCamada[];
  }> {
    const { token, lojaId } = args;
    this.validarToken(token);
    const meta = await this.lerMetadados(token, lojaId);
    if (meta.categoria !== 'DXF') {
      throw new BadRequestException(
        'O anexo informado não é um DXF; metadados de extração não se aplicam.',
      );
    }
    const dxfExtraido = meta.dxf_extraido ?? null;
    let sugestoesInsumo: SugestoesPorCamada[] = [];
    if (dxfExtraido) {
      try {
        sugestoesInsumo = await this.dxfSugestao.sugerir({
          dxfExtraido,
          lojaId,
        });
      } catch (error) {
        this.logger.warn(
          `Falha ao gerar sugestões de insumo na releitura: ${error instanceof Error ? error.message : error}`,
        );
        sugestoesInsumo = [];
      }
    }
    return {
      dxf_extraido: dxfExtraido,
      sugestoes_insumo: sugestoesInsumo,
    };
  }

  /**
   * Lê o arquivo persistido para servir ao frontend. Valida que o token
   * pertence à loja_id do JWT.
   */
  async ler(args: {
    token: string;
    lojaId: string;
  }): Promise<{
    buffer: Buffer;
    mimeType: string;
    nomeOriginal: string;
    categoria: CategoriaAnexoGeometria;
  }> {
    const { token, lojaId } = args;
    this.validarToken(token);

    const meta = await this.lerMetadados(token, lojaId);
    const caminho = join(this.baseDir, lojaId, meta.nome_arquivo);
    if (!existsSync(caminho)) {
      throw new NotFoundException('Arquivo de geometria não encontrado');
    }
    const buffer = await readFile(caminho);
    return {
      buffer,
      mimeType: meta.mime_type,
      nomeOriginal: meta.nome_original,
      categoria: meta.categoria,
    };
  }

  /**
   * Remove fisicamente o arquivo + metadados. Idempotente: se não existir,
   * apenas loga.
   */
  async remover(args: { token: string; lojaId: string }): Promise<void> {
    const { token, lojaId } = args;
    this.validarToken(token);

    const meta = await this.lerMetadadosOpt(token, lojaId);
    if (!meta) {
      this.logger.warn(
        `Remoção solicitada para token inexistente: loja=${lojaId} token=${token}`,
      );
      return;
    }

    const caminhoArquivo = join(this.baseDir, lojaId, meta.nome_arquivo);
    const caminhoMeta = join(this.baseDir, lojaId, `${token}.json`);

    await Promise.allSettled([unlink(caminhoArquivo), unlink(caminhoMeta)]);
    this.logger.log(
      `Anexo de geometria removido: loja=${lojaId} token=${token}`,
    );
  }

  /**
   * Extrai apenas o token de uma URL relativa (`/orcamentos-v2/anexos-geometria/<token>`).
   * Retorna `null` se a string não casar com esse padrão — útil para o
   * service de OS aceitar URLs externas (legado) sem quebrar.
   */
  extrairToken(url: string | null | undefined): string | null {
    if (!url) return null;
    const match = url.match(/\/orcamentos-v2\/anexos-geometria\/([0-9a-f-]{36})$/i);
    return match ? match[1] : null;
  }

  private validarToken(token: string): void {
    if (!/^[0-9a-f-]{36}$/i.test(token)) {
      throw new BadRequestException('Token de anexo inválido');
    }
  }

  private async lerMetadados(
    token: string,
    lojaId: string,
  ): Promise<MetadadosAnexo> {
    const meta = await this.lerMetadadosOpt(token, lojaId);
    if (!meta) {
      throw new NotFoundException('Anexo de geometria não encontrado');
    }
    return meta;
  }

  private async lerMetadadosOpt(
    token: string,
    lojaId: string,
  ): Promise<MetadadosAnexo | null> {
    const caminhoMeta = join(this.baseDir, lojaId, `${token}.json`);
    if (!existsSync(caminhoMeta)) {
      // Tenta detectar tentativa de acesso cross-tenant antes de devolver 404.
      // (Procura o token em outras lojas e, se achar, devolve 403 explícito.)
      const conflito = this.detectarTokenEmOutraLoja(token, lojaId);
      if (conflito) {
        throw new ForbiddenException('Anexo pertence a outra loja');
      }
      return null;
    }
    try {
      const conteudo = await readFile(caminhoMeta, 'utf-8');
      const parsed = JSON.parse(conteudo) as MetadadosAnexo;
      // Defesa em profundidade: o arquivo de metadados pode ter sido movido
      // entre lojas. Se loja_id divergir, recusa.
      if (parsed.loja_id !== lojaId) {
        throw new ForbiddenException('Anexo pertence a outra loja');
      }
      return parsed;
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      this.logger.error(
        `Metadados corrompidos para token ${token}: ${error instanceof Error ? error.message : error}`,
      );
      throw new NotFoundException('Anexo de geometria inválido');
    }
  }

  /**
   * Varre rapidamente as pastas de loja procurando o token. Usado apenas
   * para devolver 403 em vez de 404 quando há colisão entre tenants.
   */
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
          // Sanity check: arquivo precisa estar realmente acessível.
          try {
            statSync(candidato);
            return true;
          } catch {
            // ignora
          }
        }
      }
    } catch {
      // Diretório base ainda não criado / sem permissão: trata como inexistente.
    }
    return false;
  }

  private extensaoSegura(
    nomeOriginal: string,
    categoria: CategoriaAnexoGeometria,
  ): string {
    const ext = extname(nomeOriginal || '').toLowerCase();
    if (categoria === 'DXF') {
      return '.dxf';
    }
    if (categoria === 'PDF') {
      return '.pdf';
    }
    // Imagem: aceita apenas as extensões whitelistadas; cai para .png se vazio.
    const extensoesImagem = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);
    return extensoesImagem.has(ext) ? ext : '.png';
  }
}

interface MetadadosAnexo {
  token: string;
  categoria: CategoriaAnexoGeometria;
  nome_arquivo: string;
  nome_original: string;
  mime_type: string;
  tamanho_bytes: number;
  hash_sha256: string;
  loja_id: string;
  criado_por: string;
  criado_em: string;
  dxf_extraido?: DxfExtraido;
}
