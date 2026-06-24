# Relatório de Ajustes e Correções - Comunikapp

Documento refinado com base no backlog original e alinhamento com Jonatan (23/06/2026).

**Legenda de prioridade sugerida:** P0 = bug bloqueante · P1 = correção importante · P2 = melhoria · P3 = discovery / amadurecer depois

---

## 🛠️ Correções de Erros (Bugs)

### Preview de Metragem (orçamento — Geometria de produção) · P1

- [x] **Corrigir preview de área/perímetro (e métricas 3D) ao carregar template de produto** ✅ *Implementado 23/06/2026*

#### Onde
- Tela de **orçamento** → seção **"Medidas do Produto"** → **"Geometria de produção"**
- Componente: `QuickGeometryInput` (boxes logo abaixo dos campos Largura / Altura / Profundidade / Unidade)

#### Comportamento esperado
Ao carregar um **template de produto** no orçamento, os boxes de preview devem refletir os mesmos valores que a seção **Unidade comercial** (Área m² / Perímetro mm):

| Modo | Campos exibidos no preview |
|------|----------------------------|
| **2D** | Área calculada (m²), Perímetro calculado (m) |
| **3D** | Área calculada, Perímetro calculado, Área lateral (caixa aberta), Volume (m³) |

#### Comportamento atual (bug)
- **Digitação manual:** funciona corretamente (2D e 3D). Ex.: 90 × 120 cm, profundidade 10 cm → área 1,08 m², perímetro 4,2 m, volume 0,108 m³.
- **Carregar template:** campos L/A/P/Unidade são preenchidos, mas o **preview intermediário não recalcula corretamente**.
- **Exemplo reproduzido (2D, unidade metros):** template com 0,19 m × 0,19 m:
  - Preview errado: **361 m²** e **76 m** (como se fosse 19 × 19)
  - Seção comercial correta: **0,04 m²** e **760 mm**
- **Escopo 3D:** o mesmo problema afeta volume e área lateral quando profundidade vem do template com decimal (mesma função de parse).

#### Causa provável (verificado no código)
- O preview usa `parseNumero` em `QuickGeometryInput.tsx`, que remove **todos** os pontos antes de converter (`"0.19"` → `"019"` → `19`).
- Valores vindos do backend/template costumam usar **ponto decimal** (`0.19`).
- A seção comercial usa outro caminho (`SincronizadorGeometriaProduto` / `calcularRetanguloMm`), que faz `replace(',', '.')` sem remover pontos — por isso fica correta enquanto o preview quebra.
- O `onChange` do `QuickGeometryInput` **só dispara na interação manual**, não no hydrate do template.

#### Critérios de aceite
1. Carregar template 2D (metros com decimal, ex. 0,19 × 0,19 m) → preview = seção comercial.
2. Carregar template 3D (L × A × P, ex. 90 × 120 × 10 cm) → área, perímetro, área lateral e volume corretos no preview.
3. Digitação manual continua funcionando (regressão zero).
4. Unidades mm, cm e m validadas no load de template.

#### Referência técnica
- `frontend/src/components/orcamentos-v2/QuickGeometryInput.tsx` — `parseNumero` alinhado ao padrão pt-BR (não remove ponto quando é decimal; ex.: `0.19` → `0.19`, não `19`)
- `frontend/src/components/ui/orcamento/components/ProdutoSection.tsx` — integração + `SincronizadorGeometriaProduto`

---

### Persistência de Insumos (orçamento — modal de insumo) · P1

- [x] **Corrigir insumo inserido via modal do orçamento que não persiste** ✅ *Parcial 23/06/2026 — preview/custo imediato*

#### Onde
- Tela de **orçamento** → **modal de inserção de insumo** (criação/seleção de insumo a partir do orçamento)

#### Fluxo afetado
1. Operador abre o orçamento
2. Insere um insumo pelo **modal do orçamento**
3. Seleciona/confirma o insumo inserido
4. O insumo **não persiste** — ao recarregar a página, o valor não aparece no preview/cálculo

#### Comportamento esperado
- Insumo criado ou vinculado via modal deve ser salvo no vínculo insumo ↔ item do orçamento
- Após recarregar a página (ou reabrir o orçamento), o insumo deve aparecer na lista de materiais e refletir no preview de cálculo

#### Comportamento atual (bug)
- Inserção via modal aparenta funcionar na sessão, mas **não sobrevive ao reload**
- O valor do insumo **não é exibido no preview** após recarregar
- **Reunião (Wind Banner):** após cadastrar insumo no modal, custo **não atualizou** no preview até **re-selecionar** o material — pode ser o mesmo root cause ou bug irmão (ver **Preview delay · P2**)

