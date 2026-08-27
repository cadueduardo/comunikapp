# Prompt canônico — Reestruturação e implementação do módulo de Usuários

> **Como usar este documento:** peça ao agente para ler este arquivo integralmente
> e executar o trabalho nele descrito. Este documento define o objetivo e os
> critérios da entrega, mas não substitui a inspeção do código, do schema Prisma,
> dos testes e da documentação funcional vigente.

## Solicitação ao agente

Reestruture e implemente o módulo de **Usuários, Perfis e Permissões** do
ComunikApp. Trabalhe com base no estado real do repositório e execute a entrega
por fases pequenas e verificáveis. Não pare apenas no diagnóstico ou no plano:
depois de registrar o diagnóstico e o plano canônicos, avance na implementação,
salvo se encontrar uma decisão de produto realmente bloqueante ou uma ação que
exija autorização adicional.

Idioma de código voltado ao usuário, documentação, mensagens e respostas:
**português do Brasil, com acentuação correta**.

## Resultado obrigatório

Ao final da reestruturação:

1. a loja deverá possuir um CRUD completo e seguro de usuários;
2. administradores autorizados da loja deverão conseguir criar e administrar
   perfis, associá-los a usuários e revisar permissões;
3. **todos os módulos funcionais destinados aos usuários da loja deverão aparecer
   automaticamente no catálogo de perfis**;
4. todo módulo funcional deverá possuir ao menos uma permissão-base real de
   acesso, por exemplo `<modulo>.acessar`, aplicada no backend;
5. módulos que possuam autorização granular deverão acrescentar suas permissões
   reais ao mesmo catálogo;
6. nenhuma tela poderá conter lista hardcoded de módulos ou matriz CRUD genérica;
7. a inclusão de um módulo novo não poderá exigir alteração manual na tela de
   perfis nem em uma segunda lista central esquecível;
8. permissões ausentes, novas ou desconhecidas deverão negar acesso por padrão;
9. alterações de função, perfil, permissões, status ou senha deverão respeitar
   multi-tenancy, autorização, auditoria e revogação de sessão;
10. o comportamento deverá ser coberto por testes e por um gate de CI que impeça
    catálogo incompleto ou permissão sem registro.

## Regras permanentes e leituras obrigatórias

Antes de alterar qualquer arquivo:

1. leia integralmente o `AGENTS.md` da raiz e qualquer `AGENTS.md` local aplicável;
2. leia integralmente a documentação existente relacionada ao módulo, incluindo:
   - `docs/plano-acao-modulo-usuarios.md`;
   - `docs/modulo de usuarios.md`;
   - `docs/cadastro-loja-usuario.md`;
   - `docs/modulo-vendas/fase-0/03-nomenclatura-e-matriz-rbac.md`;
   - documentos de diagnóstico, plano e evidências RBAC de Vendas e Compras;
3. se houver qualquer mudança de schema, leia e siga integralmente
   `docs/database/boas-praticas-schema-prisma.md`;
4. localize documentação posterior ou mais específica que possa ter substituído
   os documentos acima;
5. trate documentação antiga, comentários e checkboxes como alegações a validar,
   não como prova de implementação.

Os documentos antigos do módulo contêm afirmações potencialmente contraditórias,
como itens simultaneamente planejados e declarados como concluídos. Reconcilie-os
com o código e os testes. Não preserve uma afirmação incorreta apenas porque já
está marcada com `[x]`.

## Git, isolamento e preservação do trabalho existente

### Contexto obrigatório desta entrega

No momento em que este documento foi criado:

- o desenvolvimento ativo está em `feat/modulo-vendas`;
- Vendas e suas alçadas ainda não foram concluídas nem integradas à `main`;
- o catálogo de permissões de Vendas necessário aos testes não existe na
  `main`;
- o módulo de Usuários precisa usar o estado atual de Vendas para validar perfis,
  permissões e alçadas;
- o working tree principal contém alterações locais de outros temas que não
  podem ser carregadas para a entrega de Usuários.

Confirme novamente esses fatos com comandos Git antes de agir. Se o estado tiver
mudado, preserve a intenção deste fluxo e registre a divergência. Não troque a
base para `main` apenas por conveniência enquanto o RBAC necessário de Vendas
continuar existindo somente em `feat/modulo-vendas`.

