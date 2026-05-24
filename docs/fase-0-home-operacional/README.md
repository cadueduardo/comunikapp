# Fase 0 — Home Operacional: Decisões e Contratos

Esta pasta contém os documentos obrigatórios da Fase 0 do plano `docs/plano-acao-home-onboarding-dashboard-operacional.md`.

Nenhuma fase posterior (1, 2, 3, …) deve começar sem que estes documentos estejam aprovados.

## Índice

| Documento | Decisão | Status |
| --- | --- | --- |
| `01-status-oficiais.md` | Status de Orçamento V2, OS e Cobrança com transições e eventos | proposto |
| `02-contratos-home-operacional.md` | Contratos JSON dos endpoints da Home | proposto |
| `03-onboarding-etapas.md` | Etapas oficiais do onboarding + critério de detecção automática | proposto |
| `04-campos-geometria.md` | Novos campos de geometria em `ProdutoOrcamento` | proposto |
| `05-persistencia-anexos.md` | Onde imagens e DXFs serão persistidos | proposto |
| `06-conversao-m2-chapa-sobra.md` | Regras de conversão m² → chapa → sobra | proposto |
| `07-permissoes-home.md` | Blocos da Home sensíveis a perfil e regras de visibilidade | proposto |
| `08-configuracao-recomendada-defaults.md` | Valores defaults da configuração recomendada | proposto |
| `09-system-state-banner-catalogo.md` | Catálogo de mensagens do `SystemStateBanner` | proposto |

## Convenção de status do documento

- `proposto`: aguardando aprovação do produto.
- `aprovado`: decisão final, pode ser usada como referência.
- `revisado em DD/MM/YYYY`: ajustado após uso real.

## Como aprovar uma decisão

1. Ler o documento.
2. Discutir pontos marcados como **Ponto de confirmação** com o time de produto.
3. Editar o documento marcando o status como `aprovado` no topo e datando.
4. Commitar a aprovação.

## Restrições gerais

- Tudo em UTF-8 com acentuação correta em pt-BR.
- Toda agregação respeita `loja_id`.
- Nenhum bloco sensível aparece para perfil sem permissão.
- O bloco "Fluxo de trabalho" da Home é visualização + atalho, **sem drag and drop**.
- Eventos financeiros automáticos nunca movimentam caixa sem confirmação manual do usuário.

## Pontos que dependem do produto (concentrados aqui para revisão rápida)

- `08-configuracao-recomendada-defaults.md`: valores numéricos defaults (margem %, imposto %, condição de pagamento padrão, processos básicos).
- `06-conversao-m2-chapa-sobra.md`: tamanho padrão de chapa (1220 × 2440 mm é o mais comum no setor) e tolerância de sobra mínima reutilizável.
- `07-permissoes-home.md`: nomes das permissões e perfis defaults (Administrador, Gestor, Operador, Comercial, Financeiro).
- `09-system-state-banner-catalogo.md`: prioridade entre mensagens concorrentes.
