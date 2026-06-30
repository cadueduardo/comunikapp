import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { join, resolve } from 'path';
import { PDFDocument, StandardFonts, rgb, type PDFImage, type PDFPage } from 'pdf-lib';
import { PrismaService } from '../../prisma/prisma.service';
import { InstalacaoAnexoService } from './instalacao-anexo.service';
import { InstalacaoSplitFiscalService } from './instalacao-split-fiscal.service';
import type { SplitFiscalResultado } from '../utils/split-fiscal.util';
import {
  extrairTokenAnexoInstalacao,
  extrairTokenAssinaturaExpedicao,
} from '../utils/anexo-url.util';
import { formatarMoedaBrl } from '../utils/split-fiscal.util';

export interface RelatorioPdfGerado {
  pdf_token: string;
  pdf_url: string;
  buffer: Uint8Array;
  split: SplitFiscalResultado;
}

@Injectable()
export class InstalacaoRelatorioPdfService {
  private readonly logger = new Logger(InstalacaoRelatorioPdfService.name);
  private readonly pageSize = { width: 595.28, height: 841.89 };
  private readonly margin = 48;

  private readonly relatoriosDir = resolve(
    process.env.COMUNIKAPP_ANEXOS_DIR ||
      join(process.cwd(), 'uploads', 'anexos'),
    'instalacao-relatorios',
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly anexoService: InstalacaoAnexoService,
    private readonly splitFiscalService: InstalacaoSplitFiscalService,
  ) {
    if (!existsSync(this.relatoriosDir)) {
      mkdirSync(this.relatoriosDir, { recursive: true });
    }
  }

  async gerarRelatorioPdf(
    osId: string,
    lojaId: string,
  ): Promise<RelatorioPdfGerado> {
    const dados = await this.carregarDados(osId, lojaId);
    const split = await this.splitFiscalService.calcularSplitFiscalOs(
      osId,
      lojaId,
    );

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page = pdfDoc.addPage([this.pageSize.width, this.pageSize.height]);
    let cursorY = this.pageSize.height - this.margin;

    const novaPaginaSeNecessario = (alturaNecessaria: number) => {
      if (cursorY - alturaNecessaria < this.margin) {
        page = pdfDoc.addPage([this.pageSize.width, this.pageSize.height]);
        cursorY = this.pageSize.height - this.margin;
      }
    };

    const escreverTitulo = (texto: string) => {
      novaPaginaSeNecessario(28);
      page.drawText(texto, {
        x: this.margin,
        y: cursorY,
        size: 14,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.1),
      });
      cursorY -= 22;
    };

    const escreverLinha = (texto: string, tamanho = 10) => {
      const linhas = this.quebrarTexto(texto, 92);
      for (const linha of linhas) {
        novaPaginaSeNecessario(16);
        page.drawText(linha, {
          x: this.margin,
          y: cursorY,
          size: tamanho,
          font,
          color: rgb(0.15, 0.15, 0.15),
        });
        cursorY -= tamanho + 4;
      }
    };

    // Bloco 1 — Cabeçalho
    escreverTitulo('Relatório Técnico de Serviços Executados');
    escreverLinha(`Empresa: ${dados.lojaNome}`);
    if (dados.lojaCnpj) escreverLinha(`CNPJ: ${dados.lojaCnpj}`);
    escreverLinha(`OS: ${dados.osNumero}`);
    escreverLinha(`Cliente: ${dados.clienteNome}`);
    escreverLinha(`Proposta / Orçamento: ${dados.orcamentoCodigo}`);
    escreverLinha(`Serviço: ${dados.nomeServico}`);
    escreverLinha(`Emitido em: ${new Date().toLocaleString('pt-BR')}`);
    cursorY -= 8;

    // Bloco 2 — Mapeamento logístico
    escreverTitulo('2. Mapeamento logístico planejado');
    for (const lote of dados.lotesPlanejados) {
      escreverLinha(
        `• ${lote.endereco} — ${lote.quantidade} un. — Status: ${lote.status}`,
      );
    }
    cursorY -= 8;

