import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { DxfExtraido } from './dxf-parser.service';

/**
 * Sugestão de insumo derivada do nome de uma camada do DXF. A heurística
 * é puramente de texto (tokenização + matching), nunca um "auto-atrelamento":
 * o frontend mostra como opção e o operador confirma com clique.
 */
export interface SugestaoInsumoCamada {
  insumo_id: string;
  insumo_nome: string;
  tipo_material_nome: string | null;
  categoria_nome: string | null;
  score: number;
  tokens_match: string[];
  motivo: 'NOME_INSUMO' | 'TIPO_MATERIAL' | 'CATEGORIA';
}

export interface SugestoesPorCamada {
  nome_camada: string;
  sugestoes: SugestaoInsumoCamada[];
  /**
   * Sub-fase 7.B+++: `true` quando o nome da camada, após filtrar as
   * stop-words de operação (CORTE/GRAVACAO/DOBRA/etc.), não sobra nenhum
   * token de material. Indica que a camada é puramente uma operação que
   * a máquina executa — **NÃO** faz sentido sugerir/cadastrar um insumo
   * a partir dela. O frontend usa para esconder o botão "Cadastrar novo"
   * e mostrar mensagem orientativa pedindo ao operador para nomear as
   * camadas do DXF incluindo o material (ex.: `ACRILICO_3MM_CRISTAL`).
   */
  apenas_operacao: boolean;
}

/**
 * Service heurístico (Passo 1 do Plano-mãe Fase 7) que sugere insumos para
 * cada camada de um DXF, baseado em substring/token match contra o catálogo
 * de insumos da loja.
 *
 * Política de produto registrada:
 *  - **Nunca atrela sozinho.** Devolve apenas sugestões; o operador clica em
 *    "Atrelar este insumo" no `DxfRevisaoCard`.
 *  - **Sem dependência de configuração da loja.** O Passo 2 (regras
 *    configuráveis por loja) virou item da próxima sub-fase, se o usuário
 *    pedir; aqui só temos heurística estática.
 *  - **Stop-list de operações** ("CORTE", "GRAVACAO", "DOBRA", ...) evita que
 *    a camada `CORTE_ACM3MM` puxe insumos só porque a palavra "CORTE" aparece
 *    em algum nome; só palavras-token de material entram no score.
 *
 * Re-execução é barata (3 queries simples no banco + matching em memória).
 * Por isso o resultado é calculado on-demand a cada upload / GET de
 * dxf-extraido, ao invés de persistido nos metadados (assim, cadastrar um
 * insumo novo passa a sugerir imediatamente, sem reupload do DXF).
 */
@Injectable()
export class DxfSugestaoInsumoService {
  private readonly logger = new Logger(DxfSugestaoInsumoService.name);

