# Gate 0S — Observabilidade e revisão de logs de produção

**Documento:** anexo do [`09-gate-hotfix-seguranca.md`](./09-gate-hotfix-seguranca.md), HS-04 e HS-06
**Status:** análise concluída; execução bloqueada por acesso externo e por decisão de infraestrutura
**Data:** 2026-07-31

Este documento existe porque duas afirmações do HS-06 precisavam de escrutínio
antes de serem aceitas: que os eventos estruturados são "agregáveis" e que a
varredura de logs históricos "só depende de acesso". A primeira era imprecisa; a
segunda precisava de procedimento antes de virar tarefa.

---

## 1. Reauditoria do substrato de eventos

O módulo é `backend/src/common/security/eventos-seguranca.ts`. O contrato que
ele cumpre de fato:

| Exigência do HS-06 | Situação | Evidência |
|---|---|---|
| Prefixo estável e campos fixos | Atendida | `PREFIXO_EVENTO_SEGURANCA = 'SEC_EVT'`, cinco campos declarados na interface |
| Sem IP bruto | Atendida | `origem` só recebe saída de `pseudonimizar`; nos eventos de autorização o pseudonimizado é o `usuarioId`, não o IP |
| Sem payload, cabeçalho, token ou e-mail | Atendida por construção | A interface `EventoSeguranca` não tem campo que os aceite; adicionar um exige editar o módulo |
| Cinco tipos de evento emitidos | Atendida | `RATE_LIMIT`, `TOKEN_RECUSADO`, `CONFLITO_IDEMPOTENCIA`, `FALHA_HANDOFF`, `AUTORIZACAO_NEGADA` |
| Métricas agregadas e alertas | **Não atendida** | Não há backend de métricas no projeto |

### 1.1 A correção da afirmação sobre agregação

O sal é gerado por processo (`randomBytes(16)` em tempo de carga do módulo).
Isso tem uma consequência que a redação anterior do gate não deixava explícita:

**o pseudônimo não é um identificador. É um agrupador de curta duração.**

Ele não correlaciona entre:

- **reinícios** — todo restart gera sal novo, então a mesma origem vira outro
  pseudônimo;
- **réplicas** — dois processos simultâneos produzem pseudônimos diferentes para
  o mesmo IP, e o total de "origens distintas" fica inflado pelo número de
  réplicas;
- **processos diferentes** — o mesmo vale para worker e API separados.

Hoje a produção roda um processo PM2 único, então na prática a correlação vale
até o próximo deploy. Isso não é uma propriedade em que se deva confiar: um
deploy no meio de um ataque zera a contagem.

### 1.2 O que pode e o que não pode ser medido hoje

| Métrica | Depende de pseudônimo estável? | Viável hoje |
|---|---|---|
| Taxa de `RATE_LIMIT` por bucket (`por_ip` / `por_orcamento`) | Não | Sim |
| Taxa de `TOKEN_RECUSADO` total e por orçamento | Não — `recursoId` é o id do orçamento, em claro e estável | Sim |
| Taxa de `AUTORIZACAO_NEGADA` por motivo | Não | Sim |
| Contagem de `AUTORIZACAO_NEGADA` com `motivo=permissao_nao_declarada` | Não | Sim — **deveria ser sempre zero**; qualquer valor acima disso é defeito de configuração em código novo |
| Qualquer `FALHA_HANDOFF` | Não | Sim |
| `CONFLITO_IDEMPOTENCIA` por orçamento | Não | Sim |
| "Quantas origens distintas tentaram" | **Sim** | Não — o número infla com réplicas e zera no restart |
| "Esta origem está tentando há 3 horas" | **Sim** | Não |
| "Top 10 origens por tentativa recusada" | **Sim** | Não |
| Correlação entre `RATE_LIMIT` e `TOKEN_RECUSADO` da mesma origem | **Sim** | Só dentro da vida do processo |

Resumo prático: **tudo o que se agrega por tipo, motivo, rota ou id de orçamento
funciona hoje.** Tudo que depende de "a mesma origem ao longo do tempo" não
funciona e não deve ser prometido.

