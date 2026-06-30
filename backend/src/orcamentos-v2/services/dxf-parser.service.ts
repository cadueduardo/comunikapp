import { Injectable, Logger } from '@nestjs/common';
import type {
  IArcEntity,
  ICircleEntity,
  IDxf,
  IEllipseEntity,
  IEntity,
  ILineEntity,
  ILwpolylineEntity,
  IPoint,
  IPolylineEntity,
} from 'dxf-parser';

// O bundle CJS da dxf-parser (`dist/dxf-parser.js`, apontado por `main`)
// expõe a classe diretamente via `module.exports = DxfParser` — não há
// `.default`. Os types declaram um default ESM, mas no runtime CommonJS
// (que é o que o NestJS usa) o `.default` viria undefined. Por isso
// trazemos só os tipos via `import type` acima e fazemos `require` para
// obter o construtor, com tipagem mínima preservada.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const DxfParserCtor = require('dxf-parser') as new () => {
  parseSync(source: string): IDxf | null;
};

/**
 * Estrutura devolvida ao frontend após o parse determinístico de um DXF.
 *
 * Política de produto (Sub-fase 7.B do plano-mãe):
 *  - O parser NUNCA preenche valores no formulário sozinho. Ele apenas
 *    devolve os valores extraídos e a UI mostra um card "Valores detectados
 *    no DXF" com botão "Aplicar ao produto". O operador continua sendo o
 *    responsável pelas medidas que vão para o orçamento.
 *  - Quando o DXF não puder ser entendido (entidades não suportadas, parse
 *    falha, sem entidades 2D), `alertas` traz o motivo e os campos numéricos
 *    vêm `null`/`0` para que a UI desabilite o botão "Aplicar".
 *
 * Sem polígono fechado (LWPOLYLINE/POLYLINE com `shape=true`) o cálculo de
 * área cai para `largura × altura do bbox`. A origem da área é marcada em
 * `area_origem` para a UI poder exibir o alerta correto.
 */
export interface DxfExtraido {
  versao_parser: string;
  nome_projeto: string | null;
  /**
   * Descrição consolidada extraída do HEADER do DXF (Sub-fase 7.B++).
   * Concatena `$SUBJECT`, `$COMMENTS`, `$TITLE`, `$KEYWORDS`, `$AUTHOR`
   * com separador `" — "`. Campos vazios são omitidos. Quando o header
   * não tem nenhum desses, vem `null`.
   *
   * NOTA: texto livre das entidades `TEXT`/`MTEXT` do desenho NÃO é
   * incluído aqui — geralmente carrega cotas, notas de produção, número
   * de peças, etc., que poluiriam a descrição. Se virar necessidade,
   * adiciona-se em um campo separado.
   */
  descricao_projeto: string | null;
  unidade_origem: UnidadeDxf;
  largura_mm: number | null;
  altura_mm: number | null;
  area_mm2: number | null;
  area_origem: 'POLIGONO_FECHADO' | 'BOUNDING_BOX' | null;
  perimetro_total_mm: number;
  camadas: CamadaExtraida[];
  camada_sugerida: string | null;
  alertas: string[];
}

export interface CamadaExtraida {
  nome: string;
  perimetro_mm: number;
  quantidade_entidades: number;
}

export type UnidadeDxf = 'mm' | 'cm' | 'm' | 'pol' | 'pe' | 'desconhecida';

/**
 * Versão da estrutura `DxfExtraido` persistida nos metadados do anexo.
 * Bump quando mudar o shape do JSON. Histórico:
 *  - 7.B-1.0: estrutura inicial (Sub-fase 7.B).
 *  - 7.B-1.1: adiciona `descricao_projeto` (Sub-fase 7.B++).
 */
const VERSAO_PARSER = '7.B-1.1';

/**
 * Campos do HEADER do DXF que são considerados "descrição" do projeto e
 * concatenados em `DxfExtraido.descricao_projeto`. A ordem aqui define a
 * ordem da concatenação final.
 */
const CHAVES_DESCRICAO_PROJETO = [
  '$TITLE',
  '$SUBJECT',
  '$KEYWORDS',
  '$COMMENTS',
  '$AUTHOR',
];

/**
 * Mapa dos códigos de `$INSUNITS` (DXF spec) para a unidade que o backend
 * tratará internamente como nome.
 *
 * Referência: https://help.autodesk.com/view/OARX/2024/ENU/?guid=GUID-A85E8E67-27CD-4C59-BE61-4DC9FADBE74A
 */
const INSUNITS_MAP: Record<number, UnidadeDxf> = {
  0: 'desconhecida',
  1: 'pol',
  2: 'pe',
  4: 'mm',
  5: 'cm',
  6: 'm',
};