### Topologia obrigatória de branches

Esta entrega deverá usar uma **branch empilhada** sobre o último checkpoint
commitado e validado de Vendas:

```text
main
  └── feat/modulo-vendas
        └── codex/modulo-usuarios-rbac
```

A branch de Usuários deverá nascer de `feat/modulo-vendas`, não de `main`, para
herdar o catálogo, o enforcement e as alçadas ainda em desenvolvimento. Ao final,
Usuários deverá ser integrado de volta em `feat/modulo-vendas`. Somente a branch
combinada e posteriormente concluída de Vendas seguirá para `main`.

Não abra PR de `codex/modulo-usuarios-rbac` diretamente para `main`, pois isso
levaria junto todos os commits ainda não integrados de Vendas e quebraria a ordem
de dependência da entrega.

### Preflight obrigatório

Antes de criar branch ou worktree:

1. execute e registre `git branch --show-current`, `git status --short`, o HEAD
   local/remoto e os worktrees existentes;
2. identifique quais alterações locais pertencem a Vendas e quais são WIP de
   Arte, OS, Cloudflare ou outro tema;
3. garanta que o checkpoint de Vendas necessário para Usuários esteja commitado
   e disponível em `feat/modulo-vendas`;
4. não faça commit conjunto de arquivos de temas diferentes;
5. não faça stash global ou limpeza destrutiva para contornar o working tree;
6. preserve toda alteração local não relacionada;
7. se o checkpoint necessário ainda existir apenas como alteração não commitada
   misturada com outros temas, pare e solicite a separação/autorização adequada;
8. verifique se o caminho e o nome da nova branch ainda estão livres.

### Worktree separado obrigatório

Não use `git switch -c` no working tree atual se ele estiver sujo. Crie um
worktree separado a partir do HEAD commitado de `feat/modulo-vendas`, em caminho
validado e fora do diretório atual. Exemplo para Windows:

```powershell
git worktree add C:\Projects\comunikapp-usuarios `
  -b codex/modulo-usuarios-rbac `
  feat/modulo-vendas
```

O resultado esperado é:

```text
C:\Projects\comunikapp           → Vendas e WIP local já existente
C:\Projects\comunikapp-usuarios  → implementação isolada de Usuários
```

Antes de executar o comando, confirme que `C:\Projects\comunikapp-usuarios` é o
destino pretendido, não existe com conteúdo relevante e que a branch ainda não
existe. Não apague nem sobrescreva diretórios para liberar o caminho.

Este documento pode ainda estar não rastreado no working tree original quando o
novo worktree for criado. Nesse caso, leve somente
`docs/modulo-usuarios/PROMPT-REESTRUTURACAO-E-IMPLEMENTACAO.md` para o worktree de
Usuários por uma operação segura e verificável, preserve o original até confirmar
a cópia e faça o primeiro commit documental na branch de Usuários. Não carregue
junto os demais arquivos não commitados do working tree original.

### Desenvolvimento e sincronização com Vendas

Faça todos os commits de Usuários no worktree e na branch
`codex/modulo-usuarios-rbac`. Publique a branch sem alterar o histórico remoto:

```powershell
git push -u origin codex/modulo-usuarios-rbac
```

Se `feat/modulo-vendas` receber novos commits enquanto Usuários estiver em
desenvolvimento, sincronize antes de concluir:

```powershell
git switch codex/modulo-usuarios-rbac
git merge feat/modulo-vendas
```

Resolva conflitos no worktree de Usuários e execute novamente os testes de
Usuários, RBAC, Vendas e alçadas. Se a branch já estiver publicada ou for usada
por outra pessoa/agente, prefira merge a rebase para não reescrever o histórico.

### Retorno obrigatório para Vendas

Quando Usuários estiver implementado, revisado e validado, integre-o de volta na
branch de Vendas, preferencialmente por PR com esta direção:

```text
codex/modulo-usuarios-rbac → feat/modulo-vendas
```

Se a integração for local, primeiro garanta que o working tree de Vendas não
tenha alterações que conflitem com o merge e então use:

```powershell
git switch feat/modulo-vendas
git merge --no-ff codex/modulo-usuarios-rbac
```