### 1.3 HMAC com segredo rotacionável

Para os três alertas da metade de baixo da tabela, seria preciso trocar o sal
por processo por um **HMAC-SHA256 com chave em variável de ambiente**:

- a chave é a mesma em todas as réplicas, então o pseudônimo passa a ser
  comparável entre elas e entre reinícios;
- a rotação da chave é uma quebra deliberada da correlação — útil como política
  de retenção: rotacionar a cada 30 dias limita naturalmente por quanto tempo um
  histórico de IP permanece correlacionável;
- exige que a chave **não** entre no repositório (a regra de "nenhum segredo
  hardcoded" continua valendo) e que a ausência da variável seja tratada de
  forma explícita — degradar em silêncio para sal aleatório recriaria o problema
  atual sem avisar.

**Recomendação:** não implementar agora. Sem destino de métricas, um pseudônimo
estável não habilita nenhum alerta — só cria um identificador persistente de
usuário e de IP sem consumidor, o que piora a postura de privacidade em troca de
nada. A troca por HMAC deve entrar **junto** com o backend de observabilidade,
não antes.

### 1.4 Cardinalidade e retenção

| Campo | Cardinalidade | Risco |
|---|---|---|
| `tipo` | 5 valores | Nenhum |
| `motivo` | 7 valores hoje: `os_nao_gerada`, `codigo_nao_aceito`, `estado_incompativel`, `permissao_nao_declarada`, `permissao_insuficiente`, `por_ip`, `por_orcamento` | Baixo — a interface aceita qualquer string curta; a convenção é usar valor enumerável, não texto derivado da requisição |
| `rota` | Limitada e estática. Duas rotas lógicas escritas à mão no service e uma por handler protegido no guard, na forma `Classe.metodo` | Baixo |
| `recursoId` | Cresce com o número de orçamentos | Alto se virar label de métrica; aceitável em log |
| `origem` | Cresce com origens distintas × réplicas × reinícios. É IP pseudonimizado no rate limit e nas ações públicas; é `usuarioId` pseudonimizado nas negações de autorização | Alto se virar label de métrica |

**Regra a seguir quando houver agregador:** `tipo`, `motivo` e `rota` podem ser
labels. `recursoId` e `origem` ficam apenas no corpo do log, nunca como
dimensão de métrica — caso contrário a série temporal explode.

**Retenção proposta:** 30 dias para a linha de log completa e 13 meses para as
séries agregadas por tipo/motivo/rota, que não contêm dado pessoal. A definição
final depende do destino escolhido.

---

## 2. Proposta de infraestrutura de observabilidade

Escopo: apenas o necessário para os alertas do HS-06. Não é uma plataforma de
APM.

### Opção A — Alerta sobre log, sem serviço novo

Os eventos já saem em formato greppável. Um script agendado no próprio host lê o
log do PM2, conta ocorrências por tipo na janela e dispara e-mail quando passa
do limiar.

- **Custo:** zero em licença; algumas horas de implementação.
- **Operação:** mais um cron para manter; rotação de log já existe via PM2.
- **Limite:** sem histórico consultável, sem gráfico, sem correlação. Serve para
  "me avise se explodir", não para investigar.

### Opção B — Sentry (plano gratuito ou Team)

- **Custo:** gratuito até 5 mil eventos/mês; Team a partir de ~US$ 26/mês.
- **Operação:** SDK no Nest, DSN em variável de ambiente. Serviço gerenciado.
- **Limite:** é orientado a erro, não a métrica. Contar `429` por minuto é
  possível, mas fora do desenho do produto. Envia dado para fora da
  infraestrutura, o que exige atenção redobrada à sanitização — justamente o que
  o HS-06 trata.

### Opção C — Prometheus + Grafana no próprio host

- **Custo:** zero em licença; ~500 MB de RAM e disco para retenção.
- **Operação:** dois serviços a mais na VPS, com backup e atualização próprios.
  Endpoint `/metrics` protegido, fora do proxy público.
- **Limite:** é a opção com mais trabalho operacional, e a única que entrega
  série temporal com alerta de verdade sem enviar dado para terceiros.

### Recomendação

**Opção C**, com a Opção A como paliativo imediato se a decisão demorar. A razão
é o requisito: os alertas pedidos pelo HS-06 são todos de **taxa** (`401`, `403`,
`404` público, `429`, conflitos, falhas parciais), e taxa é exatamente o que uma
ferramenta de erro não modela bem. Se a Opção C for aprovada, a troca do sal por
HMAC (§1.3) entra na mesma entrega.

**Enquanto não houver decisão, o HS-06 permanece bloqueado.** O substrato está
pronto; o destino não existe.

---

## 3. Runbook — revisão dos logs históricos de produção

**Status: BLOQUEADO por acesso externo.** Nada deste runbook foi executado. Ele
descreve o procedimento a ser seguido quando a execução for autorizada.

### 3.1 Por que a revisão é necessária

O código novo já não registra segredo. Mas até o Gate 0S, os seguintes pontos
gravavam dado sensível, e o que eles escreveram continua nos arquivos de log:

| O que vazava | Onde | Desde |
|---|---|---|
| Código de aprovação em texto claro | `console.log` no envio da proposta | Origem do fluxo |
| Token de link público | `LinksV2Service.acessarLinkPublico` | Origem do fluxo |
| E-mail do cliente | Dois `logger.log` em `enviarOrcamento` e `atualizarOrcamento` | Origem do fluxo |
| Custo de produção, margem e impostos por produto | Dois dos cinco `console.log` de `orcamentos-v2`, disparados por rota **anônima** | Origem do fluxo |

**Atenção — correção de uma afirmação anterior deste documento.** A versão inicial
dizia que os códigos de aprovação já estavam invalidados pela migration do HS-04 e
que um código encontrado em log não seria mais utilizável. A consulta ao banco de
produção mostrou que **a migration do HS-04 não está aplicada lá** (§4.8 do gate): a
coluna `codigo_aprovacao` continua em texto claro e 2 orçamentos ainda a preenchem.

Portanto, até o deploy do Gate 0S, **um código de aprovação encontrado em log é
segredo vivo** e permite aprovar a proposta correspondente. Isso muda a ordem do
runbook: se a varredura for executada antes do deploy, o achado de código exige ação
imediata (§3.8), não apenas contagem.

E-mail, custo e margem permanecem sensíveis independentemente do deploy.

### 3.2 Fontes a examinar

| Fonte | Caminho típico | Observação |
|---|---|---|
| Log do PM2 (app) | `~/.pm2/logs/*-out.log` e `*-error.log` | Fonte principal |
| Log rotacionado do PM2 | mesmo diretório, sufixo numérico ou `.gz` | Verificar se `pm2-logrotate` está ativo e qual a retenção |
| Access log do Nginx | `/var/log/nginx/access.log*` | Não registra corpo; registra URL. Confirmar que nenhum token viajava em query string |
| Error log do Nginx | `/var/log/nginx/error.log*` | Pode conter trecho de requisição em erro 4xx/5xx |
| Log do Next.js/BFF | PM2, processo do frontend | As rotas de proxy foram sanitizadas no gate; o histórico não |
| Backup de log | conforme política do host | Se houver cópia fora da VPS, entra no escopo |

### 3.3 Intervalo temporal

Do início da retenção disponível até a data do deploy do Gate 0S. Não há motivo
para ir além: antes disso os arquivos não existem mais, e depois disso os pontos
de vazamento já não existem.

O primeiro passo do runbook é, portanto, **descobrir a retenção real** antes de
qualquer busca:

```bash
ls -la --time-style=long-iso ~/.pm2/logs/ | head -40
ls -la --time-style=long-iso /var/log/nginx/ | head -40
pm2 conf pm2-logrotate 2>/dev/null || echo "logrotate do PM2 não instalado"
```

### 3.4 Padrões a procurar

Buscar **contando**, nunca imprimindo a linha. Este é o ponto central do
runbook: um `grep` sem `-c` copia o segredo do arquivo para o terminal, de lá
para o histórico do shell, e possivelmente para o relatório.

```bash
# Contagem por padrão. Nenhuma saída contém o valor encontrado.
for p in \
  'codigo_aprovacao' \
  'Codigo de aprovacao' \
  'token=' \
  'acessarLinkPublico' \
  'custo_total_producao' \
  'margem_lucro' \
  '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}' \
; do
  echo -n "$p: "
  grep -rEc "$p" ~/.pm2/logs/ 2>/dev/null | awk -F: '{s+=$2} END {print s+0}'
done
```

Para localizar **onde** ocorreu sem revelar **o quê**, usar nome de arquivo e
número de linha, jamais o conteúdo:

```bash
grep -rEn 'codigo_aprovacao' ~/.pm2/logs/ | cut -d: -f1,2
```

### 3.5 Como evitar copiar segredo para fora

Regras obrigatórias durante a execução:

1. Nenhum comando que imprima a linha encontrada. Só `-c` (contagem) e
   `cut -d: -f1,2` (arquivo e linha).
2. Nenhum `scp`/`cat` de arquivo de log para a máquina local.
3. Não colar saída de log no chat, em issue, em commit ou neste repositório.
4. Desativar o histórico do shell durante a sessão (`unset HISTFILE`) para que
   nem os padrões de busca fiquem gravados.
5. Se for absolutamente necessário inspecionar uma linha para entender o
   formato, fazê-lo com mascaramento na origem, por exemplo
   `sed -E 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+/[EMAIL]/g'`.

### 3.6 Responsáveis e acessos

| Papel | Quem | Acesso necessário |
|---|---|---|
| Execução | Operador com acesso à VPS (hoje, o próprio administrador) | SSH via Cloudflare Tunnel, sudo para `/var/log/nginx` |
| Revisão do resultado | Responsável técnico do módulo | Apenas o relatório sanitizado |
| Decisão sobre expurgo | Administrador | — |

Um agente automatizado **não** deve executar este runbook sem autorização
específica e acompanhada, pela mesma razão do item 3.5: a saída de um comando
mal formulado entra no contexto do agente e de lá no transcript.

### 3.7 Evidência esperada

Uma tabela, e nada além dela:

| Fonte | Padrão | Ocorrências | Intervalo dos arquivos |
|---|---|---:|---|
| `~/.pm2/logs/backend-out.log` | `codigo_aprovacao` | *(número)* | *(datas)* |
| ... | ... | ... | ... |

Sem trechos, sem exemplos, sem "amostra do formato encontrado".

### 3.8 Procedimento se algo for encontrado

| Achado | Ação |
|---|---|
| Código de aprovação, **antes** do deploy do Gate 0S | O código ainda é válido. Revogar o código do orçamento afetado, registrar a contagem e expurgar o arquivo. |
| Código de aprovação, **depois** do deploy do Gate 0S | A migration do HS-04 invalida todos os códigos legados. Registrar a contagem e expurgar o arquivo. |
| Token de link público | Revogar os links públicos ativos da janela afetada e expurgar o arquivo. |
| E-mail de cliente | Expurgar. Avaliar, com o administrador, se o volume caracteriza incidente de dado pessoal sob a LGPD. |
| Custo, margem ou preço interno | Expurgar. Avaliar quem teve acesso ao host no período. |
| Qualquer achado em log que saia da VPS (backup externo, agregador de terceiro) | Tratar como incidente: o dado saiu do perímetro. |

Expurgo, quando decidido, é truncamento do arquivo (`: > arquivo`), nunca
remoção — remover o arquivo enquanto o processo o mantém aberto não libera o
conteúdo e ainda quebra a escrita subsequente.

### 3.9 Retenção depois da revisão

Recomendação a definir junto com a §2: instalar `pm2-logrotate` com retenção de
30 dias e compressão, para que a janela de exposição de qualquer log futuro seja
limitada por padrão, e não por acaso.

---

## 4. O que este documento não resolve

- Não decide a infraestrutura de observabilidade. Isso é decisão do
  administrador, e o HS-06 fica bloqueado até ela existir.
- Não executa a revisão de logs. Fica bloqueada por acesso e por autorização
  específica.
- Não implementa HMAC. A recomendação explícita é **não** implementar antes do
  destino de métricas.
