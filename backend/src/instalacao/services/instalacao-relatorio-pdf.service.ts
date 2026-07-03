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
import { TIPO_VINCULO_OS_ADITIVA } from '../constants/status-financeiro-ocorrencia.enum';
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
    opcoes?: { previa?: boolean },
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

    const corPrimaria = rgb(0.11, 0.23, 0.42);
    const corSecao = rgb(0.93, 0.95, 0.98);
    const corTexto = rgb(0.12, 0.12, 0.14);
    const corSubtitulo = rgb(0.35, 0.38, 0.42);

    const desenharFaixaSecao = (titulo: string) => {
      novaPaginaSeNecessario(34);
      page.drawRectangle({
        x: this.margin - 6,
        y: cursorY - 20,
        width: this.pageSize.width - 2 * (this.margin - 6),
        height: 24,
        color: corSecao,
      });
      page.drawText(titulo.toUpperCase(), {
        x: this.margin,
        y: cursorY - 15,
        size: 10,
        font: fontBold,
        color: corPrimaria,
      });
      cursorY -= 32;
    };

    const desenharLinhaDivisoria = () => {
      page.drawLine({
        start: { x: this.margin, y: cursorY },
        end: { x: this.pageSize.width - this.margin, y: cursorY },
        thickness: 0.5,
        color: rgb(0.82, 0.84, 0.88),
      });
      cursorY -= 10;
    };

    // Capa
    page.drawRectangle({
      x: 0,
      y: this.pageSize.height - 120,
      width: this.pageSize.width,
      height: 120,
      color: corPrimaria,
    });
    page.drawText('RELATÓRIO DE SERVIÇOS', {
      x: this.margin,
      y: this.pageSize.height - 52,
      size: 20,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
    page.drawText(dados.nomeServico, {
      x: this.margin,
      y: this.pageSize.height - 76,
      size: 12,
      font,
      color: rgb(0.9, 0.92, 0.95),
    });
    if (opcoes?.previa) {
      page.drawText('PRÉVIA — sem aprovação financeira', {
        x: this.margin,
        y: this.pageSize.height - 96,
        size: 9,
        font: fontBold,
        color: rgb(1, 0.85, 0.4),
      });
    }
    cursorY = this.pageSize.height - 148;

    escreverLinha(`Proposta / Orçamento: ${dados.orcamentoCodigo}`, 11);
    escreverLinha(`OS: ${dados.osNumero}  ·  Emitido em: ${new Date().toLocaleDateString('pt-BR')}`, 10);
    escreverLinha(`Cliente: ${dados.clienteNome}`, 10);
    escreverLinha(`Empresa: ${dados.lojaNome}${dados.lojaCnpj ? `  ·  CNPJ: ${dados.lojaCnpj}` : ''}`, 9);
    cursorY -= 6;
    desenharLinhaDivisoria();

    // Previsão e locais
    desenharFaixaSecao('Previsão e locais de instalação');
    if (dados.lotesPlanejados.length === 0) {
      escreverLinha('Nenhum lote planejado.');
    }
    for (const lote of dados.lotesPlanejados) {
      const agenda = [
        lote.dataPrevisao,
        lote.turno ? `(${lote.turno})` : null,
      ]
        .filter(Boolean)
        .join(' ');
      escreverLinha(
        `${agenda ? `${agenda} — ` : ''}${lote.endereco} — ${lote.quantidade} un.`,
        10,
      );
      if (lote.responsavelLocal) {
        escreverLinha(`Responsável no local: ${lote.responsavelLocal}`, 9);
      }
    }
    cursorY -= 4;

    // Instalações realizadas
    desenharFaixaSecao('Instalações realizadas');
    if (dados.lotesConcluidos.length === 0) {
      escreverLinha('Nenhuma instalação concluída registrada.');
    }
    for (const lote of dados.lotesConcluidos) {
      escreverLinha(
        `• ${lote.endereco} — ${lote.quantidade} un. — ${lote.dataExecucao}`,
      );
    }
    cursorY -= 4;

    // Serviços adicionais (ocorrências faturadas / precificadas)
    const servicosAdicionais = dados.ocorrenciasDetalhadas.filter(
      (occ) =>
        occ.statusFinanceiro === 'FATURADO' ||
        occ.statusFinanceiro === 'PRECIFICADO',
    );
    desenharFaixaSecao('Serviços adicionais realizados');
    if (servicosAdicionais.length === 0 && dados.osAditivas.length === 0) {
      escreverLinha('Nenhum serviço adicional registrado.');
    }
    for (const occ of servicosAdicionais) {
      escreverLinha(
        `• ${occ.data} — ${occ.tipo}: ${occ.descricao} — ${formatarMoedaBrl(occ.precoCliente)}`,
        9,
      );
    }
    for (const aditiva of dados.osAditivas) {
      escreverLinha(
        `• OS ${aditiva.numero} — ${formatarMoedaBrl(aditiva.valorOrcado)} (cobrança aditiva)`,
      );
      for (const item of aditiva.itensResumo) {
        escreverLinha(`   — ${item}`, 9);
      }
    }
    if (servicosAdicionais.length > 0) {
      const totalExtras = servicosAdicionais.reduce(
        (acc, item) => acc + item.precoCliente,
        0,
      );
      escreverLinha(
        `Valor total serviços adicionais: ${formatarMoedaBrl(totalExtras)}`,
        10,
      );
    }
    cursorY -= 4;

    // Ocorrências (registro técnico)
    desenharFaixaSecao('Ocorrências e registros técnicos');
    if (dados.ocorrenciasDetalhadas.length === 0) {
      escreverLinha('Nenhuma ocorrência registrada.');
    }
    for (const occ of dados.ocorrenciasDetalhadas) {
      escreverLinha(`Dia ${occ.data} — ${occ.tipo}`, 10);
      escreverLinha(occ.descricao, 9);
      cursorY -= 4;
    }

    // Financeiro
    desenharFaixaSecao('Financeiro');
    escreverLinha(
      `Valor consolidado OS principal: ${formatarMoedaBrl(split.total_geral)}`,
      10,
    );
    if (dados.totalAditivas > 0.01) {
      escreverLinha(
        `Total em OS Aditiva(s): ${formatarMoedaBrl(dados.totalAditivas)} (cobrança separada).`,
        10,
      );
    }
    escreverLinha(split.instrucao_nfe, 9);
    escreverLinha(split.instrucao_nfs, 9);
    if (!opcoes?.previa) {
      escreverLinha(
        'Saldo liberado para faturamento após validação técnica deste relatório.',
        9,
      );
    }
    cursorY -= 6;

    // Evidências — assinaturas por lote
    desenharFaixaSecao('Assinaturas de recebimento em campo');
    for (const lote of dados.lotesConcluidos) {
      if (!lote.assinaturaToken) continue;
      escreverLinha(`${lote.endereco} — ${lote.dataExecucao}`, 9);
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
          200,
          70,
          novaPaginaSeNecessario,
        );
      }
    }

    // Galeria de fotos (lotes + ocorrências)
    const fotosGaleria: { legenda: string; token: string }[] = [];
    for (const lote of dados.lotesConcluidos) {
      for (const token of lote.fotosTokens) {
        fotosGaleria.push({
          legenda: `${lote.endereco} — ${lote.dataExecucao}`,
          token,
        });
      }
    }
    for (const occ of dados.ocorrenciasDetalhadas) {
      for (const token of occ.fotosTokens) {
        fotosGaleria.push({
          legenda: `${occ.tipo} — ${occ.data}`,
          token,
        });
      }
    }

    if (fotosGaleria.length > 0) {
      desenharFaixaSecao('Fotos dos serviços executados');
      for (const foto of fotosGaleria) {
        escreverLinha(foto.legenda, 8);
        const imagem = await this.carregarImagemInstalacao(
          pdfDoc,
          lojaId,
          foto.token,
          'instalacao',
        );
        if (imagem) {
          cursorY = await this.desenharImagem(
            page,
            pdfDoc,
            imagem,
            cursorY,
            240,
            160,
            novaPaginaSeNecessario,
          );
        } else {
          escreverLinha('(imagem não disponível)', 8);
        }
        cursorY -= 4;
      }
    }

    // Rodapé legal
    novaPaginaSeNecessario(24);
    desenharLinhaDivisoria();
    escreverLinha(
      `Documento gerado pelo ComunikApp — ${dados.lojaNome} — OS ${dados.osNumero}`,
      8,
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

    const osAditivas = await this.prisma.ordemServico.findMany({
      where: {
        loja_id: lojaId,
        os_pai_id: osId,
        tipo_vinculo_os: TIPO_VINCULO_OS_ADITIVA,
      },
      orderBy: { criado_em: 'asc' },
      select: {
        id: true,
        numero: true,
        valor_orcado: true,
        orcamento_aditivo_meta: {
          select: { ocorrencias_snapshot: true },
        },
        itens: {
          select: { produto_servico: true },
          orderBy: { criado_em: 'asc' },
        },
      },
    });

    const rotuloOcorrencia: Record<string, string> = {
      VISITA_IMPRODUTIVA: 'Visita improdutiva',
      MATERIAL_EXTRA: 'Material extra',
      SERVICO_ADICIONAL: 'Serviço adicional',
      RETRABALHO: 'Retrabalho',
    };

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
        .map((referencia) => {
          const token = extrairTokenAnexoInstalacao(referencia);
          if (token) return token;
          const limpo = referencia.trim();
          if (/^[0-9a-f-]{36}$/i.test(limpo)) return limpo;
          return null;
        })
        .filter((t): t is string => Boolean(t));
    };

    const rotuloTurno: Record<string, string> = {
      MANHA: 'Manhã',
      TARDE: 'Tarde',
      INTEIRO: 'Dia inteiro',
    };

    return {
      lojaNome: os.loja.nome,
      lojaCnpj: os.loja.cnpj,
      osNumero: os.numero,
      clienteNome: os.cliente.nome,
      orcamentoCodigo: os.orcamento?.numero ?? os.orcamento_id ?? '—',
      nomeServico: os.nome_servico,
      dataAbertura: os.criado_em.toLocaleDateString('pt-BR'),
      lotesPlanejados: lotes.map((lote) => ({
        endereco: formatarEndereco(lote),
        quantidade: lote.quantidade_alocada,
        status: rotuloStatus[lote.status_instalacao] ?? lote.status_instalacao,
        dataPrevisao: lote.data_previsao
          ? lote.data_previsao.toLocaleDateString('pt-BR')
          : null,
        turno: lote.turno_previsao
          ? (rotuloTurno[lote.turno_previsao] ?? lote.turno_previsao)
          : null,
        responsavelLocal: lote.responsavel_local ?? null,
      })),
      lotesConcluidos: lotes
        .filter((l) => l.status_instalacao === 'CONCLUIDO')
        .map((lote) => ({
          endereco: formatarEndereco(lote),
          quantidade: lote.quantidade_alocada,
          dataExecucao: lote.data_execucao
            ? lote.data_execucao.toLocaleDateString('pt-BR')
            : '—',
          assinaturaToken:
            extrairTokenAnexoInstalacao(lote.assinatura_url) ??
            extrairTokenAssinaturaExpedicao(lote.assinatura_url),
          fotosTokens: extrairFotos(lote.fotos_evidencia),
        })),
      ocorrenciasDetalhadas: ocorrencias.map((occ) => ({
        data: occ.criado_em.toLocaleDateString('pt-BR'),
        tipo: rotuloOcorrencia[occ.tipo] ?? occ.tipo,
        descricao: occ.descricao,
        precoCliente: Number(occ.preco_cliente ?? occ.preco_sugerido ?? 0),
        statusFinanceiro: occ.status_financeiro,
        fotosTokens: extrairFotos(occ.fotos_evidencia),
      })),
      ocorrenciasAbertas: ocorrencias
        .filter((occ) => occ.status_financeiro !== 'FATURADO')
        .map((occ) => ({
          data: occ.criado_em.toLocaleString('pt-BR'),
          tipo: rotuloOcorrencia[occ.tipo] ?? occ.tipo,
          descricao: occ.descricao,
          precoCliente: Number(occ.preco_cliente ?? occ.preco_sugerido ?? 0),
        })),
      osAditivas: osAditivas.map((aditiva) => ({
        numero: aditiva.numero,
        valorOrcado: Number(aditiva.valor_orcado ?? 0),
        itensResumo:
          aditiva.itens.length > 0
            ? aditiva.itens.map((item) => item.produto_servico)
            : this.extrairResumoSnapshot(aditiva.orcamento_aditivo_meta?.ocorrencias_snapshot),
      })),
      totalAditivas: osAditivas.reduce(
        (acc, item) => acc + Number(item.valor_orcado ?? 0),
        0,
      ),
    };
  }

  private extrairResumoSnapshot(snapshot: unknown): string[] {
    if (!Array.isArray(snapshot)) return [];
    return snapshot
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const registro = item as Record<string, unknown>;
        const tipo = String(registro.tipo ?? 'Ocorrência');
        const descricao = String(registro.descricao ?? '').slice(0, 80);
        return descricao ? `${tipo}: ${descricao}` : tipo;
      })
      .filter((linha): linha is string => Boolean(linha));
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
