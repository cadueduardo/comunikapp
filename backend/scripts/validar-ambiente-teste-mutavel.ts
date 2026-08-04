const PADRAO_BANCO_TESTE = /(test|teste|scratch|ci)/i;

export function validarAmbienteTesteMutavel(): string {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Script de validação RBAC proibido em NODE_ENV=production.',
    );
  }

  if (process.env.ALLOW_RBAC_TEST_MUTATIONS !== 'true') {
    throw new Error(
      'Defina ALLOW_RBAC_TEST_MUTATIONS=true para confirmar as mutações de teste.',
    );
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL não definida.');
  }

  const nomeBanco = decodeURIComponent(
    new URL(databaseUrl).pathname.replace(/^\//, ''),
  );
  if (!nomeBanco || !PADRAO_BANCO_TESTE.test(nomeBanco)) {
    throw new Error(
      `Banco "${nomeBanco || '(vazio)'}" recusado: use banco dedicado contendo test, teste, scratch ou ci no nome.`,
    );
  }

  return nomeBanco;
}
