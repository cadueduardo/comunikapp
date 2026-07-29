const { PrismaClient } = require('@prisma/client');
const { createHash, randomBytes } = require('crypto');

const prisma = new PrismaClient();

function getArgument(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function normalizeName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

async function main() {
  const nome = normalizeName(getArgument('name'));
  const email = normalizeEmail(getArgument('email'));

  if (nome.length < 3 || !email.includes('@')) {
    throw new Error(
      'Uso: npm run admin:bootstrap -- --name "Nome completo" --email "email@dominio.com"',
    );
  }

  const activeSuperAdmin = await prisma.admin_user.findFirst({
    where: {
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
    select: { id: true },
  });
  if (activeSuperAdmin) {
    throw new Error(
      'Já existe um SUPER_ADMIN ativo. Novos convites devem ser criados pela Gestão.',
    );
  }

  const token = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

  const existing = await prisma.admin_invitation.findFirst({
    where: {
      email,
      role: 'SUPER_ADMIN',
      status: 'PENDING',
    },
    orderBy: { created_at: 'desc' },
    select: { id: true },
  });

  if (existing) {
    await prisma.admin_invitation.update({
      where: { id: existing.id },
      data: {
        nome,
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
    });
  } else {
    await prisma.admin_invitation.create({
      data: {
        nome,
        email,
        role: 'SUPER_ADMIN',
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
    });
  }

  const baseUrl = (
    process.env.GESTAO_FRONTEND_URL || 'http://localhost:3000/gestao'
  ).replace(/\/$/, '');

  console.log('Convite de bootstrap criado com validade de 72 horas.');
  console.log(
    `Abra uma única vez: ${baseUrl}/aceitar-convite?token=${encodeURIComponent(token)}`,
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : 'Falha no bootstrap.');
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

