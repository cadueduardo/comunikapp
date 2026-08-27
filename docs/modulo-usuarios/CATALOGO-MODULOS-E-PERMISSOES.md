# Catálogo de módulos e permissões

**Fonte canônica de metadados:** código em `backend/src/**/*.catalogo.ts`, agregado por `backend/src/rbac/catalogo/agregador.ts`.
Este documento descreve o inventário e as regras; a UI **não** deve copiar esta lista.

## Critérios

Incluir módulo funcional gerenciável por perfil se o usuário da loja opera a capacidade, há API ou rota `(main)`, e a negação não quebra login/tenant. Excluir infra Nest, admin SaaS e motores internos. Ver `DIAGNOSTICO-ESTADO-REAL.md`.

## Metadados obrigatórios

```ts
type ModuloCatalogo = {
  chave: string;
  nome: string;
  descricao: string;
  grupo: string;
  ordem: number;
  permissaoAcesso: string; // <chave>.acessar
  granularidade: 'MODULO' | 'GRANULAR';
  statusEnforcement: 'ENFORCED' | 'PARCIAL' | 'PENDENTE';
  prefixosApi: string[];
  rotasFrontend: string[];
  permissoes: PermissaoCatalogo[];
};
```

`permissoes` sempre contém a permissão-base. Granulares só existem se o backend as aplica (Vendas, Compras, e as de gestão de usuários desta entrega).

## Inventário inicial

| chave | nome | grupo | granularidade | enforcement | permissão-base | prefixos API |
|---|---|---|---|---|---|---|
| dashboard | Painel | operacao | MODULO | PARCIAL | dashboard.acessar | `/dashboard`, `/home-operacional` |
| vendas | Vendas | comercial | GRANULAR | ENFORCED | vendas.acessar | `/vendas`, `/orcamentos-v2`, `/clientes` |
| compras | Compras | comercial | GRANULAR | ENFORCED | compras.acessar | `/compras` |
| estoque | Estoque | operacao | MODULO | PARCIAL | estoque.acessar | `/estoque` |
| os | Ordens de serviço | producao | MODULO | PARCIAL | os.acessar | `/os` |
| pcp | PCP | producao | MODULO | PARCIAL | pcp.acessar | `/pcp` |
| financeiro | Financeiro | financeiro | MODULO | PARCIAL | financeiro.acessar | `/financeiro` |
| expedicao | Expedição | producao | MODULO | PARCIAL | expedicao.acessar | `/expedicao` |
| instalacao | Instalação | producao | MODULO | PARCIAL | instalacao.acessar | `/instalacao`, `/instalador` |
| arte | Arte e aprovação | producao | MODULO | PARCIAL | arte.acessar | `/arte-aprovacao` (API Nest) |
| catalogo | Catálogo | cadastros | MODULO | PARCIAL | catalogo.acessar | `/catalogo`, `/produtos-finitos` |
| modelos | Modelos de orçamento | cadastros | MODULO | PARCIAL | modelos.acessar | `/produtos` |
| insumos | Insumos | cadastros | MODULO | PARCIAL | insumos.acessar | `/insumos` |
| fornecedores | Fornecedores | cadastros | MODULO | PARCIAL | fornecedores.acessar | `/fornecedores` |
| centros-trabalho | Centros de trabalho | cadastros | MODULO | PARCIAL | centros-trabalho.acessar | `/funcoes`, `/maquinas`, `/servicos-manuais`, `/custos-indiretos` |
| configuracoes | Configurações | administracao | MODULO | PARCIAL | configuracoes.acessar | `/configuracoes`, `/lojas`, `/categorias`, `/tipos-material`, `/conexoes` |
| usuarios | Usuários e perfis | administracao | GRANULAR | ENFORCED | usuarios.acessar | `/usuarios` (exceto self-service) |

## Permissões granulares já existentes (não renomear)

### Vendas

Chaves em `backend/src/vendas/permissions/vendas-permissoes.ts`. Acrescentar apenas `vendas.acessar`. Demais 32 chaves permanecem.

Parser persistido: primeiro segmento = `modulo`, resto = `acao` (`vendas.proposta.ver` → `modulo=vendas`, `acao=proposta.ver`).

### Compras

Chaves em `COMPRAS_PERMISSOES`. Acrescentar apenas `compras.acessar`.

### Usuários (novas, aplicadas nesta entrega)

| chave | risco | significado |
|---|---|---|
| usuarios.acessar | MEDIO | Abrir o módulo |
| usuarios.usuarios.gerenciar | ALTO | CRUD e ciclo de vida de usuários |
| usuarios.perfis.gerenciar | CRITICO | CRUD de perfis e grants |

## Piso temporário de `.acessar` (compatibilidade)

Não concede granulares novas. Só evita lockout na virada do guard:

- **Todas as cinco funções:** dashboard, arte, catalogo, modelos, insumos, fornecedores, centros-trabalho, configuracoes, compras (hub; granulares continuam deny-by-default).
- **ADMINISTRADOR + VENDAS + FINANCEIRO:** vendas.acessar (além do piso F7 já existente).
- **ADMINISTRADOR + FINANCEIRO:** financeiro.acessar.
- **ADMINISTRADOR + FINANCEIRO + ESTOQUE + PRODUCAO:** estoque.acessar (PRODUCAO já é mapeado no tenant isolation).
- **ADMINISTRADOR + PRODUCAO + ESTOQUE:** expedicao.acessar.
- **ADMINISTRADOR + FINANCEIRO + VENDAS:** instalacao.acessar (superfície de gestão; campo continua com guard próprio mais restrito).
- **Todas (menu OS/PCP hoje visível):** os.acessar, pcp.acessar — operações restritas pelos guards de função existentes.
- **Só ADMINISTRADOR:** usuarios.acessar e granulares de gestão.

Deny explícito em perfil ativo **vence** o piso.

## Exclusões documentadas (manifesto órfão permitido)

Nenhuma nesta entrega. Legado de navegação `orcamentos` / `clientes` / `modelos` no registry do frontend: `orcamentos` e `clientes` não geram manifesto próprio (casa canônica = `vendas`). `modelos` tem manifesto próprio porque a rota `/produtos` é capacidade distinta do catálogo de SKUs.

## Gate de CI

O gate falha se:

1. chave do inventário obrigatório sem manifesto;
2. manifesto cuja chave não está no inventário (órfão);
3. duas chaves de permissão iguais;
4. string de permissão usada em `assertPode` / `@RequerPermissao*` / `@RequerPermissaoVendas` / `COMPRAS_PERMISSOES` ausente do catálogo.
