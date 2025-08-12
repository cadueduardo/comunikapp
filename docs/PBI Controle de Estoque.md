# PBI – Módulo de Controle de Estoque para SaaS Comunikapp

## Objetivo
Desenvolver um módulo de controle de estoque completo, integrado ao sistema, focado nas necessidades específicas do setor de comunicação visual. O módulo deve oferecer uma interface de dashboard com cards e gráficos, além de funcionalidades detalhadas de cadastro, movimentação, alertas e gestão de materiais, aproveitando os insumos já cadastrados no sistema e considerando a integração futura com compras, produção e gestão de sobras.

---

## Escopo Geral
- Dashboard inicial com KPIs, gráficos e cards de visão geral
- CRUD de materiais de estoque, referenciando os insumos já existentes
- Movimentações de entradas, saídas, baixas, devoluções, campanhas, lotes e validade
- Controle de sobras e retalhos, com sugestão de uso
- Alertas de estoque mínimo e materiais vencidos
- Integração com o módulo de produção e orçamentos
- Histórico de movimentações e auditoria completa
- API independente e plugável via API REST

---

## 1. Dashboard Inicial – Visual e KPI

### Componentes e Campos
| Card/Gráfico                   | Descrição                                                       | Valores/Indicadores        |
|--------------------------------|-----------------------------------------------------------------|----------------------------|
| Quantiade Atual por Insumo    | Quantidade física disponível, agrupada por categoria          | Valor numérico, cor de alerta se abaixo MÍNIMO |
| Gráfico de Giro de Estoque     | Evolução de movimentações (entrada/saída) ao longo do tempo     | Gráfico de barras/linha |
| Alertas de Materiais Vencidos | Materiais com validade expirada ou próximo do vencimento       | Lista com cores de prioridade |
| Sobras/Retalhos               | Quantidade de sobras aproveitáveis                              | Valor, com opção de view detalhado |
| Materiais em Alta Rotatividade | Materiais que mais saem do estoque                              | Top 10 listados |
| Próximas Ações                 | Alertas de materiais em estoque mínimo ou em falta             | Lista e notificações à equipe |

### Critérios de Aceite
- Visualização em painel responsivo
- Atualizações automáticas via WebSocket ou polling
- Links ou botões para detalhes e gestão de materiais
- Configuração de limites de alerta

---

## 2. Cadastro de Materiais (Ref. Insumos já existentes)

### Campos e Componente
| Campo                     | Tipo de componente     | Obrigatório | Validação                                      | Descrição                                               |
|---------------------------|------------------------|:----------:|------------------------------------------------|---------------------------------------------------------|
| Insumo (referência)       | Dropdown/Autocomplete  | Sim        | Deve existir na tabela de insumos                | Vínculo ao cadastro técnico existente                     |
| Quantidade em Estoque     | Numérico               | Sim        | >= 0                                           | Quantidade física atual                                |
| Localização Física        | Texto                  | Não        | Máx. 100 caracteres                            | Local de armazenamento                                 |
| Estoque Mínimo            | Numérico               | Não        | >= 0, menor que quantidade atual               | Para gerar alertas                                    |
| Lote/Validade             | Data                   | Não        | Data válida válida                             | Controle de validade (especialmente tintas e solventes) |
| Data da Última Movimentação | Data/Hora             | Automático | —                                              | Atualizado ao movimentar o item                        |
| Observações               | Texto                  | Não        | Máx. 255 caracteres                            | Campo livre de detalhes adicionais                     |

### Critérios de Aceite
- Cadastro, edição, visualização e exclusão de materiais
- Não permitir quantidade negativa
- Validação de unicidade de código e lote
- Atualização automática do saldo após movimentações
- Permitir múltiplas localizações, se necessário

---

## 3. Movimentações de Estoque

