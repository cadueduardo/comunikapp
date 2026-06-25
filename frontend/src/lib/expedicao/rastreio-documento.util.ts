/** Verifica se ORC-AAAA-NNN e OS-AAAA-NNN compartilham a mesma sequência. */
export function numerosDocumentoAlinhados(
  numeroOrcamento: string,
  numeroOs: string,
): boolean {
  const orc = numeroOrcamento.trim().match(/^ORC-(\d{4})-(\d+)$/i);
  const os = numeroOs.trim().match(/^OS-(\d{4})-(\d+)$/i);
  if (!orc || !os) return true;
  return (
    orc[1] === os[1] &&
    orc[2].padStart(3, '0') === os[2].padStart(3, '0')
  );
}

export function osEsperadaDeOrcamento(numeroOrcamento: string): string | null {
  const orc = numeroOrcamento.trim().match(/^ORC-(\d{4})-(\d+)$/i);
  if (!orc) return null;
  return `OS-${orc[1]}-${orc[2].padStart(3, '0')}`;
}