/**
 * Fator multiplicativo para converter o valor original do DXF para mm.
 * Default: 1 (assume mm; é o que a esmagadora maioria dos plotters/CNCs
 * de comunicação visual usa por padrão).
 */
const FATOR_PARA_MM: Record<UnidadeDxf, number> = {
  mm: 1,
  cm: 10,
  m: 1000,
  pol: 25.4,
  pe: 304.8,
  desconhecida: 1,
};

/**
 * Service determinístico para extrair informações de um arquivo DXF
 * (perímetro por camada, dimensões do bounding box, área aproximada,
 * `$PROJECTNAME` do HEADER).
 *
 * Implementa apenas leitura — nenhuma escrita em disco / banco. O service
 * que chama (`AnexoGeometriaService`) é quem persiste o resultado no JSON
 * de metadados do anexo.
 */
@Injectable()
export class DxfParserService {
  private readonly logger = new Logger(DxfParserService.name);

  /**
   * Faz o parse de um buffer DXF e devolve a estrutura `DxfExtraido`.
   * Nunca lança: erros viram entrada em `alertas` para que o upload do
   * arquivo não falhe só porque o DXF é exótico.
   */
  parse(buffer: Buffer): DxfExtraido {
    const alertas: string[] = [];
    const resultadoVazio = (): DxfExtraido => ({
      versao_parser: VERSAO_PARSER,
      nome_projeto: null,
      descricao_projeto: null,
      unidade_origem: 'desconhecida',
      largura_mm: null,
      altura_mm: null,
      area_mm2: null,
      area_origem: null,
      perimetro_total_mm: 0,
      camadas: [],
      camada_sugerida: null,
      alertas,
    });

    let conteudo: string;
    try {
      conteudo = buffer.toString('utf-8');
    } catch (error) {
      this.logger.warn(
        `Falha ao decodificar buffer DXF como UTF-8: ${error instanceof Error ? error.message : error}`,
      );
      alertas.push('Não foi possível ler o conteúdo do DXF como texto.');
      return resultadoVazio();
    }

    let parsed: IDxf | null;
    try {
      const parser = new DxfParserCtor();
      parsed = parser.parseSync(conteudo);
    } catch (error) {
      this.logger.warn(
        `dxf-parser lançou erro: ${error instanceof Error ? error.message : error}`,
      );
      alertas.push(
        'O DXF não pôde ser interpretado (formato inválido ou versão não suportada).',
      );
      return resultadoVazio();
    }

    if (!parsed) {
      alertas.push('O DXF retornou estrutura vazia ao ser interpretado.');
      return resultadoVazio();
    }

    const nomeProjeto = this.extrairNomeProjeto(parsed);
    const descricaoProjeto = this.extrairDescricaoProjeto(parsed);
    const unidadeOrigem = this.extrairUnidade(parsed);
    const fatorMm = FATOR_PARA_MM[unidadeOrigem];

    if (unidadeOrigem === 'desconhecida') {
      alertas.push(
        'Unidade do DXF não declarada ($INSUNITS=0). Os valores foram tratados como milímetros.',
      );
    }

    const entidades = parsed.entities || [];
    if (entidades.length === 0) {
      alertas.push('O DXF não contém entidades 2D para análise.');
      return {
        ...resultadoVazio(),
        nome_projeto: nomeProjeto,
        descricao_projeto: descricaoProjeto,
        unidade_origem: unidadeOrigem,
      };
    }

    // Agrega por camada: perímetro + bbox local + flag de polígono fechado.
    const porCamada = new Map<
      string,
      {
        perimetro: number;
        quantidade: number;
        poligonosFechados: { vertices: IPoint[] }[];
      }
    >();
    const bboxGlobal: BoundingBox = {
      minX: Infinity,
      maxX: -Infinity,
      minY: Infinity,
      maxY: -Infinity,
    };

    for (const entidade of entidades) {
      const nomeCamada = (entidade.layer || 'default').trim() || 'default';
      if (!porCamada.has(nomeCamada)) {
        porCamada.set(nomeCamada, {
          perimetro: 0,
          quantidade: 0,
          poligonosFechados: [],
        });
      }
      const bucket = porCamada.get(nomeCamada);

      const contribuicao = this.medirEntidade(entidade, fatorMm);
      if (!contribuicao) continue;

      bucket.perimetro += contribuicao.perimetro;
      bucket.quantidade += 1;
      if (contribuicao.poligonoFechado) {
        bucket.poligonosFechados.push(contribuicao.poligonoFechado);
      }

      for (const ponto of contribuicao.pontos) {
        if (ponto.x < bboxGlobal.minX) bboxGlobal.minX = ponto.x;
        if (ponto.x > bboxGlobal.maxX) bboxGlobal.maxX = ponto.x;
        if (ponto.y < bboxGlobal.minY) bboxGlobal.minY = ponto.y;
        if (ponto.y > bboxGlobal.maxY) bboxGlobal.maxY = ponto.y;
      }
    }

    const camadas: CamadaExtraida[] = Array.from(porCamada.entries())
      .map(([nome, bucket]) => ({
        nome,
        perimetro_mm: arredondar(bucket.perimetro, 3),
        quantidade_entidades: bucket.quantidade,
      }))
      .filter((c) => c.quantidade_entidades > 0)
      .sort((a, b) => b.perimetro_mm - a.perimetro_mm);

    if (camadas.length === 0) {
      alertas.push(
        'Nenhuma entidade 2D suportada (LINE, LWPOLYLINE, POLYLINE, CIRCLE, ARC, ELLIPSE) foi encontrada.',
      );
      return {
        ...resultadoVazio(),
        nome_projeto: nomeProjeto,
        descricao_projeto: descricaoProjeto,
        unidade_origem: unidadeOrigem,
      };
    }

    const perimetroTotal = camadas.reduce((acc, c) => acc + c.perimetro_mm, 0);

    let larguraMm: number | null = null;
    let alturaMm: number | null = null;
    if (Number.isFinite(bboxGlobal.minX) && Number.isFinite(bboxGlobal.maxX)) {
      larguraMm = arredondar(bboxGlobal.maxX - bboxGlobal.minX, 3);
      alturaMm = arredondar(bboxGlobal.maxY - bboxGlobal.minY, 3);
    } else {
      alertas.push('Bounding box do DXF não pôde ser calculado.');
    }

    // Área: prefere shoelace do maior polígono fechado encontrado. Senão,
    // cai para bbox global.
    let areaMm2: number | null = null;
    let areaOrigem: DxfExtraido['area_origem'] = null;

    let maiorAreaShoelace = 0;
    for (const bucket of porCamada.values()) {
      for (const poligono of bucket.poligonosFechados) {
        const area = Math.abs(calcularAreaShoelace(poligono.vertices));
        if (area > maiorAreaShoelace) {
          maiorAreaShoelace = area;
        }
      }
    }
    if (maiorAreaShoelace > 0) {
      areaMm2 = arredondar(maiorAreaShoelace, 3);
      areaOrigem = 'POLIGONO_FECHADO';
    } else if (larguraMm !== null && alturaMm !== null) {
      areaMm2 = arredondar(larguraMm * alturaMm, 3);
      areaOrigem = 'BOUNDING_BOX';
      alertas.push(
        'Sem polígono fechado no DXF: a área foi estimada pelo retângulo envolvente (largura × altura).',
      );
    }

    // Camada sugerida: prioriza nome contendo "CORTE"/"CUT" (case-insensitive);
    // caso contrário, a de maior perímetro (a primeira do array já ordenado).
    const camadaCorte = camadas.find((c) =>
      /^(corte|cut)/i.test(
        c.nome.normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
      ),
    );
    const camadaSugerida = camadaCorte
      ? camadaCorte.nome
      : camadas[0]?.nome || null;

    return {
      versao_parser: VERSAO_PARSER,
      nome_projeto: nomeProjeto,
      descricao_projeto: descricaoProjeto,
      unidade_origem: unidadeOrigem,
      largura_mm: larguraMm,
      altura_mm: alturaMm,
      area_mm2: areaMm2,
      area_origem: areaOrigem,
      perimetro_total_mm: arredondar(perimetroTotal, 3),
      camadas,
      camada_sugerida: camadaSugerida,
      alertas,
    };
  }

