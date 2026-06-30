export interface EnderecoInstalacaoMontado {
  cep: string | null;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  uf: string;
}

interface ProdutoEnderecoInstalacao {
  instalacao_cep?: string | null;
  instalacao_logradouro?: string | null;
  instalacao_numero?: string | null;
  instalacao_complemento?: string | null;
  instalacao_bairro?: string | null;
  instalacao_cidade?: string | null;
  instalacao_estado?: string | null;
  instalacao_endereco_snapshot?: string | null;
}

/**
 * Monta endereço estruturado a partir dos campos de instalação do orçamento.
 */
export function montarEnderecoInstalacaoDoProduto(
  produto: ProdutoEnderecoInstalacao,
): EnderecoInstalacaoMontado {
  const snapshot = (produto.instalacao_endereco_snapshot ?? '').trim();

  return {
    cep: produto.instalacao_cep?.trim() || null,
    logradouro:
      produto.instalacao_logradouro?.trim() ||
      (snapshot ? snapshot.slice(0, 255) : 'Endereço a confirmar'),
    numero: produto.instalacao_numero?.trim() || 'S/N',
    complemento: produto.instalacao_complemento?.trim() || null,
    bairro: produto.instalacao_bairro?.trim() || 'A definir',
    cidade: produto.instalacao_cidade?.trim() || 'A definir',
    uf: (produto.instalacao_estado?.trim() || 'SP').slice(0, 2).toUpperCase(),
  };
}
