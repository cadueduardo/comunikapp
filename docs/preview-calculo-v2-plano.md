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
- [ ] Reaproveitar preview-calculo.helpers.ts para calcular totais, evitando duplicacao de logica dentro do componente.
- [ ] Revisar calculo.utils.ts para suportar as necessidades do preview (converter medidas, custo por unidade) e expor apenas funcoes utilizadas.
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