  // -----------------------------------------------------------------------
  // Helpers privados

  private extrairNomeProjeto(parsed: IDxf): string | null {
    // O tipo da lib declara `header` como `Record<string, IPoint | number>`,
    // mas o parser na prática devolve string para `$PROJECTNAME`. Trato como
    // `unknown` e valido em runtime.
    const header = (parsed.header || {}) as Record<string, unknown>;
    const candidatos: Array<string> = [];
    // $PROJECTNAME pode aparecer com nomes ligeiramente diferentes em alguns
    // exportadores (LibreCAD usa $PROJECTNAME mesmo; AutoCAD idem). Procura
    // case-insensitive por garantia.
    for (const chave of Object.keys(header)) {
      if (chave.toUpperCase() === '$PROJECTNAME') {
        const valor = header[chave];
        if (typeof valor === 'string' && valor.trim().length > 0) {
          candidatos.push(valor.trim());
        }
      }
    }
    const escolhido = candidatos.find((v) => v && v.length > 0);
    return escolhido || null;
  }

  /**
   * Consolida em uma string única os campos descritivos do HEADER do DXF
   * (`$TITLE`, `$SUBJECT`, `$KEYWORDS`, `$COMMENTS`, `$AUTHOR`). Cada campo
   * vazio é descartado. Retorna `null` quando nenhum dos campos veio
   * preenchido — assim a UI sabe que não há nada para sugerir.
   *
   * Não inclui texto livre das entidades `TEXT`/`MTEXT` do desenho — esses
   * normalmente trazem cotas/notas de produção e poluiriam a descrição.
   */
  private extrairDescricaoProjeto(parsed: IDxf): string | null {
    const header = (parsed.header || {}) as Record<string, unknown>;
    const partes: string[] = [];
    for (const chaveAlvo of CHAVES_DESCRICAO_PROJETO) {
      for (const chave of Object.keys(header)) {
        if (chave.toUpperCase() === chaveAlvo) {
          const valor = header[chave];
          if (typeof valor === 'string' && valor.trim().length > 0) {
            partes.push(valor.trim());
          }
          break;
        }
      }
    }
    if (partes.length === 0) return null;
    // Remove duplicatas (ex.: $TITLE igual ao $SUBJECT) preservando ordem.
    const vistos = new Set<string>();
    const dedup: string[] = [];
    for (const p of partes) {
      const k = p.toLowerCase();
      if (vistos.has(k)) continue;
      vistos.add(k);
      dedup.push(p);
    }
    return dedup.join(' — ');
  }

