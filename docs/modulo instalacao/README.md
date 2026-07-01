# Módulo de Instalações e Pós-Cálculo — Documentação

Índice da documentação de engenharia do **Módulo de Instalações (Fase 2 do ComunikApp)**.

| Documento | Conteúdo | Status |
|-----------|----------|--------|
| [`modulo.md`](./modulo.md) | Especificação técnica e funcional unificada (v2.0) | Referência |
| [`01-analise-implementacao-e-decisoes.md`](./01-analise-implementacao-e-decisoes.md) | Análise do estado atual, lacunas e decisões pendentes | Referência |
| [`02-relatorio-fase-1-banco-dados-e-configuracoes.md`](./02-relatorio-fase-1-banco-dados-e-configuracoes.md) | Relatório de conclusão — Fase 1 | ✅ Aprovada |
| [`03-relatorio-fase-2-travas-comerciais-e-hooks-pcp.md`](./03-relatorio-fase-2-travas-comerciais-e-hooks-pcp.md) | Relatório de conclusão — Fase 2 | ✅ Implementada |
| [`04-relatorio-fase-3-backend-e-financas.md`](./04-relatorio-fase-3-backend-e-financas.md) | Relatório de conclusão — Fase 3 | ✅ Implementada |
| [`05-relatorio-fase-4-frontend.md`](./05-relatorio-fase-4-frontend.md) | Relatório de conclusão — Fase 4 | ✅ Implementada |
| [`06-relatorio-fase-5-pdf-e-fechamento.md`](./06-relatorio-fase-5-pdf-e-fechamento.md) | Relatório de conclusão — Fase 5 | ✅ Finalizada |
| [`07-handoff-continuidade-jul-2026.md`](./07-handoff-continuidade-jul-2026.md) | Handoff jul/2026 — integração PCP, DEC-01, próximos passos | 🔄 Ativo |
| [`08-ux-gestao-agenda-e-calendario.md`](./08-ux-gestao-agenda-e-calendario.md) | UX gestão: grid OS, Kanban por lote, agenda, calendário, conflitos | 📋 Especificação |
| [`09-plano-execucao-doc08-dec04.md`](./09-plano-execucao-doc08-dec04.md) | Plano de execução técnico: DEC-04 + Passos 1–4 (Doc 08) | 🚀 Implementação |
| [`10-analise-varredura-alinhamento-passo1.md`](./10-analise-varredura-alinhamento-passo1.md) | Varredura de código + plano detalhado do Passo 1 (backend) | 📋 Análise |
| [`11-ux-kanban-saldo-alocacao-e-correcao-lotes.md`](./11-ux-kanban-saldo-alocacao-e-correcao-lotes.md) | UX-07/08: header de saldo no Kanban + edição/exclusão de lote | 📋 Validação |
| [`12-decisoes-produto-instalacao-comunikapp.md`](./12-decisoes-produto-instalacao-comunikapp.md) | Dúvidas 1–3 de produto; **DEC-17** sobra/aditivos de campo | ✅ Dúvida 3 fechada |
| [`13-plano-split-financeiro-os-aditiva.md`](./13-plano-split-financeiro-os-aditiva.md) | Split Financeiro: precificação gestor, OS Aditiva, Prisma, transações, UX | 📋 Especificação |
| [`14-analise-contexto-fase5-split-financeiro.md`](./14-analise-contexto-fase5-split-financeiro.md) | Análise pré-implementação: migration, serviços, IDOR, gap Fase 5, plano FE | 📋 Análise |

## Handoff para novo chat

**Leia primeiro:** [`../HANDOFF-CONTINUIDADE-INSTALACAO-JUL-2026.md`](../HANDOFF-CONTINUIDADE-INSTALACAO-JUL-2026.md) (entrada principal) ou o espelho local [`07-handoff-continuidade-jul-2026.md`](./07-handoff-continuidade-jul-2026.md).

**Plano de implementação (Doc 08 + DEC-04):** [`09-plano-execucao-doc08-dec04.md`](./09-plano-execucao-doc08-dec04.md)

**Análise de varredura (Passo 1):** [`10-analise-varredura-alinhamento-passo1.md`](./10-analise-varredura-alinhamento-passo1.md)

**Processos Node no Windows:** [`../DEV-GESTAO-PROCESSOS-NODE-WINDOWS.md`](../DEV-GESTAO-PROCESSOS-NODE-WINDOWS.md)

## Fases do plano de execução

| Fase | Escopo | Relatório |
|------|--------|-----------|
| **1** | Prisma, migrations, config loja, seeder de taxas | [02](./02-relatorio-fase-1-banco-dados-e-configuracoes.md) |
| **2** | Trava de sinal PCP, hook financeiro, gatilho produção → instalação | [03](./03-relatorio-fase-2-travas-comerciais-e-hooks-pcp.md) |
| **3** | Backend instalações, CEP, RBAC mobile, motor de ocorrências | [04](./04-relatorio-fase-3-backend-e-financas.md) |
| **4** | Frontend mobile `/instalador` + timeline desktop | [05](./05-relatorio-fase-4-frontend.md) |
| **5** | PDF Relatório Técnico + split fiscal + liberação financeira | [06](./06-relatorio-fase-5-pdf-e-fechamento.md) |

## Código principal

```
backend/src/instalacao/
├── instalacao.module.ts
├── controllers/
│   ├── instalador.controller.ts      # /instalador (mobile)
│   ├── instalacao.controller.ts      # CEP, margem, split fiscal, relatório técnico
│   └── instalacao-relatorio.controller.ts  # Download PDF
├── dto/
├── guards/
├── constants/
├── seeders/
├── services/
│   ├── configuracao-instalacao.service.ts
│   ├── pcp-bloqueio-sinal.service.ts
│   ├── item-os-instalacao-criacao.service.ts
│   ├── cep-integration.service.ts
│   ├── instalacao.service.ts
│   ├── instalacao-pos-calculo.service.ts
│   ├── instalacao-split-fiscal.service.ts
│   └── instalacao-relatorio-pdf.service.ts
└── utils/
```
