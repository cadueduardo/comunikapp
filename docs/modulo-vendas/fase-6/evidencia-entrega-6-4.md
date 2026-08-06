# Evidência — Incremento 6.4 (Versão Enviada, Aceita e Diff)

**Data:** 2026-08-06
**Módulo:** Módulo de Vendas (Fase 6)
**Escopo:** Gestão de Versões, Snapshot Imutável no Envio, Diff Legível Sanitizado e Validação Multi-tenant no Aceite

---

## 1. Descrição da Entrega

Implementado o domínio e serviço de gestão de versões de orçamento (`VersaoOrcamentoService`), módulo comparador de diff legível e higienização estrita de dados públicos:

- **Domínio & Comparador:** [diff-versao-orcamento.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/domain/diff-versao-orcamento.ts).
- **Service:** [versao-orcamento.service.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/services/versao-orcamento.service.ts).
- **Suíte de Testes:** [versao-orcamento.service.spec.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/services/versao-orcamento.service.spec.ts).

---

## 2. Garantias e Invariantes

1. **Snapshot Imutável:** O envio da proposta congela a versão em `VersaoOrcamento` com snapshot completo. Edições posteriores criam versões novas (`vN+1`) sem alterar os dados da versão anterior (`v1..vN`).
2. **Validação no Aceite:** O aceite exige que a versão apresentada corresponda exatamente a `versao_enviada_id` vigente no orçamento. Tentativa de aceitar versão antiga ou pertencente a outro tenant/orçamento devolve `400 Bad Request`.
3. **Higienização SENSÍVEL / OWASP:** Todas as rotas públicas de consulta de versão e diff expurgam custos (`custo_material`, `custo_mao_obra`, `custo_total`, `custo_total_producao`), margens de lucro e detalhes internos de cálculo.
4. **Isolamento Multi-Tenant:** Toda consulta de versão filtra estritamente por `orcamento_id` e `loja_id`.
5. **Zero Migrations Desnecessárias:** A tabela `VersaoOrcamento` existente foi integralmente reutilizada sem alteração de schema.

---

## 3. Resultados das Validações

### 3.1 Testes Unitários de Versão e Diff
```text
npm test -- backend/src/orcamentos-v2/services/versao-orcamento.service.spec.ts
```
**Resultado:** 7 testes aprovados (100% de sucesso).
- √ 1. snapshot anterior permanece byte a byte imutável ao congelar nova versão
- √ 2. atualização produz snapshot completo e imutável
- √ 3. hashes materiais são estáveis para conteúdos comerciais equivalentes
- √ 4. aceite de versão antiga ou pertencente a outro orçamento/tenant é negado
- √ 5. diff não expõe custo/margem e representa todas as alterações de preço, escopo e prazos
- √ 6. sanitizarObjetoSnapshot purga recursivamente campos sensíveis
- √ 7. obterVersaoSanitizada impõe filtro estrito de multi-tenancy

### 3.2 Compilação da Aplicação
```text
npm run build
```
**Resultado:** `nest build` concluído com sucesso.

---

## 4. Arquivos Modificados/Criados no Incremento

- `[NEW]` [diff-versao-orcamento.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/domain/diff-versao-orcamento.ts)
- `[NEW]` [versao-orcamento.service.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/services/versao-orcamento.service.ts)
- `[NEW]` [versao-orcamento.service.spec.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/services/versao-orcamento.service.spec.ts)
- `[MODIFY]` [orcamentos-v2.module.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/orcamentos-v2.module.ts)
- `[NEW]` [evidencia-entrega-6-4.md](file:///c:/Projects/comunikapp/docs/modulo-vendas/fase-6/evidencia-entrega-6-4.md)
