# Centros de Trabalho – Comunicação Visual (Especificação)

Este documento define a modelagem funcional e técnica do módulo Centros de Trabalho para padronizar cálculo de custos e produtividade em orçamentos/produtos de comunicação visual.

Referências: ver "docs/premissas melhores praticas.md".

## 1) Objetivos
- Unificar cadastros produtivos (máquinas, funções, serviços manuais, custos indiretos) em um módulo único.
- Calcular horas e custos de forma consistente (setup + produção, por m²/linha/unidade).
- Permitir modos automáticos por parâmetros de produtividade com override manual quando necessário.
- Manter o layout atual de orçamentos/produtos, adicionando automação de cálculo por trás.

## 2) Terminologia
- **Centros de Trabalho**: módulo-mãe que engloba recursos produtivos.
- **Máquina**: equipamento (plotter, laminadora), com custo/h e parâmetros de produtividade.
- **Função**: mão de obra (Operador de Plotter), com custo/h e regra de cálculo.
- **Serviço Manual**: acabamento/processo manual (ilhós, embalagem) com parâmetros próprios.
- **Custos Indiretos**: despesas mensais rateadas em função do tempo produtivo.
- **Modo de Impressão**: preset por máquina (qualidade/passadas/velocidade), opcional.

## 3) Módulo no Menu – Centros de Trabalho
- Adicionar item de menu de nível superior: **Centros de Trabalho**.
- Página inicial do módulo em cards (mesma linguagem visual de Configurações), contendo:
  - **Máquinas** (lista/CRUD + configurações e modos de impressão)
  - **Funções** (lista/CRUD + regras de cálculo)
  - **Serviços (manuais)** (lista/CRUD + parâmetros de produtividade)
  - **Custos Indiretos** (lista/CRUD – nível loja, alimenta custo_indireto_por_hora)
  - (Opcional) **Modos de Impressão** acessível dentro do detalhe da Máquina
- Navegação: cada card leva para sua respectiva lista/CRUD. Breadcrumb: Centros de Trabalho / [Seção].

## 4) Entidades e Campos
### 4.1 Máquina
- id, nome, tipo (PLOTTER_GRANDE_FORMATO, LAMINADORA, ROUTER, OUTRO), ativo
- custo_hora: number
- modo_producao: 'M2_H' | 'ML_H' | 'MANUAL'
- velocidade_m2_h?: number
- velocidade_ml_h?: number
- largura_util_m?: number
- eficiencia_percent?: number (0–1)
- setup_min?: number

#### Modos de Impressão (filho de Máquina)
- id, maquina_id
- nome_modo (ex.: Draft 2-pass / Quality 8-pass)
- qualidade/passadas (livre)
- velocidade_m2_h: number
- consumo_tinta_ml_m2?: number (opcional)
- padrao: boolean, ativo: boolean

### 4.2 Função
- id, nome, ativo
- custo_hora: number
- tipo_calculo: 'ACOMPANHA_MAQUINA' | 'POR_M2' | 'POR_UNIDADE' | 'MANUAL'
- fator_acompanhamento?: number (0–1)
- horas_por_m2?: number
- horas_por_unidade?: number
- setup_min?: number
- maquina_id?: string (quando acompanha máquina específica)

### 4.3 Serviço Manual
- id, nome, ativo
- tipo_unidade: 'POR_M2' | 'POR_UNIDADE' | 'POR_ML' | 'MANUAL'
- custo_hora?: number | preco_base?: number
- horas_por_m2?: number | horas_por_unidade?: number | velocidade_ml_h?: number
- eficiencia_percent?: number (0–1)
- setup_min?: number

### 4.4 Custos Indiretos (nível loja)
- id, nome, categoria, valor_mensal, ativo
- regra_rateio: 'PROPORCIONAL_TEMPO' (default; futuros: POR_M2, POR_UNIDADE)
- Parâmetros de loja (fora daqui): horas_produtivas_mensais (usado no rateio)

