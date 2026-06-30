import { extname } from 'path';
import { memoryStorage } from 'multer';
import type { Request } from 'express';

export const INSTALACAO_ANEXO_LIMITE_BYTES = 5 * 1024 * 1024;

const MIMES_PERMITIDOS = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
]);

interface MulterFileLike {
  originalname: string;
  mimetype: string;
}

export function classificarAnexoInstalacao(
  mimetype: string,
  nomeOriginal: string,
): '.png' | '.jpg' | '.webp' | null {
  const mimeLower = (mimetype || '').toLowerCase();
  if (mimeLower === 'image/png') return '.png';
  if (mimeLower === 'image/jpeg' || mimeLower === 'image/jpg') return '.jpg';
  if (mimeLower === 'image/webp') return '.webp';

  const ext = extname(nomeOriginal || '').toLowerCase();
  if (ext === '.png') return '.png';
  if (ext === '.jpg' || ext === '.jpeg') return '.jpg';
  if (ext === '.webp') return '.webp';

  return null;
}

export const multerInstalacaoAnexoConfig = {
  storage: memoryStorage(),
  limits: {
    fileSize: INSTALACAO_ANEXO_LIMITE_BYTES,
  },
  fileFilter: (
    _req: Request,
    file: MulterFileLike,
    cb: (error: Error | null, acceptFile?: boolean) => void,
  ) => {
    const ext = classificarAnexoInstalacao(file.mimetype, file.originalname);
    if (!ext || !MIMES_PERMITIDOS.has(file.mimetype.toLowerCase())) {
      return cb(
        new Error(
          'Formato não permitido. Aceitos: PNG, JPEG e WebP (máx. 5 MB).',
        ),
      );
    }
    cb(null, true);
  },
};
