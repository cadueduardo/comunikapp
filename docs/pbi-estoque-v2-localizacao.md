# PBI – Módulo de Controle de Estoque v2 (Atualizado com Gestão de Localização)

**Papel:** Product Owner (P.O)  
**Módulo:** Controle de Estoque (API plug-in contratável)  
**Contexto:** SaaS Comunikapp para empresas de comunicação visual  
**Dependências:** Módulo de Insumos (cadastro técnico) e Módulo de Orçamentos/PCP  
**Marketplace:** Este módulo será oferecido como **add-on** instalável no futuro marketplace. Toda arquitetura deve ser **separada** e **independente**, ativada apenas para lojas contratantes.

---

## Objetivo Geral

Criar um módulo de estoque completo, escalável e plugável, **integrado** ao cadastro de insumos existente e capaz de controlar quantidades físicas, movimentações, localização hierárquica de materiais (endereçamento), retalhos, lotes e validade. A solução deve respeitar boas práticas de **arquitetura limpa** com arquivos de código menores que **1.000 linhas** (organização por camadas e sub-módulos).

---

## Arquitetura de Integração

```
┌──────────────┐      FK       ┌────────────┐
│  INSUMOS     │──────────────▶│  ESTOQUE   │
│ (cadastro)   │               │ (quant.)   │
└──────────────┘               └────────────┘
        ▲                            ▲
        │                            │
        │                ┌──────────┴──────────┐
        │                │ MOVIMENTAÇÕES       │
        │                └──────────┬──────────┘
        │                            │
        └─────────────── Marketplace ────────────▶  Módulo instalado ou não
```

- **Isolamento multi-tenant**: todas as tabelas contêm `loja_id`.
- **API separada**: `/api/estoque/*` só fica disponível para lojas com o módulo ativado.
- **Pastas dedicadas**: `apps/inventory` contendo subpastas de controllers, services, DTOs, testes.
- **Código limpo**: limite de 400 linhas por arquivo de serviço e 200 linhas por controller.

---

## Estrutura de Fases

| Fase | Entrega Principal                                    |
|------|------------------------------------------------------|
| 1    | Dashboard + Endereçamento Base                       |
| 2    | CRUD de Localizações + Validações                    |
| 3    | CRUD de Materiais Físicos (Estoque)                  |
| 4    | Movimentações (Entrada/Saída/Ajuste)                 |
| 5    | Integrações (Orçamentos/Compras) + Retalhos/Lotes    |
| 6    | Relatórios, KPIs e Sugestões de Compra               |
| 7    | Empacotamento como Plug-in de Marketplace            |

---

## Fase 1 – Dashboard & Estrutura Base

### 1.1 Cards e KPIs
- Total de SKUs estocados  
- Valor total (custo)  
- Estoque baixo / sem estoque  
- Giro de estoque (30 dias)  
- Materiais próximos ao vencimento  

### 1.2 Gráficos
- Entradas vs. saídas (mês)  
- Distribuição por categoria (pie)  
- Aproveitamento de bobinas (bar)  

### 1.3 Cards de Navegação
- Entrada · Saída · Inventário · Relatórios · Configurações · Localizações

---

## Fase 2 – Gestão de Localização Física

### 2.1 Tabela `localizacoes`
| Campo          | Tipo     | Descrição                                 |
|----------------|---------|-------------------------------------------|
| id             | UUID PK | Identificador                             |
| codigo         | TEXT    | Ex: A1-01-B-02-03 (único por loja)        |
| deposito       | TEXT    | Almoxarifado ou área                      |
| corredor       | TEXT    | Rua/corredor                              |
| prateleira     | TEXT    | Estante ou prateleira                     |
| nivel          | TEXT    | Nível/altura                              |
| posicao        | TEXT    | Coluna/posição                            |
| descricao      | TEXT    | Uso opcional                              |
| capacidade_max | NUM     | Capacidade (unidade do insumo)            |
| loja_id        | UUID FK |                                           |

### 2.2 Validações
- `codigo` único.  
- Proíbe deletar localização com estoque > 0.

### 2.3 Interface
- Wizard de cadastro em 5 passos (depósito → corredor → prateleira → nível → posição).  
- Mass import via CSV.

---

## Fase 3 – Tabela `estoque`

Inclui campo `localizacao_id` obrigatório.

| Campo                | Tipo      | Validação                         |
|----------------------|-----------|-----------------------------------|
| insumo_id (FK)       | UUID      | Deve existir & ativo              |
| localizacao_id (FK)  | UUID      | Não nulo – integra endereço       |
| quantidade_atual     | DEC(10,4) | >= 0                               |
| quantidade_reservada | DEC(10,4) | >= 0                               |
| …                    |           |                                   |

---

## Fase 4 – Movimentações

- **Entrada**: exige escolha de localização ou distribuição por múltiplas localizações.  
- **Saída**: sistema mostra locais disponíveis e saldo por localização; permite picking parcial.
- **Inventário**: contagem física por local.

Validações: impede estoque negativo, respeita FIFO para lotes.

---

## Fase 5 – Integrações Avançadas

### 5.1 Orçamentos/PCP
- Reserva por localização (prioriza menor saldo).  
- Picking automático gera lista de separação com endereços.

### 5.2 Compras
- Entrada pode sugerir local baseado em categoria (configuração default).

---

## Fase 6 – Relatórios & KPIs

- Ocupação por depósito/corredor  
- Heat-map de localização (lugares vazios x lotados)  
- % de aproveitamento de bobinas por local  
- SLA de picking (tempo médio de separação)

---

## Fase 7 – Empacotamento para Marketplace

- Script de **migrations isoladas**  
- **Feature flag** no front-end: exibe menu “Estoque” apenas se módulo ativo.  
- Licenciamento: verificação de assinatura antes de carregar rotas.  
- Documentação **OpenAPI** separada.  
- Testes unitários & integração automáticos via CI.

---

## Critérios de Aceite Essenciais

1. Usuário consegue cadastrar localizações hierárquicas únicas.  
2. Cada item estocado deve possuir `localizacao_id` válido.  
3. Impossível deletar local com saldo > 0.  
4. Dashboard exibe KPIs corretos em ≤ 3 s.  
5. Arquivos de serviço ≤ 400 linhas; controllers ≤ 200 linhas (revisado em PR).  
6. API bloqueada para lojas sem o módulo ativo.  
7. Reservas automáticas respeitam saldos por localização e FIFO de lotes.  
8. Relatório de ocupação mostra % de uso por depósito.  
9. Toda movimentação gera log auditável com usuário, IP, data/hora.  
10. Testes cobrem ≥ 80 % das regras de localização.

---

## Observações Técnicas

- **Pattern**: Clean Architecture; camadas `application`, `domain`, `infra`, `presentation`.  
- **Código máximo por arquivo**: 400 linhas (service), 200 linhas (controller).  
- **Naming**: `inventory` ou `stock` como prefixo.  
- **Migrations**: arquivos pequenos (< 200 linhas) separados por tabela.  
- **Docs**: pasta `/docs/inventory` com exemplos de payload.

---

**Com essa atualização, o PBI cobre detalhadamente a gestão de localização física, garante arquitetura limpa e prepara o módulo para ser oferecido como produto separado no marketplace.**
