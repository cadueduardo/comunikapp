# Matriz endpoint × permissão

Escopo: operações do **módulo de usuários/perfis** e a porta `.acessar` dos demais módulos. Vendas e Compras granulares já têm matrizes próprias (`docs/modulo-vendas/fase-2/matriz-endpoints.md` e o service de Compras); esta entrega **não** as reescreve.

Autorização efetiva = identidade + loja ativa + permissão efetiva (ver `MODELO-AUTORIZACAO-EFETIVA.md`). `loja_id` sempre do token.

## Usuários

| Método | Rota | Ator | Permissão efetiva | Notas |
|---|---|---|---|---|
| GET | `/usuarios` | gestão | `usuarios.usuarios.gerenciar` | Paginação; sem hash/segredo |
| GET | `/usuarios/:id` | gestão | `usuarios.usuarios.gerenciar` | Tenant `id+loja_id` |
| POST | `/usuarios` | gestão | `usuarios.usuarios.gerenciar` | Função whitelist do enum; não aceita `loja_id`/`sistema`; criar `ADMINISTRADOR` exige ator já `ADMINISTRADOR` (lido no banco) |
| PATCH | `/usuarios/:id` | gestão | `usuarios.usuarios.gerenciar` | Não administra conta `ADMINISTRADOR` (e-mail, nome, telefone, status, função, perfis) sem ator administrador da loja; último admin com `FOR UPDATE`; incrementa `session_version` se status/função/senha |
| PATCH | `/usuarios/:id/desativar` | gestão | `usuarios.usuarios.gerenciar` | Conta `ADMINISTRADOR` só por administrador da loja; último admin com `FOR UPDATE`; revoga sessão do alvo |
| PATCH | `/usuarios/:id/reativar` | gestão | `usuarios.usuarios.gerenciar` | Reativar `ADMINISTRADOR` exige ator administrador da loja |
| POST | `/usuarios/:id/perfis` | gestão | `usuarios.perfis.gerenciar` | Associação tenant-safe; conta `ADMINISTRADOR` só por administrador da loja |
| GET | `/usuarios/me/preferencias` | próprio | autenticado | Fora do catálogo de perfil |
| PATCH | `/usuarios/me/preferencias` | próprio | autenticado | |
| GET/POST | `/usuarios/2fa/*` | próprio | autenticado | |
| GET | `/usuarios/me/acesso` | próprio | autenticado | Flags `.acessar` para UX; **não** exige `usuarios.acessar`; prefixo `/api` é o mesmo autoatendimento; uma carga do usuário |
| POST | `/usuarios/reenviar-codigo` | público | — | Resposta genérica (anti-enumeração) |
| POST | `/usuarios/definir-senha` | público | — | DTO + senha mín. 8 |
| POST | `/usuarios/solicitar-redefinicao-senha` | público | — | Já genérico |
| POST | `/usuarios/redefinir-senha` | público | — | |

Fase 0 (antes do núcleo): as rotas de gestão usam `usuario_funcao.ADMINISTRADOR` como equivalente temporário de `usuarios.*.gerenciar`.

## Perfis

| Método | Rota | Permissão | Notas |
|---|---|---|---|
| GET | `/usuarios/perfis/catalogo` | `usuarios.perfis.gerenciar` | Catálogo global + estado do perfil se `?perfilId=` |
| GET | `/usuarios/perfis` | `usuarios.perfis.gerenciar` | Paginação |
| POST | `/usuarios/perfis` | `usuarios.perfis.gerenciar` | `sistema` forçado false |
| GET | `/usuarios/perfis/:id` | `usuarios.perfis.gerenciar` | |
| PUT | `/usuarios/perfis/:id` | `usuarios.perfis.gerenciar` | `versao` obrigatória; transação; auditoria |
| DELETE | `/usuarios/perfis/:id` | `usuarios.perfis.gerenciar` | Bloqueia sistema e perfil com usuários |
| POST/DELETE | `/usuarios/perfis/:id/usuarios/:usuarioId` | `usuarios.perfis.gerenciar` | Mesma loja; revoga sessão do usuário alvo; conta `ADMINISTRADOR` só por administrador da loja |

## Porta de módulo (Fase 5)

Guard de prefixo: para cada manifesto, requisições autenticadas cujo path começa com `prefixosApi` exigem `permissaoAcesso`, **exceto**:

- rotas públicas;
- `/admin/v1`;
- `/usuarios/me/*`, `/usuarios/2fa/*` e rotas públicas de senha (com ou sem prefixo `/api` do proxy).

Operações granulares de Vendas/Compras/OS **permanecem** mais restritivas que `.acessar`. Ter `.acessar` não dispensa `vendas.proposta.editar`.

## Endpoints que a Fase 0 fecha (antes eram só JWT)

| Antes | Depois (Fase 0) | Depois (Fase 2+) |
|---|---|---|
| GET `/usuarios` qualquer autenticado | ADMINISTRADOR | `usuarios.usuarios.gerenciar` |
| GET `/usuarios/:id` + hash de senha | ADMINISTRADOR + select seguro | idem |
| CRUD `/usuarios/perfis*` qualquer autenticado | ADMINISTRADOR | `usuarios.perfis.gerenciar` |
