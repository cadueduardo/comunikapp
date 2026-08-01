# Gate 0S — Observabilidade e revisão de logs de produção

**Documento:** anexo do [`09-gate-hotfix-seguranca.md`](./09-gate-hotfix-seguranca.md), HS-04 e HS-06
**Status:** decisão de arquitetura tomada (§2); observabilidade centralizada vira projeto
apartado; revisão dos logs históricos segue bloqueada por acesso externo (§3)
**Data:** 2026-07-31, atualizado em 2026-08-01

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
| Cinco tipos de evento emitidos | Atendida, comprovada | `eventos-seguranca.spec.ts` (9 casos) e `orcamentos-v2-aceite-publico.spec.ts` (4 casos de evento), exercitando os pontos reais; linha final conferida por `scripts/comprovar-eventos-seguranca.ts` |
| Métricas centralizadas e alertas automáticos | Fora do Gate 0S | Decisão de arquitetura de 2026-08-01 (§2): vira projeto apartado |

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

**Recomendação, confirmada pela decisão de §2:** não implementar agora. Sem
destino de métricas, um pseudônimo estável não habilita nenhum alerta — só cria
um identificador persistente de usuário e de IP sem consumidor, o que piora a
postura de privacidade em troca de nada. A troca por HMAC entra **junto** com o
projeto de observabilidade, não antes.

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

## 2. Decisão de arquitetura — observabilidade centralizada é projeto apartado

**Aprovada em 2026-08-01. Registrada como DV-17 no RP.**

A observabilidade centralizada **não** entra no Gate 0S e **não** é instalada na
VPS principal. Ela será um projeto próprio, provavelmente hospedado em uma VPS
separada da Oracle com recursos limitados.

Em consequência, dentro desta branch e deste gate:

- não se instala Prometheus, Grafana, Loki, Sentry, OpenTelemetry ou qualquer
  outra plataforma de observabilidade;
- métricas centralizadas e alertas automáticos **deixam de bloquear o Gate 0S**;
- nada disso dispensa o que o hotfix precisa entregar: evento estruturado,
  sanitização, baixa cardinalidade, consulta local e runbook.

A análise das opções que precedeu a decisão (§2 da versão anterior deste
documento) permanece válida como insumo do projeto futuro, com uma ressalva: ela
assumia hospedagem no próprio host, o que a decisão descarta. A comparação de
custo e operação precisa ser refeita para o cenário de VPS dedicada.

### 2.1 O que o Gate 0S entrega (obrigatório, local)

| Requisito | Situação | Evidência |
|---|---|---|
| Eventos estruturados e sanitizados | Atendido | `common/security/eventos-seguranca.ts`; §1 |
| Ausência de segredo e dado sensível | Atendido | Varredura por padrão proibido em `testing/capturar-eventos-seguranca.ts`, aplicada nas duas suítes e no script |
| Baixa cardinalidade | Atendido | §1.4 |
| Logs locais consultáveis | Atendido | §4.1 |
| Runbook de investigação | Atendido | §4.2 |
| Critérios de incidente | Atendido | §4.3 |
| Comprovação dos cinco tipos de evento | Atendido | §4.4 |
| Rollback fail-closed | Atendido | §2.7 do gate |

### 2.2 O que fica para o projeto futuro

| Item | Por que não cabe agora |
|---|---|
| Coleta centralizada em VPS separada | Exige host, rede e decisão de stack que não existem |
| Armazenamento e política de retenção do agregado | Depende do destino escolhido |
| Dashboards | Sem coleta, não há o que desenhar |
| Alertas automáticos por taxa | Mesmo motivo |
| Correlação entre instâncias e reinícios | Exige pseudônimo estável, que exige consumidor (§1.3) |
| Pseudonimização estável (HMAC rotacionável) | Só deve existir junto do consumidor; antes disso é identificador persistente sem uso (§1.3) |
| Segurança de transporte entre as VPS | Escopo do projeto: autenticação mútua, cifra em trânsito e superfície mínima exposta |
| Dimensionamento e escolha da stack | A VPS Oracle tem recurso limitado; a escolha precisa partir do orçamento de memória e disco disponível |

Enquanto esse projeto não existe, o que responde "está acontecendo alguma coisa
anormal?" é a consulta local descrita em §4 — manual, sob demanda, e
suficiente para o volume atual de uma instância única.

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

## 4. Investigação local de eventos de segurança