Depois do merge, continue o desenvolvimento normalmente em
`feat/modulo-vendas`. Essa branch passará a conter Vendas, Usuários, catálogo,
perfis, integrações, migrations e testes de alçadas no mesmo histórico.

As migrations criadas em Usuários entram no histórico de Vendas pelo merge e não
devem ser recriadas, renomeadas nem copiadas manualmente. O Prisma controlará sua
aplicação pela tabela de migrations. Nunca edite migration já aplicada.

A integração final seguirá esta ordem:

```text
1. codex/modulo-usuarios-rbac → feat/modulo-vendas
2. concluir e validar Vendas com Usuários/RBAC
3. feat/modulo-vendas combinada → main
```

### Regras gerais de Git

- não use comandos destrutivos para limpar o repositório;
- não misture WIP de Arte, OS, Cloudflare ou outro tema;
- mantenha commits pequenos, coerentes e associados a uma fase/checklist;
- não faça force-push sem autorização explícita;
- não aplique migration da mesma entrega por caminhos paralelos;
- ao concluir, informe branches, base, merges realizados e estado dos worktrees.

## Princípios de domínio obrigatórios

### 1. Módulo, entitlement e permissão são conceitos diferentes

Não confunda:

- **módulo funcional:** capacidade do produto apresentada ao usuário da loja;
- **entitlement/ativação da loja:** módulo contratado ou habilitado para a loja;
- **navegação:** rotas e itens apresentados no frontend;
- **permissão do usuário:** autorização efetiva concedida por perfil;
- **função do usuário:** valor legado/canônico de `usuario_funcao` usado por
  partes do sistema;
- **perfil de acesso:** composição configurável de permissões.

Um item de menu não prova autorização. Um módulo ativado para a loja também não
autoriza automaticamente todos os usuários. A autorização efetiva deve exigir,
quando aplicável:

```text
identidade válida
+ loja ativa
+ módulo habilitado para a loja
+ conta e sessão válidas
+ permissão efetiva do usuário
+ escopo de tenant do recurso
```

### 2. Todos os módulos funcionais devem entrar no catálogo

Crie uma definição canônica, explícita e testável do que é um **módulo funcional
gerenciável por perfil**. O inventário inicial deve reconciliar, no mínimo:

- registros/manifestos de módulos do backend;
- módulos habilitáveis/marketplace e `loja_modulo`;
- registro de navegação do frontend;
- módulos funcionais existentes em `frontend/src/app/(main)`;
- módulos NestJS e controllers públicos relevantes;
- catálogos e serviços de permissão já existentes;
- módulos sem UI própria que ainda exponham operações a usuários da loja.

Não transforme todo módulo técnico do NestJS — Prisma, e-mail, cache, telemetria e
infraestrutura — em módulo de perfil. Documente critérios objetivos para incluir
ou excluir um módulo.

Todo módulo funcional incluído deverá possuir metadados canônicos, no mínimo:

```ts
type ModuloCatalogo = {
  chave: string;             // estável, minúscula e sem acento
  nome: string;              // rótulo pt-BR
  descricao: string;
  grupo: string;
  ordem: number;
  permissaoAcesso: string;   // exemplo: compras.acessar
  granularidade: 'MODULO' | 'GRANULAR';
  statusEnforcement: 'ENFORCED' | 'PARCIAL' | 'PENDENTE';
  permissoes: PermissaoCatalogo[];
};
```

O formato exato deve ser ajustado às convenções reais do projeto. Não adicione
campo ao banco apenas para reproduzir metadado estático que pode viver com
segurança no código.

### 3. Entrada automática de módulos novos

Implemente uma arquitetura em que cada módulo declare seu próprio manifesto de
catálogo junto ao domínio e um agregador de backend descubra/registre esses
manifestos. A UI deverá consumir somente a API agregada.

A solução deve garantir simultaneamente:

- uma única declaração por módulo;
- nenhuma lista de módulos duplicada no frontend;
- nenhuma matriz de ações genéricas inventada;
- nenhuma necessidade de editar a página de perfis quando surgir módulo novo;
- compatibilidade com build, testes e runtime reais do projeto;
- ordem e rótulos determinísticos;
- chaves estáveis e únicas;
- falha explícita para manifesto inválido ou duplicado;
- gate de CI que detecte módulo funcional sem manifesto;
- gate de CI que detecte manifesto órfão, salvo exceção documentada;
- gate de CI que detecte permissão usada no código mas ausente do catálogo;
- gate de CI que detecte permissão catalogada sem enforcement, classificando
  exceções temporárias de modo explícito.

