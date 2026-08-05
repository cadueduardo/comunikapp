// Contratos de UI/personas do Novo atendimento e do deep-link de orçamento.
// Rodar: npm run test:vendas-atendimento

import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';

async function ler(relativo) {
  return readFile(new URL(`../${relativo}`, import.meta.url), 'utf8');
}

const [atendimentoPage, novoOrcamento, orcamentoForm, schema] =
  await Promise.all([
    ler('src/app/(main)/vendas/atendimento/page.tsx'),
    ler('src/app/(main)/orcamentos-v2/novo/page.tsx'),
    ler('src/components/ui/orcamentos-v2/orcamento-v2-form.tsx'),
    ler('src/components/ui/orcamento/schemas/orcamento.schema.ts'),
  ]);

// Personas / estados de interface do atendimento
assert.match(atendimentoPage, /modo: ModoCliente/);
assert.match(atendimentoPage, /'existente' \| 'prospect'/);
assert.match(atendimentoPage, /clientesApi\.search/);
assert.match(atendimentoPage, /clientesApi\.listarContatos/);
assert.match(atendimentoPage, /atividade_gerenciar/);
assert.match(atendimentoPage, /cliente_criar/);
assert.match(atendimentoPage, /Sem acesso ao atendimento/);
assert.match(atendimentoPage, /Criar prospect/);
assert.match(atendimentoPage, /Cliente existente/);
assert.match(atendimentoPage, /disabled=\{!podeProspect\}/);
assert.doesNotMatch(
  atendimentoPage,
  /!acesso\.permissoes\.cliente_criar[\s\S]{0,80}Sem acesso ao atendimento/,
);

// Deep-link consome contatoId (não só gera a string)
assert.match(novoOrcamento, /contatoIdFromQuery/);
assert.match(novoOrcamento, /contato_id: contatoIdFromQuery/);
assert.match(orcamentoForm, /form\.setValue\('contato_id'/);
assert.match(orcamentoForm, /contato_id: String\(data\.contato_id/);
assert.match(schema, /contato_id: z\.string\(\)\.optional\(\)/);

console.log(
  JSON.stringify({
    ok: true,
    contratos: [
      'atendimento_busca_cliente_existente',
      'atendimento_opcao_prospect',
      'ui_exige_atividade_gerenciar',
      'ui_cliente_criar_somente_prospect',
      'orcamento_novo_consome_contatoId',
      'orcamento_form_persiste_contato_id',
      'personas_estados_interface',
    ],
  }),
);
