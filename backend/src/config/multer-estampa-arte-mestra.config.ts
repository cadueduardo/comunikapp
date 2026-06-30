import { extname } from 'path';
import { memoryStorage } from 'multer';
import type { Request } from 'express';

/** Limite de 15 MB para arte-mestra (mitigação DoS — OWASP A05). */
export const ESTAMPA_ARTE_MESTRA_LIMITE_BYTES = 15 * 1024 * 1024;

export const MIMES_ESTAMPA_ARTE_MESTRA = new Set<string>([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/svg+xml',
]);

export const EXTENSOES_ESTAMPA_ARTE_MESTRA = new Set<string>([
  '.pdf',
  '.png',
  '.jpg',
  '.jpeg',
  '.svg',
]);

interface MulterFileLike {
  originalname: string;
  mimetype: string;
}

/**
 * Remove segmentos de path traversal e caracteres perigosos do nome original.
 */
export function sanitizarNomeOriginal(nome: string): string {
  return nome
    .replace(/\\/g, '/')
    .split('/')
    .pop()
    .replace(/\.\./g, '')
    .replace(/[^\w.\- ()áàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]/g, '_')
    .slice(0, 200);
}

export function classificarArteMestraEstampa(
  mimetype: string,
  nomeOriginal: string,
): string | null {
  const mimeLower = (mimetype || '').toLowerCase();
  const extOriginal = extname(
    sanitizarNomeOriginal(nomeOriginal),
  ).toLowerCase();

  if (mimeLower === 'application/pdf' && extOriginal === '.pdf') {
    return '.pdf';
  }
  if (mimeLower === 'image/png' && extOriginal === '.png') {
    return '.png';
  }
  if (
    (mimeLower === 'image/jpeg' || mimeLower === 'image/jpg') &&
    (extOriginal === '.jpg' || extOriginal === '.jpeg')
  ) {
    return extOriginal === '.jpeg' ? '.jpeg' : '.jpg';
  }
  if (mimeLower === 'image/svg+xml' && extOriginal === '.svg') {
    return '.svg';
  }

  return null;
}

export const multerEstampaArteMestraConfig = {
  storage: memoryStorage(),
  limits: {
    fileSize: ESTAMPA_ARTE_MESTRA_LIMITE_BYTES,
  },
  fileFilter: (
    _req: Request,
    file: MulterFileLike,
    cb: (error: Error | null, acceptFile?: boolean) => void,
  ) => {
    const ext = classificarArteMestraEstampa(file.mimetype, file.originalname);
    if (!ext) {
      return cb(
        new Error('Formato não permitido. Aceitos: PDF, PNG, JPEG e SVG.'),
      );
    }
    cb(null, true);
  },
};