#### Implementação (23/06/2026) — preview/custo na sessão
- `PreviewCalculoV2` recebe `datasets` do formulário (mesma lista de insumos) — elimina estado duplicado do hook
- `MaterialSection.aplicarInsumoNaLinhaMaterial` aplica sugestão de quantidade igual ao Select ao cadastrar via modal
- `NovoInsumoModal.onCriado` repassa `unidade_uso`, `custo_unitario`, etc. para cálculo imediato

#### Ainda a confirmar
- Após **salvar rascunho/orçamento** e recarregar, insumo continua ausente? (se sim, investigar save/load de `ItemInsumo`)

#### Referência técnica (provável)
- `frontend/src/components/ui/shared/sections/MaterialSection.tsx` — materiais/insumos no item do orçamento
- Fluxo de criação de insumo via modal no contexto de orçamento

---

### Serviços Manuais + Salvamento de Produto/Template · P0

- [x] **Corrigir persistência de serviços manuais no cadastro de produto e erros ao salvar** ✅ *Implementado 23/06/2026*

> Este item unifica **Serviços Manuais** e **Salvamento de Templates**: o produto (template) é salvo pelo fluxo de cadastro de produtos, reutilizado no orçamento via "carregar produto".

#### Onde
- Tela de **cadastro de produto** (`/produtos`) — formulário reutiliza `OrcamentoV2Form` em `mode="template"`
- Impacto ao **carregar o template no orçamento**

#### Fluxo afetado
1. Operador cadastra/edita um **produto (template)** e adiciona **serviço(s) manual(is)**
2. Tenta **salvar** o produto → ocorre erro (ver evidências abaixo)
3. Mesmo quando salva parcialmente, ao carregar o template no orçamento o **serviço manual não vem**

#### Comportamento esperado
- Serviços manuais configurados no produto devem ser **persistidos** no template
- Save/update de produto deve concluir **sem erro**
- Ao carregar o template no orçamento, todos os serviços manuais devem aparecer com seus dados

#### Comportamento atual (bug)

**Serviços não persistem / não carregam:**
- Serviço manual **não é salvo** junto com o template
- Ao importar produto para o orçamento, serviços **não são mapeados**

**Erros ao salvar (evidências do Jonatan):**

| Erro observado | Contexto |
|----------------|----------|
| `Erro ao salvar orçamento: Cannot PUT /produtos/{id}` | Toast ao salvar produto (ex.: produto `cmqmn3le4003qkkhkag91pgen`) |
| `HTTP error! status: 500 - Internal server error` | Console ao salvar rascunho; produto "Totem de Parede 30x20cm - SMK" |

#### Causa provável (verificado no código)

1. **Serviços ignorados no mapeamento produto ↔ orçamento:**
   - `ProdutoTemplateForm.mapProdutoParaOrcamento` não lê serviços do `initialData` — inicializa linha vazia
   - `handleCarregarProduto` em `orcamento-v2-form.tsx` define explicitamente `servicos: []` com comentário *"Produtos template não têm serviços por enquanto"*

2. **HTTP method incorreto no update de produto:**
   - `produtosApi.update` usa **PUT** (`api-client.ts`)
   - Backend expõe apenas **PATCH** (`produtos.controller.ts`) → explica `Cannot PUT /produtos/{id}`

3. **Fluxo "Salvar rascunho" em mode template:**
   - `handleSalvarRascunho` não trata `mode === 'template'` — pode enviar payload de orçamento para API errada (investigar se contribui para o 500)

#### Critérios de aceite
1. Criar/editar produto com serviço manual → salvar sem erro
2. Reabrir produto no cadastro → serviço manual presente
3. Carregar produto no orçamento → serviço manual presente no item
4. Update de produto usa método HTTP compatível com backend (PATCH)

#### Implementação (23/06/2026)
- `produtosApi.update` alterado para **PATCH**
- Nova tabela `servico_template_produtos` + CRUD em `produtos.service.ts`
- `transformarDadosParaProdutoTemplate` inclui `servicos` e campos de geometria/anexo
- `handleSalvarRascunho` trata `mode === 'template'` (salva produto, não orçamento)
- `ProdutoTemplateForm` e `handleCarregarProduto` mapeiam serviços e foto (`arquivo_geometria_url`)
- Migration: `20260623120000_template_servicos_geometria_medidas_insumo`

#### Referência técnica
- `frontend/src/components/ui/produto/ProdutoTemplateForm.tsx` — mapeamento inicial (serviços ausentes)
- `frontend/src/components/ui/orcamentos-v2/orcamento-v2-form.tsx` — save template + load produto
- `frontend/src/lib/api-client.ts` — `produtosApi.update` (PUT)
- `backend/src/produtos/produtos.controller.ts` — `@Patch(':id')`

---

### Forma de Pagamento no PDF · P1

- [x] **Atualizar PDF do orçamento para exibir condição de pagamento estruturada do sistema** ✅ *Implementado 23/06/2026*

#### Onde
- Página de impressão/PDF do orçamento — tabela **"Condições Comerciais"**, linha **FORMA DE PAGAMENTO**
- Arquivo: `frontend/src/app/orcamento-v2/[id]/page.tsx`