    // Bloco 3 — Evidências de campo
    escreverTitulo('3. Evidências de instalações concluídas');
    for (const lote of dados.lotesConcluidos) {
      escreverLinha(
        `Data: ${lote.dataExecucao} | Local: ${lote.endereco} | Qtd: ${lote.quantidade}`,
      );
      escreverLinha('Recebedor: identificado por assinatura digital em campo.');

      if (lote.assinaturaToken) {
        const imagem = await this.carregarImagemInstalacao(
          pdfDoc,
          lojaId,
          lote.assinaturaToken,
          'instalacao',
        );
        if (imagem) {
          cursorY = await this.desenharImagem(
            page,
            pdfDoc,
            imagem,
            cursorY,
            180,
            60,
            novaPaginaSeNecessario,
          );
        }
      }

      for (const fotoToken of lote.fotosTokens) {
        const imagem = await this.carregarImagemInstalacao(
          pdfDoc,
          lojaId,
          fotoToken,
          'instalacao',
        );
        if (imagem) {
          cursorY = await this.desenharImagem(
            page,
            pdfDoc,
            imagem,
            cursorY,
            220,
            140,
            novaPaginaSeNecessario,
          );
        }
      }
      cursorY -= 6;
    }

    // Bloco 4 — Ocorrências
    escreverTitulo('4. Ocorrências técnicas e extras de campo');
    if (dados.ocorrencias.length === 0) {
      escreverLinha('Nenhuma ocorrência registrada.');
    }
    for (const occ of dados.ocorrencias) {
      escreverLinha(
        `${occ.data} — ${occ.tipo}: ${occ.descricao} (Cobrança extra: ${formatarMoedaBrl(occ.precoCliente)})`,
      );
    }
    cursorY -= 8;

    // Bloco 5 — Fechamento financeiro
    escreverTitulo('5. Fechamento financeiro e split fiscal');
    escreverLinha(`Valor total consolidado: ${formatarMoedaBrl(split.total_geral)}`);
    escreverLinha(split.instrucao_nfe);
    escreverLinha(split.instrucao_nfs);
    escreverLinha(
      'Autorização: saldo de 50% liberado para faturamento após validação técnica deste relatório.',
    );

    const buffer = await pdfDoc.save();
    const pdfToken = randomUUID();
    const lojaDir = join(this.relatoriosDir, lojaId);
    if (!existsSync(lojaDir)) {
      mkdirSync(lojaDir, { recursive: true });
    }
    const caminho = join(lojaDir, `${pdfToken}.pdf`);
    await writeFile(caminho, buffer);

    const pdfUrl = `/instalacao/relatorios/${pdfToken}`;
    this.logger.log(`PDF do relatório técnico gerado: ${pdfToken} (OS ${osId})`);

