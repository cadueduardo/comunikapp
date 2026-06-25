import { extname } from 'path';
import { memoryStorage } from 'multer';
import type { Request } from 'express';

export const EXPEDICAO_ASSINATURA_LIMITE_BYTES = 500 * 1024;

const MIMES_PERMITIDOS = new Set(['image/png', 'image/webp']);
const EXTENSOES_PERMITIDAS = new Set(['.png', '.webp']);

interface MulterFileLike {
  originalname: string;
  mimetype: string;
}

export function classificarAssinaturaExpedicao(
  mimetype: string,
  nomeOriginal: string,
): '.png' | '.webp' | null {
  const mimeLower = (mimetype || '').toLowerCase();
  if (mimeLower === 'image/png') return '.png';
  if (mimeLower === 'image/webp') return '.webp';

  const ext = extname(nomeOriginal || '').toLowerCase();
  if (ext === '.png' || ext === '.webp') {
    return ext;
  }

  return null;
}

export const multerExpedicaoAssinaturaConfig = {
  storage: memoryStorage(),
  limits: {
    fileSize: EXPEDICAO_ASSINATURA_LIMITE_BYTES,
  },
  fileFilter: (
    _req: Request,
    file: MulterFileLike,
    cb: (error: Error | null, acceptFile?: boolean) => void,
  ) => {
    const ext = classificarAssinaturaExpedicao(file.mimetype, file.originalname);
    if (!ext) {
      return cb(
        new Error('Formato não permitido. Aceitos: PNG e WebP (máx. 500 KB).'),
      );
    }
    cb(null, true);
  },
};