Esta seção é o substituto operacional dos dashboards enquanto o projeto de §2
não existe. Diferente da §3, ela **não** é bloqueada: trata dos eventos novos,
que por construção não contêm dado sensível, e pode ser executada a qualquer
momento depois do deploy.

### 4.1 Onde os eventos ficam

O backend roda em uma única instância PM2, em modo `fork`, com destino de log
fixado em `ecosystem.config.js`:

| Item | Valor |
|---|---|
| Arquivo principal | `/opt/comunikapp/.pm2/logs/comunikapp-backend-out.log` |
| Arquivo de erro | `/opt/comunikapp/.pm2/logs/comunikapp-backend-error.log` |
| Timestamp por linha | Sim (`time: true` no PM2) |
| Instâncias | 1 (`instances: 1`, `exec_mode: 'fork'`) |

Uma instância única tem uma consequência boa para a investigação: o sal do
pseudônimo é o mesmo para todas as linhas entre dois deploys, então `origem`
agrupa de forma confiável dentro dessa janela. Isso deixa de valer no instante
em que houver réplica (§1.1).

Os eventos saem em nível `WARN`. O `main.ts` não restringe níveis de log, então
eles chegam ao arquivo sem configuração adicional. Ainda assim, a busca abaixo
cobre `out` e `error`: o custo é zero e a dúvida sobre qual stream recebe `warn`
deixa de importar.

### 4.2 Runbook de investigação

Diferente do runbook da §3, aqui **é seguro imprimir a linha**. Um evento
`SEC_EVT` não contém e-mail, IP, código, token, custo ou margem — é isso que a
varredura automatizada de §4.4 garante a cada execução da suíte.

```bash
LOGS=/opt/comunikapp/.pm2/logs

# 1. Panorama: quantos eventos de cada tipo, no total do arquivo.
grep -h 'SEC_EVT' $LOGS/comunikapp-backend-*.log \
  | grep -oP 'tipo=\K\w+' | sort | uniq -c | sort -rn

# 2. Recorte de hoje, por tipo e motivo — a dimensão mais útil no dia a dia.
grep -h "$(date +%d/%m/%Y)" $LOGS/comunikapp-backend-out.log \
  | grep 'SEC_EVT' \
  | grep -oP 'tipo=\K\w+|motivo=\K\w+' | paste - - | sort | uniq -c | sort -rn

# 3. O contador que deveria ser sempre zero.
grep -c 'motivo=permissao_nao_declarada' $LOGS/comunikapp-backend-*.log

# 4. Qualquer falha de handoff, com a linha inteira (são raras e cada uma importa).
grep -h 'tipo=FALHA_HANDOFF' $LOGS/comunikapp-backend-*.log

# 5. Um orçamento específico, para reconstruir a sequência de tentativas.
grep -h "recurso=$ORCAMENTO_ID" $LOGS/comunikapp-backend-*.log | grep 'SEC_EVT'

# 6. Concentração por origem dentro da janela do processo atual.
grep -h 'SEC_EVT' $LOGS/comunikapp-backend-out.log \
  | grep -oP 'origem=\K[0-9a-f]{12}' | sort | uniq -c | sort -rn | head -20
```

O passo 6 só faz sentido **depois** de confirmar quando foi o último restart
(`pm2 list` mostra o uptime). Contagens que atravessam um restart misturam
pseudônimos de sais diferentes e superestimam o número de origens.

### 4.3 Critérios de incidente

Os limiares abaixo valem para o volume atual — uma loja em operação, instância
única. Eles não são SLA: são o ponto em que vale a pena olhar. Devem ser
revisados quando o volume mudar.

