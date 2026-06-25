export function formatarDataHistoricoExpedicao(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return iso;

  const dia = data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });
  const hora = data.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${dia} às ${hora}`;
}
