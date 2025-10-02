# Componentes de OS - Novo Layout

Este diretório contém os componentes modulares para a página de detalhamento da OS, seguindo o novo layout proposto com hierarquia clara e organização em abas.

## 🎯 Estrutura do Layout

### **Cabeçalho Principal**
- **OSHeader**: Cabeçalho com número da OS, status destacado e botões de ação
- Identidade instantânea da ordem
- Linha de resumo rápido (cliente, prazo, prioridade)

### **Layout Principal (2 Colunas)**

#### **Coluna Esquerda (⅔ da largura)**
- **OSTabs**: Sistema de abas para organizar conteúdo
  - `[Resumo]` - Projeto e materiais principais
  - `[Técnico]` - Especificações e tipo de impressão
  - `[Materiais]` - Lista completa e acabamentos
  - `[Aprovação]` - Status da aprovação técnica
  - `[Instalação]` - Detalhes da instalação
- **OSTimeline**: Timeline/histórico de atividades

#### **Coluna Direita (⅓ da largura)**
- **OSWorkflowActions**: Ações de workflow baseadas no status
- **OSSidebar**: Painel lateral com informações auxiliares
  - Status de materiais
  - Contato cliente
  - Aprovação técnica
  - Ações rápidas

## 📁 Componentes

### **OSHeader.tsx**
Cabeçalho principal com:
- Número da OS destacado
- Status badge com cores
- Botões de ação (Voltar, Imprimir, Editar)
- Linha de resumo rápido

### **OSTabs.tsx**
Sistema de abas com conteúdo modular:
- Navegação por abas
- Conteúdo específico para cada aba
- Cartões modulares para informações

### **OSSidebar.tsx**
Painel lateral com:
- Status de materiais (chips coloridos)
- Contato do cliente
- Status da aprovação técnica
- Ações rápidas (duplicar, notas)
- Observações

### **OSTimeline.tsx**
Timeline de atividades com:
- Histórico completo de movimentações
- Ícones para tipos de movimentação
- Transições de status
- Informações de usuário e data

### **OSWorkflowActions.tsx**
Ações de workflow baseadas no status:
- Aprovação técnica (OS Comercial)
- Aprovação orçamentária (OS Interna)
- Transições de estado
- Validações automáticas

## 🎨 Características Visuais

### **Indicadores Visuais**
- **Badges coloridos** para status
- **Chips** para materiais (OK, Faltando)
- **Ícones** para tipos de movimentação
- **Cores consistentes** (azul, verde, vermelho, amarelo)

### **Responsividade**
- Layout adaptável para diferentes telas
- Coluna direita pode virar painel inferior em mobile
- Abas responsivas

## 🔄 Fluxo de Navegação

1. **Usuário acessa** `/os/[id]`
2. **Vê identidade instantânea** (OS #, status, cliente)
3. **Navega pelas abas** para ver detalhes específicos
4. **Acompanha timeline** de mudanças
5. **Usa painel lateral** para ações rápidas e status
6. **Executa ações de workflow** baseadas no status atual

## 🚀 Novos Status Suportados

### **OS Comercial**
- `AGUARDANDO_APROVACAO_TECNICA` - Aguardando aprovação técnica
- `APROVADA_TECNICA` - Aprovada tecnicamente
- `PRODUCAO` - Em produção
- `ACABAMENTO` - Acabamento
- `FINALIZADA` - Finalizada

### **OS Interna**
- `AGUARDANDO_APROVACAO_ORCAMENTARIA` - Aguardando aprovação orçamentária
- `APROVADA_ORCAMENTARIA` - Aprovada orçamentariamente
- `PRODUCAO` - Em produção
- `FINALIZADA` - Finalizada

## 📱 Como Usar

```tsx
import { 
  OSHeader,
  OSSidebar,
  OSTabs,
  OSTimeline,
  OSWorkflowActions
} from '@/components/ui/os';

// Na página de detalhes da OS
<OSHeader os={os} onImprimirOS={handleImprimirOS} />
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2 space-y-6">
    <OSTabs os={os} dadosTransformados={dadosTransformados} />
    <OSTimeline movimentacoes={os.movimentacoes} os={os} />
  </div>
  <div className="space-y-6">
    <OSWorkflowActions os={os} onStatusChange={fetchOS} />
    <OSSidebar os={os} onDuplicarOS={handleDuplicarOS} />
  </div>
</div>
```

## ✅ Benefícios

- **Hierarquia clara** de informações
- **Organização modular** por abas
- **Timeline transparente** de atividades
- **Ações contextuais** baseadas no status
- **Layout responsivo** para diferentes telas
- **Indicadores visuais** intuitivos
- **Navegação fluida** entre seções