  /**
   * Palavras genéricas de operação/desenho técnico que NÃO devem influenciar
   * o matching de material. São removidas dos tokens da camada antes do
   * cálculo de score.
   */
  private readonly STOP_WORDS = new Set<string>([
    'corte',
    'cortes',
    'cortar',
    'cut',
    'cutting',
    'gravacao',
    'gravação',
    'gravar',
    'engrave',
    'engraving',
    'furo',
    'furos',
    'hole',
    'holes',
    'dobra',
    'dobras',
    'fold',
    'vinco',
    'vincos',
    'score',
    'frente',
    'fundo',
    'lateral',
    'lados',
    'lado',
    'verso',
    'arte',
    'artwork',
    'contorno',
    'outline',
    'border',
    'borda',
    'layer',
    'camada',
    'default',
    'linha',
    'linhas',
    'line',
    'lines',
    'texto',
    'text',
    'label',
    'etiqueta',
    'logo',
    'logotipo',
    'desenho',
  ]);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Gera sugestões para cada camada do DXF. Devolve a mesma lista (mesma
   * ordem) que `dxf_extraido.camadas`, anexando até `limitePorCamada`
   * sugestões por camada (default 3), ordenadas por score desc.
   *
   * Quando a camada não tem nenhum token útil após a stop-list, devolve
   * sugestões vazias.
   */
  async sugerir(args: {
    dxfExtraido: DxfExtraido;
    lojaId: string;
    limitePorCamada?: number;
  }): Promise<SugestoesPorCamada[]> {
    const { dxfExtraido, lojaId, limitePorCamada = 3 } = args;

    if (!dxfExtraido.camadas || dxfExtraido.camadas.length === 0) {
      return [];
    }

    // Sub-fase 7.B++: tokens da descrição do projeto (HEADER do DXF) entram
    // como pista adicional de material. Cada camada herda esses tokens, mas
    // com peso menor para não dominar a heurística do nome da camada.
    const tokensDescricao = dxfExtraido.descricao_projeto
      ? this.tokenizar(dxfExtraido.descricao_projeto)
      : [];

    const camadasComToken = dxfExtraido.camadas.map((camada) => ({
      nome_original: camada.nome,
      tokens: this.tokenizar(camada.nome),
    }));

    const algumaCamadaTemToken =
      camadasComToken.some((c) => c.tokens.length > 0) ||
      tokensDescricao.length > 0;
    if (!algumaCamadaTemToken) {
      // Sem tokens em nenhuma camada nem na descrição: todas são apenas
      // operação (CORTE/GRAVACAO/etc.) ou estão vazias. Marca todas.
      return dxfExtraido.camadas.map((c) => ({
        nome_camada: c.nome,
        sugestoes: [],
        apenas_operacao: true,
      }));
    }

    // Carrega o catálogo da loja uma única vez. Só insumos ativos.
    const insumos = await this.prisma.insumo.findMany({
      where: { loja_id: lojaId, ativo: true },
      select: {
        id: true,
        nome: true,
        categoria: { select: { nome: true } },
        tipoMaterial: { select: { nome: true } },
      },
      take: 500,
    });

    if (insumos.length === 0) {
      // Sem catálogo, ainda assim marcamos camadas apenas-operação para
      // que a UI consiga orientar o operador.
      return dxfExtraido.camadas.map((c) => ({
        nome_camada: c.nome,
        sugestoes: [],
        apenas_operacao: this.tokenizar(c.nome).length === 0,
      }));
    }

    // Pré-tokeniza cada insumo. O mesmo token vetor é usado para todas as
    // camadas (loop interno fica O(camadas × insumos × tokens)).
    const insumosTokenizados = insumos.map((insumo) => ({
      id: insumo.id,
      nome: insumo.nome,
      categoria_nome: insumo.categoria?.nome || null,
      tipo_material_nome: insumo.tipoMaterial?.nome || null,
      tokens_nome: this.tokenizar(insumo.nome),
      tokens_tipo: insumo.tipoMaterial?.nome
        ? this.tokenizar(insumo.tipoMaterial.nome)
        : [],
      tokens_categoria: insumo.categoria?.nome
        ? this.tokenizar(insumo.categoria.nome)
        : [],
    }));

    return camadasComToken.map((camada) => {
      // Camada é "apenas operação" quando, após remover stop-words, não
      // restou nenhum token DELA (mesmo que a descrição do projeto traga
      // algo). O frontend usa isso para esconder "Cadastrar novo" e
      // sinalizar que o operador precisa renomear a camada no DXF.
      const apenasOperacao = camada.tokens.length === 0;

      if (apenasOperacao && tokensDescricao.length === 0) {
        return {
          nome_camada: camada.nome_original,
          sugestoes: [],
          apenas_operacao: true,
        };
      }
      const ranking: SugestaoInsumoCamada[] = [];

      for (const insumo of insumosTokenizados) {
        const matchNome = this.calcularMatch(camada.tokens, insumo.tokens_nome);
        const matchTipo = this.calcularMatch(camada.tokens, insumo.tokens_tipo);
        const matchCategoria = this.calcularMatch(
          camada.tokens,
          insumo.tokens_categoria,
        );
        // Sub-fase 7.B++: matches da descrição entram com peso reduzido (0.5)
        // — servem para reforçar quando o nome da camada é genérico, sem
        // mascarar a evidência principal (nome da camada x catálogo).
        const matchNomePelaDescricao = this.calcularMatch(
          tokensDescricao,
          insumo.tokens_nome,
        );
        const matchTipoPelaDescricao = this.calcularMatch(
          tokensDescricao,
          insumo.tokens_tipo,
        );

        // Pesos: nome do insumo casado pela camada é a melhor pista (3x);
        // tipoMaterial pela camada (2x); categoria pela camada (1x).
        // Casamentos via descrição entram com peso reduzido (0.5x) para não
        // dominar a evidência principal (nome da camada).
        const score =
          matchNome.score * 3 +
          matchTipo.score * 2 +
          matchCategoria.score * 1 +
          matchNomePelaDescricao.score * 0.5 +
          matchTipoPelaDescricao.score * 0.5;

        if (score <= 0) continue;

        const tokensMatch = Array.from(
          new Set([
            ...matchNome.tokens,
            ...matchTipo.tokens,
            ...matchCategoria.tokens,
            ...matchNomePelaDescricao.tokens,
            ...matchTipoPelaDescricao.tokens,
          ]),
        );

        // Motivo principal é a fonte de maior contribuição. Quando só a
        // descrição casou, o motivo continua sendo NOME_INSUMO/TIPO_MATERIAL,
        // pois é o campo do insumo que casou — a descrição é só o veículo.
        let motivo: SugestaoInsumoCamada['motivo'] = 'NOME_INSUMO';
        const scoreNomeTotal = matchNome.score + matchNomePelaDescricao.score;
        const scoreTipoTotal = matchTipo.score + matchTipoPelaDescricao.score;
        if (scoreNomeTotal === 0 && scoreTipoTotal > 0) {
          motivo = 'TIPO_MATERIAL';
        } else if (
          scoreNomeTotal === 0 &&
          scoreTipoTotal === 0 &&
          matchCategoria.score > 0
        ) {
          motivo = 'CATEGORIA';
        }

        ranking.push({
          insumo_id: insumo.id,
          insumo_nome: insumo.nome,
          tipo_material_nome: insumo.tipo_material_nome,
          categoria_nome: insumo.categoria_nome,
          score: Number(score.toFixed(2)),
          tokens_match: tokensMatch,
          motivo,
        });
      }

      ranking.sort((a, b) => b.score - a.score);
      return {
        nome_camada: camada.nome_original,
        sugestoes: ranking.slice(0, limitePorCamada),
        apenas_operacao: apenasOperacao,
      };
    });
  }

