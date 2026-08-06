# Evidência — Incremento 6.5 (Negociação e Contrato de Chat)

**Data:** 2026-08-06
**Módulo:** Módulo de Vendas (Fase 6)
**Escopo:** Contrato de Chat Canônico, Promoção de Estado Comercial no Envio de Mensagem e Validação de Anexos

---

## 1. Descrição da Entrega

Implementada a integração de chat do orçamento com a máquina comercial canônica (DV-14), promoção idempotente de estado comercial e proteção de upload de arquivos:

- **Service:** [chat-v2.service.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/services/chat-v2.service.ts).
- **Suíte de Testes:** [chat-v2.service.spec.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/services/chat-v2.service.spec.ts).

---

## 2. Invariantes Mantidas

1. **Promoção de Estado Comercial via CAS:** A primeira mensagem de negociação em propostas no status `enviada` promove automaticamente para `em_negociacao` utilizando exclusivamente `TransicaoComercialService.executar`. Mensagens posteriores não alteram o status nem duplicam a timeline.
2. **Proteção Multi-Tenant & IDOR:** Toda operação de leitura, envio e marcação de mensagens não lidas valida e filtra estritamente por `loja_id`.
3. **Segurança de Anexos:** Aplicação de allowlist de extensões/MIME (`.jpg`, `.png`, `.webp`, `.pdf`, `.txt`, `.dxf`, `.dwg`) e limite máximo de 10MB por arquivo com nome sanitizado.
4. **Sanitização de Logs (OWASP):** Conteúdo bruto de mensagens, tokens, e-mails e IPs foram expurgados dos logs do serviço.
5. **Preservação do Histórico Legado:** Mantida a tabela `mensagemnegociacao` sem remoções destrutivas.

---

## 3. Resultados das Validações

### 3.1 Testes Unitários de Chat e Negociação
```text
npm test -- backend/src/orcamentos-v2/services/chat-v2.service.spec.ts
```
**Resultado:** 6 testes aprovados (100% de sucesso).
- √ 1. nega acesso a mensagem de orçamento pertencente a outro tenant (IDOR)
- √ 2. primeira mensagem promove proposta enviada -> em_negociacao via writer único
- √ 3. mensagens subsequentes em propostas já em_negociacao não re-executam promoção
- √ 4. leitura e marcação de não lidas filtram estritamente por loja_id
- √ 5. rejeita envio de arquivo se exceder 10MB ou se tiver tipo/extensão não permitida
- √ 6. aceita upload de anexo válido dentro do limite de 10MB e mime allowlist

### 3.2 Compilação da Aplicação
```text
npm run build
```
**Resultado:** `nest build` concluído com sucesso sem erros.

---

## 4. Arquivos Modificados/Criados no Incremento

- `[MODIFY]` [chat-v2.service.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/services/chat-v2.service.ts)
- `[NEW]` [chat-v2.service.spec.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/services/chat-v2.service.spec.ts)
- `[NEW]` [evidencia-entrega-6-5.md](file:///c:/Projects/comunikapp/docs/modulo-vendas/fase-6/evidencia-entrega-6-5.md)
