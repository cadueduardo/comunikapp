# 07 — Permissões e Visibilidade da Home

**Status do documento:** proposto

## Princípio

A Home respeita o perfil do usuário. O que ele não pode ver, **não aparece** — não vem como bloco desabilitado, vem ausente. Isso reduz fricção visual e respeita o princípio de **menor privilégio**.

## Estado atual

- `perfil_acesso` e `perfil_permissao` (modelo `modulo` + `acao` + `permitido`) já existem.
- `usuario_perfil` faz a junção.
- `usuario.funcao` (enum `usuario_funcao`) é uma classificação ampla; permissões reais vivem em `perfil_permissao`.

Não vamos criar novo modelo. Apenas adicionar novas combinações `modulo` + `acao` para os blocos sensíveis da Home.

## Catálogo de permissões da Home

| modulo | acao | descrição |
| --- | --- | --- |
| `home-operacional` | `ver_resumo_financeiro` | Pode ver o bloco "Resumo financeiro simples" |
| `home-operacional` | `ver_alertas_financeiros` | Pode ver alertas de cobrança e saldo |
| `home-operacional` | `aplicar_configuracao_recomendada` | Pode disparar a ação automática de defaults |
| `home-operacional` | `usar_simulador_precificacao` | Pode abrir o simulador de precificação |
| `financeiro` | `ver_auditoria_recebimentos` | Pode abrir a tela de auditoria de recebimentos |
| `financeiro` | `registrar_recebimento` | Pode marcar entrada/saldo como pago |
| `financeiro` | `forcar_recebimento_total` | Pode usar a ação de força bruta (com auditoria) |
| `orcamentos-v2` | `aprovar_internamente` | Pode aprovar orçamento sem passar pelo link público |
| `os` | `aprovar_tecnicamente` | Pode aprovar revisão técnica de OS |
| `os` | `liberar_para_pcp` | Pode liberar item de OS para PCP |

## Perfis defaults sugeridos

Quando uma loja é criada, criar automaticamente estes perfis (todos com `sistema = true`, não removíveis):

### Administrador

Acesso a **tudo**, inclusive impressão financeira e ações sensíveis.

### Gestor

- `home-operacional.ver_resumo_financeiro`
- `home-operacional.ver_alertas_financeiros`
- `home-operacional.aplicar_configuracao_recomendada`
- `home-operacional.usar_simulador_precificacao`
- `financeiro.ver_auditoria_recebimentos`
- `financeiro.registrar_recebimento`
- `orcamentos-v2.aprovar_internamente`
- `os.aprovar_tecnicamente`
- `os.liberar_para_pcp`
- Não pode `financeiro.forcar_recebimento_total`.

### Comercial

- `orcamentos-v2.*` (criar, editar, enviar, aprovar internamente).
- `home-operacional.usar_simulador_precificacao`.
- **Não** vê resumo financeiro nem auditoria.

### Operador (PCP/Produção)

- `pcp.*`.
- `os.liberar_para_pcp` (se for líder).
- **Não** vê resumo financeiro nem auditoria.
- Vê alertas operacionais (estoque baixo, material insuficiente, OS aguardando revisão).

### Financeiro

- `financeiro.*`.
- `home-operacional.ver_resumo_financeiro`.
- `home-operacional.ver_alertas_financeiros`.
- **Não** edita orçamento ou OS.

## Regras de visibilidade na Home

| bloco | permissão necessária | comportamento sem permissão |
| --- | --- | --- |
| Banner de estado | nenhuma | sempre visível (mensagens já são filtradas por contexto) |
| Onboarding checklist | nenhuma | sempre visível |
| Atalho "Aplicar configuração recomendada" | `home-operacional.aplicar_configuracao_recomendada` | botão escondido |
| Fluxo de trabalho | nenhuma para visualizar | ações específicas em cada card respeitam permissão própria |
| Alertas operacionais | nenhuma para a lista geral | alertas de origem `financeiro` exigem `home-operacional.ver_alertas_financeiros` |
| Resumo financeiro simples | `home-operacional.ver_resumo_financeiro` | bloco inteiro escondido |
| Simulador de precificação (atalho) | `home-operacional.usar_simulador_precificacao` | atalho escondido |

## Backend — onde aplicar

- O agregador da Home (`HomeOperacionalService`) recebe o `usuario_id` e consulta as permissões antes de montar a resposta.
- Os blocos sem permissão **não vêm na resposta**, em vez de virem `null`. Isso evita o front renderizar caixa vazia.
- O campo `data.resumo_financeiro.habilitado: false` é exceção para o front saber **explicitamente** que existe o bloco mas o usuário não tem acesso (assim podemos exibir mensagem educativa de "fale com o administrador" se julgarmos útil — decisão Fase 4).

## Frontend — como aplicar

- Criar hook `usePermissaoHome()` que retorna um mapa `{ "home-operacional.ver_resumo_financeiro": true, ... }`.
- Cada componente da Home checa a permissão antes de renderizar.
- Permissões vêm via `GET /usuarios/me/permissoes` (endpoint a verificar/criar).

## Auditoria

- Toda ação sensível (aplicar configuração recomendada, aprovar internamente, forçar recebimento) gera log em `OrcamentoLog`, `OrdemServicoLog` ou tabela equivalente do financeiro.
- O log inclui `usuario_id`, `ip_origem`, `user_agent`, `dados_extras` com o estado anterior e novo.

## Pontos de confirmação

1. Nomes dos perfis defaults (`Administrador`, `Gestor`, `Comercial`, `Operador`, `Financeiro`) estão alinhados com o que você quer apresentar ao cliente?
2. O perfil **Comercial** pode aprovar orçamento internamente sem passar pelo link público? Recomendação inicial: sim, com auditoria.
3. O perfil **Operador** vê o bloco de fluxo de trabalho completo (com colunas comercial, aprovado, etc.)? Recomendação inicial: sim, em modo leitura.
