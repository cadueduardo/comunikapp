# Evidência — Incremento 6.6 (Auditoria de LinkPublico)

**Data:** 2026-08-06
**Módulo:** Módulo de Vendas (Fase 6)
**Escopo:** Auditoria de Rotas, Mapeamento de Campos Duplicados e Validação de Segurança de Links Públicos

---

## 1. Descrição do Levantamento (Read-only Audit)

Concluída a auditoria de segurança e inventário de rotas das tabelas `LinkPublico` e `AcessoLink`:

- **Controllers & Services Auditados:** `LinksV2Controller` (`backend/src/orcamentos-v2/controllers/links-v2.controller.ts`) e `LinksV2Service` (`backend/src/orcamentos-v2/services/links-v2.service.ts`).
- **Tabelas do Banco:** `link_publico` (`LinkPublico`) e `acesso_link` (`AcessoLink`).

---

## 2. Conclusões da Auditoria

1. **Isolamento Multi-Tenant Garantido:**
   - Toda operação de criação, listagem, atualização ou cancelamento de links em `LinksV2Service` valida o orçamento através de `orcamento: { loja_id: lojaId }`.
   - Tentativa de acesso a links de outro tenant resulta em `404 Not Found`.

2. **Auditoria de IP / User-Agent Segura (Gate 0S / HS-03):**
   - O registro de acessos utiliza `extrairContextoDaRequisicao(req)` (cabeçalhos confiáveis da requisição HTTP), impedindo qualquer injeção via query string.

3. **Mapeamento de Campos Duplicados:**
   - `expira_em` / `data_expiracao`, `visualizacoes_max` / `max_visualizacoes`, `visualizacoes_atual` / `visualizacoes` pertencem à evolução gradual de versão.
   - **Decisão Normativa:** As colunas e estruturas foram mantidas **READ-ONLY** sem migrações ou drops destrutivos no banco de dados.

---

## 3. Validações Executadas

- **Compilação:** `nest build` aprovado sem avisos ou erros.
- **Evidência Registrada:** `docs/modulo-vendas/fase-6/evidencia-entrega-6-6.md`.
