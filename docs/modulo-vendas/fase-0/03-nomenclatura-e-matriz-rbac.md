# Fase 0 — Nomenclatura canônica e matriz RBAC de Vendas

**Documento:** entregáveis "Nomenclatura canônica" e "Matriz inicial de permissões"
**Status:** aprovado — DV-13, DV-04, DV-05, DV-11 e DV-12 decididas em 2026-07-31
**Referências:** RP §§4.5, 4.9, 5.1, 8.8; `01-auditoria-estado-real.md` §2

---

## 1. Papéis: resolvendo o vocabulário duplo

O repositório tem dois vocabulários de papel que não se correspondem:

| Vocabulário | Valores | Onde vive | Usado de verdade? |
|---|---|---|---|
| `usuario_funcao` (Prisma) | `ADMINISTRADOR`, `FINANCEIRO`, `PRODUCAO`, `VENDAS`, `ESTOQUE` | `schema.prisma:2548–2554` | **Sim** — é o que está no JWT (`auth.service.ts`, campo `funcao`) e o que todos os guards leem |
| `UserRole` (TypeScript) | `admin`, `user`, `manager`, `viewer`, `gerente`, `vendedor`, `operador` | `backend/src/auth/enums/user-role.enum.ts` | **Não** — valores minúsculos que não correspondem a nenhum `usuario.funcao`. Só aparece em `@Roles`, que é inerte |

### Decisão de nomenclatura

**`usuario_funcao` é a única fonte de verdade de papel.** `UserRole` é considerado
legado e **não deve ser usado em nenhum código novo de Vendas**. Não será removido
nesta entrega para não quebrar o legado, mas fica registrado como dívida.

Correspondência canônica para os termos do RP:

| Termo do RP | Implementação canônica |
|---|---|
| Vendedor de equipe | `usuario_funcao.VENDAS` sem permissões de escopo ampliado |
| Gestor de Vendas | `usuario_funcao.VENDAS` **com** `vendas.carteira.ver.equipe` e `vendas.alcada.aprovar` |
| Vendedor solo / dono | `usuario_funcao.ADMINISTRADOR` |
| Financeiro | `usuario_funcao.FINANCEIRO` |
| Operação | `usuario_funcao.PRODUCAO` |
| Administrador | `usuario_funcao.ADMINISTRADOR` |

Ou seja: **não existe papel "GERENTE" no enum e não será criado**. Gestor de Vendas
é uma composição de permissões sobre a função `VENDAS`. Isso evita migration de enum
e mantém a granularidade que o RP exige.

---

## 2. Mecanismo de autorização

A autenticação **já está resolvida** por `JwtGlobalMiddleware`
(`backend/src/app.module.ts:99–104`), que valida token, usuário ativo, loja ativa,
versão de sessão e tenant do host, e popula `req.user` com dados frescos do banco.
Vendas não deve refazer nada disso.

O que falta é a autorização. Conforme DV-13 (opção recomendada A), Vendas segue o
padrão de Compras, que é o único que funciona hoje:

```text
VendasPermissionsService
  ├── VENDAS_PERMISSOES        catálogo de constantes (fonte da verdade)
  ├── pode(usuarioId, lojaId, acao)      consulta perfil_permissao
  ├── assertPode(...)                    lança ForbiddenException
  └── assertPodeQualquer([...], rotulo)  OR entre permissões
```

Referência de implementação: `backend/src/compras/services/compras-permissions.service.ts`.

Regras obrigatórias herdadas do padrão:

1. A permissão é o par `(modulo, acao)` em `perfil_permissao`. A string
   `vendas.carteira.ver.propria` é quebrada em `modulo = 'vendas'` e
   `acao = 'carteira.ver.propria'` — primeiro segmento é o módulo, o resto é a ação.
2. `usuario_funcao.ADMINISTRADOR` tem bypass total.
3. Perfil com `nome` normalizado igual a `ADMINISTRADOR` tem bypass.
4. A checagem exige `usuario.status = 'ATIVO'` **e** `usuario.ativo = true`.
5. `assertPode` é chamado **dentro do service**, nunca só no controller, e nunca só
   no frontend.

**Proibido em Vendas:** usar `@Roles(...)` como se autorizasse. O decorator continua
existindo no repositório, mas não tem efeito.

### 2.1 Recorte obrigatório do Gate 0S

Antes de criar o catálogo completo da Fase 2, o hotfix deve proteger **todos os
endpoints já existentes** de Orçamentos V2 com um catálogo mínimo explícito. A
matriz endpoint × permissão deve ser anexada ao PR e nenhuma operação pode cair em
“autenticado pode tudo”. Permissões futuras de carteira, contatos, alçada e pipeline
não devem ser semeadas antecipadamente.

