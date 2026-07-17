# 09 — Catálogo do `SystemStateBanner`

**Status do documento:** proposto

## Objetivo

Definir as mensagens iniciais que o banner de estado pode exibir no topo da Home, suas prioridades, condições de aparição e ações associadas.

## Estrutura de uma mensagem

```ts
type BannerMensagem = {
  id: string;                  // chave estável
  nivel: 'critico' | 'atencao' | 'informativo';
  titulo: string;              // até 60 caracteres
  descricao?: string;          // até 140 caracteres
  acao?: BannerAcao;           // ação principal opcional
  dismissable: boolean;        // se pode ser dispensado pelo usuário
  prioridade: number;          // 1..100; menor = mais importante
};

type BannerAcao =
  | { tipo: 'link'; label: string; href: string }
  | { tipo: 'endpoint'; label: string; metodo: 'POST' | 'PATCH'; endpoint: string };
```

## Regras gerais

- Exibir **no máximo 2 mensagens** empilhadas simultaneamente.
- Se houver mais de 2, mostrar as 2 com **menor `prioridade` numérica** (mais importantes) + link "ver outras N mensagens".
- Mensagens críticas **não são dispensáveis** (`dismissable = false`).
- O front guarda dispensas em `localStorage[`comunikapp:banner-dismiss:${userId}:${bannerId}`]` com TTL definido por mensagem.
- O backend recalcula a lista a cada `GET /home-operacional/banner-estado` ou junto do `/resumo`.

## Catálogo (v1)

### 1. Trial expirando

```yaml
id: trial_expirando
nivel: atencao
titulo: "Seu período de avaliação termina em {dias} dias"
descricao: "Ative seu plano para continuar usando todos os recursos."
acao:
  tipo: link
  label: "Ativar plano"
  href: "/configuracoes/assinatura"
dismissable: false
prioridade: 10
condicao:
  - loja.data_inicio_trial existe
  - loja.assinatura_ativa = false
  - dias_restantes (calculado) <= 7
  - dias_restantes > 0
```

### 2. Trial expirado

```yaml
id: trial_expirado
nivel: critico
titulo: "Seu período de avaliação encerrou"
descricao: "Ative seu plano para evitar bloqueio das funcionalidades."
acao:
  tipo: link
  label: "Ativar plano agora"
  href: "/configuracoes/assinatura"
dismissable: false
prioridade: 1
condicao:
  - loja.data_inicio_trial existe
  - loja.assinatura_ativa = false
  - dias_restantes <= 0
```

### 3. Configuração mínima incompleta

```yaml
id: configuracao_incompleta
nivel: informativo
titulo: "Configuração mínima incompleta"
descricao: "Aplique a configuração recomendada para começar mais rápido."
acao:
  tipo: endpoint
  label: "Aplicar configuração recomendada"
  metodo: POST
  endpoint: /home-operacional/onboarding/aplicar-configuracao-recomendada
dismissable: true
prioridade: 40
condicao:
  - onboarding.progresso_pct < 60
  - configuracao_recomendada_nao_aplicada_ainda
```

### 4. Insumos do tipo chapa sem tamanho

```yaml
id: insumos_chapa_sem_tamanho
nivel: atencao
titulo: "{n} insumos sem tamanho de chapa cadastrado"
descricao: "Cadastre largura e altura para conseguir calcular sobras corretamente."
acao:
  tipo: link
  label: "Revisar insumos"
  href: "/insumos?filtro=chapa-sem-tamanho"
dismissable: false
prioridade: 30
condicao:
  - existe insumo do tipo chapa onde largura_chapa_mm IS NULL OR altura_chapa_mm IS NULL
```

### 5. E-mail SMTP não configurado

```yaml
id: smtp_nao_configurado
nivel: atencao
titulo: "Envio de e-mail indisponível"
descricao: "Configure SMTP para enviar orçamentos e notificações."
acao:
  tipo: link
  label: "Configurar e-mail"
  href: "/configuracoes/email"
dismissable: false
prioridade: 35
condicao:
  - integracao SMTP inativa ou ausente
```

### 6. 2FA não ativo (mensagem leve)

```yaml
id: dois_fatores_pendente
nivel: informativo
titulo: "Ative a segurança em 2 fatores"
descricao: "Proteja sua conta com código temporário do autenticador."
acao:
  tipo: link
  label: "Ativar 2FA"
  href: "/configuracoes?security=2fa#seguranca-2fa"
dismissable: true
prioridade: 70
condicao:
  - usuario.two_factor_enabled = false
  - usuario não dispensou nos últimos 30 dias
ttl_dispensa_dias: 30
```

> Hoje essa mensagem já existe como `Dialog` em `frontend/src/app/(main)/layout.tsx`. O plano da Fase 1 é **migrar para o banner**, com a mesma lógica de "lembrar depois". O Dialog inicial pode ser mantido até a migração concluir.

### 7. Estoque crítico generalizado

```yaml
id: estoque_critico_geral
nivel: critico
titulo: "{n} insumos abaixo do estoque mínimo"
descricao: "Verifique compras urgentes para não parar a produção."
acao:
  tipo: link
  label: "Ver estoque crítico"
  href: "/estoque?filtro=critico"
dismissable: false
prioridade: 15
condicao:
  - count(insumos onde estoque_atual <= estoque_minimo) > 0
```

### 8. Material insuficiente para OS já liberada

```yaml
id: material_insuficiente_os_liberada
nivel: critico
titulo: "{n} OS sem material suficiente"
descricao: "Compre ou substitua antes de iniciar produção."
acao:
  tipo: link
  label: "Ver OS afetadas"
  href: "/os?filtro=material-insuficiente"
dismissable: false
prioridade: 5
condicao:
  - existe OS com status_liberacao_pcp = LIBERADO e estoque insuficiente
```

### 9. Atualização do sistema disponível (futuro)

```yaml
id: atualizacao_disponivel
nivel: informativo
titulo: "Nova versão disponível"
descricao: "Veja o que mudou."
acao:
  tipo: link
  label: "Ver novidades"
  href: "/sobre/novidades"
dismissable: true
prioridade: 90
ttl_dispensa_dias: 7
```

(Mensagem opcional; só ativar quando houver um changelog interno.)

## Comportamento na ausência de mensagens

Quando o backend não retorna nenhuma mensagem, o front **não renderiza o banner** (sem espaço reservado).

## Atualização

- Para adicionar uma nova mensagem, atualizar este documento + implementar a regra no backend (`SystemStateService`).
- Cada mensagem deve ter teste unitário cobrindo a condição.

## Pontos de confirmação

1. Ordem de prioridade entre `trial_expirado`, `material_insuficiente_os_liberada` e `estoque_critico_geral`: faz sentido?
2. A mensagem `dois_fatores_pendente` deve continuar como `Dialog` inicial **e** banner, ou virar apenas banner?
3. TTL padrão de dispensa: 30 dias para mensagens informativas?