## 5) Regras de Cálculo
### 5.1 Área e quantidade
- area_unit_m2 = (largura_cm × altura_cm) / 10.000
- area_total_m2 = area_unit_m2 × quantidade

### 5.2 Máquinas
- 'M2_H': horas = setup_h + area_total_m2 / (velocidade_m2_h × eficiencia)
- 'ML_H': comp_lin_m = area_total_m2 / largura_util_m; horas = setup_h + comp_lin_m / (velocidade_ml_h × eficiencia)
- 'MANUAL': usar horas informadas pelo item
- custo_maquina = horas × custo_hora

### 5.3 Funções
- 'ACOMPANHA_MAQUINA': horas = Σ(horas_máquinas_vinculadas) × fator_acompanhamento + setup
- 'POR_M2': horas = area_total_m2 × horas_por_m2 + setup
- 'POR_UNIDADE': horas = quantidade × horas_por_unidade + setup
- 'MANUAL': usar horas informadas
- custo_funcao = horas × custo_hora

### 5.4 Serviços Manuais
- Idêntico às funções conforme tipo_unidade; custo = horas × custo_hora (ou preço_base, conforme política)

### 5.5 Indiretos e Preço
- custo_indireto_por_hora = soma(valor_mensal ativos) / horas_produtivas_mensais
- horas_totais = Σ horas(máquinas) + Σ horas(funções) + Σ horas(serviços)
- custo_indireto = custo_indireto_por_hora × horas_totais
- custo_total_producao = materiais + máquinas + mão_de_obra + serviços + indiretos
- subtotal = custo_total_producao × (1 + margem/100)
- preco_final = subtotal × (1 + impostos/100)

### 5.6 Overrides
- Toggle “Ajustar manualmente”: quando ativo, ignora cálculo automático e usa horas do item.
- Log de origem (automático vs manual) para auditoria.

## 6) Defaults Iniciais (ajustáveis)
- Plotter GF: velocidade 60–100 m²/h; eficiencia 0.85; setup 10–12 min
- Operador de plotter: ACOMPANHA_MAQUINA; fator 0.8; setup 5 min
- Laminação: 3–7 min/m²; setup 5–8 min
- Acabamentos por unidade (ilhós/corte): 0.5–2 min/un

## 7) UX – Orçamento/Produtos
- Não alterar layout; cálculo passa a ser automático.
- Mostrar "Horas calculadas automaticamente" + toggle de override; tooltip com fórmula/valores (velocidade, eficiência, setup, área, quantidade).

## 8) Integrações
- Não há API pública universal de setups/modos. RIPs/fabricantes (HP PrintOS, Caldera, ONYX, etc.) oferecem dados sob licença.
- Estratégia: importar CSV/JSON de modos por máquina (opcional) + conectores futuros.

## 9) Migração/Roadmap
1. Esquema de dados: novos campos + criação de Serviços Manuais + mover Custos Indiretos para o módulo (só navegação).
2. Backend: cálculo automático com fallback MANUAL e override por linha.
3. Preview: espelhar regras, sem mudar layout; exibir horas calculadas.
4. UI Config: cards de Centros de Trabalho (Máquinas, Funções, Serviços, Custos Indiretos) + Modos por Máquina.
5. Integrações RIP (opcional, pós-go-live).

## 10) Qualidade
- Logs padronizados (entrada → horas → custos → preço).
- Consistência: preview = backend = grid.
- Testes ≥ 80% nos trechos alterados.

## 11) Exemplo rápido
- Banner 100×120 cm (1,2 m²), quantidade 2; plotter 80 m²/h; eficiência 0.85; setup 10 min:
  - horas_plotter = 0.1667 h + (2.4 / (80×0.85)) ≈ 0.1667 + 0.0353 = 0.202 h
  - operador (0.8): 0.202×0.8 + 0.0833 ≈ 0.245 h
  - somar laminação/aplicação conforme parâmetros.