#### Comportamento atual (bug)
- PDF exibe texto **legado** com fallback fixo:
  - `{orcamento.forma_pagamento || '50% entrada, restante na entrega'}`
- Exemplo no PDF atual: **"50% entrada, restante na entrega"** — não reflete o que foi configurado no orçamento

#### Comportamento esperado
- PDF deve exibir a **condição de pagamento completa** conforme implementado no formulário (Fase 6), incluindo:
  - **Tipo de pagamento** (`condicao_pagamento_tipo`): A vista, Entrada + saldo, Faturado 30/60/90, Parcelado mensalmente, Personalizado
  - **Detalhes condicionais:** percentual de entrada, número de parcelas, descrição
  - Demais campos de pagamento configurados no orçamento (conforme UI atual)
- Texto legível para o cliente — equivalente ao que o operador vê no sistema, não o campo deprecated `forma_pagamento`

#### Contexto técnico
- Formulário novo usa `CondicaoPagamentoFieldset` com campos estruturados; `forma_pagamento` (texto livre) está **deprecated** — backend deriva cobrança dos campos estruturados
- PDF ainda lê apenas `forma_pagamento` (campo antigo ou vazio → fallback)

#### Critérios de aceite
1. Orçamento com tipo **Parcelado** (ex.: 3 parcelas) → PDF mostra parcelamento correto
2. Orçamento com **Entrada + saldo** (ex.: 50%) → PDF mostra entrada e saldo
3. Orçamento **Personalizado** → PDF mostra descrição informada
4. Não exibir fallback `"50% entrada, restante na entrega"` quando houver condição estruturada preenchida

#### Referência técnica
- `frontend/src/app/orcamento-v2/[id]/page.tsx` — `resolverTextoCondicaoPagamento()`
- `frontend/src/lib/condicao-pagamento-descricao.ts` — helper espelhando `ParcelasBuilderService.gerarDescricao`
- `backend/src/orcamentos-v2/services/orcamentos-v2.service.ts` — API pública retorna campos estruturados + `forma_pagamento` derivada
- `frontend/src/components/ui/orcamento/components/CondicaoPagamentoFieldset.tsx` — campos do formulário

> **Nota (transcrição):** após **aprovar** o orçamento, campos comerciais ficam **bloqueados para edição**. Corrigir PDF **antes** de aprovar, ou prever fluxo de revisão pós-aprovação.

---

### Foto do Produto — save e load · P1

- [x] **Corrigir foto/imagem do produto que não persiste e não carrega no orçamento** ✅ *Implementado 23/06/2026*

#### Onde
- **Cadastro de produto** (`/produtos` → editar) — upload de foto de referência/controle interno
- **Orçamento** → "Carregar produto" — foto deveria vir do template

#### Comportamento atual (demonstrado na reunião)
1. Operador anexa foto no produto (ex.: totem monitoramento) → **não salva** ao gravar
2. Repete upload → mesma falha
3. No orçamento, carrega produto (ex.: totem de parede) → **foto não vem** do template

#### Comportamento esperado
- Foto salva com o produto e reaparece ao reabrir o cadastro
- Ao carregar produto no orçamento, foto exibida no item (controle interno; não necessariamente no PDF)

#### Critérios de aceite
1. Upload → salvar produto → reabrir → foto presente
2. Carregar produto no orçamento → foto visível no item

#### Implementação (23/06/2026)
- Campos `arquivo_geometria_url`, `geometria_origem`, `unidade_geometria`, `perimetro_produto`, `profundidade_produto` adicionados em `template_produtos`
- Save/load via `transformarDadosParaProdutoTemplate` e `ProdutoTemplateForm`

---

### Erro ao alterar quantidade do produto no orçamento · P1

- [x] **Corrigir erro 500 ao aumentar quantidade (ex.: 10 unidades)** ✅ *Mitigação 23/06/2026*

#### Contexto (reunião)
- Orçamento com produto duplicado/cópia; operador altera **quantidade** para 10
- Ao salvar → **Internal Server Error (500)** no console
- Jonatan enviou prints do console (DevTools)

#### Comportamento esperado
- Alterar `quantidade_produto` recalcula preview e **salva** rascunho/orçamento sem erro

#### Implementação (23/06/2026)
- `horas_producao` com mínimo **0,01** no frontend (`orcamento-v2-form`) e backend (`transformacao-v2.service`) — evita `Decimal(0)` inválido quando orçamento não tem máquinas/funções/serviços com tempo

#### A validar
- Reproduzir save com qty=10 após fix; se 500 persistir, capturar log do backend

---

### Preview de cálculo — delay ao vincular insumo · P2

- [x] **Corrigir atualização tardia do preview ao selecionar insumo recém-cadastrado** ✅ *Implementado 23/06/2026*

