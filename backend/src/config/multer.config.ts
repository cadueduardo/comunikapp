import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import type { Request } from 'express';

/** Tipo do arquivo no callback do multer (compatível com Express.Multer.File). */
interface MulterFileLike {
  originalname: string;
  mimetype: string;
}

// Diretório base para uploads
const uploadDir = join(process.cwd(), 'uploads', 'arte');

// Garantir que o diretório existe
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

export const multerConfig = {
  storage: diskStorage({
    destination: (
      req: Request,
      file: MulterFileLike,
      cb: (error: Error | null, dest: string) => void,
    ) => {
      // Criar subpasta por versão para organização
      const versaoId = (req.params as { versaoId?: string }).versaoId ?? '';
      const versaoDir = join(uploadDir, versaoId);

      if (!existsSync(versaoDir)) {
        mkdirSync(versaoDir, { recursive: true });
      }

      cb(null, versaoDir);
    },
    filename: (
      req: Request,
      file: MulterFileLike,
      cb: (error: Error | null, filename: string) => void,
    ) => {
      // Gerar nome único: timestamp-random-originalname
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      const nameWithoutExt = file.originalname.replace(ext, '');
      const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');

      cb(null, `${uniqueSuffix}-${sanitizedName}${ext}`);
    },
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (
    req: Request,
    file: MulterFileLike,
    cb: (error: Error | null, acceptFile?: boolean) => void,
  ) => {
    // Validar tipos de arquivo permitidos
    const allowedMimes: string[] = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/postscript', // .ai
      'image/vnd.adobe.photoshop', // .psd
      'application/eps', // .eps
      'application/x-eps', // .eps
      'image/eps', // .eps
    ];

    const allowedExtensions = [
      '.pdf',
      '.jpg',
      '.jpeg',
      '.png',
      '.ai',
      '.psd',
      '.eps',
    ];
    const ext = extname(file.originalname).toLowerCase();
    const mimetype = typeof file.mimetype === 'string' ? file.mimetype : '';

    if (allowedMimes.includes(mimetype) || allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Tipo de arquivo não permitido: ${mimetype}. Aceitos: PDF, JPG, PNG, AI, PSD, EPS`,
        ),
        false,
      );
    }
  },
};

export const uploadPath = uploadDir;
