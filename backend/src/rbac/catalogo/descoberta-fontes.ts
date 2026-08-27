import * as fs from 'fs';
import * as path from 'path';

/**
 * Descoberta verificável das fontes reais do RBAC.
 * Usada pelo gerador commitado e pelo gate de CI — nunca por duas listas manuais.
 */
export const MARCADOR_MANIFESTO_RBAC = 'manifestoAcessoModulo';

/** Rotas `(main)` que não são módulo funcional da loja. */
export const ROTAS_MAIN_FORA_DO_TENANT = ['admin-plataforma'] as const;

export type ArquivoManifestoRbac = {
  absolutePath: string;
  relativeFromSrc: string;
  exportName: string;
};

function listarArquivos(
  dir: string,
  aceitar: (nome: string) => boolean,
): string[] {
  if (!fs.existsSync(dir)) {
    throw new Error(`Diretório inexistente para descoberta RBAC: ${dir}`);
  }
  const saida: string[] = [];
  const entradas = fs.readdirSync(dir, { withFileTypes: true });
  for (const entrada of entradas) {
    const abs = path.join(dir, entrada.name);
    if (entrada.isDirectory()) {
      if (entrada.name === 'node_modules' || entrada.name === 'dist') {
        continue;
      }
      saida.push(...listarArquivos(abs, aceitar));
      continue;
    }
    if (entrada.isFile() && aceitar(entrada.name)) {
      saida.push(abs);
    }
  }
  return saida;
}

export function descobrirArquivosManifestoRbac(
  srcDir: string,
): ArquivoManifestoRbac[] {
  const arquivos = listarArquivos(srcDir, (nome) =>
    nome.endsWith('.catalogo.ts'),
  );
  const encontrados: ArquivoManifestoRbac[] = [];
  for (const abs of arquivos) {
    const content = fs.readFileSync(abs, 'utf8');
    if (!content.includes(MARCADOR_MANIFESTO_RBAC)) {
      continue;
    }
    const match = content.match(/export const ([A-Z0-9_]+_CATALOGO)\b/);
    if (!match) {
      throw new Error(
        `Manifesto RBAC sem \`export const *_CATALOGO\`: ${path.relative(srcDir, abs)}`,
      );
    }
    encontrados.push({
      absolutePath: abs,
      relativeFromSrc: path.relative(srcDir, abs).replace(/\\/g, '/'),
      exportName: match[1],
    });
  }
  return encontrados.sort((a, b) =>
    a.relativeFromSrc.localeCompare(b.relativeFromSrc),
  );
}

export function descobrirSegmentosRotaMain(mainDir: string): string[] {
  if (!fs.existsSync(mainDir)) {
    throw new Error(`Diretório (main) inexistente: ${mainDir}`);
  }
  return fs
    .readdirSync(mainDir, { withFileTypes: true })
    .filter((entrada) => entrada.isDirectory())
    .map((entrada) => entrada.name)
    .sort();
}

export function segmentoDeRotaFrontend(rota: string): string | undefined {
  const limpa = rota.split('?')[0].replace(/\\/g, '/');
  const partes = limpa.split('/').filter(Boolean);
  return partes[0];
}

const RE_REQUER_LITERAL =
  /@RequerPermissao(?:Vendas)?\(\s*(?:'([^']+)'|"([^"]+)")/g;
const RE_ASSERT_LITERAL =
  /assertPode(?:Qualquer)?\(\s*[^,]+,\s*[^,]+,\s*'([^']+)'/g;

export function descobrirChavesEnforcedNoCodigo(srcDir: string): string[] {
  const arquivos = listarArquivos(
    srcDir,
    (nome) =>
      nome.endsWith('.ts') &&
      !nome.endsWith('.spec.ts') &&
      !nome.endsWith('.d.ts'),
  );
  const chaves = new Set<string>();
  for (const abs of arquivos) {
    const content = fs.readFileSync(abs, 'utf8');
    for (const match of content.matchAll(RE_REQUER_LITERAL)) {
      const chave = match[1] || match[2];
      if (chave) {
        chaves.add(chave);
      }
    }
    for (const match of content.matchAll(RE_ASSERT_LITERAL)) {
      if (match[1]?.includes('.')) {
        chaves.add(match[1]);
      }
    }
  }
  return [...chaves].sort();
}

export function renderizarAgregadorGerado(
  arquivos: readonly ArquivoManifestoRbac[],
  srcDir: string,
  destinoAbs: string,
): string {
  const destinoDir = path.dirname(destinoAbs);
  const imports = arquivos.map((arquivo) => {
    let rel = path
      .relative(destinoDir, path.join(srcDir, arquivo.relativeFromSrc))
      .replace(/\\/g, '/');
    if (!rel.startsWith('.')) {
      rel = `./${rel}`;
    }
    rel = rel.replace(/\.ts$/, '');
    return `import { ${arquivo.exportName} } from '${rel}';`;
  });
  const lista = arquivos
    .map((arquivo) => `  ${arquivo.exportName},`)
    .join('\n');
  const caminhos = arquivos
    .map((arquivo) => `  '${arquivo.relativeFromSrc}',`)
    .join('\n');

  return `/* AUTO-GERADO por scripts/gerar-agregador-catalogo-rbac.ts. Não edite. */
${imports.join('\n')}
import { ModuloCatalogo } from './tipos';

export const ARQUIVOS_MANIFESTO_RBAC = [
${caminhos}
] as const;

export const MANIFESTOS_DESCOBERTOS: readonly ModuloCatalogo[] = [
${lista}
];
`;
}
