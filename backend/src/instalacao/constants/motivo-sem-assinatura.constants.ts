import { MotivoSemAssinaturaLote } from '@prisma/client';

export const MOTIVO_SEM_ASSINATURA_LABEL: Record<
  MotivoSemAssinaturaLote,
  string
> = {
  CLIENTE_AUSENTE: 'Cliente ausente no local',
  CLIENTE_RECUSOU_ASSINAR: 'Cliente recusou assinar',
  ASSINATURA_CANAL_ALTERNATIVO:
    'Assinatura obtida por outro canal (e-mail, WhatsApp, etc.)',
  INSTALADOR_SEM_APP: 'Instalador não finalizou no aplicativo de campo',
  EVIDENCIA_SUFICIENTE: 'Evidências fotográficas consideradas suficientes',
  OUTROS: 'Outros (descrever abaixo)',
};

export const MOTIVOS_SEM_ASSINATURA_OPCOES = Object.entries(
  MOTIVO_SEM_ASSINATURA_LABEL,
).map(([value, label]) => ({
  value: value as MotivoSemAssinaturaLote,
  label,
}));