#### Contexto (reunião — Wind Banner)
- Insumo **IND Banner** cadastrado via modal (R$ 205, unidade)
- Selecionado em Material → **custo não apareceu** imediatamente à direita no preview
- Ao **re-selecionar** o mesmo insumo → valor apareceu (R$ 205)
- Jonatan: *"acontece isso às vezes"*

#### Comportamento esperado
- Primeira seleção de insumo atualiza preview/custo **sem** precisar re-selecionar

#### Implementação (23/06/2026)
- `PreviewCalculoV2` usa `datasets` passados pelo `OrcamentoV2Form` (insumos, máquinas, etc.) em vez de lista isolada do hook interno
- Ver também **Persistência de Insumos** — `aplicarInsumoNaLinhaMaterial` no modal

---

### Arte e Aprovação — sync de status · P2

- [x] **Status "aprovada" deve refletir sem F5; revisar carga de imagem no link público** ✅ *Implementado 23/06/2026*

#### Contexto (reunião — teste ao vivo)
- Fluxo de arte/aprovação **funcionou** (link, chat, aprovação formal pelo cliente)
- **Problema 1:** após cliente aprovar, tela do operador **não atualizava** até **Ctrl+F5**
- **Problema 2:** em um momento a **imagem não carregou** no link público (depois funcionou com print screen leve)

#### Comportamento esperado
- Status "Banner aprovada" / liberar PCP atualiza em tempo real (ou polling curto)
- Imagens leves (print screen) carregam consistentemente no link público

#### Causa raiz (preview de imagem em produção)
- URLs salvas como `/api/arte-aprovacao/...` eram concatenadas com `NEXT_PUBLIC_API_URL=/api` → **`/api/api/...` (404)**
- Página pública usava endpoint autenticado `download/` em `<img>` sem JWT
- Preview interno (OS) usava `?token=jwt` no `<img>`, mas o endpoint exige header `Authorization`

#### Implementação (23/06/2026)
- `frontend/src/lib/arte-assets.ts` — `resolveArtePublicFileUrl`, `resolveArteAuthenticatedFileUrl`, `fetchArteFileBlob`
- Página pública: converte para `public/download?token=<link>` (caminho relativo `/api/...`)
- Equipe interna: `ArteAuthenticatedImage` + blob com JWT (`ArteAprovacaoTab`, `ArtePreviewModal`)
- Sync sem F5: polling 20s + `contadorAtualizado` no WebSocket passa a disparar `refreshVersoes`

#### Fora de escopo imediato
- Arte/aprovação como canal com cliente — **validado positivamente** na reunião

---

### Editar / finalizar OS entregue · P2

- [ ] **Revisar erro ao editar OS já entregue ou finalizada**

#### Contexto (reunião)
- OS banner já **entregue** (data retroativa registrada)
- Tentativa de **editar/finalizar** → erro na UI (mencionado ao arrastar no PCP)
- Operador usa data retroativa para registrar entregas passadas

#### Comportamento esperado
- Permitir ajuste de datas/status retroativo onde faz sentido operacionalmente, ou mensagem clara se ação não permitida

---

### Logo da loja no PDF · P2

- [x] **Garantir logo configurado apareça no PDF do orçamento** ✅ *Implementado 23/06/2026*

#### Contexto (reunião)
- PDF gerado **sem logo** no cabeçalho
- Carlos indicou: **Configurações → Loja** para upload do logo
- Jonatan não tinha certeza se havia configurado

#### Comportamento esperado
- Logo em Configurações da loja → exibido no PDF e demais impressões de orçamento
- Se não configurado → placeholder ou aviso na UI (não PDF silenciosamente vazio)

#### Implementação (23/06/2026)
- Página pública `orcamento-v2/[id]/page.tsx` usa `resolveAssetUrl()` para resolver `/uploads/...` em URL absoluta da API

---

### Comissão — configuração na loja · P3 / onboarding

- [x] **Campo de comissão padrão do vendedor em Configurações → Loja** ✅ *Implementado 23/06/2026*

#### Contexto (reunião + esclarecimento)
- Jonatan comentou: *"Comissão eu nunca dou"*
- Orientação dada ao cliente: definir **comissão 0%** em **Configurações → Loja** — o campo **não existia** na UI (só margem/impostos)

#### Implementação (23/06/2026)
- Campo `comissao_padrao` em `loja` (migration `20260623140000_loja_comissao_padrao`)
- UI em **Configurações → Loja → Parâmetros de Negócio → Comissão do vendedor padrão (%)**
- Novos orçamentos herdam o valor (inclui **0**); se não configurado, mantém **5%** (legado)
- **Onboarding:** etapa *margem_imposto* renomeada para margem/impostos/comissão; detecção automática exige `comissao_padrao` preenchido; *Aplicar configuração recomendada* define **0%**

#### Melhoria opcional (futuro)
- Destacar no onboarding ou empty state do orçamento onde configurar o default

