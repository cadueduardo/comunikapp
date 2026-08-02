/**
 * Smoke do sharp após upgrade (Gate 0S / GHSA-f88m-g3jw-g9cj).
 * Gera JPEG/PNG mínimos, processa com sharp e valida resize + metadata.
 * Não usa uploads reais nem dados de produção.
 *
 *   node scripts/smoke-sharp-upload.mjs
 */

import sharp from 'sharp';

function fail(msg) {
  process.stderr.write(`[smoke-sharp] FALHA: ${msg}\n`);
  process.exit(1);
}

function ok(msg) {
  process.stdout.write(`[smoke-sharp] ${msg}\n`);
}

async function main() {
  const versions = sharp.versions || {};
  const version = String(versions.sharp || '');
  ok(`sharp_version=${version || '(desconhecida)'}`);
  ok(`libvips_version=${versions.vips || '(desconhecida)'}`);
  if (version && !/^0\.35\./.test(version) && !(Number(version.split('.')[0]) >= 1)) {
    fail(`versão ${version} ainda está abaixo do patch >=0.35.0`);
  }

  const jpeg = await sharp({
    create: {
      width: 64,
      height: 48,
      channels: 3,
      background: { r: 20, g: 120, b: 200 },
    },
  })
    .jpeg({ quality: 80 })
    .toBuffer();

  const png = await sharp({
    create: {
      width: 80,
      height: 60,
      channels: 4,
      background: { r: 10, g: 10, b: 10, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

  const thumb = await sharp(jpeg)
    .resize(32, 32, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 70 })
    .toBuffer();

  const metaJpeg = await sharp(jpeg).metadata();
  const metaPng = await sharp(png).metadata();
  const metaThumb = await sharp(thumb).metadata();

  if (metaJpeg.format !== 'jpeg' || metaJpeg.width !== 64) {
    fail('metadata JPEG inesperada');
  }
  if (metaPng.format !== 'png' || metaPng.width !== 80) {
    fail('metadata PNG inesperada');
  }
  if (!metaThumb.width || metaThumb.width > 32) {
    fail('thumbnail não redimensionou');
  }

  ok('jpeg_ok=1');
  ok('png_ok=1');
  ok('thumbnail_ok=1');
  ok('ensaio_ok=1');
}

main().catch((e) => fail(String(e && e.message ? e.message : e)));
