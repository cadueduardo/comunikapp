# Plano de ação — Home por perfil

**Branch:** `feat/modulo-vendas`

**Ambiente de teste:** UAT (`uat.comunikapp.com.br`). Produção não entra neste pacote.

**Marcar o checkbox no mesmo commit da implementação.**

## Decisões travadas

- Recorte por porta de módulo (`.acessar`), não por `usuario_funcao` no front.
- Cache da Home deixa de ser só `loja_id`; inclui o usuário.
- Sem tabela nova: favoritos em `usuario.preferencias` (JSON já existente).
- Achatamento: se o perfil vê **um** módulo funcional, as seções sobem à
  sidebar (exceto “Visão geral”). Se o módulo tem **1 a 4** seções além da
  home, também achata — mesmo com outros módulos. Admin (muitos módulos e
  muitas seções) permanece com hub + submenu.
- Quando a seção já está na sidebar, submenu interno e bottom nav daquele
  módulo somem.
- Teto de **6** favoritos. Ids `modulo:item` do `module-nav`.
- Login permanece em `/dashboard`.

## Fase 1 — Dashboard por permissão

### Backend

- [x] `HomeVisibilidade` (mapa alerta/KPI/coluna → módulo) + testes.
- [x] `HomeOperacionalController` usa identidade autenticada e
      `PermissaoEfetivaService.listarAcessoModulos`.
- [x] KPI, alertas, fluxo e resumo financeiro **não calculam** o que o
      perfil não pode ver; cache `prefixo:lojaId:usuarioId`.
- [x] Onboarding GET devolve payload vazio/`habilitado: false` sem
      `configuracoes.acessar`; PATCH/POST respondem 403.
- [x] Banner de implantação (config incompleta, chapa sem tamanho) só com
      `configuracoes.acessar`.

### Frontend

- [x] Resumo financeiro usa `financeiro.acessar` (não mais o proxy da
      função ADMINISTRADOR/FINANCEIRO).
- [x] Onboarding, fluxo e KPIs somem quando a API não traz bloco.
- [x] Estado vazio honesto se o perfil não tiver nenhum card.

### Mapa de blocos

| Bloco | Módulo |
|---|---|
| KPI orçamentos / total orçado | `vendas` |
| KPI OS em produção | `os` ou `pcp` |
| KPI alertas críticos | só origens permitidas |
| Alertas `orcamentos` | `vendas` |
| Alertas `os` | `os` |
| Alertas `pcp` | `pcp` |
| Alertas `estoque` | `estoque` |
| Alertas `financeiro` | `financeiro` |
| Fluxo orçamentos / aprovados | `vendas` |
| Fluxo revisão técnica / prontos | `os` |
| Fluxo produção | `pcp` |
| Fluxo a receber / concluídos | `financeiro` |
| Resumo financeiro | `financeiro` |
| Onboarding + aplicar defaults | `configuracoes` |

## Fase 2 — Menu achatado

- [x] Função pura: dado o acesso e o `module-nav`, decidir o que sobe à
      sidebar.
- [x] `AppSidebar` renderiza seções achatadas no lugar do item do módulo.
- [x] `ModuleLayoutShell` / submenu / bottom nav ocultos no módulo achatado.
- [x] Teste: perfil só Vendas explode seções; admin não.

## Fase 3 — Favoritos

- [x] DTO `favoritos: string[]` em `/usuarios/me/preferencias` (máx. 6,
      ids `modulo:item`, só módulos com `.acessar`).
- [x] Estrela nos cards do hub do módulo.
- [x] Lista no topo da sidebar (fora da ordenação dos módulos).
- [x] Cards na Home a partir dos favoritos permitidos.
- [x] Favorito sem permissão some da UI (não quebra o GET).

## Fora de escopo

- [ ] ~~Página inicial custom~~ (explícito).
- [ ] ~~Recentes / favoritar registro~~.
- [ ] ~~Dashboard arrastável~~.

## Validação

- [x] Jest das regras de visibilidade, achatamento e preferências.
- [x] `git diff --check` nos arquivos da entrega.
- [x] Deploy só UAT (PM2 `comunikapp-uat-*`); produção intocada.
- [x] `ModuleHeader` não quebra sem `nav` (Aditivos/Pedidos no menu achatado).
- [ ] Conferir no UAT com usuário limitado + admin.
