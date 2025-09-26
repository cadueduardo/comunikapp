import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function gerarCodigoOrcamento(lojaId: string): Promise<string> {
  const ano = new Date().getFullYear();

  const sequence = await prisma.$transaction((tx) =>
    tx.document_sequence.upsert({
      where: {
        loja_id_tipo_documento_ano: {
          loja_id: lojaId,
          tipo_documento: "ORC",
          ano,
        },
      },
      update: {
        ultimo_numero: {
          increment: 1,
        },
      },
      create: {
        loja_id: lojaId,
        tipo_documento: "ORC",
        ano,
        ultimo_numero: 1,
      },
    }),
  );

  const numero = sequence.ultimo_numero.toString().padStart(3, "0");
  return `ORC-${ano}-${numero}`;
}

async function main() {
  // Primeiro, vamos ver todos os orçamentos
  const todosOrcamentos = await prisma.orcamento.findMany({
    select: {
      id: true,
      numero: true,
      loja_id: true,
      status: true,
    },
  });

  console.log(`Total de orçamentos encontrados: ${todosOrcamentos.length}`);
  todosOrcamentos.forEach(o => {
    console.log(`- ID: ${o.id}, Número: "${o.numero}", Status: ${o.status}, Loja: ${o.loja_id}`);
  });

  const orcamentos = await prisma.orcamento.findMany({
    where: {
      numero: {
        not: {
          startsWith: "ORC-",
        },
      },
    },
    select: {
      id: true,
      numero: true,
      loja_id: true,
    },
  });

  console.log(`Orçamentos que NÃO seguem formato ORC-AAAA-NNN: ${orcamentos.length}`);

  if (orcamentos.length === 0) {
    console.log("Nenhum orçamento pendente de conversão.");
    return;
  }

  for (const orcamento of orcamentos) {
    const codigo = await gerarCodigoOrcamento(orcamento.loja_id);
    await prisma.orcamento.update({
      where: { id: orcamento.id },
      data: { numero: codigo },
    });
    console.log(`Orçamento ${orcamento.id} atualizado de ${orcamento.numero} para ${codigo}`);
  }
}

main()
  .catch((error) => {
    console.error("Erro ao executar backfill:", error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