| Observação | Interpretação | Ação |
|---|---|---|
| Qualquer `motivo=permissao_nao_declarada` | Handler novo entrou sem `@RequerPermissaoVendas`. Não é ataque: é defeito de configuração que o guard conteve | Corrigir a anotação do endpoint no mesmo dia. O guard já negou o acesso, então não há exposição — mas o próximo endpoint pode não estar sob o guard |
| Qualquer `tipo=FALHA_HANDOFF` | Um cliente aceitou a proposta e a OS não foi gerada. O aceite foi revertido | Conferir o orçamento citado em `recurso=`, confirmar que o código voltou a ser utilizável e apurar a causa da falha da OS |
| `TOKEN_RECUSADO` acima de 20 no mesmo `recurso=` em 24 h | Tentativa de adivinhação contra uma proposta específica | O contador de tentativas do orçamento já trava o alvo. Revogar o código, avisar o cliente e emitir um novo |
| `TOKEN_RECUSADO` em mais de 5 `recurso=` distintos vindos da mesma `origem=` | Varredura, não cliente confuso | Bloquear a origem na borda (Cloudflare/Nginx) e registrar o incidente |
| `RATE_LIMIT` com `motivo=por_ip` recorrente | O limitador de varredura está atuando | Só investigar se persistir por horas: uso legítimo raramente atinge o teto por IP |
| `RATE_LIMIT` com `motivo=por_orcamento` isolado | Cliente clicando repetidamente | Nenhuma. É o limitador fazendo o trabalho dele |
| `CONFLITO_IDEMPOTENCIA` em volume | Retry de cliente ou link antigo sendo reaberto | Investigar apenas se concentrado em um orçamento: pode indicar UI devolvendo estado velho |
| Ausência total de `SEC_EVT` por dias, com tráfego normal | Suspeitar do próprio registro antes de comemorar | Executar `scripts/comprovar-eventos-seguranca.ts` no host e confirmar que a linha chega ao arquivo |

A última linha existe porque um sistema de log silencioso e um sistema de log
quebrado são indistinguíveis de longe — e o segundo é o mais perigoso dos dois.

### 4.4 Comprovação dos cinco tipos

Três camadas, todas reproduzíveis:

| Camada | O que prova | Onde |
|---|---|---|
| `common/security/eventos-seguranca.spec.ts` (9 casos) | `RATE_LIMIT` (dois buckets) e `AUTORIZACAO_NEGADA` (dois motivos) saem do limitador e do guard reais; formato da linha; pseudônimo não contém o valor original | Suíte unitária |
| `orcamentos-v2/services/orcamentos-v2-aceite-publico.spec.ts` (4 casos de evento) | `TOKEN_RECUSADO`, `CONFLITO_IDEMPOTENCIA` e `FALHA_HANDOFF` saem do fluxo real de aceite | Suíte unitária |
| `backend/scripts/comprovar-eventos-seguranca.ts` | A linha final, como o PM2 a grava, com varredura de padrão proibido sobre o texto escrito no stdout | Execução manual |

As duas suítes verificam a sanitização pela direção que pega regressão: em vez
de conferir se os campos esperados estão certos, procuram o que não pode estar
lá — e-mail, IPv4/IPv6, código, token, `authorization`, custo, margem, preço. Um
campo novo com dado sensível falha o teste mesmo que ninguém se lembre de
atualizar as asserções.

Saída da execução manual em 2026-08-01:

```
WARN [SegurancaVendas] SEC_EVT tipo=RATE_LIMIT rota=orcamentos-v2/acao-publica recurso=orc-exemplo origem=bfc17ef507df motivo=por_ip
WARN [SegurancaVendas] SEC_EVT tipo=TOKEN_RECUSADO rota=orcamentos-v2/acao-publica recurso=orc-exemplo origem=bfc17ef507df motivo=codigo_nao_aceito
WARN [SegurancaVendas] SEC_EVT tipo=CONFLITO_IDEMPOTENCIA rota=orcamentos-v2/acao-publica recurso=orc-exemplo origem=bfc17ef507df motivo=estado_incompativel
WARN [SegurancaVendas] SEC_EVT tipo=FALHA_HANDOFF rota=orcamentos-v2/aceite recurso=orc-exemplo motivo=os_nao_gerada
WARN [SegurancaVendas] SEC_EVT tipo=AUTORIZACAO_NEGADA rota=OrcamentosV2Controller.remover origem=aa9e6aafab4b motivo=permissao_insuficiente

linhas emitidas: 5 de 5
varredura de dado sensível: nenhum achado.
```

Os valores de `recurso` e `origem` acima são de exemplo, gerados pelo próprio
script. `origem=bfc17ef507df` é o pseudônimo de `203.0.113.42` **naquele
processo**: rodar o script de novo produz outro valor, o que é a demonstração
prática da limitação descrita em §1.1.

---

## 5. O que este documento não resolve

- Não implementa a observabilidade centralizada. Por decisão de §2, ela é
  projeto apartado e não entra nesta branch.
- Não executa a revisão de logs históricos. Fica bloqueada por acesso e por
  autorização específica (§3).
- Não implementa HMAC. A recomendação explícita é **não** implementar antes de
  existir consumidor para o pseudônimo estável (§1.3).