---

### Badge "Beta" — sobreposição de botões · P2

- [x] **Badge beta compacto: ícone fixo + tooltip no hover, sem cobrir ações** ✅ *Implementado 23/06/2026*

#### Contexto (reunião)
- Ao criar workflow "produção externa" no PCP, badge **beta ficava em cima** de campos/botões obrigatórios

#### Decisão de UX (Carlos)
- **Manter no canto** — posição geral aprovada
- **Problema:** às vezes **sobrepõe** outros botões/campos
- **Solução proposta:**
  1. Flutuar um pouco **mais para o meio** da tela (evitar colisão com controles do canto)
  2. Estado normal: exibir **apenas o ícone** do balãozinho (sem texto longo)
  3. **Hover:** expandir tooltip com *"Beta — feedback"* (ou texto equivalente)
  4. Objetivo: menos destaque visual, sem perder canal de feedback

#### Critérios de aceite
1. Badge não cobre botões/campos clicáveis em telas com scroll (ex.: PCP, workflow)
2. Ícone sempre visível; texto descritivo só no hover/focus
3. Tooltip acessível (teclado/focus, não só mouse)

#### Implementação (23/06/2026)
- `BetaFeedbackButton`: botão circular só com ícone, `title="Beta — feedback"`, posição `bottom-6 right-6`

---

## 🏗️ Melhorias de Funcionalidade

### Medidas Diferenciadas por Insumo + Produto Composto no PDF · P1

- [x] **Permitir medida local por insumo e manter 1 linha comercial no PDF** ✅ *Implementado 23/06/2026*

> **Esclarecimento (pós-reunião):** o custo que “não batia” no caso das 250 peças **não era bug de horas trabalhadas** em serviço manual. O sistema aplicava a **metragem mãe do produto** a todos os insumos; como cada vinil tem área diferente, material e custo ficavam errados. A solução correta é **medida por insumo**, não ajuste de horas.

#### Contexto de negócio
Em produtos compostos, nem todo insumo ocupa a mesma metragem do produto total. Vários insumos compõem **um único produto** vendido ao cliente.

#### Caso real demonstrado na reunião (adesivo banheiro VIP)
- **Produto comercial (1 item para o cliente):** adesivo de recorte em duas cores — 250 unidades
- **Composição interna:**
  - Vinil cinza claro gold: **9 × 9 cm** por peça
  - Vinil cinza escuro gold: **40 × 9 cm** por peça
  - Serviços manuais: recorte plotter, aplicação de vinil, etc.
- **Medida “mãe” do produto** não serve para ambos os vinis — cada um consome área diferente

#### Por que “dois produtos no orçamento” não resolve
Durante a reunião, foi sugerido criar **produto 1** (cinza claro) + **produto 2** (cinza escuro) no mesmo orçamento.

| Aspecto | Problema |
|---------|----------|
| **PDF / proposta ao cliente** | Aparecem **2 linhas distintas** — inválido comercialmente |
| **Realidade do negócio** | É **uma composição** (1 adesivo, 2 vinis), não dois produtos separados |
| **OS / PCP** | Até ajuda a separar fornecedores, mas **quebra a apresentação ao cliente** |

**Conclusão:** a saída é **1 produto no orçamento** (nome + descrição agregados) com **medidas e custos corretos por insumo interno**.

#### PDF / proposta ao cliente (decisão definida)

O que o cliente vê no PDF **não muda de estrutura** — segue os campos que já existem hoje (unidade, quantidade, valor, etc.).

| Campo no PDF | Origem |
|--------------|--------|
| **Descrição** | Texto único que o operador escreve no campo **Descrição** do item do orçamento |
| **Quantidade, unidade, valores** | Campos comerciais já existentes no PDF |
| **Insumos internos** | **Não aparecem** como linhas separadas — só entram no cálculo de custo |

A descrição agrega o detalhamento comercial (ex.: *"Vinil em duas cores, recorte, máscara, refilo individual"*). O operador escreve uma vez; o cliente recebe **uma linha** com essa descrição.

#### UI — medida local por insumo (decisão definida)

Por **linha de insumo/material** no orçamento:

| Estado | Comportamento |
|--------|---------------|
| **Toggle desligado (default)** | Insumo usa medida **mãe** do produto (Geometria de produção) |
| **Toggle ligado** | Exibe campos **L × A × P** (profundidade só se produto 3D), mesma unidade da geometria mãe |
| **Cálculo** | Área/consumo do insumo calculado a partir das dimensões locais × quantidade do produto |

Reutilizar o padrão visual de `QuickGeometryInput` (ou campos equivalentes compactos por linha), não apenas campo de área m² solto.

