import { STATUS_OS_VALUES, StatusOS, isStatusOS } from '../os.interfaces';

/**
 * Garante que o enum TypeScript e o enum Prisma (schema) permaneçam alinhados.
 * Ao alterar StatusOS, atualize também `enum StatusOS` em schema.prisma.
 */
const STATUS_OS_PRISMA_ESPERADO = [
  'FILA',
  'AGUARDANDO_APROVACAO_FINANCEIRA',
  'AGUARDANDO_APROVACAO_TECNICA',
  'APROVADA_TECNICA',
  'AGUARDANDO_APROVACAO_ORCAMENTARIA',
  'APROVADA_ORCAMENTARIA',
  'REJEITADA',
  'LIBERADA_PARA_PCP',
  'PARCIALMENTE_LIBERADA',
  'EM_WORKFLOW',
  'PRODUCAO',
  'ACABAMENTO',
  'FINALIZADA',
  'CANCELADA',
  'AGUARDANDO_MATERIAL',
  'PAUSADA',
] as const;

describe('StatusOS unificado (P1-5)', () => {
  it('STATUS_OS_VALUES tem 16 valores únicos', () => {
    expect(STATUS_OS_VALUES).toHaveLength(16);
    expect(new Set(STATUS_OS_VALUES).size).toBe(16);
  });

  it('coincide com o enum Prisma documentado', () => {
    expect([...STATUS_OS_VALUES].sort()).toEqual(
      [...STATUS_OS_PRISMA_ESPERADO].sort(),
    );
  });

  it('isStatusOS aceita valores válidos e rejeita inválidos', () => {
    expect(isStatusOS(StatusOS.FILA)).toBe(true);
    expect(isStatusOS('LIBERADA_PARA_PCP')).toBe(true);
    expect(isStatusOS('DEVOLVIDA')).toBe(false);
    expect(isStatusOS('')).toBe(false);
    expect(isStatusOS(null)).toBe(false);
  });
});
