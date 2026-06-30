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
