import { extname } from 'path';
import { memoryStorage } from 'multer';
import type { Request } from 'express';

/**
 * Configuração de upload do Multer para anexos de geometria do orçamento V2.
 *
 * Difere do `multer.config.ts` (usado por Arte & Aprovação) em três pontos:
 *  - Usa `memoryStorage` em vez de `diskStorage`. O `AnexoGeometriaService` é
 *    quem decide o caminho final (por loja_id) e grava o arquivo em disco.
 *    Manter o arquivo na memória até esse ponto evita criar arquivos em
 *    diretórios temporários que precisariam ser limpos depois.
 *  - Aceita imagens (PNG/JPG/WEBP/GIF) **e** DXF — formatos esperados pela
 *    Fase 7 do plano-mãe e pelo HTML do cliente.
 *  - Limite global de 20 MB (tamanho máximo do DXF). A validação por
 *    categoria (5 MB para imagem, 20 MB para DXF) é feita no service, depois
 *    de inspecionar o mime type real do arquivo.
 */

interface MulterFileLike {
  originalname: string;
  mimetype: string;
}

export const ANEXO_GEOMETRIA_LIMITE_GLOBAL_BYTES = 20 * 1024 * 1024;
export const ANEXO_GEOMETRIA_LIMITE_IMAGEM_BYTES = 5 * 1024 * 1024;
export const ANEXO_GEOMETRIA_LIMITE_DXF_BYTES = 20 * 1024 * 1024;

export const MIMES_IMAGEM_ACEITOS = new Set<string>([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
]);

export const MIMES_DXF_ACEITOS = new Set<string>([
  'application/dxf',
  'application/x-dxf',
  'image/x-dxf',
  'image/vnd.dxf',
]);

export const EXTENSOES_DXF = new Set<string>(['.dxf']);

export type CategoriaAnexoGeometria = 'IMAGEM' | 'DXF';

/**
 * Classifica o arquivo recebido em IMAGEM, DXF ou inválido. O DXF tem mime
 * inconsistente entre exportadores (alguns enviam application/octet-stream),
 * por isso o fallback por extensão é obrigatório.
 */
export function classificarAnexoGeometria(
  mimetype: string,
  nomeOriginal: string,
): CategoriaAnexoGeometria | null {
  const mimeLower = (mimetype || '').toLowerCase();
  if (MIMES_IMAGEM_ACEITOS.has(mimeLower)) {
    return 'IMAGEM';
  }
  if (MIMES_DXF_ACEITOS.has(mimeLower)) {
    return 'DXF';
  }
  const ext = extname(nomeOriginal || '').toLowerCase();
  if (EXTENSOES_DXF.has(ext)) {
    return 'DXF';
  }
  return null;
}

export const multerAnexoGeometriaConfig = {
  storage: memoryStorage(),
  limits: {
    fileSize: ANEXO_GEOMETRIA_LIMITE_GLOBAL_BYTES,
  },
  fileFilter: (
    _req: Request,
    file: MulterFileLike,
    cb: (error: Error | null, acceptFile?: boolean) => void,
  ) => {
    const categoria = classificarAnexoGeometria(
      file.mimetype,
      file.originalname,
    );
    if (categoria) {
      cb(null, true);
      return;
    }
    cb(
      new Error(
        'Formato de arquivo não permitido. Aceitos: PNG, JPG, WEBP, GIF, DXF.',
      ),
      false,
    );
  },
};