  private extrairUnidade(parsed: IDxf): UnidadeDxf {
    const header = (parsed.header || {}) as Record<string, unknown>;
    for (const chave of Object.keys(header)) {
      if (chave.toUpperCase() === '$INSUNITS') {
        const valor = header[chave];
        if (typeof valor === 'number' && INSUNITS_MAP[valor]) {
          return INSUNITS_MAP[valor];
        }
      }
    }
    return 'desconhecida';
  }

  /**
   * Devolve perímetro, lista de pontos do bounding box e — quando aplicável —
   * o polígono fechado em mm para shoelace.
   */
  private medirEntidade(
    entidade: IEntity,
    fatorMm: number,
  ): {
    perimetro: number;
    pontos: { x: number; y: number }[];
    poligonoFechado: { vertices: IPoint[] } | null;
  } | null {
    switch (entidade.type) {
      case 'LINE':
        return this.medirLine(entidade as ILineEntity, fatorMm);
      case 'LWPOLYLINE':
        return this.medirLwPolyline(entidade as ILwpolylineEntity, fatorMm);
      case 'POLYLINE':
        return this.medirPolyline(entidade as IPolylineEntity, fatorMm);
      case 'CIRCLE':
        return this.medirCircle(entidade as ICircleEntity, fatorMm);
      case 'ARC':
        return this.medirArc(entidade as IArcEntity, fatorMm);
      case 'ELLIPSE':
        return this.medirEllipse(entidade as IEllipseEntity, fatorMm);
      default:
        return null;
    }
  }

  private medirLine(
    entidade: ILineEntity,
    fatorMm: number,
  ): {
    perimetro: number;
    pontos: { x: number; y: number }[];
    poligonoFechado: null;
  } | null {
    const vs = entidade.vertices || [];
    if (vs.length < 2) return null;
    const pontos: { x: number; y: number }[] = vs.map((v) => ({
      x: (v.x || 0) * fatorMm,
      y: (v.y || 0) * fatorMm,
    }));
    let perimetro = 0;
    for (let i = 1; i < pontos.length; i += 1) {
      perimetro += distancia(pontos[i - 1], pontos[i]);
    }
    return { perimetro, pontos, poligonoFechado: null };
  }

  private medirLwPolyline(entidade: ILwpolylineEntity, fatorMm: number) {
    const vs = entidade.vertices || [];
    if (vs.length < 2) return null;
    const pontos = vs.map((v) => ({
      x: (v.x || 0) * fatorMm,
      y: (v.y || 0) * fatorMm,
    }));
    let perimetro = 0;
    for (let i = 1; i < pontos.length; i += 1) {
      perimetro += distancia(pontos[i - 1], pontos[i]);
    }
    const fechado = !!entidade.shape;
    if (fechado && pontos.length > 2) {
      perimetro += distancia(pontos[pontos.length - 1], pontos[0]);
    }
    const poligonoFechado =
      fechado && pontos.length >= 3
        ? {
            vertices: pontos.map((p) => ({ x: p.x, y: p.y, z: 0 }) as IPoint),
          }
        : null;
    return { perimetro, pontos, poligonoFechado };
  }

