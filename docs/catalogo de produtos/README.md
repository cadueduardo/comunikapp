# RP — Catálogo de Produtos e Personalização

Repositório de planejamento (RP) para amadurecer e implementar o **Catálogo de Produtos** no Comunikapp: hub de cadastro, produtos finitos (prateleira), processos de decoração, estampas e conjuntos de campos reutilizáveis — com integração ao orçamento, OS e expedição/PCP.

**Versão:** 0.1 (rascunho para validação)  
**Data:** 2026-06-26  
**Status:** Em amadurecimento — decisões abertas em [09-decisoes-pendentes.md](./09-decisoes-pendentes.md)

---

## Objetivo deste RP

1. Consolidar a visão de produto acordada em sessões de alinhamento (produto finito, personalização opcional, estampas com variáveis, imprint livre).
2. Separar claramente **cadastro** (catálogo) de **venda** (orçamento) e **execução** (OS / PCP / expedição).
3. Servir de base para implementação em fases, sem conflitar com **Modelos de Orçamento** (`/produtos`), que permanecem no menu lateral como ferramenta própria.

---

## Documentos

| # | Arquivo | Conteúdo |
|---|---------|----------|
| 1 | [01-visao-escopo.md](./01-visao-escopo.md) | Problema, objetivos, fora de escopo, princípios |
| 2 | [02-glossario.md](./02-glossario.md) | Termos: produto finito, processo, estampa, conjunto de campos, modos |
| 3 | [03-ia-ux-hub.md](./03-ia-ux-hub.md) | Menu lateral, hub com cards (sem dashboard), telas e navegação |
| 4 | [04-modelo-de-dados.md](./04-modelo-de-dados.md) | Entidades, relacionamentos, campos principais |
| 5 | [05-cadastros-crud.md](./05-cadastros-crud.md) | Especificação de cada CRUD e regras de negócio |
| 6 | [06-produto-finito-vinculos.md](./06-produto-finito-vinculos.md) | Cadastro do produto finito e vínculos com personalização |
| 7 | [07-fluxo-orcamento.md](./07-fluxo-orcamento.md) | Linha do orçamento: escolhas, preços, preview, persistência |
| 8 | [08-integracao-operacional.md](./08-integracao-operacional.md) | OS, arte, liberação PCP, expedição, estoque |
| 9 | [09-decisoes-pendentes.md](./09-decisoes-pendentes.md) | Decisões a validar antes/durante implementação |
| 10 | [10-plano-implementacao.md](./10-plano-implementacao.md) | Fases, entregas, critérios de aceite, dependências |

---

## Relação com documentação existente

| Documento | Relação |
|-----------|---------|
| [modulo de produtos/decisoes-pre-implementacao-produtos-finitos.md](../modulo%20de%20produtos/decisoes-pre-implementacao-produtos-finitos.md) | Base do **produto finito** já implementado; este RP **estende** com personalização |
| [modulo de produtos.md](../modulo%20de%20produtos.md) | Visão legada; `/produtos` = Modelos de Orçamento |
| [arte-aprovacao-modulo/](../arte-aprovacao-modulo/) | Arte por item na OS; estampas geram arte de produção quando aplicável |
| [integracao orc os pcp/](../integracao%20orc%20os%20pcp/) | Liberação parcial PCP, status por produto na OS |

---

## Convenções deste RP

- **Modelos de Orçamento** (`/produtos`, menu lateral): **não** entram no hub Catálogo.
- **Insumos** e **Estoque**: módulos separados; produto finito pode **referenciar** estoque, mas CRUD de insumo não migra para o catálogo.
- Decisões fechadas devem ser movidas de `09-decisoes-pendentes.md` para o documento relevante com data e autor.
- Implementação só inicia fase N+1 quando os critérios de aceite da fase N estiverem marcados no [plano](./10-plano-implementacao.md).

---

## Resumo da arquitetura acordada

```
Menu: "Catálogo de produtos" (renomear item atual Produtos /produtos-finitos)
  └── Hub (cards, sem KPIs)
        ├── Produtos          → grid produto finito (existente)
        ├── Personalização    → processos de decoração (UV, silk, laser…)
        ├── Estampas          → catálogo visual + arte mestra + campos
        └── Conjuntos de campos → grupos reutilizáveis de variáveis

Orçamento (fora do hub):
  └── Linha produto finito + modo personalização + estampa + valores dos campos

OS / PCP / Expedição:
  └── Roteamento por item conforme modo (estoque, produção, híbrido)
```

---

## Próximo passo recomendado

1. Validar [09-decisoes-pendentes.md](./09-decisoes-pendentes.md) (itens marcados **CRÍTICO**).
2. Aprovar wireframes descritos em [03-ia-ux-hub.md](./03-ia-ux-hub.md).
3. Iniciar **Fase 0** do [plano de implementação](./10-plano-implementacao.md) (hub + renomear menu).