Não considere “automático” um processo que ainda dependa de alguém lembrar de
editar manualmente um array central e depois editar a UI. Se as limitações do
bundler impedirem descoberta por arquivos em runtime, use registro automático no
container, geração em build ou outro mecanismo confiável, complementado pelo gate
de CI. Explique e teste a escolha.

### 4. Permissão-base de acesso por módulo

Todo módulo funcional gerenciável por perfil deve entrar no catálogo com uma
permissão-base real, preferencialmente no padrão:

```text
<modulo>.acessar
```

Essa permissão não pode ser apenas decorativa. Ela deve ser aplicada no backend
como porta de entrada do módulo ou em todas as operações relevantes por meio de
um mecanismo central confiável. Esconder o menu é apenas consequência de UX.

Quando o módulo possuir permissões granulares, a regra geral será:

```text
<modulo>.acessar + <modulo>.<recurso>.<acao>[.<escopo>]
```

O plano pode propor exceções quando uma permissão granular já implique acesso ao
módulo, desde que a semântica seja única, documentada e coberta por testes. Evite
dupla checagem contraditória ou consultas redundantes.

Para módulos ainda protegidos apenas por `usuario_funcao`, implemente uma migração
gradual e segura. Eles devem aparecer no catálogo desde o primeiro rollout, mas a
UI deve informar honestamente `enforcement parcial` enquanto a proteção granular
não estiver completa. Não exiba checkboxes CRUD fictícios.

### 5. Catálogo de permissões reais

O catálogo deverá ser a fonte canônica de metadados das permissões. Cada entrada
granular deve possuir, no mínimo:

```ts
type PermissaoCatalogo = {
  chave: string;       // dominio.recurso.acao[.escopo]
  nome: string;
  descricao: string;
  grupo: string;
  risco: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';
};
```

As chaves persistidas devem continuar compatíveis com o contrato real de
`perfil_permissao`, validando o parser de `modulo` + `acao`. Não altere schema por
conveniência antes de provar a necessidade.

Mapeie separadamente:

1. permissões declaradas em constantes/manifestos;
2. permissões efetivamente verificadas em controllers, guards e services;
3. strings de permissão usadas fora de catálogo;
4. permissões catalogadas e nunca aplicadas;
5. endpoints sensíveis sem autorização funcional;
6. módulos protegidos apenas por função;
7. módulos sem proteção além de autenticação;
8. autorização feita apenas no frontend.

Não assuma que uma constante existente é enforced. Cite evidência em
`arquivo:linha` no diagnóstico.

### 6. Estado de decisão de uma permissão

O modelo deve distinguir conceitualmente:

1. concedida;
2. explicitamente negada;
3. nova e ainda não revisada pelo administrador.

Em todos os casos de ausência ou dúvida, a autorização deve negar por padrão.
Não faça um seed de `permitido=false` que torne impossível diferenciar negação
deliberada de permissão nova não revisada. Avalie, com base no schema e no uso
real, se a ausência de linha representa `não revisada`, se é necessário metadado
de revisão/versão ou se outra solução aditiva é mais adequada.

Na UI, permissões novas não revisadas devem ser destacadas e nunca concedidas
automaticamente a perfis customizados.

### 7. Composição de permissões efetivas

Defina e centralize formalmente a regra de autorização para:

- múltiplos perfis por usuário;
- perfil ativo e inativo;
- usuário ativo, inativo, pendente ou bloqueado;
- `permitido=true`, `permitido=false` e ausência de decisão;
- função `ADMINISTRADOR`;
- perfis de sistema;
- perfis customizados;
- função legada versus perfil granular;
- módulo não contratado/inativo para a loja;
- permissão desconhecida;
- mudança de permissão durante sessão já autenticada.

Não use o nome textual de um perfil como prova de privilégio sem justificar a
compatibilidade e impedir falsificação por perfil customizado. O bypass
administrativo, se preservado, deve ser explícito, mínimo, testado e nunca remover
isolamento de tenant, auditoria ou regras de segregação de função.