#### Regra desejada
| Situação | Comportamento |
|----------|---------------|
| **Padrão (default)** | Insumo **herda a medida mãe** do produto (L × A × P × unidade) |
| **Override (toggle on)** | Insumo usa **L × A × P** próprios informados na linha |
| **Cálculo de material** | Cada insumo usa **sua** medida × quantidade do produto (ex.: 250 × área do vinil) |
| **Serviços manuais** | Calculados sobre a base correta do produto (independente da metragem por insumo) |
| **PDF** | **1 linha** — descrição do campo Descrição + qty/unidade/valor existentes; insumos só internos |

#### Workaround rejeitado vs. solução alvo

```
❌ Rejeitado:  Produto A (vinil claro) + Produto B (vinil escuro) → 2 linhas no PDF

✅ Alvo:       Produto "Adesivo recorte 2 cores"
              Descrição (campo único → PDF): "250 adesivos, vinil 2 cores, recorte..."
              ├─ Insumo vinil claro    → toggle ON → 9×9 cm
              ├─ Insumo vinil escuro   → toggle ON → 40×9 cm
              └─ Serviços manuais      → recorte, aplicação...
              → PDF: 1 linha (descrição + unidades/valores atuais)
```

#### Ainda a confirmar (menor)
- Ao mudar medida mãe, insumos **sem** toggle atualizam automaticamente?
- Medida local também no **cadastro de produto/template** ou só no orçamento?
- Insumos com unidade de uso M3 / M2_LATERAL herdam profundidade local ou da mãe?

#### Critérios de aceite (caso adesivo 250 peças)
1. Um único item de produto no orçamento
2. Toggle por insumo com L × A (e P se 3D) → custos de material coerentes por vinil
3. PDF: **1 linha** — descrição = campo Descrição do orçamento; demais colunas como hoje
4. Preview de cálculo bate com conta manual do operador

#### Implementação (23/06/2026)
- Toggle **"Medidas próprias deste material (L × A × P)"** em `MaterialSection.tsx`
- Campos persistidos em `ItemInsumo` e `item_template_produtos` (`usa_medida_propria`, `largura_material`, etc.)
- Recálculo automático de quantidade usa dimensões locais quando toggle ativo
- PDF inalterado (1 linha comercial — descrição do campo Descrição)

#### Referência técnica (provável)
- `frontend/src/components/ui/shared/sections/MaterialSection.tsx` — hoje usa metragem mãe para todos os insumos
- Motor de cálculo / preview (`preview-calculo.helpers.ts`)
- PDF orçamento — evitar N linhas quando N insumos com medidas diferentes

---

### PCP para agente — workflow simplificado · P2

- [ ] **Madurar PCP para operação tipo agente (produção externa / terceiros)**

#### Contexto (reunião)
- Jonatan **não produz internamente** — compra/terceiriza (Zap Gráfica, etc.)
- Hoje controla no **Excel**: arte → protótipo → produção → agendar → receber → entregue
- Workflow **"produção externa"** criado na reunião (envio arquivo → produção → retirada) — **funcionou**
- Carlos: PCP ainda precisa **madurar**; Jonatan prefere visão **essencial** (fila / em produção / concluído)

#### Passos desejados (modelo Jonatan)
1. Arquivos prontos
2. Enviado ao fornecedor
3. Fornecedor confirma / em produção
4. Prazo de entrega
5. Recebido / entregue

#### Direção
- Modo **essencial** vs. **completo** no PCP (Jonatan inclinado ao essencial)
- Workflow por **fornecedor/setor externo** (ex.: produção Zap)
- Integração futura com **alerta ao fornecedor** (ver Notas)

#### Validado na reunião
- Kanban PCP + arrastar cards + workflow externo — **aceito**, com ressalvas de maturidade

---

### Pós-produção — faturado / entregue / NF · P3

- [ ] **Definir fluxo pós-PCP: faturamento, NF e entrega (NF em sistema externo)**

#### Contexto (reunião)
- Após PCP "pronto", Jonatan **fatura fora** do Comunikapp e combina retirada/entrega
- Precisa registrar: **faturado**, **nº NF**, **entregue**
- Carlos: área **financeira restrita** (não expor valores na OS aberta à produção)
- Card "Prontos" no dashboard pode crescer infinito — precisa critério (ex.: do dia, pendentes de faturar)

#### Ideias discutidas
- Botão "Finalizar para faturamento" no financeiro
- Colunas/barras: faturado · entregue (similar ao Excel dele)
- NF **não** emitida dentro do Comunikapp no curto prazo (sistema separado)

---

### Produtos prontos vs. templates de orçamento · P3

- [ ] **Separar cadastro de produto pronto (revenda/unidade) de template de composição**

#### Contexto (reunião — roadmap Carlos)
| Tipo | Uso | Exemplo Jonatan |
|------|-----|-----------------|
| **Template de orçamento** | Composição com insumos/serviços, preview de custo | Totem, adesivo composto |
| **Produto pronto** | Revenda por unidade, foto, preço — estilo e-commerce | Wind Banner, GIV (compra e revende) |

