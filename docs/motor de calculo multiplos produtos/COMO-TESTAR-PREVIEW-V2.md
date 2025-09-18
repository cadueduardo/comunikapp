# 🧪 Como Testar o Preview de Cálculo V2

## 📍 **Localização**

O novo componente `PreviewCalculoV2` está disponível em:
- **Arquivo**: `frontend/src/components/ui/shared/sections/PreviewCalculoV2.tsx`
- **Página de Demonstração**: `/demo-preview`
- **Menu**: "Demo Preview V2" na barra lateral

## 🚀 **Como Acessar**

### **1. Via Menu Principal**
1. Acesse a aplicação
2. Na barra lateral esquerda, clique em **"Demo Preview V2"**
3. Você será direcionado para `/demo-preview`

### **2. Via URL Direta**
```
http://localhost:3000/demo-preview
```

## 🎯 **O Que Você Verá**

### **Layout da Página**
- **Lado Esquerdo**: Formulário simulado com informações de exemplo
- **Lado Direito**: Sidebar com o novo preview de cálculo

### **Preview de Cálculo V2 (Sidebar Direita)**
- **Header Sticky**: "Preview do Cálculo" com status de conexão
- **Resumo do Orçamento**: Totais consolidados e breakdown
- **Produtos no Orçamento**: Lista expandível com detalhes
- **Custos Indiretos**: Rateio global com detalhamento
- **Informações de Sistema**: Metadados do cálculo

## 🔍 **Funcionalidades para Testar**

### **1. Expansão de Produtos**
- Clique em **"Ver Detalhes de Custo"** em qualquer produto
- Veja o breakdown completo:
  - Materiais utilizados
  - Máquinas e horas
  - Mão de obra (funções)
  - Serviços manuais
  - Custos indiretos rateados

### **2. Toggle de Custos Indiretos**
- Clique em **"Ver Detalhes"** na seção de custos indiretos
- Veja a lista completa de custos mensais

### **3. Status WebSocket**
- Observe o badge de conexão no header
- Deve mostrar "Atualizado em tempo real" ou "Desconectado"

## 📊 **Dados Mockados Incluídos**

### **Produtos de Exemplo**
1. **Banner** (100x): 2x1m, Vinil Brilho + Cordão
2. **Painel** (1x): 3x2m, ACM + Impressão
3. **Expositor PDV** (1x): 1.5x0.8m, MDF + Ponteiras

### **Cálculos Automáticos**
- **Custos por Material**: Quantidade × Custo Unitário
- **Custos por Máquina**: Horas × Custo por Hora
- **Custos por Função**: Horas × Custo por Hora
- **Custos por Serviço**: Horas × Custo por Hora
- **Custos Indiretos**: Rateio automático por produto

### **Metadados do Sistema**
- **Versão do Motor**: 2.1.3
- **Tempo de Execução**: 245ms
- **Estágios Executados**: 7 estágios completos
- **Timestamp**: Atualização em tempo real

## 🎨 **Características Visuais**

### **Cores Semânticas**
- **Verde**: Valores positivos (total, margem de lucro)
- **Vermelho**: Custos adicionais (impostos)
- **Laranja**: Comissões
- **Azul**: Status de conexão

### **Layout Responsivo**
- **Desktop**: Sidebar fixa à direita (320px)
- **Mobile**: Adaptação automática
- **Scroll**: Vertical com header sticky

## 🔧 **Componentes Utilizados**

### **UI Components**
- `Card`, `CardHeader`, `CardContent`
- `Button`, `Badge`, `Separator`
- `Switch` (para toggle futuro)

### **Ícones Lucide**
- `Calculator`, `Package`, `Clock`
- `ChevronDown`, `ChevronUp`, `Eye`
- `AlertCircle`

## 📱 **Responsividade**

### **Desktop (lg+)**
- Layout em duas colunas
- Sidebar fixa à direita
- Preview sempre visível

### **Mobile (< lg)**
- Layout em coluna única
- Preview abaixo do conteúdo
- Scroll otimizado para touch

## 🚧 **Próximos Passos para Produção**

### **1. Integração com Motor Real**
- Substituir dados mockados por dados do motor
- Conectar com WebSocket real
- Implementar cálculos em tempo real

### **2. Integração com Formulários**
- Conectar com `OrcamentoForm`
- Conectar com `ProdutoTemplateForm`
- Sincronizar dados em tempo real

### **3. Configurações Avançadas**
- Toggle entre versões (atual vs. nova)
- Personalização de layout
- Exportação de dados

## 🐛 **Solução de Problemas**

### **Erro: "Componente não encontrado"**
- Verifique se `PreviewCalculoV2` está exportado em `index.ts`
- Confirme que o arquivo foi criado corretamente

### **Erro: "Hook não encontrado"**
- Verifique se `useCalculoWebSocket` existe
- Confirme que `formatCurrency` está disponível

### **Layout quebrado**
- Verifique se todos os componentes UI estão instalados
- Confirme que o Tailwind CSS está funcionando

## 📞 **Suporte**

Se encontrar problemas:
1. Verifique o console do navegador
2. Confirme que todas as dependências estão instaladas
3. Verifique se o servidor de desenvolvimento está rodando

---

**Status**: ✅ Pronto para Teste
**Versão**: 2.0
**Última Atualização**: Janeiro 2025
**Responsável**: Equipe de Desenvolvimento ComunikApp