O bypass administrativo previsto neste documento não elimina escopo de tenant,
auditoria, validação, idempotência ou segregação de autoaprovação. Ele significa
apenas autorização funcional dentro da loja autenticada. O contrato executável e os
testes do hotfix estão no
[`09-gate-hotfix-seguranca.md`](./09-gate-hotfix-seguranca.md), HS-01 e HS-02.

**Ajustes feitos na execução do hotfix**, detalhados em
[`09-gate-hotfix-seguranca.md`](./09-gate-hotfix-seguranca.md) §2.0:

- Enquanto `perfil_permissao` estiver vazia, a autorização é a união entre um piso por
  `usuario_funcao` derivado da matriz da §4 e as permissões explicitamente cadastradas.
  Sem esse piso, negar por padrão deixaria só administradores operando Orçamentos V2.
- `vendas.proposta.excluir` foi acrescentada ao catálogo mínimo por causa do endpoint
  `DELETE /orcamentos-v2/:id`, que já existe. Precisa ser ratificada na Fase 2.

---

## 3. Catálogo `VENDAS_PERMISSOES`

Convenção: `vendas.<recurso>.<acao>[.<escopo>]`, tudo em minúsculas, sem acento.

### 3.1 Carteira e clientes

| Constante | String | Significado |
|---|---|---|
| `CARTEIRA_VER_PROPRIA` | `vendas.carteira.ver.propria` | Clientes em que é responsável ou participante |
| `CARTEIRA_VER_EQUIPE` | `vendas.carteira.ver.equipe` | Carteiras dos vendedores sob gestão |
| `CARTEIRA_VER_TODOS` | `vendas.carteira.ver.todos` | Cadastro mestre completo da loja |
| `CARTEIRA_VER_SEM_RESPONSAVEL` | `vendas.carteira.ver.sem_responsavel` | Fila de distribuição |
| `CARTEIRA_TRANSFERIR` | `vendas.carteira.transferir` | Trocar responsável comercial |
| `CLIENTE_CRIAR` | `vendas.cliente.criar` | Criar cliente ou prospect |
| `CLIENTE_EDITAR` | `vendas.cliente.editar` | Editar dados comerciais |
| `CLIENTE_MESCLAR` | `vendas.cliente.mesclar` | Mesclagem administrativa de duplicados |
| `CLIENTE_INATIVAR` | `vendas.cliente.inativar` | Inativar/bloquear |
| `CONTATO_GERENCIAR` | `vendas.contato.gerenciar` | Contatos e papéis do cliente |

### 3.2 Proposta e pipeline

| Constante | String | Significado |
|---|---|---|
| `PROPOSTA_VER` | `vendas.proposta.ver` | Listar e abrir propostas no escopo permitido |
| `PROPOSTA_CRIAR` | `vendas.proposta.criar` | Criar orçamento/proposta |
| `PROPOSTA_EDITAR` | `vendas.proposta.editar` | Editar antes do envio |
| `PROPOSTA_ENVIAR` | `vendas.proposta.enviar` | Congelar versão e enviar ao cliente |
| `PROPOSTA_REVISAR` | `vendas.proposta.revisar` | Criar nova versão de proposta enviada |
| `PROPOSTA_MARCAR_PERDIDA` | `vendas.proposta.marcar_perdida` | Encerrar com motivo de perda |
| `PROPOSTA_REABRIR` | `vendas.proposta.reabrir` | Reabrir proposta perdida ou expirada |
| `PROPOSTA_ACEITE_REGISTRAR` | `vendas.proposta.aceite.registrar` | Registrar aceite externo manualmente |

### 3.3 Preço, margem e alçada comercial

| Constante | String | Significado |
|---|---|---|
| `PRECO_DESCONTO_APLICAR` | `vendas.preco.desconto.aplicar` | Aplicar desconto dentro do limite |
| `PRECO_CUSTO_VER` | `vendas.preco.custo.ver` | Ver custo interno detalhado (**DV-05**) |
| `PRECO_MARGEM_VER` | `vendas.preco.margem.ver` | Ver margem resultante e limite |
| `ALCADA_SOLICITAR` | `vendas.alcada.solicitar` | Pedir exceção de desconto/margem |
| `ALCADA_APROVAR` | `vendas.alcada.aprovar` | Decidir exceção (**DV-04**) |