- Hoje Jonatan cadastra revenda como **insumo/material** (workaround)
- Futuro distante: integração **Mercado Livre** / marketplace — **explicitamente depois**

#### Entrega inicial ( quando priorizar )
- Cadastro simples de produto pronto (unidade, foto, descrição, custo/venda)
- Adicionar ao orçamento junto com templates compostos (ex.: Wind Banner + caixas acrílico)

---

### Cadastro de Máquinas — hora alocada em fornecedor (agente) · P3

- [ ] **Definir modelo de alocação de hora-máquina para agentes sem máquina própria**

#### Contexto de negócio (Jonatan)
- Cliente opera como **agente** — **não possui máquina própria**
- Tentou cadastrar máquina → **falhou** (campos exigem hora/funcionário que não tem)
- Às vezes aloca **hora no fornecedor** (ex.: plotter R$ 22/m); hoje registra como **insumo** (ex.: plotter de recorte)
- Empresas parceiras **emprestam hora** de máquina

#### Direção inicial (a detalhar)
- Diferenciar **máquina própria** vs. **hora terceirizada/alocada**
- Vincular hora alocada a **fornecedor** e custo/hora
- Integrar ao cálculo do orçamento de forma similar às máquinas atuais

#### Pendente para próxima rodada
- Campos, telas, nomenclatura (máquina vs. serviço terceirizado?)
- Relação com cadastro de máquinas e fornecedores existentes
- Impacto em OS e produção

---

### Status "Em Prospecção" no Financeiro · P1

- [x] **Corrigir exibição incorreta de "Em prospecção" no grid financeiro** ✅ *Implementado 23/06/2026*

#### Decisão de negócio (definida)
- **Contexto:** módulo **Financeiro** (recebimentos/cobranças), **não** funil de vendas
- Status `PREVISTA` no enum de cobrança era exibido com label **"Em prospecção"** no grid
- **Jonatan (reunião):** *"prospecção é quando você tá fazendo orçamento ainda"* — label atual **confunde** com fase comercial; no dashboard operacional deveria refletir **produção**, não prospecção

#### Comportamento atual (bug reportado)
- Status **"Em prospecção"** aparecia no grid financeiro **sem motivo aparente**
- No teste: orçamento **já estava aprovado**, mas a cobrança/registro ainda mostrava prospecção

#### Comportamento esperado
- Status financeiro deve refletir corretamente o ciclo da cobrança (prevista → parcial → liquidada, etc.)
- Orçamento **aprovado** não deveria aparecer como "Em prospecção" se a cobrança já foi gerada/atualizada
- Revisar se o label **"Em prospecção"** é adequado para `PREVISTA` ou se deve ser renomeado (ex.: "Prevista", "A receber")

#### Implementação (23/06/2026)
- Label `PREVISTA` alterado para **"Prevista"** em `financeiro/recebimentos/page.tsx`
- Lógica pós-aprovação (rollup de status) permanece para investigação futura se cobrança continuar em `PREVISTA`

#### Investigar
- Lógica de criação/atualização de cobrança ao aprovar orçamento (`status-rollup.service.ts`, `cobrancas.service.ts`)
- Condição que mantém cobrança em `PREVISTA` após aprovação
- Mapeamento de label em `frontend/src/app/(main)/financeiro/recebimentos/page.tsx`

#### Referência técnica
- `frontend/src/app/(main)/financeiro/recebimentos/page.tsx` — `PREVISTA` → label **"Prevista"**
- `backend/src/financeiro/services/status-rollup.service.ts` — rollup de status da cobrança
- `backend/src/financeiro/enums/cobranca-status.enum.ts`

---

## 📝 Notas de Desenvolvimento · P3 (amadurecer por último)

> Itens de discovery e backlog futuro. **Não priorizar** até fechar bugs P0/P1 acima.

### Documentação de Processos — Cadastro de Fornecedores

**Contexto reunião:** cadastro atual só tem **nome**; Jonatan precisa de mais dados para alertas e gestão.

| Campo sugerido | Detalhe |
|----------------|---------|
| Nome / razão social | Existente |
| **CNPJ** | Puxa endereço etc. |
| **Telefone / e-mail** | Contato operacional |
| **Nome do contato** | Pessoa que trata |
| **Tipo de fornecedor** | Gráfica, corte, plotagem, revenda (GIV), insumos (Tecnos), SMK (fachadas/tótem) |
| **Observações** | Ex.: Artint — só corte, às vezes plotagem veicular |
| **Flag** | Recebe alerta automático de OS (WhatsApp/e-mail) |

- Local atual: **Configurações** (não em Centros de Trabalho)
- Tipos exemplos citados: Zap Gráfica, Mr. Print, GIV, SMK, Tecnos, Artint

### Importação de Dados (CSV/Excel)

**Contexto reunião:** Jonatan enviou planilha de controle manual; Carlos analisará viabilidade de importação.