    return {
      pdf_token: pdfToken,
      pdf_url: pdfUrl,
      buffer,
      split,
    };
  }

  async lerPdf(token: string, lojaId: string): Promise<Buffer> {
    const caminho = join(this.relatoriosDir, lojaId, `${token}.pdf`);
    if (!existsSync(caminho)) {
      throw new NotFoundException('Relatório técnico não encontrado.');
    }
    return readFile(caminho);
  }

  private async carregarDados(osId: string, lojaId: string) {
    const os = await this.prisma.ordemServico.findFirst({
      where: { id: osId, loja_id: lojaId },
      include: {
        cliente: { select: { nome: true } },
        loja: { select: { nome: true, cnpj: true, logo_url: true } },
        orcamento: { select: { id: true, numero: true } },
      },
    });

    if (!os) {
      throw new NotFoundException('Ordem de serviço não encontrada.');
    }

    const lotes = await this.prisma.itemOSInstalacao.findMany({
      where: { loja_id: lojaId, item_os: { os_id: osId } },
      orderBy: { criado_em: 'asc' },
    });

    const ocorrencias = await this.prisma.ocorrenciaInstalacao.findMany({
      where: { os_id: osId, loja_id: lojaId },
      orderBy: { criado_em: 'asc' },
    });

    const rotuloStatus: Record<string, string> = {
      AGUARDANDO: 'Aguardando',
      EM_ANDAMENTO: 'Em andamento',
      CONCLUIDO: 'Concluído',
      LOGISTICA_NEGATIVA: 'Logística negativa',
    };

    const formatarEndereco = (lote: (typeof lotes)[number]) =>
      `${lote.logradouro}, ${lote.numero} — ${lote.bairro}, ${lote.cidade}/${lote.uf}`;

    const extrairFotos = (valor: unknown): string[] => {
      if (!Array.isArray(valor)) return [];
      return valor
        .filter((v): v is string => typeof v === 'string')
        .map((url) => extrairTokenAnexoInstalacao(url))
        .filter((t): t is string => Boolean(t));
    };

    return {
      lojaNome: os.loja.nome,
      lojaCnpj: os.loja.cnpj,
      osNumero: os.numero,
      clienteNome: os.cliente.nome,
      orcamentoCodigo: os.orcamento?.numero ?? os.orcamento_id ?? '—',
      nomeServico: os.nome_servico,
      lotesPlanejados: lotes.map((lote) => ({
        endereco: formatarEndereco(lote),
        quantidade: lote.quantidade_alocada,
        status: rotuloStatus[lote.status_instalacao] ?? lote.status_instalacao,
      })),
      lotesConcluidos: lotes
        .filter((l) => l.status_instalacao === 'CONCLUIDO')
        .map((lote) => ({
          endereco: formatarEndereco(lote),
          quantidade: lote.quantidade_alocada,
          dataExecucao: lote.data_execucao
            ? lote.data_execucao.toLocaleString('pt-BR')
            : '—',
          assinaturaToken:
            extrairTokenAnexoInstalacao(lote.assinatura_url) ??
            extrairTokenAssinaturaExpedicao(lote.assinatura_url),
          fotosTokens: extrairFotos(lote.fotos_evidencia),
        })),
      ocorrencias: ocorrencias.map((occ) => ({
        data: occ.criado_em.toLocaleString('pt-BR'),
        tipo: occ.tipo,
        descricao: occ.descricao,
        precoCliente: Number(occ.preco_cliente),
      })),
    };
  }

  private async carregarImagemInstalacao(
    pdfDoc: PDFDocument,
    lojaId: string,
    token: string,
    origem: 'instalacao',
  ): Promise<PDFImage | null> {
    try {
      const { buffer, mimeType } = await this.anexoService.ler({
        token,
        lojaId,
      });
      if (mimeType.includes('png')) {
        return pdfDoc.embedPng(buffer);
      }
      if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
        return pdfDoc.embedJpg(buffer);
      }
      return pdfDoc.embedPng(buffer);
    } catch (error) {
      this.logger.warn(
        `Não foi possível embutir imagem ${token} (${origem}): ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  private async desenharImagem(
    page: PDFPage,
    pdfDoc: PDFDocument,
    imagem: PDFImage,
    cursorY: number,
    larguraMax: number,
    alturaMax: number,
    novaPagina: (altura: number) => void,
  ): Promise<number> {
    const escala = Math.min(
      larguraMax / imagem.width,
      alturaMax / imagem.height,
    );
    const largura = imagem.width * escala;
    const altura = imagem.height * escala;

    novaPagina(altura + 12);
    page.drawImage(imagem, {
      x: this.margin,
      y: cursorY - altura,
      width: largura,
      height: altura,
    });
    return cursorY - altura - 12;
  }

  private quebrarTexto(texto: string, maxChars: number): string[] {
    const palavras = texto.replace(/\s+/g, ' ').trim().split(' ');
    const linhas: string[] = [];
    let atual = '';

    for (const palavra of palavras) {
      const candidato = atual ? `${atual} ${palavra}` : palavra;
      if (candidato.length > maxChars) {
        if (atual) linhas.push(atual);
        atual = palavra;
      } else {
        atual = candidato;
      }
    }
    if (atual) linhas.push(atual);
    return linhas.length > 0 ? linhas : [''];
  }
}
