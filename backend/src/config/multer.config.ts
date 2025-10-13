import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Diretório base para uploads
const uploadDir = join(process.cwd(), 'uploads', 'arte');

// Garantir que o diretório existe
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
  console.log('📁 Diretório de uploads criado:', uploadDir);
}

export const multerConfig = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      // Criar subpasta por versão para organização
      const versaoId = req.params.versaoId;
      const versaoDir = join(uploadDir, versaoId);
      
      if (!existsSync(versaoDir)) {
        mkdirSync(versaoDir, { recursive: true });
      }
      
      cb(null, versaoDir);
    },
    filename: (req, file, cb) => {
      // Gerar nome único: timestamp-random-originalname
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = extname(file.originalname);
      const nameWithoutExt = file.originalname.replace(ext, '');
      const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
      
      cb(null, `${uniqueSuffix}-${sanitizedName}${ext}`);
    },
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    // Validar tipos de arquivo permitidos
    const allowedMimes = [
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
    
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.ai', '.psd', '.eps'];
    const ext = extname(file.originalname).toLowerCase();
    
    if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}. Aceitos: PDF, JPG, PNG, AI, PSD, EPS`));
    }
  },
};

export const uploadPath = uploadDir;



