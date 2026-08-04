# Evidência — auditoria RBAC pré-M2.1

**Gerado:** 2026-08-04  
**Script:** `backend/scripts/auditar-rbac-vendas.ts`  
**Ambiente:** desenvolvimento local Windows

## Resultado

```text
MySQL 127.0.0.1:3306 — indisponível (TcpClient connect falhou).
Relatório quantitativo de usuários/perfis/colisões NÃO coletado nesta sessão.
```

## O que o script cobre (quando o DB estiver up)

- Usuários ativos sem perfil
- Contagem por `usuario_funcao`
- Funções fora do enum (SQL defensivo)
- Perfis e contagem de permissões/usuários
- Permissões `modulo=vendas`
- Colisões `(perfil_id, modulo, acao)`
- Lojas e efeito (contagens)

Saída sanitizada: sem e-mail, CPF, tokens.

## Decisão para M2.1

Seed idempotente e seguro (não remove, não reabre `permitido=false`, não
associa produção/estoque, não concede financeiro ao vendedor) foi implementado
e coberto por teste unitário com Prisma fake. **Reexecutar a auditoria no
ambiente com DB** antes de promover seed em produção; não bloqueia o
fechamento técnico da Fase 2 no código.
