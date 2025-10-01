# Template de Impressão de OS - Documentação

## Visão Geral

Este documento descreve o sistema de template de impressão para Ordens de Serviço (OS) implementado conforme o **PLANO Fase 1 - Item 6**.

## Objetivo

Fornecer template A4 otimizado para impressão física da OS, incluindo:
- Layout profissional para uso no chão de fábrica
- QR Code para acesso digital
- Dados completos do projeto e cliente
- Especificações técnicas detalhadas
- Status de aprovação e agendamento

## Arquitetura

### Componentes Principais

1. **ImpressaoOSService** (`backend/src/os/services/impressao-os.service.ts`)
   - Service principal para geração de dados e templates
   - Integração com Prisma para busca de dados
   - Geração de QR Code
   - Transformação de dados usando helpers

2. **ImpressaoOSController** (`backend/src/os/controllers/impressao-os.controller.ts`)
   - Endpoints REST para impressão
   - Suporte a diferentes formatos (HTML, PDF)
   - Configurações flexíveis de impressão

3. **Template HTML** (`backend/src/os/templates/os-impressao.html`)
   - Template otimizado para impressão A4
   - CSS responsivo com media queries
   - Layout profissional com seções organizadas

### Endpoints Disponíveis

#### GET `/os/:id/imprimir`
Gera template HTML para impressão da OS.

**Query Parameters:**
- `formato`: 'html' | 'pdf' (default: 'html')
- `incluirQRCode`: boolean (default: true)
- `incluirLogo`: boolean (default: true)
- `incluirDetalhesTecnicos`: boolean (default: true)

**Exemplo:**
```
GET /os/OS-2024-001/imprimir?formato=html&incluirQRCode=true&incluirLogo=true
```

#### GET `/os/:id/imprimir/preview`
Gera preview do template antes da impressão.

**Query Parameters:** Mesmos do endpoint de impressão.

#### GET `/os/:id/imprimir/dados`
Retorna dados estruturados da OS em formato JSON.

**Query Parameters:** Mesmos do endpoint de impressão.

## Estrutura do Template

### Seções do Template

1. **Cabeçalho**
   - Logo da loja
   - Número da OS
   - Data de criação
   - QR Code para acesso digital

2. **Cliente**
   - Dados completos do cliente
   - Endereço formatado
   - Contatos (telefone, email)

3. **Projeto**
   - Descrição do serviço
   - Quantidade
   - Dimensões (largura, altura, profundidade)
   - Prazo de entrega
   - Status atual
   - Necessidade de instalação

4. **Especificações Técnicas**
   - Materiais principais (extraídos do orçamento)
   - Tipo de impressão identificado
   - Acabamentos necessários

5. **Materiais Necessários**
   - Tabela com todos os insumos
   - Quantidades e unidades
   - Observações específicas

6. **Aprovação Técnica**
   - Status da aprovação
   - Responsável pela aprovação
   - Data da aprovação
   - Observações técnicas

7. **Agendamento de Instalação**
   - Data agendada (se aplicável)
   - Observações de instalação

8. **Observações Gerais**
   - Campo livre para observações adicionais

9. **Rodapé**
   - Data de impressão
   - Responsável pela impressão
   - Dados da loja

### Características do Layout

- **Formato A4**: Otimizado para impressão em papel A4
- **CSS Print**: Media queries específicas para impressão
- **Quebras de Página**: Controle de quebras para evitar cortes
- **Cores**: Suporte a cores na impressão
- **Fontes**: Arial para máxima compatibilidade

## Integração com Dados

### Fonte de Dados

O template utiliza dados da OS e do orçamento relacionado:

```typescript
interface DadosImpressaoOS {
  os: OrdemServico;
  cliente: Cliente;
  loja: Loja;
  orcamento?: Orcamento;
  produtos: ProdutoOrcamento[];
  insumos: ItemInsumo[];
  maquinas: ItemMaquina[];
  servicosManuais: ItemServicoManual[];
  dadosTransformados: DadosTransformacao;
  qrCodeDataUrl: string;
}
```

### Transformação de Dados

Utiliza o `TransformacaoDadosHelper` para:
- Calcular prazo de produção
- Extrair materiais principais
- Identificar tipo de impressão
- Listar acabamentos
- Verificar necessidade de instalação

### QR Code

