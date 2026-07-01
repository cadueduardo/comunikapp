import { memoryStorage } from 'multer';
import { extname } from 'path';
import { Request } from 'express';

type MulterFileLike = {
  originalname: string;
  mimetype: string;
};

const TIPOS_PERMITIDOS = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/postscript',
  'image/vnd.adobe.photoshop',
  'application/illustrator',
];

const EXTENSOES_PERMITIDAS = ['.pdf', '.jpg', '.jpeg', '.png', '.ai', '.psd', '.eps'];

/**
 * Upload de arte em memória — stream enviado ao Google Drive sem gravar em disco.
 */
export const multerArteMemoryConfig = {
  storage: memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter: (
    _req: Request,
    file: MulterFileLike,
    cb: (error: Error | null, acceptFile?: boolean) => void,
  ) => {
    const ext = extname(file.originalname).toLowerCase();
    const mimeOk = TIPOS_PERMITIDOS.includes(file.mimetype);
    const extOk = EXTENSOES_PERMITIDAS.includes(ext);

    if (mimeOk || extOk) {
      cb(null, true);
      return;
    }

    cb(
      new Error(
        `Tipo de arquivo não permitido. Aceitos: ${EXTENSOES_PERMITIDAS.join(', ')}`,
      ),
    );
  },
};
