# Jornada manual — Novo atendimento / Fase 5

**Pré-requisito:** app local (frontend + backend) apontando ao banco de teste
autorizado. **Não** usar produção / Gate 0S.

## Personas

| Persona | Permissões mínimas | Expectativa |
|---|---|---|
| Vendedor A | `ATIVIDADE_GERENCIAR`, sem `CLIENTE_CRIAR` | Cliente existente OK; prospect bloqueado |
| Vendedor B | `ATIVIDADE_GERENCIAR` + `CLIENTE_CRIAR` | Prospect habilitado |
| Operador C | sem `ATIVIDADE_GERENCIAR` | Tela "Sem acesso ao atendimento" |

## Roteiro

1. Login como Vendedor A → `/vendas/atendimento`
2. Digitar 1 caractere na busca → sem chamada útil / sem seleção
3. Digitar ≥2 caracteres → loading; depois lista ou vazio
4. Selecionar cliente da carteira + contato → preencher necessidade/prazo → salvar com orçamento
5. Confirmar redirect para `/orcamentos-v2/novo?clienteId=…&contatoId=…`
6. Salvar orçamento mínimo e consultar `orcamento.contato_id` no MySQL de teste
7. Tentar "Criar prospect" → permanece desabilitado / toast de permissão
8. Login como Operador C → negar acesso
9. Login como Vendedor B → prospect disponível

## Registro

Data/hora: _pendente_
Executor: _pendente_
SHA: _preencher após execução_
Resultado: _pendente_