  private medirPolyline(entidade: IPolylineEntity, fatorMm: number) {
    const vs = entidade.vertices || [];
    if (vs.length < 2) return null;
    const pontos = vs.map((v) => ({
      x: (v.x || 0) * fatorMm,
      y: (v.y || 0) * fatorMm,
    }));
    let perimetro = 0;
    for (let i = 1; i < pontos.length; i += 1) {
      perimetro += distancia(pontos[i - 1], pontos[i]);
    }
    const fechado = !!entidade.shape;
    if (fechado && pontos.length > 2) {
      perimetro += distancia(pontos[pontos.length - 1], pontos[0]);
    }
    const poligonoFechado =
      fechado && pontos.length >= 3
        ? {
            vertices: pontos.map((p) => ({ x: p.x, y: p.y, z: 0 }) as IPoint),
          }
        : null;
    return { perimetro, pontos, poligonoFechado };
  }

  private medirCircle(entidade: ICircleEntity, fatorMm: number) {
    const r = (entidade.radius || 0) * fatorMm;
    if (r <= 0) return null;
    const cx = (entidade.center?.x || 0) * fatorMm;
    const cy = (entidade.center?.y || 0) * fatorMm;
    const perimetro = 2 * Math.PI * r;
    // Para bbox, basta usar 4 pontos extremos do círculo.
    const pontos = [
      { x: cx - r, y: cy },
      { x: cx + r, y: cy },
      { x: cx, y: cy - r },
      { x: cx, y: cy + r },
    ];
    // O círculo é uma curva fechada, mas como vértices para shoelace seria
    // necessário discretizar — preferimos não inflar a área artificialmente
    // aqui; a UI ainda terá o perímetro correto.
    return { perimetro, pontos, poligonoFechado: null };
  }

  private medirArc(entidade: IArcEntity, fatorMm: number) {
    const r = (entidade.radius || 0) * fatorMm;
    if (r <= 0) return null;
    const cx = (entidade.center?.x || 0) * fatorMm;
    const cy = (entidade.center?.y || 0) * fatorMm;
    // ARC: ângulos em graus no DXF.
    const startDeg = entidade.startAngle || 0;
    const endDeg = entidade.endAngle || 0;
    let delta = endDeg - startDeg;
    while (delta < 0) delta += 360;
    while (delta > 360) delta -= 360;
    const perimetro = ((delta * Math.PI) / 180) * r;
    // Para bbox, amostra 8 pontos ao longo do arco.
    const pontos: { x: number; y: number }[] = [];
    const passos = 8;
    for (let i = 0; i <= passos; i += 1) {
      const t = startDeg + (delta * i) / passos;
      const rad = (t * Math.PI) / 180;
      pontos.push({ x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) });
    }
    return { perimetro, pontos, poligonoFechado: null };
  }

  private medirEllipse(entidade: IEllipseEntity, fatorMm: number) {
    const cx = (entidade.center?.x || 0) * fatorMm;
    const cy = (entidade.center?.y || 0) * fatorMm;
    const ax = (entidade.majorAxisEndPoint?.x || 0) * fatorMm;
    const ay = (entidade.majorAxisEndPoint?.y || 0) * fatorMm;
    const a = Math.sqrt(ax * ax + ay * ay);
    const b = a * (entidade.axisRatio || 1);
    if (a <= 0) return null;
    // Aproximação de Ramanujan II para perímetro de elipse.
    const h = ((a - b) * (a - b)) / ((a + b) * (a + b));
    const perimetro =
      Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
    // Bbox aproximado (sem rotação fina).
    const pontos = [
      { x: cx - a, y: cy - b },
      { x: cx + a, y: cy - b },
      { x: cx - a, y: cy + b },
      { x: cx + a, y: cy + b },
    ];
    return { perimetro, pontos, poligonoFechado: null };
  }
}

interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

function distancia(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function calcularAreaShoelace(vertices: IPoint[]): number {
  if (vertices.length < 3) return 0;
  let soma = 0;
  for (let i = 0; i < vertices.length; i += 1) {
    const atual = vertices[i];
    const prox = vertices[(i + 1) % vertices.length];
    soma += atual.x * prox.y - prox.x * atual.y;
  }
  return soma / 2;
}

function arredondar(valor: number, casas: number): number {
  const fator = Math.pow(10, casas);
  return Math.round(valor * fator) / fator;
}
