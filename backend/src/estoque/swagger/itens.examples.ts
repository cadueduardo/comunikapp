export const itemCriadoExample = {
  id: '550e8400-e29b-41d4-a716-446655440002',
  insumoId: '550e8400-e29b-41d4-a716-446655440000',
  localizacaoId: '550e8400-e29b-41d4-a716-446655440001',
  quantidadeAtual: 100.5,
  quantidadeReservada: 0,
  estoqueMinimo: 10.0,
  estoqueMaximo: 1000.0,
  lojaId: '550e8400-e29b-41d4-a716-446655440003',
  dataUltimaMov: '2025-01-08T10:00:00.000Z',
  createdAt: '2025-01-08T10:00:00.000Z',
  localizacao: {
    codigo: 'A1-01-B-02-03',
    deposito: 'Depósito Central',
  },
};

export const listarItensExample = {
  data: [
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      insumoId: '550e8400-e29b-41d4-a716-446655440000',
      quantidadeAtual: 50.0,
      estoqueMinimo: 10.0,
      localizacao: {
        codigo: 'A1-01-B-02-03',
        deposito: 'Depósito Central',
      },
      lotes: [
        {
          numeroLote: 'LT001',
          dataValidade: '2025-12-31T00:00:00.000Z',
          quantidadeLote: 30.0,
          status: 'ATIVO',
        },
      ],
    },
  ],
  pagination: {
    page: 1,
    limit: 20,
    total: 1,
    totalPages: 1,
  },
};

export const itemDetalheExample = {
  id: '550e8400-e29b-41d4-a716-446655440002',
  insumoId: '550e8400-e29b-41d4-a716-446655440000',
  insumoNome: 'Bobina Lona Impressão Digital',
  localizacaoId: '550e8400-e29b-41d4-a716-446655440001',
  localizacaoCodigo: 'A1-01-B-02-03',
  quantidadeAtual: 50.0,
  quantidadeReservada: 5.0,
  estoqueMinimo: 10.0,
  estoqueMaximo: 100.0,
  unidadeCompra: 'BOBINA',
  valorUnitario: 870.0,
  codigoBarras: '7891234567890',
  lote: 'LT001',
  dataValidade: '2025-12-31T00:00:00.000Z',
  fornecedor: 'Fornecedor ABC',
  observacoes: 'Observações do item',
  ativo: true,
  createdAt: '2025-01-08T10:00:00.000Z',
  updatedAt: '2025-01-08T10:00:00.000Z',
};