- Gera QR Code com URL para acesso digital
- Formato: `{FRONTEND_URL}/os/{numeroOS}`
- Tamanho: 100x100 pixels
- Cores: Preto sobre branco

## Configurações de Impressão

### ConfiguracaoImpressao

```typescript
interface ConfiguracaoImpressao {
  incluirQRCode: boolean;
  incluirLogo: boolean;
  incluirDetalhesTecnicos: boolean;
  formato: 'html' | 'pdf';
}
```

### Exemplos de Uso

**Impressão Completa:**
```
GET /os/OS-2024-001/imprimir?incluirQRCode=true&incluirLogo=true&incluirDetalhesTecnicos=true
```

**Impressão Simplificada:**
```
GET /os/OS-2024-001/imprimir?incluirQRCode=false&incluirLogo=false&incluirDetalhesTecnicos=false
```

**Preview:**
```
GET /os/OS-2024-001/imprimir/preview
```

## Testes

### Testes Unitários

- **ImpressaoOSService**: Testa geração de dados e templates
- **ImpressaoOSController**: Testa endpoints e tratamento de erros

### Cenários Testados

1. **Geração de Dados**
   - OS com orçamento completo
   - OS sem orçamento
   - OS não encontrada

2. **Template HTML**
   - Substituição de variáveis
   - Formatação de dados
   - Template inline vs arquivo

3. **QR Code**
   - Geração com URL correta
   - Tratamento de erros
   - Configuração de parâmetros

4. **Endpoints**
   - Parâmetros padrão
   - Conversão de tipos
   - Tratamento de erros

## Dependências

### Pacotes NPM

```json
{
  "qrcode": "^1.5.3",
  "@types/qrcode": "^1.5.5"
}
```

### Variáveis de Ambiente

```env
FRONTEND_URL=http://localhost:3000
```

## Próximos Passos

### Melhorias Futuras

1. **Geração de PDF**
   - Implementar Puppeteer para PDF
   - Otimizar performance
   - Cache de templates

2. **Templates Personalizáveis**
   - Múltiplos templates por loja
   - Editor visual de templates
   - Preview em tempo real

3. **Integração com Impressoras**
   - Suporte a impressoras específicas
   - Configurações de qualidade
   - Impressão em lote

4. **Analytics**
   - Contagem de impressões
   - Tempo de geração
   - Erros de impressão

## Troubleshooting

### Problemas Comuns

1. **Template não carrega**
   - Verificar se arquivo existe em `backend/src/os/templates/`
   - Fallback para template inline

2. **QR Code não aparece**
   - Verificar variável `FRONTEND_URL`
   - Verificar dependência `qrcode`

3. **Dados não aparecem**
   - Verificar se OS existe
   - Verificar relacionamentos no Prisma
   - Verificar permissões de acesso

4. **Layout quebrado**
   - Verificar CSS de impressão
   - Testar em diferentes navegadores
   - Verificar configurações de impressão

### Logs

O service gera logs para:
- Geração de dados
- Erros de QR Code
- Erros de template
- Performance de queries

## Conformidade com PLANO

### ✅ Requisitos Atendidos

- [x] Template A4 otimizado para impressão
- [x] Layout profissional para chão de fábrica
- [x] QR Code para acesso digital
- [x] Dados completos do projeto
- [x] Especificações técnicas detalhadas
- [x] Status de aprovação e agendamento
- [x] Integração com dados existentes
- [x] Configurações flexíveis
- [x] Testes unitários completos
- [x] Documentação detalhada

### 📋 Entregáveis

1. **ImpressaoOSService** - Service principal
2. **ImpressaoOSController** - Endpoints REST
3. **Template HTML** - Layout A4 otimizado
4. **Testes Unitários** - Cobertura completa
5. **Documentação** - Este documento

### 🎯 Objetivos Alcançados

- Template profissional para impressão física
- Integração completa com dados da OS
- Flexibilidade de configuração
- Qualidade de código e testes
- Documentação completa

## Conclusão

O sistema de template de impressão foi implementado com sucesso, atendendo todos os requisitos do PLANO Fase 1. O template fornece uma solução completa para impressão física de OS, com layout profissional, dados completos e integração com o sistema existente.

A implementação segue as melhores práticas de desenvolvimento, com testes unitários, documentação completa e arquitetura modular que permite futuras extensões e melhorias.