Nomenclatura: **"alçada comercial"**, para não colidir com a "alçada orçamentária"
já existente em `backend/src/os/services/alcadas-orcamento.service.ts`.

### 3.4 Pedido e acompanhamento

| Constante | String | Significado |
|---|---|---|
| `PEDIDO_VER` | `vendas.pedido.ver` | Acompanhamento comercial do pedido |
| `PEDIDO_CANCELAR` | `vendas.pedido.cancelar` | Cancelamento pós-aceite por fluxo compensatório |
| `PEDIDO_COBRANCA_VER` | `vendas.pedido.cobranca.ver` | Card read-only de situação da cobrança |

### 3.5 Aditivos comerciais

| Constante | String | Significado |
|---|---|---|
| `ADITIVO_VER` | `vendas.aditivo.ver` | Fila de ocorrências a precificar |
| `ADITIVO_PRECIFICAR` | `vendas.aditivo.precificar` | Definir preço ao cliente da ocorrência |
| `ADITIVO_ENVIAR` | `vendas.aditivo.enviar` | Enviar proposta de aditivo |
| `ADITIVO_GERAR_OS` | `vendas.aditivo.gerar_os` | Disparar o split existente |

**Abono permanece fora de Vendas**, em Financeiro/Admin, conforme RP §5.3.3 (4).

### 3.6 Atividades

| Constante | String | Significado |
|---|---|---|
| `ATIVIDADE_VER_PROPRIA` | `vendas.atividade.ver.propria` | Minhas atividades |
| `ATIVIDADE_VER_EQUIPE` | `vendas.atividade.ver.equipe` | Atividades da equipe |
| `ATIVIDADE_GERENCIAR` | `vendas.atividade.gerenciar` | Criar, concluir, reatribuir |

**Total: 31 permissões.**

---

## 4. Perfis padrão

Como não existe seed de perfis hoje (`backend/prisma/seed.ts` não popula
`perfil_acesso` nem `perfil_permissao`), a Fase 2 precisa criar o seed. Proposta:

| Permissão | Vendedor | Gestor de Vendas | Financeiro | Admin |
|---|:---:|:---:|:---:|:---:|
| `carteira.ver.propria` | ● | ● | ○ | ● |
| `carteira.ver.equipe` | ○ | ● | ○ | ● |
| `carteira.ver.todos` | ○ | ● | ○ | ● |
| `carteira.ver.sem_responsavel` | ○ | ● | ○ | ● |
| `carteira.transferir` | ○ | ● | ○ | ● |
| `cliente.criar` | ● | ● | ○ | ● |
| `cliente.editar` | ● | ● | ○ | ● |
| `cliente.mesclar` | ○ | ○ | ○ | ● |
| `cliente.inativar` | ○ | ● | ○ | ● |
| `contato.gerenciar` | ● | ● | ○ | ● |
| `proposta.ver` | ● | ● | ● | ● |
| `proposta.criar` | ● | ● | ○ | ● |
| `proposta.editar` | ● | ● | ○ | ● |
| `proposta.enviar` | ● | ● | ○ | ● |
| `proposta.revisar` | ● | ● | ○ | ● |
| `proposta.marcar_perdida` | ● | ● | ○ | ● |
| `proposta.reabrir` | ○ | ● | ○ | ● |
| `proposta.aceite.registrar` | ● | ● | ○ | ● |
| `preco.desconto.aplicar` | ● | ● | ○ | ● |
| `preco.custo.ver` | ○ | ● | ● | ● |
| `preco.margem.ver` | ● | ● | ● | ● |
| `alcada.solicitar` | ● | ● | ○ | ● |
| `alcada.aprovar` | ○ | ● | ○ | ● |
| `pedido.ver` | ● | ● | ● | ● |
| `pedido.cancelar` | ○ | ● | ○ | ● |
| `pedido.cobranca.ver` | ● | ● | ● | ● |
| `aditivo.ver` | ● | ● | ● | ● |
| `aditivo.precificar` | ● | ● | ○ | ● |
| `aditivo.enviar` | ● | ● | ○ | ● |
| `aditivo.gerar_os` | ● | ● | ○ | ● |
| `atividade.ver.propria` | ● | ● | ○ | ● |
| `atividade.ver.equipe` | ○ | ● | ○ | ● |
| `atividade.gerenciar` | ● | ● | ○ | ● |

● concedido por padrão ○ negado por padrão

Notas de fronteira, todas derivadas do RP:

- Financeiro tem **leitura** comercial (`proposta.ver`, `pedido.ver`, `aditivo.ver`) para auditoria, mas **nenhuma escrita comercial**. Isso atende ao cenário de teste "Financeiro acessa cobrança, mas não ganha edição comercial implícita" (plano, Fase 2).
- `preco.custo.ver` está negado para o Vendedor, conforme a recomendação de DV-05. Se o PO decidir o contrário, muda-se apenas esta linha.
- Nenhuma permissão de Vendas concede acesso ao módulo Financeiro. A sidebar continua controlada por `podeVerFinanceiro` em `frontend/src/app/(main)/layout.tsx`.
- `aditivo.gerar_os` concede o disparo, **não** o abono. O abono permanece sob a política de `FinanceiroPermissionsGuard`.

---

## 5. Compatibilidade com os guards existentes

O `InstalacaoGestaoPermissionsGuard` já aceita `VENDAS`, então a fila de ocorrências
é acessível hoje. O bloqueio real está em `FinanceiroPermissionsGuard`
(`ADMINISTRADOR`, `FINANCEIRO`), aplicado nos métodos de precificar, abonar e gerar
aditiva em `backend/src/instalacao/controllers/instalacao.controller.ts`
(linhas 261, 328, 375, 392, 409).

A Fase 9 **não deve trocar o guard por outro guard de função**. Deve introduzir a
checagem por permissão comercial via `VendasPermissionsService.assertPode(...)`
dentro do service, mantendo o guard financeiro apenas onde a ação é genuinamente
financeira (abono).

| Endpoint em `instalacao.controller.ts` | Guard hoje | Política proposta |
|---|---|---|
| `precificar` (261) | Financeiro | `vendas.aditivo.precificar` **ou** função financeira |
| `abonar` (328) | Financeiro | mantém-se financeiro |
| `gerar-os-aditiva` (375) | Financeiro | `vendas.aditivo.gerar_os` **ou** função financeira |
| `os-aditivas` (392) | Financeiro | `vendas.aditivo.ver` **ou** função financeira |
| `fila-precificacao` (409) | Financeiro | `vendas.aditivo.ver` **ou** função financeira |

---

## 6. Nomenclatura de eventos

Convenção: `vendas.<agregado>.<fato_no_passado>`, em minúsculas.

| Evento | Quando ocorre |
|---|---|
| `vendas.proposta.criada` | Orçamento criado com responsável comercial |
| `vendas.proposta.enviada` | Versão congelada e disponibilizada ao cliente |
| `vendas.proposta.visualizada` | Cliente abriu a proposta |
| `vendas.proposta.revisao_solicitada` | Cliente pediu alteração |
| `vendas.proposta.revisada` | Nova versão criada após negociação |
| `vendas.proposta.expirada` | Validade vencida sem aceite |
| `vendas.proposta.perdida` | Encerrada com motivo de perda |
| `vendas.proposta.reaberta` | Retomada após perda ou expiração |
| `vendas.proposta.aceita` | Aceite válido registrado com evidência |
| `vendas.pedido.confirmado` | Pedido comercial criado a partir do aceite |
| `vendas.pedido.cancelado` | Cancelamento pós-aceite |
| `vendas.alcada.solicitada` | Exceção de desconto/margem pedida |
| `vendas.alcada.decidida` | Exceção aprovada ou rejeitada |
| `vendas.carteira.transferida` | Responsável comercial alterado |
| `vendas.aditivo.precificado` | Preço ao cliente definido para ocorrência |
| `vendas.aditivo.aceito` | Cliente aceitou o aditivo |

Estes nomes devem ser usados como `tipo` em `HistoricoOrcamento` (conforme DV-15) e
como `tipo` em `notificacao`, substituindo as strings livres atuais.

---

## 7. Testes obrigatórios da matriz

Derivados do plano, Fase 2. Cada linha exige teste positivo **e** negativo:

1. Vendedor A não lê carteira privada do vendedor B sem `carteira.ver.equipe`.
2. Gestor lê a equipe autorizada, nunca outra loja.
3. Financeiro lê proposta e pedido, mas recebe 403 em `proposta.editar`.
4. Vendedor precifica aditivo, mas recebe 403 em abono.
5. Instalador não recebe nenhum campo de valor.
6. ID de cliente, orçamento ou ocorrência de outro tenant não produz efeito.
7. Esconder item de menu não substitui negação no service.
8. Usuário com `status != 'ATIVO'` ou `ativo = false` é negado mesmo com JWT válido.
9. `preco.custo.ver` negada não vaza custo em nenhum payload de resposta.
10. Perfil sem nenhuma permissão de Vendas não enumera recursos existentes.