## Escopo funcional

### A. Gestão de usuários

Audite e complete:

- listagem paginada, busca, filtros e ordenação;
- detalhe;
- criação com nome, e-mail, telefone, senha inicial ou fluxo canônico de convite;
- escolha segura de `usuario_funcao`;
- associação e desassociação de um ou mais perfis;
- edição de dados permitidos;
- inativação, reativação, bloqueio e desbloqueio conforme a máquina de estados
  real;
- redefinição e alteração de senha;
- revogação de sessões quando status, senha, função ou permissões exigirem;
- proteção contra desativar o próprio usuário quando isso deixar a loja sem
  administrador válido;
- proteção contra remover ou rebaixar o último administrador válido da loja;
- prevenção de autoelevação e mass assignment;
- auditoria sanitizada das mutações sensíveis.

Não presuma que `status`, `ativo`, bloqueio temporário, verificação de e-mail e
versão de sessão significam a mesma coisa. Mapeie a máquina de estados real e
unifique invariantes antes de ampliar enums ou criar colunas.

### B. Gestão de perfis

Implemente CRUD completo:

- listar, buscar, filtrar e paginar;
- criar;
- detalhar;
- editar nome e descrição;
- ativar/desativar;
- excluir quando permitido;
- impedir alteração indevida de perfil de sistema;
- associar/desassociar usuários;
- editar permissões a partir do catálogo da API;
- mostrar contagem e usuários associados;
- mostrar permissões novas não revisadas;
- mostrar nível de risco e pedir confirmação reforçada para grants críticos;
- impedir que o cliente defina `sistema=true` ou qualquer campo reservado;
- impedir associação entre lojas;
- proteger contra gravação concorrente e sobrescrita silenciosa.

Defina o comportamento de perfil inativo, perfil com usuários associados,
exclusão, renomeação e mudança de permissões. Mutações que atualizem perfil,
permissões e auditoria devem ser transacionais.

### C. Catálogo e API

Implemente uma API autenticada e autorizada de catálogo, por exemplo sob
`/usuarios/perfis/catalogo`, ajustando a rota às convenções e evitando conflito
com `/:id`.

O contrato deve retornar:

- todos os módulos funcionais canônicos;
- permissão-base de cada módulo;
- permissões granulares reais;
- metadados de apresentação;
- status de enforcement;
- versão/hash do catálogo, se útil;
- estado de decisão para o perfil consultado, sem misturar catálogo global com
  dados de outro tenant.

O frontend não deverá importar catálogos do backend nem duplicar chaves. Ele
consumirá o contrato HTTP tipado.

### D. Seed e sincronização

Implemente sincronização idempotente quando necessária:

- perfis de sistema podem receber defaults versionados e revisados;
- perfis customizados nunca ganham grant novo automaticamente;
- concessões existentes não podem desaparecer por engano;
- permissões removidas ou renomeadas exigem estratégia explícita de depreciação;
- seed repetido não pode duplicar registros nem alterar decisão customizada;
- catálogo deve aparecer pela fonte canônica mesmo antes de existir linha de
  decisão para cada perfil;
- nunca use seed como substituto do enforcement no backend.

O seed não deve inventar permissões granulares para módulos que ainda não as
aplicam. Para esses módulos, use apenas a permissão-base real e o status honesto
de rollout.

### E. Frontend e experiência

Remova a lista hardcoded existente na criação de perfil e qualquer matriz do tipo
`módulos × ações CRUD genéricas`.

As listagens de usuários e perfis devem seguir integralmente o template CRUD do
`AGENTS.md`:

- tabela/grid como padrão no desktop;
- alternância para cards no desktop;
- cards obrigatórios no mobile, sem toggle;
- `DataTable` e `columns.tsx` no desktop;
- componente reutilizável de card em `frontend/src/components`;
- mesmas ações, permissões e confirmações em tabela e cards;
- estados de carregamento, vazio, erro e sucesso;
- `ConfirmDialog` ou diálogo dedicado para ações sensíveis;
- dark/light mode;
- sem CSS inline;
- acessibilidade, labels, foco e teclado;
- paginação coerente com a API.

A matriz de perfil deve:

- ser gerada integralmente pelo catálogo da API;
- agrupar por módulo e por recurso;
- permitir busca e expansão/recolhimento;
- explicar dependências entre acesso ao módulo e permissão granular;
- diferenciar concedida, negada e não revisada;
- destacar permissões de alto risco;
- não renderizar ação inexistente;
- mostrar módulo com enforcement pendente sem oferecer controle enganoso;
- manter estado de formulário e erros sem perder alterações silenciosamente.

## Segurança obrigatória

Faça triagem dos achados como **Crítico, Alto, Médio ou Baixo**. Antes do CRUD,
corrija vulnerabilidades exploráveis de autorização.

No mínimo, audite e trate:

- controllers de usuários e perfis protegidos apenas por autenticação;
- leitura da lista/detalhe de usuários por não administradores;
- criação, edição, exclusão e associação de perfis por usuário comum;
- `sistema`, `loja_id`, função, status e permissões enviados pelo cliente;
- DTOs definidos como interfaces ou bodies inline sem `class-validator`;
- uso de `any` para contornar validação;
- update/delete por ID sem tenant na mesma decisão de autorização;
- IDOR entre duas lojas;
- autoatribuição de perfil privilegiado;
- promoção do próprio usuário;
- remoção do último administrador;
- enumeração de conta em endpoints públicos;
- rate limit apenas em memória em ambiente distribuído;
- tokens, códigos, senha e segredo em resposta, log ou auditoria;
- replay de convite/reset e mutações duplicadas;
- sessões ainda válidas após inativação, bloqueio ou mudança crítica;
- ausência de auditoria em mudança de perfil/permissão;
- transações incompletas em substituição de permissões.

Toda consulta pertencente a loja deve usar `loja_id` derivado da identidade
autenticada. Nunca aceite `loja_id`, slug, hostname, função ou permissão enviados
pelo cliente como prova de autorização.

## Contratos e concorrência

Para cada mutação sensível, documente e implemente:

- ator autorizado;
- DTO tipado e whitelist de campos;
- invariantes;
- filtro de tenant;
- transação;
- idempotência quando repetição puder causar efeito duplicado;
- proteção de concorrência;
- auditoria antes/depois sanitizada;
- revogação/invalidação de sessão quando aplicável;
- código HTTP e erro público estável em português;
- testes positivo, negativo, cross-tenant e replay.

Evite substituir permissões por `deleteMany` seguido de `createMany` fora de
transação. Avalie versão otimista ou equivalente para impedir que dois
administradores sobrescrevam alterações sem perceber.

## Fases obrigatórias

Antes de implementar, ajuste a divisão conforme o código real, mas preserve esta
ordem de dependência.

### Fase 0 — Diagnóstico executável, documentação e contenção

- [x] Mapear telas, rotas, DTOs, services, guards, schema, seeds e testes.
- [x] Inventariar módulos funcionais atuais e justificar inclusões/exclusões.
- [x] Criar matriz módulo × ativação × navegação × autorização.
- [x] Criar matriz endpoint/operação × permissão efetivamente enforced.
- [x] Classificar vulnerabilidades e corrigir primeiro as críticas/altas.
- [x] Reconciliar documentação antiga com evidências `arquivo:linha`.
- [x] Criar diagnóstico e plano canônicos dentro de `docs/modulo-usuarios/`.
- [x] Definir MVP, rollout e compatibilidade com funções legadas.

### Fase 1 — Contratos canônicos e catálogo automático

- [x] Definir tipos de módulo e permissão.
- [x] Implementar manifesto pertencente a cada módulo.
- [x] Implementar descoberta/agregação sem lista duplicada na UI.
- [x] Incluir todos os módulos funcionais no catálogo.
- [x] Criar permissão-base real por módulo.
- [x] Agregar Vendas e Compras sem alterar chaves canônicas.
- [x] Implementar validações de duplicidade, formato e metadados.
- [x] Implementar API tipada do catálogo.
- [x] Implementar testes e gate de CI.

### Fase 2 — Núcleo de autorização e persistência

