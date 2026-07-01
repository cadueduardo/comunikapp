export enum LojaConexaoTipo {
  GOOGLE_DRIVE = 'GOOGLE_DRIVE',
  WHATSAPP_EVOLUTION = 'WHATSAPP_EVOLUTION',
}

export enum LojaConexaoStatus {
  DESCONECTADO = 'DESCONECTADO',
  CONECTADO = 'CONECTADO',
  PENDENTE = 'PENDENTE',
  ERRO = 'ERRO',
}

export const GOOGLE_DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  // Necessário para localizar pastas existentes (files.list) sem escopo drive completo
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'openid',
] as const;

export const DRIVE_ROOT_FOLDER_NAME = 'Comunikapp';
