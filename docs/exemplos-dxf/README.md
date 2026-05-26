# Exemplos de DXF para teste

Arquivos DXF válidos (formato ASCII, AutoCAD R14 — `AC1014`) para testar a Sub-fase 7.A (anexo de imagem/DXF no produto do Orçamento V2) e a futura Sub-fase 7.B (parser DXF real).

## Como usar

1. Abra um orçamento novo ou existente em `/orcamentos-v2`.
2. No card de um produto, no bloco **"Imagem do produto / DXF"** (no topo do card), arraste um dos arquivos `.dxf` desta pasta para a área tracejada — ou clique e selecione pelo file picker.
3. O sistema deve aceitar o upload, marcar `geometria_origem = 'DXF'` e exibir um card com o nome do arquivo.

## Arquivos

### `exemplo-retangulo-1200x800.dxf`

- **Descrição:** placa retangular de fachada, 1200 mm × 800 mm.
- **Entidades:** 4 `LINE` formando o perímetro.
- **Camadas:** apenas `CORTE`.
- **Metadado de projeto (`$PROJECTNAME`):** `Placa Fachada Padaria Bom Pao`.
- **Geometria esperada após parser (7.B):**
  - perímetro: 4000 mm
  - área: 0,96 m²

### `exemplo-logo-corte-gravacao.dxf`

- **Descrição:** logo de adesivo de vitrine, 600 mm × 400 mm, com **duas camadas**.
- **Entidades:** 4 `LINE` no perímetro externo (camada `CORTE`) + 1 `CIRCLE` central de raio 80 mm + 2 `LINE` formando uma cruz dentro do círculo (camada `GRAVACAO`).
- **Camadas:** `CORTE` (cor 1, vermelho) e `GRAVACAO` (cor 3, verde).
- **Metadado de projeto (`$PROJECTNAME`):** `Logo Adesivo Vitrine 600x400`.
- **Geometria esperada após parser (7.B):**
  - perímetro de `CORTE`: 2000 mm
  - área de `CORTE`: 0,24 m²
  - camada `GRAVACAO` deve ser **ignorada** no cálculo de perímetro de corte (alerta: *"Camada GRAVACAO ignorada para cálculo de perímetro"*).
- **Sugestão de insumo esperada:** **nenhuma** — as duas camadas (`CORTE` e `GRAVACAO`) são puramente nomes de operação. O `DxfRevisaoCard` deve marcá-las como `apenas_operacao` e mostrar a mensagem orientativa pedindo para renomear as camadas (ex.: `ACRILICO_3MM_CORTE`).

### `exemplo-acrilico-com-descricao-800x500.dxf`

- **Descrição:** placa retangular em acrílico 3mm cristal, 800 mm × 500 mm, com camada de material nomeada corretamente. Inclui todos os campos descritivos do header DXF (`$TITLE`, `$SUBJECT`, `$KEYWORDS`, `$COMMENTS`, `$AUTHOR`) preenchidos, para validar a feature de descrição (Sub-fase 7.B++).
- **Entidades:** 4 `LINE` no perímetro externo (camada `ACRILICO_3MM_CRISTAL_CORTE`) + 1 `CIRCLE` de gravação na camada `GRAVACAO_TEXTO`.
- **Camadas:** `ACRILICO_3MM_CRISTAL_CORTE` (cor 7, branco) e `GRAVACAO_TEXTO` (cor 1, vermelho).
- **Metadados do header preenchidos:**
  - `$PROJECTNAME` → "Placa Acrilico Bar Recanto Mineiro"
  - `$TITLE` → "Placa de Identificacao 800x500"
  - `$SUBJECT` → "Placa em acrilico cristal 3mm com corte a laser"
  - `$KEYWORDS` → "acrilico, 3mm, cristal, placa, corte a laser, ponto comercial"
  - `$COMMENTS` → "Material: acrilico cristal 3mm transparente. Corte a laser CO2..."
  - `$AUTHOR` → "Estudio Comunikapp - Designer Carla"
- **Geometria esperada após parser:**
  - perímetro da camada de corte: 2600 mm (800 + 500 + 800 + 500)
  - área pelo bounding box: 0,40 m² (alerta de "envolvente" porque o parser ainda não detecta o retângulo como polígono fechado pela soma de LINES)
- **Descrição do projeto esperada no card:** concatenação dos 5 campos do header, separados por `" — "`, deduplicada — usada para sugerir preenchimento do campo "Descrição" do produto (se vazio).
- **Sugestão de insumo esperada:** se a loja tiver cadastrado um insumo com nome contendo "acrílico" ou "acrilico" e/ou um `TipoMaterial` "acrílico", a camada `ACRILICO_3MM_CRISTAL_CORTE` deve gerar sugestão com score reforçado pelos tokens da descrição (`cristal`, `transparente`). Caso contrário, o botão "Cadastrar novo" aparece (pois a camada não é apenas operação).

## O que validar na Sub-fase 7.A (já entregue)

- [x] Arquivo é aceito pelo `POST /orcamentos-v2/anexos-geometria`.
- [x] Mime sai como `application/octet-stream` ou `application/dxf` — o backend usa fallback por extensão `.dxf`.
- [x] Resposta traz `categoria: 'DXF'` e `metadados.nome_original`.
- [x] Frontend mostra card com nome do arquivo, sem preview visual.
- [x] `geometria_origem` no formulário vira `'DXF'`.
- [x] Se o "Nome do Produto" estiver vazio, é sugerido a partir do nome do arquivo (`exemplo-logo-corte-gravacao` → `exemplo logo corte gravacao`). Se já tiver algo digitado, não é tocado.

## O que ainda NÃO funciona (Sub-fase 7.B pendente)

- [ ] Extração automática de perímetro/área/camadas a partir do conteúdo do DXF.
- [ ] Substituição da heurística atual de sugestão de nome (`nome_original` do arquivo) pelo `$PROJECTNAME` do header DXF (que ambos os arquivos desta pasta carregam).
- [ ] Tela de revisão obrigatória antes de aplicar valores no preço.

## Limites do endpoint (configuráveis)

- Tamanho máximo do DXF: **20 MB** (configurado em `multer-anexo-geometria.config.ts`).
- Extensões aceitas: `.dxf`. Mimes formais aceitos: `application/dxf`, `application/x-dxf`, `image/x-dxf`, `image/vnd.dxf` — e qualquer arquivo com extensão `.dxf` (fallback).

## Encoding

Os arquivos são salvos em **ASCII puro** (sem caracteres acentuados), conforme convenção do formato DXF clássico. O `$PROJECTNAME` foi escrito sem acentos para garantir compatibilidade com parsers que não tratam UTF-8 fora do escopo `EXTENDED_DATA`.
