/**
 * Gera `src/rbac/catalogo/manifestos.generated.ts` a partir dos arquivos
 * `*.catalogo.ts` que usam `manifestoAcessoModulo`.
 *
 * Uso:
 *   npx ts-node --transpile-only scripts/gerar-agregador-catalogo-rbac.ts
 *   npx ts-node --transpile-only scripts/gerar-agregador-catalogo-rbac.ts --check
 */
import * as fs from 'fs';
import * as path from 'path';
import {
  descobrirArquivosManifestoRbac,
  renderizarAgregadorGerado,
} from '../src/rbac/catalogo/descoberta-fontes';

const backendRoot = path.resolve(__dirname, '..');
const srcDir = path.join(backendRoot, 'src');
const destino = path.join(
  srcDir,
  'rbac',
  'catalogo',
  'manifestos.generated.ts',
);

const arquivos = descobrirArquivosManifestoRbac(srcDir);
if (arquivos.length === 0) {
  throw new Error('Nenhum manifesto RBAC encontrado em src/**/*.catalogo.ts');
}

const conteudo = renderizarAgregadorGerado(arquivos, srcDir, destino);
const check = process.argv.includes('--check');

if (check) {
  if (!fs.existsSync(destino)) {
    console.error(`Arquivo gerado ausente: ${destino}`);
    process.exit(1);
  }
  const atual = fs.readFileSync(destino, 'utf8');
  if (atual !== conteudo) {
    console.error(
      'manifestos.generated.ts está desatualizado. Rode: npx ts-node --transpile-only scripts/gerar-agregador-catalogo-rbac.ts',
    );
    process.exit(1);
  }
  console.log(
    `Catálogo RBAC gerado está sincronizado (${arquivos.length} manifestos).`,
  );
  process.exit(0);
}

fs.writeFileSync(destino, conteudo, 'utf8');
console.log(`Gerado ${path.relative(backendRoot, destino)} (${arquivos.length} manifestos).`);
