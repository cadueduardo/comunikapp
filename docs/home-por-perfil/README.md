# Home por perfil, menu achatado e favoritos

A Home operacional (`/dashboard`) deixou de ser um painel único da loja. Ela
passa a ser uma **mesa de trabalho composta**: só entram blocos, alertas e
atalhos que o perfil pode ver. O menu deixa de exigir um hub quando o perfil
é estreito. Atalhos frequentes viram **favoritos** da pessoa.

## Por que existe

Um usuário só de Vendas via o mesmo dashboard do administrador: estoque
baixo, linha de produção, onboarding da loja. O menu pedia dois cliques
(módulo → seção) para chegar em Clientes. Não havia como fixar o destino
do dia a dia.

Isso quebrava menor privilégio (a API devolvia o dado da loja inteira) e
aumentava fricção.

## Princípios

1. **O que não pode ver, não aparece** — nem cinza, nem número zerado de
   outro módulo.
2. **A API omite o bloco.** Esconder só no React não basta.
3. **Uma Home, widgets com direito** — não criamos um dashboard por cargo.
4. **Onboarding é implantação da loja** — só quem tem `configuracoes.acessar`.
5. **Favorito é área** (Clientes, Orçamentos), não um registro.
6. **Login continua no dashboard.** Favorito não troca a página inicial.

## Fases

| Fase | Entrega |
|---|---|
| 1 | Dashboard e endpoints da Home filtrados por `<modulo>.acessar` |
| 2 | Seções do módulo na sidebar quando o perfil é estreito |
| 3 | Favoritos persistidos na conta, visíveis na sidebar e na Home |

Detalhe e checklist: [`PLANO-DE-ACAO.md`](./PLANO-DE-ACAO.md).

## Fora deste pacote

- Página “ao entrar, ir para…”.
- Recentes / favoritar um cliente ou orçamento.
- Dashboard arrastável estilo BI.
- Um dashboard distinto por cargo.

## Como validar no UAT

1. Perfil só de Vendas: Home sem estoque, PCP, onboarding; cards de Vendas.
2. URL `/insumos` continua negada (gate já existente).
3. Sidebar do vendedor mostra seções (Clientes, Orçamentos…) sem o hub.
4. Estrelar no **header** da página (ex.: Orçamentos, OS): aparece abaixo do
   Dashboard no menu e na Home após recarregar.
5. Admin: Home completa; módulos continuam como item + hub (sidebar curta).
6. Relogar o usuário limitado depois do deploy.
7. Console do perfil só de Vendas: sem `403` em `/api/instalacao/configuracao`.
