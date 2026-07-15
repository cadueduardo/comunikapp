# 📋 Handoff de Continuidade - Integração OS, PCP e Terceirizados (Julho 2026)

Este documento serve como guia de handoff para continuar o desenvolvimento do sistema **Comunikapp** no Antigravity IDE, consolidando tudo o que foi analisado e mapeado sobre o módulo de PCP, Ordem de Serviço (OS), Gestão de Materiais, e o perfil de Agenciador (Terceirização).

---

## 🎯 Contexto e Status Atual

O sistema possui a base de Centros de Trabalho e Workflows implementada (Prisma + NestJS + Next.js). Porém, identificamos as seguintes lacunas e inconsistências que precisam ser corrigidas/desenvolvidas:

### 1. Inconsistências Críticas no PCP Atual

- **Desconexão do Estoque:** O `EstoqueApontamentoService` (que reserva e baixa materiais) está implementado e integrado apenas no antigo fluxo de OS. O novo PCP por setores (`PCPKanbanService`) está completamente desconectado dele. As ações de Iniciar e Concluir no Kanban/Meu Setor não afetam o estoque.
- **Omissão de Refugo (Perdas):** O backend tem suporte para `quantidadeRefugo` no DTO, mas o controller e as assinaturas de serviço ignoram o campo. O frontend não possui modal para o operador digitar o refugo ao concluir uma etapa.

### 2. Diagnóstico do Módulo de Ordem de Serviço (OS)

- **Aba de Materiais Incompleta:** Atualmente, ela é muito simples. Precisa ser expandida para exibir a comparação de materiais necessários vs. estoque real, marcar as reservas físicas e permitir substituição de materiais ou geração automática de requisição de compra.
- **Checklist de Estoque (Mockup):** O painel lateral direito na aba "Resumo" da OS ([page.tsx](<file:///C:/Projects/comunikapp/frontend/src/app/(main)/os/[id]/page.tsx#L78-L105>)) está com valores 100% estáticos (_Bobina Lona, Cabo de Madeira, Cordão_). Precisa ser integrado com os dados reais do banco.
- **Aba Análise Inteligente:** Está vazia, sem propósito claro no momento. Deve ser substituída por uma ferramenta útil (como análise de lucratividade/margem) ou removida para limpar a interface.
- **Fluxo de Terceirização (Agenciador):** Quando o cliente da Comunikapp é um agente, a OS precisa de uma estrutura mais robusta para selecionar o **Parceiro Terceirizado**, gerar a requisição de compra do serviço e gerar um link público para o fornecedor terceirizado baixar a arte e ver as especificações sem acessar o painel administrativo.
- **Impressão de OS Incompleta:** O arquivo de impressão em [imprimir/page.tsx](<file:///C:/Projects/comunikapp/frontend/src/app/(main)/os/[id]/imprimir/page.tsx>) está muito simples e incompleto, necessitando de uma formatação profissional para ser enviada aos instaladores e fornecedores.

---

## 📂 Documentos de Referência Salvos no Projeto

Toda a análise detalhada, modelos de dados, diagramas e propostas de solução foram documentados nos seguintes arquivos no repositório:

1. 📊 **Relatório de Análise Minuciosa do PCP:**
   [docs/pcp/pcp_analysis_report.md](file:///C:/Projects/comunikapp/docs/pcp/pcp_analysis_report.md)
   _Contém o diagnóstico de código, tabelas Prisma envolvidas, diagramas de sequência da correção do Refugo e mapeamento de lacunas._

2. 🚀 **Plano de Implementação de Novas Features:**
   [docs/pcp/novas-features/planejamento-novas-features-pcp.md](file:///C:/Projects/comunikapp/docs/pcp/novas-features/planejamento-novas-features-pcp.md)
   _Contém o cronograma de 3 Fases (Fase 1: Correções de Estoque/Refugo; Fase 2: Módulo de Fornecedores/Parceiros; Fase 3: Módulo de Agenciador/Terceirização)._

---

## 🛠️ Arquivos de Código Envolvidos

Caso precise acessar os arquivos diretamente para iniciar o trabalho no IDE:

- **Estoque do PCP:** [estoque-apontamento.service.ts](file:///C:/Projects/comunikapp/backend/src/os/services/estoque-apontamento.service.ts) e [pcp-kanban.service.ts](file:///C:/Projects/comunikapp/backend/src/pcp/services/pcp-kanban.service.ts).
- **Fila do Chão de Fábrica:** [FilaOperador.tsx](file:///C:/Projects/comunikapp/frontend/src/components/pcp/FilaOperador.tsx) e [MeuSetorPage](<file:///C:/Projects/comunikapp/frontend/src/app/(main)/pcp/meu-setor/page.tsx>).
- **Aba de Materiais e Mockups da OS:** [page.tsx](<file:///C:/Projects/comunikapp/frontend/src/app/(main)/os/[id]/page.tsx>) e [OSMateriaisPanel.tsx](file:///C:/Projects/comunikapp/frontend/src/components/os/OSMateriaisPanel.tsx).
- **Impressão da OS:** [imprimir/page.tsx](<file:///C:/Projects/comunikapp/frontend/src/app/(main)/os/[id]/imprimir/page.tsx>).

---

## 🎯 Próximos Passos Sugeridos para a IDE

1. **Correção do PCP Interno:** Implementar o modal de refugo no front e passar a variável no controller do back para habilitar o lançamento de perdas.
2. **Integração de Estoque:** Injetar o `EstoqueApontamentoService` nas ações de início e fim no `PCPKanbanService`.
3. **Módulo de Fornecedores:** Expandir a tabela `fornecedor` no Prisma schema para permitir adicionar tipo (Insumo, Terceirizado, Ambos) e informações de contato/endereço.
4. **Acoplamento Terceirizado na OS:** Adicionar opção de selecionar parceiro terceirizado na OS e remover o mockup do Checklist de Estoque.
