# Modelo de autorização efetiva

## Camadas (todas obrigatórias quando aplicável)

```
identidade válida (JWT de loja, não admin)
+ loja ativa
+ conta ATIVA, ativo=true, e-mail verificado
+ session_version da loja e do usuário
+ permissão efetiva do usuário
+ escopo de tenant do recurso (loja_id do token)
```

Menu **não** autoriza. Entitlement de marketplace **não** está implementado; quando existir, entra como camada extra, não no lugar do perfil.

## Algoritmo (`PermissaoEfetivaService.avaliar`)

Entrada: `usuarioId`, `lojaId` (do token), `chave` da permissão.

1. Se a chave **não** existe no catálogo → **nega** (desconhecida).
2. Carrega o usuário com `id + loja_id + status=ATIVO + ativo=true`. Ausente → **nega**.
3. Se `usuario.funcao === ADMINISTRADOR` → **concede** (bypass funcional; tenant/ativo já filtrados). Não remove auditoria nem isolamento.
4. Junta decisões de **perfis ativos** vinculados (`usuario_perfil` → `perfil_acesso.ativo=true`) para o par `(modulo, acao)` parseado da chave.
5. Se alguma decisão tem `permitido=false` → **nega** (deny explícito vence piso e grant).
6. Se alguma decisão tem `permitido=true` → **concede**.
7. Se não há linha (não revisada):
   - se a chave está no **piso da função** do manifesto / `funcaoConcede` de Vendas → **concede** (compatibilidade temporária);
   - senão → **nega**.

Múltiplos perfis: união de grants, **qualquer** deny explícito vence. Perfil inativo é ignorado.

## Estados de uma permissão na UI

| Estado | Persistência | Efeito |
|---|---|---|
| Concedida | linha `permitido=true` | concede (salvo deny em outro perfil ativo) |
| Negada | linha `permitido=false` | nega |
| Não revisada | ausência de linha | nega, salvo piso temporário documentado |

Não há seed de `permitido=false` em massa. Permissão nova em perfil customizado aparece como não revisada e **não** é concedida no sync.

## Bypass administrativo

Somente `usuario_funcao.ADMINISTRADOR`. **Proibido:** nome textual do perfil, `UserRole` minúsculo, `@Roles` inerte, `sistema=true` enviado pelo cliente.

`usuarios.usuarios.gerenciar` **não** autoriza criar ou promover `funcao: ADMINISTRADOR`. Somente um usuário já `ADMINISTRADOR`, ativo e da mesma loja (lido no banco, não no JWT) pode conceder essa função. Sem essa fronteira, a permissão delegável de gestão de usuários se torna bypass completo do RBAC.

## Função vs perfil

- Função: papel canônico no JWT; piso temporário; escolha na criação do usuário.
- Perfil: composição de grants/denies da loja; um usuário pode ter vários.
- Perfis de sistema (`sistema=true`): só o sync versionado altera permissões; UI não edita a matriz além do que o sync define; não se exclui.

## Sessão

| Evento | Efeito |
|---|---|
| Inativar / bloquear / mudar função / resetar senha / mudar grants do usuário | `usuario.session_version++` |
| Gestão bloqueia a loja inteira | `loja.session_version++` (já existe) |

JWT antigo sem `usuario_session_version` compara como `0`. Middleware recusa se divergir.

## Concorrência de perfil

`PUT` de perfil exige `versao`. Se divergir → 409, sem overwrite silencioso. Substituição de permissões ocorre na **mesma transação** que o update e a auditoria. Sem `deleteMany` + `createMany` fora de transação.

## Auditoria

Tabela `loja_audit_log`: ator, ação, recurso, antes/depois **sanitizados** (nunca senha, hash, token, código, secret 2FA). Falha de auditoria aborta a transação.

## Erros públicos

Português do Brasil, estáveis, sem stack. Não confirmar existência de e-mail em endpoints públicos de recuperação/reenvio.
