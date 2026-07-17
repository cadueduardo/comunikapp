# Plano de Acao - Preview Calculo V2

## Diagnostico atual
- Erro de build em rontend/src/components/ui/shared/sections/PreviewCalculoV2.tsx:208 devido a typo no helper ormatarValor.
- Componente PreviewCalculoV2 continua com imports ausentes (useUser) e diversos parenteses/deslocamentos quebrando o parser.
- 	ransformarDadosParaMotor e processarDadosReais nao refletem o DTO real do motor V2; usam mocks e valores hardcoded.
- WebSocket dispara em loop sem debounce efetivo porque o cleanup do orm.watch esta incorreto.
- Helpers fortes preview-calculo.helpers.ts e calculo.utils.ts estao desconectados do componente principal.
- Repositorio guarda variantes antigas do preview (PreviewCalculoV2-simple.tsx, PreviewCalculoV2-temp.tsx) e arquivos de debug (debug_*.json, *_block.txt).
- OrcamentoV2Form ainda contem varios console.log com caracteres corrompidos.

## Objetivo geral
Entregar o preview do calculo V2 consumindo o motor em tempo real, consolidando as regras em helpers compartilhados e eliminando artefatos temporarios.

## Entregas por etapa
### 1. Correcoes imediatas de build
- [x] Ajustar funcoes utilitarias (ormatarValor, ormatarNumero, formatacoes de custo/horas) para remover typos e normalizar retorno monetario.
- [x] Incluir useUser e demais imports faltantes no PreviewCalculoV2.
- [x] Padronizar o retorno dos JSX com interpolacao correta (R$ {valor.toFixed(2)}) eliminando parenteses sobrando.

### 2. Integracao com helpers compartilhados
- [x] Reaproveitar preview-calculo.helpers.ts para calcular totais, evitando duplicacao de logica dentro do componente.
- [ ] Revisar calculo.utils.ts para suportar as necessidades do preview (converter medidas, custo por unidade) e expor apenas funcoes utilizadas.
  - Levantar funcoes existentes, marcando quais continuam em uso no PreviewCalculoV2 e removendo as obsoletas.
  - Reescrever conversores de unidade e calculo de custo por item para aceitar parametros dinamicos (quantidade, unidade, fator de conversao).
  - Garantir que apenas as funcoes publicas fiquem exportadas, movendo utilitarios internos para escopo privado ou modulo especifico.
  - Documentar no topo do arquivo o contrato esperado pelos helpers e pelo componente para facilitar manutencao.
- [ ] Criar testes rapidos (unitarios) para as helpers criticas (materiais, maquinas, funcoes) garantindo consistencia com cards antigos.

### 3. Orquestracao do WebSocket/DTO
- [ ] Mapear o contrato DTOCalculo (backend) -> PreviewCalculoV2 e documentar no helper.
- [ ] Ajustar 	ransformarDadosParaMotor para enviar apenas dados reais (materiais, maquinas, funcoes, servicos) com IDs e unidades corretas.
- [ ] Revisar processarDadosReais para consumir o payload real do evento calculo_concluido e alimentar o helper centralizado.
- [ ] Revisar use-calculo-websocket.ts caso seja necessario alinhar eventos, reconexao e canais especificos.

### 4. Fluxo do formulario V2
- [ ] Limpar console.log e caracteres corrompidos em OrcamentoV2Form.
- [ ] Criar hook utilitario (ex.: usePreviewCalculo) encapsulando serialize + disparo do socket, reutilizavel no form.
- [ ] Ativar debounce real usando useRef ou useDebounceCallback para evitar floods no motor.

### 5. Limpeza de artefatos e organizacao
- [ ] Remover componentes de preview antigos (PreviewCalculoV2-simple.tsx, PreviewCalculoV2-temp.tsx).
- [ ] Excluir arquivos de debug/rascunho (debug_*.json, *block.txt) apos validar que nao sao mais uteis.
- [ ] Atualizar docs/console.log.md ou remover caso nao tenha mais proposito.

### 6. Validacao
- [ ] Executar fluxo manual: preencher formulario, acompanhar envio pelo socket e validar que preview bate com motor.
- [ ] Registrar screenshots ou GIF rapido para QA (opcional se processo interno exigir).
- [ ] Considerar adicionar comando de teste automatizado/CI para rodar helpers de calculo.

## Dependencias e notas
- Confirmar com backend o shape atualizado do evento calculo_concluido antes de refatorar processarDadosReais.
- Verificar se ha billing/performance para debouncing <500 ms; ajustar conforme resposta do motor.
- Manter feature flag ou fallback mockado ate o socket ficar estavel em producao.


## Cronograma sugerido
- Dia 1-2: Finalizar revisao de `calculo.utils.ts` e cobrir helpers com testes rapidos em `preview-calculo.helpers.spec.ts`.
- Dia 3-4: Sincronizar com backend, atualizar DTOs (`transformarDadosParaMotor`, `processarDadosReais`) e validar fluxo em homologacao.
- Dia 5: Refatorar formulario (`OrcamentoV2Form`, novo `usePreviewCalculo`) e garantir debounce.
- Dia 6: Remover artefatos antigos e arquivos temporarios, preparando PR final.
- Dia 7: Rodar validacao ponta-a-ponta, produzir evidencias para QA e abrir card de follow-up se necessario.

## Riscos e mitigacoes
- Falta de confirmacao do contrato `calculo_concluido`: agendar sync curto com backend (Rafa) antes de mexer nos DTOs; fallback temporario com tipagem permissiva.
- Instabilidade do WebSocket em ambiente dev: habilitar logs em `use-calculo-websocket.ts` e coletar traces ate estabilizar.
- Divergencias entre helpers e regras do motor: incluir QA tecnico (Gabi) nas revisoes de teste e compartilhar fixtures representativas.
- Janela curta para testes automatizados: priorizar smoke tests e catalogar cenarios nao cobertos para sprint seguinte.

## Comunicacao e alinhamentos
- Atualizar daily com status das etapas 2 e 3; sinalizar bloqueios de backend imediatamente no Slack #squad-orcamento.
- Registrar notas de validacao no Notion da squad, anexando payloads relevantes.
- Enviar PRs pequenos e frequentes para facilitar review e feature flag se necessario.
- Confirmar com suporte a necessidade de material de treinamento antes do rollout.

## Indicadores de sucesso
- Preview gera os mesmos totais do motor V2 para os casos de teste (materiais, maquinas, funcoes, servicos).
- WebSocket sem erros de reconexao por 1h de uso continuo em ambiente dev.
- Formulario V2 sem logs ruidosos e com feedback visual em ate 1s apos ajustes de entrada.
- Base do repositorio limpa, sem artefatos temporarios nem componentes legacy ativos.

## Proximos passos imediatos
- Concluir revisao de `calculo.utils.ts` definindo API publica e removendo funcoes inuteis.
- Escrever testes unitarios minimos cobrindo materiais/maquinas e valores monetarios criticos.
- Agendar validacao com backend para revisar contrato do socket e payload final.
- Preparar script de smoke test manual descrevendo fluxo completo para QA.

