import { Injectable, Logger } from '@nestjs/common';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { AncoraRenderizacao } from './vdp-valores.util';

/**
 * Provider isolado para merge gráfico VDP → PDF multipáginas.
 * Ponto de extensão para trocar por CLI servidor, canvas ou serviço externo.
 */
@Injectable()
export class VdpPdfMergeProvider {
  private readonly logger = new Logger(VdpPdfMergeProvider.name);

  private readonly pageSize = { width: 595.28, height: 841.89 };

  async gerarPdfMultipaginas(args: {
    registros: Array<Record<string, string>>;
    ancoras: AncoraRenderizacao[];
    arteMestraBytes?: Buffer | null;
    arteMestraMime?: string | null;
    tituloFallback?: string;
  }): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let masterPdf: PDFDocument | null = null;
    if (
      args.arteMestraBytes?.length &&
      args.arteMestraMime === 'application/pdf'
    ) {
      try {
        masterPdf = await PDFDocument.load(args.arteMestraBytes);
      } catch (error) {
        this.logger.warn(
          'Não foi possível carregar arte-mestra PDF; páginas usarão layout textual.',
          error,
        );
      }
    }

    let imagemEmbed: Awaited<ReturnType<PDFDocument['embedPng']>> | null = null;
    if (
      args.arteMestraBytes?.length &&
      args.arteMestraMime?.startsWith('image/')
    ) {
      try {
        if (args.arteMestraMime.includes('png')) {
          imagemEmbed = await pdfDoc.embedPng(args.arteMestraBytes);
        } else if (
          args.arteMestraMime.includes('jpeg') ||
          args.arteMestraMime.includes('jpg')
        ) {
          imagemEmbed = await pdfDoc.embedJpg(args.arteMestraBytes);
        }
      } catch (error) {
        this.logger.warn(
          'Não foi possível embutir imagem da arte-mestra; usando layout textual.',
          error,
        );
      }
    }

    for (let i = 0; i < args.registros.length; i += 1) {
      const registro = args.registros[i];
      const page = pdfDoc.addPage([this.pageSize.width, this.pageSize.height]);

      if (masterPdf && masterPdf.getPageCount() > 0) {
        const [copiedPage] = await pdfDoc.embedPdf(masterPdf, [0]);
        const scale = Math.min(
          this.pageSize.width / copiedPage.width,
          this.pageSize.height / copiedPage.height,
        );
        page.drawPage(copiedPage, {
          x: 0,
          y: 0,
          width: copiedPage.width * scale,
          height: copiedPage.height * scale,
        });
      } else if (imagemEmbed) {
        page.drawImage(imagemEmbed, {
          x: 0,
          y: 0,
          width: this.pageSize.width,
          height: this.pageSize.height,
        });
      } else if (args.tituloFallback) {
        page.drawText(args.tituloFallback, {
          x: 40,
          y: this.pageSize.height - 60,
          size: 14,
          font,
          color: rgb(0.2, 0.2, 0.2),
        });
      }

      if (args.ancoras.length > 0) {
        for (const ancora of args.ancoras) {
          const texto = registro[ancora.chave] ?? '';
          if (!texto) continue;

          const boxX = ancora.x * this.pageSize.width;
          const boxY =
            this.pageSize.height -
            (ancora.y + ancora.height) * this.pageSize.height;
          const boxW = ancora.width * this.pageSize.width;
          const fontSize = Math.min(
            ancora.height * this.pageSize.height * 0.75,
            28,
          );

          page.drawText(texto, {
            x: boxX + 2,
            y: boxY + 2,
            size: Math.max(fontSize, 8),
            font,
            color: rgb(0, 0, 0),
            maxWidth: Math.max(boxW - 4, 20),
          });
        }
      } else {
        const linhas = Object.entries(registro)
          .filter(([, v]) => v)
          .map(([k, v]) => `${k}: ${v}`);
        let y = this.pageSize.height - 100;
        for (const linha of linhas) {
          page.drawText(linha.slice(0, 120), {
            x: 40,
            y,
            size: 12,
            font,
            color: rgb(0, 0, 0),
            maxWidth: this.pageSize.width - 80,
          });
          y -= 18;
        }
      }
    }

    return pdfDoc.save();
  }
}