  /**
   * Tokeniza um texto: remove acentos, separa por `[\s_\-./,]`, descarta
   * palavras com menos de 2 chars e remove stop-words. Tokens são devolvidos
   * em minúsculas e sem acento, prontos para comparação direta.
   */
  private tokenizar(texto: string): string[] {
    if (!texto) return [];
    const semAcento = texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    const bruto = semAcento.split(/[\s_\-./,]+/g);
    const filtrado = bruto
      .map((t) => t.trim())
      .filter((t) => t.length >= 2 && !this.STOP_WORDS.has(t));
    return filtrado;
  }

  /**
   * Calcula score de match entre os tokens da camada e os tokens-alvo (de
   * algum campo do insumo).
   *
   * Regras:
   *  - Token idêntico (camada == alvo): +3
   *  - Token da camada é substring de algum alvo: +1
   *  - Token-alvo é substring de algum token da camada: +1 (cobre o caso
   *    "ACM3" da camada contendo "ACM" do tipoMaterial)
   *
   * Tokens já contabilizados não pontuam de novo. Devolve também a lista
   * de tokens que casaram para auditoria/UI.
   */
  private calcularMatch(
    tokensCamada: string[],
    tokensAlvo: string[],
  ): { score: number; tokens: string[] } {
    if (tokensCamada.length === 0 || tokensAlvo.length === 0) {
      return { score: 0, tokens: [] };
    }
    let score = 0;
    const matched = new Set<string>();
    for (const tCamada of tokensCamada) {
      let melhorPontosDoToken = 0;
      for (const tAlvo of tokensAlvo) {
        if (tCamada === tAlvo) {
          melhorPontosDoToken = Math.max(melhorPontosDoToken, 3);
        } else if (
          tCamada.length >= 3 &&
          (tAlvo.includes(tCamada) || tCamada.includes(tAlvo))
        ) {
          melhorPontosDoToken = Math.max(melhorPontosDoToken, 1);
        }
      }
      if (melhorPontosDoToken > 0) {
        score += melhorPontosDoToken;
        matched.add(tCamada);
      }
    }
    return { score, tokens: Array.from(matched) };
  }
}