- [x] Definir algoritmo único de permissão efetiva.
- [x] Implementar deny-by-default.
- [x] Tratar múltiplos perfis e perfis inativos.
- [x] Definir compatibilidade temporária com `usuario_funcao`.
- [x] Implementar sincronização idempotente de perfis de sistema.
- [x] Preservar decisões de perfis customizados.
- [x] Diferenciar grant, deny explícito e não revisada.
- [x] Tornar mudanças sensíveis transacionais e auditadas.
- [x] Revogar/inutilizar sessões quando necessário.

### Fase 3 — CRUD de perfis completo

- [x] Backend seguro, DTOs, paginação e auditoria.
- [x] Listagem desktop/mobile conforme template obrigatório.
- [x] Criação e edição dirigidas pela API de catálogo.
- [x] Associação/desassociação segura de usuários.
- [x] Confirmação reforçada para permissões críticas.
- [x] Proteção de perfil de sistema e último administrador.
- [x] Estados completos de UX e acessibilidade.

### Fase 4 — CRUD de usuários completo

- [x] Remover função `ADMINISTRADOR` hardcoded na criação.
- [x] Implementar seleção segura de função e perfis.
- [x] Completar listagem, detalhe, criação, edição e ciclo de vida.
- [x] Unificar regras de senha/convite com os fluxos canônicos existentes.
- [x] Implementar reativação e revogação de sessão.
- [x] Aplicar template CRUD em desktop e mobile.
- [x] Cobrir estados, confirmações e acessibilidade.

### Fase 5 — Rollout de todos os módulos

- [x] Aplicar a permissão-base em cada módulo funcional atual.
- [x] Migrar gradualmente guards por função para o núcleo canônico.
- [x] Preservar regras de domínio e escopo mais restritivas.
- [x] Marcar claramente módulos com enforcement parcial.
- [x] Validar menu, API e acesso direto por URL.
- [x] Testar usuário sem perfil, perfil sem grants e permissão desconhecida.
- [x] Testar isolamento com ao menos duas lojas.

### Fase 6 — Consolidação e remoção do legado enganoso

- [x] Remover listas hardcoded e caminhos de autorização inertes.
- [x] Remover ou deprecar catálogos duplicados somente após migrar consumidores.
- [x] Atualizar OpenAPI e documentação operacional.
- [x] Atualizar checkboxes no mesmo commit da respectiva implementação.
- [x] Registrar dívidas remanescentes com risco, proprietário e condição de saída.
- [ ] Executar validação final completa.

## Entregáveis documentais

Crie ou atualize dentro de `docs/modulo-usuarios/`:

1. `DIAGNOSTICO-ESTADO-REAL.md`;
2. `PLANO-DE-ACAO.md`;
3. `CATALOGO-MODULOS-E-PERMISSOES.md`;
4. `MATRIZ-ENDPOINT-PERMISSAO.md`;
5. `MODELO-AUTORIZACAO-EFETIVA.md`;
6. `EVIDENCIAS-DE-VALIDACAO.md`.

O diagnóstico deve usar tabela com:

| Área | Evidência | Estado real | Severidade | Gap | Fase |
|---|---|---|---|---|---|

Cada afirmação relevante deve apontar para `arquivo:linha`. Diferencie claramente
**fato verificado**, **inferência**, **proposta** e **decisão de produto pendente**.

## Testes obrigatórios

Descubra os comandos reais nos `package.json` e na configuração do repositório.
Não invente scripts. Cubra, no mínimo:

1. usuário comum não administra usuários nem perfis;
2. administrador de uma loja não lê nem altera dados de outra;
3. cliente não consegue definir `sistema`, `loja_id` ou campos reservados;
4. usuário não promove a si próprio;
5. último administrador válido não pode ser removido/rebaixado;
6. perfil inativo não concede permissão;
7. usuário inativo/bloqueado é negado com sessão já emitida;
8. múltiplos perfis seguem exatamente a regra documentada;
9. permissão ausente, desconhecida ou não revisada é negada;
10. todo módulo funcional aparece no catálogo;
11. módulo novo com manifesto aparece na API/UI sem editar a tela de perfis;
12. módulo funcional sem manifesto faz o gate de CI falhar;
13. chave usada no enforcement e ausente no catálogo faz o gate falhar;
14. chave duplicada faz build/teste falhar;
15. perfil customizado não recebe grant novo após sincronização;
16. seed/sincronização repetidos são idempotentes;
17. alteração concorrente não sobrescreve silenciosamente;
18. permissão-base bloqueia acesso direto à API, não apenas o menu;
19. entitlement ausente da loja continua negando mesmo com perfil concedido;
20. alteração crítica revoga ou invalida a sessão conforme contrato;
21. listagens paginam sem vazamento entre tenants;
22. auditoria não contém senha, token, código ou segredo.