### Campos e Componente
| Campo                     | Tipo de componente        | Obrigatório | Validação                                              | Descrição                                  |
|---------------------------|---------------------------|:----------:|--------------------------------------------------------|--------------------------------------------|
| Insumo (referência)       | Dropdown                  | Sim        | Deve existir                                             | Vinculado ao cadastro de insumos          |
| Tipo de movimentação     | Dropdown (Entrada, Saída, Devolução, Ajuste) | Sim | -                                                      | Tipo de movimento                          |
| Quantidade Movimentada   | Numérico                  | Sim        | > 0, menor que saldo disponível em saída ou ajuste positivo | Quantidade registrada                   |
| Data da movimentação     | Data/Hora                 | Sim        | Data válida                                              | Quando ocorreu                             |
| Responsável (usuário)     | Dropdown ou autofill      | Sim        | Perfil autorizado                                        | Quem realizou a movimentação               |
| Localização (opcional)    | Texto                     | Não        | —                                                      | Para controle físico por setor ou prateleira |
| Lote / Validade (opcional)| Data/Texto               | Não        | Data válida                                              | Para controle de validade, especialmente tintas |
| Complemento / Observação  | Texto                     | Não        | Máx. 255 caracteres                                       | Motivos, motivos especiais, etc.          |

### Critérios de Aceite
- Movimentação registrada com controle de saldo atualizado
- Admite movimentação manual e automática via API
- Verifica saldo suficiente na saída
- Histórico detalhado e log de movimentações

---

## 4. Gestão de Sobras e Retalhos

### Funcionalidades
- Controle específico de sobras, com percentual de aproveitamento
- Sugestões automáticas de uso baseado em projetos futuros
- Visualização de sobras por faixa dimensional ou por categoria
- Registro de uso de sobras na movimentação do estoque

### Campos
| Campo                    | Tipo de componente   | Obrigatório | Validação             | Descrição                               |
|--------------------------|----------------------|:----------:|------------------------|----------------------------------------|
| Material (insumo)        | Dropdown             | Sim        | Vinculado ao cadastro de insumos | Material sobras                        |
| Quantidade disponível    | Numérico             | Sim        | ≥ 0                   | Quantidade disponível para uso           |
| Tamanho / Dimensão      | Texto                 | Não        | —                     | Dimensão do retalho (ex: 2,5x1m)        |
| Uso sugerido             | Texto                 | Não        | —                     | Sugestões de projeto ou aplicação       |
| Última atualização      | Data/Hora             | Automático | —                     | Quando o sobras foi atualizado          |

### Critérios de Aceite
- Registro detalhado de sobras existentes
- Sugestões automáticas de uso
- Atualização automática na movimentação e uso

---

## 5. Regras e Validações Gerais do Sistema

- **Conectividade com Insumos:** Os insumos cadastrados servirão como base de referência; a quantidade em estoque será controlada nesta tabela.
- **Validade:** Materiais perecíveis devem expirar automaticamente com alertas gerados.
- **Alertas:** Configuração de limites de estoque mínimo e máximo por material.
- **Ações Automáticas:** Baixas após uso na produção, registros de entrada por compra, devolução, ajuste.
- **Auditoria:** Logs de todas as movimentações, alterações de quantidade e localização.
- **Permissões:** Controle de quem pode editar, retirar ou aumentar o estoque.
- **Relatórios:** Giro, perdas, sobras, validade, consumo por projeto.

---

## 6. Estratégia de Implantação em Fases

**Fase 1:** Dashboard inicial com KPIs, visualização rápida, saldo e alertas.  
**Fase 2:** CRUD completo de materiais, movimentações e localização.  
**Fase 3:** Controle avançado de sobras, aproveitamento e sugestões automáticas.  
**Fase 4:** Integrações com produção, compras e geração de relatórios analíticos.  

---

## 7. Considerações Finais

Este sistema de estoque foi desenhado para atender às particularidades do setor de comunicação visual, focando na eficiência do aproveitamento, redução de desperdício, rastreabilidade e automação. Sua implementação faseada é essencial para garantir adaptação, testes de usabilidade e melhorias contínuas.

---

**Este documento serve de guia para o desenvolvimento completo do módulo de estoque, integrado ao seu SaaS, com API plugável, interfaces responsivas, validações rigorosas e foco em gestão inteligente de materiais.**
