import { extname } from 'path';
import { memoryStorage } from 'multer';
import type { Request } from 'express';

export const PRODUTO_FINITO_IMAGEM_LIMITE_BYTES = 5 * 1024 * 1024;
export const PRODUTO_FINITO_MAX_IMAGENS = 10;

export const MIMES_PRODUTO_FINITO_IMAGEM = new Set<string>([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
]);

export const EXTENSOES_PRODUTO_FINITO_IMAGEM = new Set<string>([
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
]);

interface MulterFileLike {
  originalname: string;
  mimetype: string;
}

export function classificarImagemProdutoFinito(
  mimetype: string,
  nomeOriginal: string,
): string | null {
  const mimeLower = (mimetype || '').toLowerCase();
  if (MIMES_PRODUTO_FINITO_IMAGEM.has(mimeLower)) {
    return extname(nomeOriginal || '').toLowerCase() || '.jpg';
  }
  const ext = extname(nomeOriginal || '').toLowerCase();
  if (EXTENSOES_PRODUTO_FINITO_IMAGEM.has(ext)) {
    return ext;
  }
  return null;
}

export const multerProdutoFinitoImagemConfig = {
  storage: memoryStorage(),
  limits: {
    fileSize: PRODUTO_FINITO_IMAGEM_LIMITE_BYTES,
  },
  fileFilter: (
    _req: Request,
    file: MulterFileLike,
    cb: (error: Error | null, acceptFile?: boolean) => void,
  ) => {
    const ext = classificarImagemProdutoFinito(file.mimetype, file.originalname);
    if (!ext) {
      return cb(
        new Error(
          'Formato não permitido. Aceitos: PNG, JPG, JPEG, WEBP e GIF.',
        ),
      );
    }
    cb(null, true);
  },
};
