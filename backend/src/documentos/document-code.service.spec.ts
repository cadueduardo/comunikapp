import { DocumentCodeService } from './document-code.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DocumentCodeService', () => {
  const upsertMock = jest.fn();
  const prismaMock = {
    document_sequence: {
      upsert: upsertMock,
    },
    $transaction: jest.fn((callback: any) => callback(prismaMock)),
  } as unknown as PrismaService;

  let service: DocumentCodeService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DocumentCodeService(prismaMock);
  });

  it('deve gerar código inicial para orçamento', async () => {
    (prismaMock.document_sequence.upsert as jest.Mock).mockResolvedValue({
      ultimo_numero: 1,
    });

    const codigo = await service.gerarCodigoOrcamento('loja-001', 2025);

    expect(codigo).toBe('ORC-2025-001');
    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(prismaMock.document_sequence.upsert).toHaveBeenCalledWith({
      where: {
        loja_id_tipo_documento_ano: {
          loja_id: 'loja-001',
          tipo_documento: 'ORC',
          ano: 2025,
        },
      },
      update: {
        ultimo_numero: {
          increment: 1,
        },
      },
      create: {
        loja_id: 'loja-001',
        tipo_documento: 'ORC',
        ano: 2025,
        ultimo_numero: 1,
      },
    });
  });

  it('deve incrementar sequência existente', async () => {
    (prismaMock.document_sequence.upsert as jest.Mock).mockResolvedValue({
      ultimo_numero: 7,
    });

    const codigo = await service.gerarCodigoOrcamento('loja-001', 2025);

    expect(codigo).toBe('ORC-2025-007');
  });

  it('deve usar ano atual quando não informado', async () => {
    const anoAtual = new Date().getFullYear();

    (prismaMock.document_sequence.upsert as jest.Mock).mockResolvedValue({
      ultimo_numero: 2,
    });

    const codigo = await service.gerarCodigoOrcamento('loja-001');

    expect(codigo).toBe(`ORC-${anoAtual}-002`);
  });
});