## Critérios de aceite finais

A entrega só estará pronta quando:

- [x] todos os módulos funcionais atuais estiverem no catálogo canônico;
- [x] cada módulo possuir permissão-base real e enforced ou exceção temporária
      explícita, visível e documentada;
- [x] adicionar um módulo com seu manifesto o fizer aparecer na API e na UI sem
      editar a página de perfis;
- [x] CI impedir módulo funcional sem manifesto e permissão sem catálogo;
- [x] Vendas e Compras usarem suas chaves existentes sem regressão;
- [x] não existir matriz hardcoded de módulos × CRUD no frontend;
- [x] a UI não oferecer permissão que o backend não aplica;
- [x] perfil customizado nunca receber grant automático novo;
- [x] ausência de decisão negar acesso;
- [x] múltiplos perfis terem semântica única e testada;
- [x] nenhum usuário de loja administrar perfis sem autorização explícita;
- [x] nenhuma consulta por recurso de tenant confiar apenas no ID;
- [x] mudanças sensíveis serem tipadas, transacionais, auditadas e seguras contra
      repetição;
- [x] status, bloqueio, ativação e revogação de sessão estarem coerentes;
- [x] CRUDs seguirem o padrão visual obrigatório em desktop e mobile;
- [x] documentação antiga estar reconciliada, sem conclusão falsa;
- [ ] testes proporcionais, validação Prisma quando aplicável, typecheck, build e
      `git diff --check` passarem;
- [x] não houver secrets, dados mockados, CSS inline ou alterações não
      relacionadas na entrega.

## Fora de escopo sem evidência ou aprovação

- não criar permissões CRUD fictícias apenas para preencher a tela;
- não tratar menu como mecanismo de segurança;
- não substituir entitlement/marketplace por perfil de usuário;
- não migrar a área administrativa da plataforma para JWT de usuário de loja;
- não criar permissões customizadas diretamente por usuário nesta entrega, salvo
  requisito já aprovado e documentado;
- não alterar regras de alçada comercial ou financeira que pertençam a outro
  domínio;
- não ampliar enums/status sem consolidar a fonte de verdade;
- não criar tabelas especulativas;
- não fazer refactor expansivo de módulos sem relação com autorização;
- não marcar fases de outros módulos como concluídas.

## Forma de trabalho e comunicação

1. Comece apresentando um resumo curto do estado real encontrado, os riscos
   críticos e a ordem das fases.
2. Registre o diagnóstico e o plano canônicos antes de grandes mudanças.
3. Implemente uma fase por vez e atualize seus checkboxes no mesmo commit.
4. Ao encontrar divergência entre este documento e código/documentação canônica
   mais recente, priorize a evidência real, registre a divergência e preserve os
   objetivos de segurança e catálogo automático.
5. Não peça confirmação para decisões técnicas reversíveis e já delimitadas.
6. Pare e peça orientação somente quando uma escolha de produto mudar
   materialmente permissões concedidas, compatibilidade ou escopo autorizado.
7. Ao final de cada fase, informe arquivos alterados, testes executados, riscos
   remanescentes e próximo passo.

## Instrução curta para iniciar em outro chat

Use a seguinte mensagem:

> Leia integralmente `docs/modulo-usuarios/PROMPT-REESTRUTURACAO-E-IMPLEMENTACAO.md`
> e todos os documentos obrigatórios que ele referencia. Em seguida, execute a
> reestruturação do módulo de Usuários por fases, começando pelo diagnóstico do
> estado real e pela contenção dos riscos críticos. Siga o `AGENTS.md`, preserve
> alterações não relacionadas e não pare apenas no plano. Use obrigatoriamente
> uma branch/worktree de Usuários empilhada sobre o último checkpoint commitado de
> `feat/modulo-vendas`; ao concluir, integre Usuários de volta em
> `feat/modulo-vendas`, nunca diretamente em `main`.