**Colunas do Excel dele (referência):**
- Data · Cliente · Quantidade · Produto · Fornecedor(es) (seta = múltiplos) · Custo total · Valor venda · Imposto · Faturamento
- Status operacional: em produção · entregue · arte · protótipo
- Nº nota fiscal · Vencimentos (verde quando pago)

- Jonatan: pouca estrutura formal — **lançamento manual** no sistema pode ser suficiente
- Entrega: spike / análise, não implementação direta

### Integração — Alertas para Fornecedor na OS

**Fluxo desejado (reunião):**
1. Orçamento → OS aprovada → liberada para fila do fornecedor
2. Fornecedor recebe **WhatsApp ou e-mail**: nova OS na fila (nº, empresa, resumo)
3. Hoje Jonatan manda **manual** via WhatsApp (descrição do orçamento + arquivos)

**Depende de:** cadastro de fornecedor completo + contato + flag de notificação

### Salvar orçamento como produto (template)

- Jonatan: ao montar orçamento sem template prévio, quer **salvar como produto** para reutilizar
- Carlos: recurso planejado (template de orçamento vs. produto pronto — ver seção Produtos prontos)
- Relacionado ao bug **P0 serviços manuais** no save de produto

### Emissão de NF fiscal · futuro

- Carlos mencionou visão de longo prazo: sistema emitir NF
- Jonatan usa **sistema separado** hoje — **fora de escopo** imediato

### UX — Duplicar orçamento

- Jonatan não via opção **Duplicar** (scroll horizontal no grid)
- Carlos mostrou menu **⋯ → Duplicar** — **recurso já existe**
- Melhoria opcional: tornar ação mais visível (sem scroll escondido)

### Visão geral — processo início ao fim (meta do produto)

Jonatan validou objetivo: cliente → orçamento → imagem/arte → OS → PCP/fornecedor → financeiro, **do início ao fim** no Comunikapp (substituir Excel + WhatsApp manual gradualmente).

---

## Resumo de prioridades sugeridas

| Prioridade | Item |
|------------|------|
| **P0** | ~~Serviços manuais + erro ao salvar produto~~ ✅ |
| **P1** | ~~Preview metragem~~ ✅ · ~~Persistência insumos (preview)~~ ✅ · ~~PDF pagamento~~ ✅ · ~~Status financeiro~~ ✅ · ~~Medidas por insumo~~ ✅ · ~~Foto produto~~ ✅ · ~~Erro qty 10~~ ✅ (validar) |
| **P2** | ~~Preview delay insumo~~ ✅ · ~~Arte/sync F5~~ ✅ · ~~Logo PDF~~ ✅ · ~~Badge beta~~ ✅ · Editar OS entregue ⏳ · **PCP agente (madurar)** |
| **P3** | Comissão (onboarding/config loja) · Pós-PCP faturado/NF · Produtos prontos vs template · Máquinas/hora fornecedor · Fornecedores · Excel · Alertas OS · NF futuro |

---

## Itens da transcrição × backlog (índice)

| Tema | No backlog | Prioridade |
|------|------------|------------|
| Preview metragem (361 m²) | ✅ implementado | P1 |
| Save produto / serviços manuais | ✅ implementado | P0 |
| PDF forma pagamento | ✅ implementado | P1 |
| Medidas por insumo + PDF 1 linha | ✅ implementado | P1 |
| Status "Em prospecção" | ✅ label corrigido | P1 |
| Persistência insumo modal | ✅ preview/custo imediato | P1 |
| Foto produto save/load | ✅ implementado | P1 |
| Erro qty 10 / 500 | ✅ mitigação horas_producao | P1 |
| Preview delay insumo | ✅ implementado | P2 |
| Arte aprovação sync F5 + preview imagem | ✅ implementado | P2 |
| Logo PDF | ✅ implementado | P2 |
| Comissão (config loja) | ✅ campo comissao_padrao | P3 |
| Badge beta (ícone + hover) | ✅ implementado | P2 |
| Editar OS entregue | ⏳ pendente | P2 |
| PCP agente / workflow externo | ⏳ discovery | P2 |
| Pós-PCP faturado/NF | ✅ **novo** | P3 |
| Produtos prontos vs template | ✅ **novo** | P3 |
| Fornecedores + alertas OS | ✅ expandido | P3 |
| Importação Excel | ✅ expandido | P3 |
| Duplicar orçamento | ✅ nota UX (já existe) | — |
| Orçamento aprovado bloqueado | ✅ nota | — |
| Marketplace / NF emitir | ✅ nota futuro | — |

---

## Deploy — migration obrigatória

Após pull desta entrega, executar no servidor:

```bash
cd backend
npx prisma migrate deploy
```

Migration: `20260623120000_template_servicos_geometria_medidas_insumo` (serviços no template, geometria/foto, medidas por insumo).

Migration: `20260623140000_loja_comissao_padrao` (comissão padrão do vendedor na loja).
