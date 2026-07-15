# Plano de Implementação - Detalhes e Separação de Produtos na Expedição

Melhorar o modal de detalhes da expedição (`ExpedicaoDetalheSheet`) para exibir a listagem dos produtos a serem separados, suas quantidades, detalhes adicionais para produtos finitos (SKU) e aplicar um filtro que oculte itens que exigem instalação. Além disso, ajustar a responsividade e o layout do modal para dispositivos móveis.

---

## Proposta de Mudanças

### [Backend] Módulo de Expedição

#### [MODIFY] [expedicao.service.ts](file:///c:/Projects/comunikapp/backend/src/expedicao/services/expedicao.service.ts)
- **Alteração do `INCLUDE_EXPEDICAO_DETALHE`:** Adicionar a consulta das relações `itens` de `ordem_servico`, e também os `produtos` de `orcamento` (incluindo a relação `produto_finito`).
- **Ajuste no método `montarDetalhe`:**
  - Cruzar os itens da OS com os produtos do orçamento original (usando o ID compartilhado).
  - **Filtro de Instalação:** Filtrar e remover da lista qualquer item que tenha `instalacao_necessaria: true` no orçamento.
  - **Mapeamento de Produto Finito:** Para os itens restantes, se o produto correspondente no orçamento for do tipo `PRODUTO_FINITO`, incluir informações adicionais como `sku` e `descricao_resumida` (se aplicável).
  - Incluir essa lista de itens formatada no retorno de `ExpedicaoDetalhe`.

#### [MODIFY] [expedicao.interface.ts](file:///c:/Projects/comunikapp/backend/src/expedicao/interfaces/expedicao.interface.ts)
- Atualizar a interface `ExpedicaoDetalhe` e `ExpedicaoDetalheOs` para incluir a lista de itens:
```typescript
export interface ExpedicaoDetalheItem {
  id: string;
  produto_servico: string;
  quantidade: number;
  tipo_item: 'SOB_DEMANDA' | 'PRODUTO_FINITO';
  sku: string | null;
  modo_fulfillment: string | null;
}
```

---

### [Frontend] Módulo de Expedição

#### [MODIFY] [expedicao.types.ts](file:///c:/Projects/comunikapp/frontend/src/lib/expedicao/expedicao.types.ts)
- Atualizar os tipos `ExpedicaoDetalhe` no frontend para espelhar as alterações do backend (incluindo o novo array de itens `itens` no objeto `ordem_servico`).

#### [MODIFY] [ExpedicaoDetalheSheet.tsx](file:///c:/Projects/comunikapp/frontend/src/components/expedicao/ExpedicaoDetalheSheet.tsx)
- **Visualização de Itens:** Adicionar uma nova seção no corpo do modal (após as informações do cliente) intitulada "Produtos para Separação".
- **Exibição de Detalhes:** Exibir os itens em formato de tabela ou lista limpa contendo:
  - Tipo do Produto (badge "Finito" ou "Personalizado")
  - Nome do produto
  - SKU (apenas para produtos finitos)
  - Quantidade a ser separada
- **Responsividade e Ajustes de Layout:**
  - Limitar a largura do modal no mobile e aplicar margens adequadas (`max-w-[95vw]` no mobile e `sm:max-w-xl`).
  - Utilizar classes utilitárias do Tailwind CSS para quebras de palavra (`break-words`, `whitespace-normal`) no campo de Endereço de Entrega para evitar que o modal estoure lateralmente.
  - Ajustar o tamanho dos botões do footer no mobile para empilhar verticalmente de forma correta e limpa, e manter o layout em linha (`sm:flex-row`) em telas maiores.
  - Adicionar um limite de altura máxima para a área de conteúdo (`max-h-[50vh]`) com rolagem vertical (`overflow-y-auto`) para que o modal não saia da tela em celulares pequenos.

---

## Plano de Verificação

### Testes Manuais
- Abrir uma OS que possua itens mistos (um produto finito de prateleira e um produto personalizado que exige instalação).
- Aprovar o orçamento correspondente e avançar para a expedição (Kanban).
- Ao abrir o modal da expedição:
  - **Confirmar** que o produto que exige instalação **NÃO** aparece na listagem de itens do modal.
  - **Confirmar** que o produto finito aparece listado com seu SKU, nome e quantidade corretos.
  - **Confirmar** que o layout do endereço e textos longos não causam estouro horizontal.
  - Simular o visual no DevTools móvel e verificar se todos os botões e informações se adaptam corretamente ao tamanho da tela.
