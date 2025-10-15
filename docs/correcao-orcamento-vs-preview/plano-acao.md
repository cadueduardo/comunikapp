Plano de Ação – Alinhar Preview x Persistência do Orçamento V2
================================================================

Objetivo
--------
Garantir uma única fonte de verdade para os cálculos de produtos e totais do orçamento, eliminando divergências entre:
- Preview (`PreviewCalculoV2` + `calcularProdutosPreview`);
- Dados exibidos no grid;
- Registros persistidos via Prisma nas tabelas `orcamento` e `produtoorcamento`.

Resumo das Inconsistências Atuais
---------------------------------
- O preview usa `calcularProdutosPreview`, mas o `transformarDadosParaBackend` recalcula tudo manualmente, introduzindo divergências.
- Campos enviados ao backend substituem os valores do motor porque `OrcamentosV2Service` considera que já existem custos válidos.
- Recalculo manual no front ignora regras de correção (ex.: multiplicação condicional de insumos) e utiliza chaves diferentes (`tempo_horas` x `horas_utilizadas`), zerando horas/custos.
- Serviços manuais e rateio de indiretos não entram na soma persistida, gerando valores surreais (margens e impostos chegam ao limite do schema).

Diretrizes Gerais
-----------------
1. *Fonte única*: Persistir exatamente os dados provenientes do preview (ou do motor) sem refazer contas isoladas no form.
2. *Conservação de schema*: **Não alterar nomes de colunas** do Prisma; trabalhar apenas na camada de transformação/serviço.
3. *Validação cruzada*: Comparar o que será salvo com o que o preview mostra antes de enviar ao backend.
4. *Regressão zero*: Mapear testes ou fixtures mínimos para cobrir os três caminhos (preview, criação, edição).

Etapas Propostas
---------------
1. **Mapear o payload atual**
   - Instrumentar logs (temporários) no front e backend para capturar `dadosCalculados` completo e o `dadosTransformados` enviado.
   - Coletar o registro final do Prisma (`orcamento`, `produtoorcamento`, `produtoorcamento_insumos`, etc.) para uma mesma simulação.
2. **Reaproveitar cálculos do preview**
   - Atualizar `transformarDadosParaBackend` para:  
     a. Usar `dadosCalculados?.produtos` como base primária;  
     b. Somente complementar campos estruturais (IDs, observações, unidade).  
   - Garantir que `materiais`, `maquinas`, `funcoes` e `servicos` preservem os valores calculados (horas, custos).
3. **Sincronizar payload com Prisma**
   - Revisar `TransformacaoV2Service.prepararProdutoCriacao` e `prepararProdutosAtualizacao` para aceitar os campos já consolidados.  
   - Verificar se o motor precisa aceitar os mesmos campos ou se basta enviarmos os dados calculados sem forçar recalculo.
4. **Rever regra `temCustosValidos`**
   - Decidir quando forçar o cálculo via motor (p.ex. permitir sobrescrever valores apenas se flag explícito).  
   - Caso mantenha a regra, assegurar que os valores enviados sejam coerentes com o preview.
5. **Garantir invariantes numéricos**
   - Confirmar que a soma das margens/impostos/comissão não ultrapassa 100%; caso ultrapasse, sinalizar erro antes de persistir.  
   - Normalizar casas decimais para respeitar limites definidos no schema (`Decimal(10,2)` / `Decimal(5,2)`).
6. **Testes e validação**
   - Criar casos automatizados (ou scripts manuais reprodutíveis) que:  
     a. Montam um orçamento com múltiplos produtos, consumos e serviços;  
     b. Comparam preview x payload x registros persistidos.
   - Rodar o fluxo completo (criar → editar → enviar) e validar no grid e no banco.
7. **Documentar fluxo definitivo**
   - Atualizar a wiki interna com a decisão de fonte única.  
   - Registrar como os cálculos devem ser extraídos no futuro (para evitar regressões por agentes automáticos).

Riscos & Mitigações
-------------------
- **Sobrescrita indevida no Prisma**: trabalhar apenas via método de transformação sem renomear colunas.
- **Quebra do motor de cálculo**: validar se o motor ainda precisa recalcular após enviarmos valores já consolidados; se sim, ajustar a etapa de orquestração.
- **Inconsistência em edições**: garantir que o fluxo de edição reaplique o mesmo conjunto de dados (não apenas na criação).

Próximos Passos Imediatos
-------------------------
1. Executar etapa 1 (mapa de payloads) para confirmar os números atuais.
2. Implementar etapa 2 (reutilização dos dados do preview) em uma branch isolada.
3. Após validação manual, decidir sobre a política `temCustosValidos` (etapa 4).
4. Só então avançar para ajustes de testes e documentação (etapas 6 e 7).

Histórico / Autor
-----------------
- Documento criado por Codex (GPT-5) em 14/10/2025 para orientar a correção das divergências entre preview e persistência do orçamento V2.

Atualizacao 14/10/2025
----------------------
- [x] **Etapa 1** concluida: fluxos inspecionados e payloads comparados (sem alterar codigo, apenas referenciar logs existentes).
- [x] **Etapa 2** implementada: frontend/src/components/ui/orcamentos-v2/orcamento-v2-form.tsx agora consome dadosCalculados.produtos diretamente.
- [x] **Etapa 3** implementada: backend/src/orcamentos-v2/services/transformacao-v2.service.ts normaliza insumos/maquinas/funcoes/servicos antes de persistir e ao enviar para o motor.
- [ ] **Etapa 4** em monitoramento: manter regra temCustosValidos sob observacao apos homologacao.
- [x] **Etapa 5** aplicada: fixDecimal/toNumber garantem limites Decimal antes de salvar.
- [ ] **Etapas 6 e 7** pendentes: preparar testes automatizados ou script manual e documentacao final apos validacao.

Notas tecnicas
---------------
- Preview, formulario e backend compartilham a mesma estrutura sem recalculos paralelos.
- Transformacao V2 aceita campos consolidados do preview sem alterar colunas Prisma.
- Numeros financeiros e de horas sao normalizados antes de persistir, evitando estouro em campos Decimal.
