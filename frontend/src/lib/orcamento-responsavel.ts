export type ResponsavelOrcamentoResumo = {
  id: string;
  nome: string;
};

export function rotuloResponsavelOrcamento(orcamento: {
  responsavel?: ResponsavelOrcamentoResumo | null;
  responsavel_id?: string | null;
  atendente?: string | null;
}): string {
  const nomeRelacao = orcamento.responsavel?.nome?.trim();
  if (nomeRelacao) return nomeRelacao;
  if (orcamento.responsavel_id) {
    const nomeCopia = orcamento.atendente?.trim();
    if (nomeCopia && nomeCopia !== 'Equipe Comercial') return nomeCopia;
    return 'Responsável';
  }
  return 'Sem responsável';
}

export function orcamentoSemResponsavel(orcamento: {
  responsavel_id?: string | null;
  responsavel?: ResponsavelOrcamentoResumo | null;
}): boolean {
  return !orcamento.responsavel_id && !orcamento.responsavel?.id;
}
