# 🔍 Problema Identificado: Cálculo de Materiais na OS

## 📊 **Situação Atual (Problemática)**

### **Fluxo Atual:**
```
1. Orçamento calcula materiais via Motor V2 ✅
2. Orçamento salva custos_calculados no banco ✅
3. OS é criada a partir do orçamento ✅
4. OS herda custos_calculados como insumos_calculados ✅
5. OS exibe materiais usando insumos_calculados ❌ PROBLEMA AQUI
```

### **O Problema:**
A OS está buscando os cálculos de materiais do campo `insumos_calculados` (que vem do `custos_calculados` do orçamento), mas **não está espelhando exatamente** o que foi definido no orçamento.

## 🔍 **Análise Detalhada do Código**

### **1. Criação da OS (Linha 1948 em os.service.ts):**
```typescript
// OS herda custos_calculados do orçamento
insumos_calculados: dadosOrcamento.custos_calculados,
```

### **2. Exibição na OS (Linhas 1244-1282 em os.service.ts):**
```typescript
// OS busca quantidade nos insumos_calculados
const insumoCalculado = insumosCalculados.find((ic: any) => 
  ic.insumo_id === itemInsumo.insumo.id && ic.produto_nome === produto.nome
);

return {
  quantidade: insumoCalculado?.quantidade_necessaria || itemInsumo.quantidade,
  // ... outros campos
};
```

### **3. Problema Identificado:**
- **OS busca**: `insumoCalculado?.quantidade_necessaria`
- **Orçamento calcula**: Via Motor V2 com lógicas corretas
- **Resultado**: Quantidades irreais na OS

## 🎯 **Causa Raiz**

### **1. Desconexão entre Orçamento e OS:**
- O orçamento calcula corretamente via Motor V2
- A OS não está usando os mesmos cálculos
- A OS está aplicando lógicas diferentes ou incorretas

### **2. Campo `insumos_calculados` mal estruturado:**
- Vem do `custos_calculados` do orçamento
- Pode não conter as quantidades corretas
- Pode estar sendo sobrescrito por cálculos incorretos

### **3. Falta de sincronização:**
- OS não recalcula materiais baseado no orçamento
- OS não verifica se os cálculos estão corretos
- OS não espelha exatamente o que foi aprovado no orçamento

## 🚀 **Solução: OS Deve Espelhar o Orçamento**

### **Princípio Fundamental:**
> **A OS deve ser um espelho exato do orçamento aprovado, sem recálculos ou modificações nos materiais.**

### **Implementação:**

#### **1. Modificar Criação da OS:**
```typescript
// Em os.service.ts - método criarOSDeOrcamento
async criarOSDeOrcamento(
  lojaId: string,
  dadosOrcamento: any,
  usuarioId: string,
): Promise<OrdemServicoData> {
  
  // 1. Buscar orçamento completo com produtos e insumos
  const orcamentoCompleto = await this.prisma.orcamento.findUnique({
    where: { id: dadosOrcamento.orcamento_id },
    include: {
      produtos: {
        include: {
          insumos: {
            include: { insumo: true }
          }
        }
      }
    }
  });

  // 2. Extrair materiais exatos do orçamento
  const materiaisOrcamento = this.extrairMateriaisDoOrcamento(orcamentoCompleto);

  // 3. Criar OS com materiais exatos
  const createDto: CreateOSDto = {
    // ... outros campos
    insumos_calculados: JSON.stringify(materiaisOrcamento), // Materiais exatos do orçamento
  };

  return await this.create(lojaId, createDto);
}
```

#### **2. Extrair Materiais do Orçamento:**
```typescript
private extrairMateriaisDoOrcamento(orcamento: any): InsumoCalculado[] {
  const materiais: InsumoCalculado[] = [];

  orcamento.produtos.forEach(produto => {
    produto.insumos.forEach(itemInsumo => {
      // Usar dados exatos do orçamento
      materiais.push({
        insumo_id: itemInsumo.insumo.id,
        nome: itemInsumo.insumo.nome,
        quantidade_necessaria: itemInsumo.quantidade, // Quantidade exata do orçamento
        unidade: itemInsumo.unidade,
        custo_unitario: itemInsumo.custo_unitario,
        custo_total: itemInsumo.custo_total,
        produto_nome: produto.nome,
        logica_consumo: itemInsumo.insumo.logica_consumo,
        parametros_consumo: itemInsumo.insumo.parametros_consumo
      });
    });
  });

  return materiais;
}
```

#### **3. Modificar Exibição na OS:**
```typescript
// Em formatarOrdemServico - usar dados exatos do orçamento
materiais: produto.insumos?.map(itemInsumo => {
  // Buscar material correspondente nos insumos_calculados
  const insumoCalculado = insumosCalculados.find((ic: any) => 
    ic.insumo_id === itemInsumo.insumo.id && ic.produto_nome === produto.nome
  );

  return {
    id: itemInsumo.insumo.id,
    nome: itemInsumo.insumo.nome,
    // USAR QUANTIDADE EXATA DO ORÇAMENTO
    quantidade: insumoCalculado?.quantidade_necessaria || itemInsumo.quantidade,
    unidade: itemInsumo.unidade,
    categoria: itemInsumo.insumo.categoria?.nome || 'Sem categoria',
    tipo_material: itemInsumo.insumo.tipoMaterial?.nome || null,
    logica_consumo: itemInsumo.insumo.logica_consumo,
    parametros_consumo: itemInsumo.insumo.parametros_consumo ? 
      (typeof itemInsumo.insumo.parametros_consumo === 'string' ? 
        JSON.parse(itemInsumo.insumo.parametros_consumo) : 
        itemInsumo.insumo.parametros_consumo) : null,
    // Adicionar informações de origem
    origem: 'orcamento',
    orcamento_id: os.orcamento_id,
    data_calculo: orcamentoCompleto?.data_ultimo_calculo
  };
}) || [],
```

## 🔧 **Implementação Prática**

### **1. Modificar Interface InsumoCalculado:**
```typescript
export interface InsumoCalculado {
  insumo_id: string;
  nome: string;
  quantidade_necessaria: number;
  unidade: string;
  custo_unitario: number;
  custo_total: number;
  produto_nome: string; // Adicionar nome do produto
  logica_consumo?: string; // Adicionar lógica de consumo
  parametros_consumo?: any; // Adicionar parâmetros
  origem: 'orcamento' | 'os'; // Adicionar origem
  orcamento_id?: string; // Adicionar ID do orçamento
  data_calculo?: Date; // Adicionar data do cálculo
  disponivel_estoque?: boolean;
  quantidade_disponivel?: number;
  localizacao_estoque?: string;
}
```

### **2. Adicionar Validação de Sincronização:**
```typescript
private async validarSincronizacaoOSOrcamento(osId: string): Promise<boolean> {
  const os = await this.prisma.ordemServico.findUnique({
    where: { id: osId },
    include: { orcamento: true }
  });

  if (!os.orcamento_id) return true; // OS sem orçamento

  // Verificar se os materiais da OS correspondem ao orçamento
  const materiaisOS = JSON.parse(os.insumos_calculados || '[]');
  const materiaisOrcamento = await this.extrairMateriaisDoOrcamento(os.orcamento);

  // Comparar quantidades
  for (const materialOS of materiaisOS) {
    const materialOrcamento = materiaisOrcamento.find(m => 
      m.insumo_id === materialOS.insumo_id && m.produto_nome === materialOS.produto_nome
    );

    if (!materialOrcamento || materialOS.quantidade_necessaria !== materialOrcamento.quantidade_necessaria) {
      this.logger.warn(`⚠️ Desincronização detectada: ${materialOS.nome}`);
      return false;
    }
  }

  return true;
}
```

### **3. Adicionar Endpoint de Sincronização:**
```typescript
@Patch(':id/sincronizar-orcamento')
async sincronizarComOrcamento(
  @Param('id') osId: string,
  @Request() req: any
) {
  const user = req['user'] || req.user;
  const lojaId = user.loja_id;

  const os = await this.prisma.ordemServico.findUnique({
    where: { id: osId, loja_id: lojaId },
    include: { orcamento: true }
  });

  if (!os.orcamento_id) {
    throw new BadRequestException('OS não possui orçamento vinculado');
  }

  // Re-extrair materiais do orçamento
  const materiaisAtualizados = await this.extrairMateriaisDoOrcamento(os.orcamento);

  // Atualizar OS
  await this.prisma.ordemServico.update({
    where: { id: osId },
    data: {
      insumos_calculados: JSON.stringify(materiaisAtualizados),
      atualizado_em: new Date()
    }
  });

  return { message: 'OS sincronizada com orçamento', materiais: materiaisAtualizados };
}
```

## 📊 **Exemplo Prático**

### **Orçamento (Correto):**
```json
{
  "produtos": [
    {
      "nome": "Banner",
      "quantidade": 100,
      "insumos": [
        {
          "insumo_id": "insumo_1",
          "nome": "Bobina Lona Impressão Digital",
          "quantidade": 2, // Calculado corretamente pelo Motor V2
          "unidade": "BOBINA",
          "custo_unitario": 700.00,
          "custo_total": 1400.00
        },
        {
          "insumo_id": "insumo_2", 
          "nome": "Cabo De Madeira Para Banner",
          "quantidade": 100, // Calculado corretamente pelo Motor V2
          "unidade": "UN",
          "custo_unitario": 5.00,
          "custo_total": 500.00
        }
      ]
    }
  ]
}
```

### **OS (Atual - Incorreto):**
```json
{
  "insumos_calculados": [
    {
      "insumo_id": "insumo_1",
      "nome": "Bobina Lona Impressão Digital", 
      "quantidade_necessaria": 27, // ❌ Quantidade incorreta
      "unidade": "BOBINA"
    },
    {
      "insumo_id": "insumo_2",
      "nome": "Cabo De Madeira Para Banner",
      "quantidade_necessaria": 100, // ✅ Quantidade correta
      "unidade": "UN"
    }
  ]
}
```

### **OS (Proposta - Correta):**
```json
{
  "insumos_calculados": [
    {
      "insumo_id": "insumo_1",
      "nome": "Bobina Lona Impressão Digital",
      "quantidade_necessaria": 2, // ✅ Espelha exatamente o orçamento
      "unidade": "BOBINA",
      "produto_nome": "Banner",
      "origem": "orcamento",
      "orcamento_id": "orc_123"
    },
    {
      "insumo_id": "insumo_2", 
      "nome": "Cabo De Madeira Para Banner",
      "quantidade_necessaria": 100, // ✅ Espelha exatamente o orçamento
      "unidade": "UN",
      "produto_nome": "Banner",
      "origem": "orcamento",
      "orcamento_id": "orc_123"
    }
  ]
}
```

## 🎯 **Benefícios da Solução**

### **1. Consistência Total:**
- ✅ OS espelha exatamente o orçamento aprovado
- ✅ Quantidades sempre corretas
- ✅ Custos sempre consistentes

### **2. Rastreabilidade:**
- ✅ Origem clara dos cálculos
- ✅ Data do cálculo do orçamento
- ✅ ID do orçamento vinculado

### **3. Manutenibilidade:**
- ✅ Cálculos centralizados no orçamento
- ✅ OS não precisa recalcular
- ✅ Sincronização automática disponível

### **4. Auditoria:**
- ✅ Histórico completo de mudanças
- ✅ Comparação fácil entre orçamento e OS
- ✅ Validação de consistência

## 🚀 **Plano de Implementação**

### **Fase 1: Correção Imediata (1 semana)**
- [ ] Modificar `criarOSDeOrcamento` para extrair materiais exatos
- [ ] Atualizar interface `InsumoCalculado`
- [ ] Modificar `formatarOrdemServico` para usar dados corretos
- [ ] Testes unitários

### **Fase 2: Validação e Sincronização (1 semana)**
- [ ] Implementar validação de sincronização
- [ ] Adicionar endpoint de sincronização
- [ ] Implementar alertas de desincronização
- [ ] Testes de integração

### **Fase 3: Melhorias (1 semana)**
- [ ] Interface para visualizar origem dos cálculos
- [ ] Histórico de sincronizações
- [ ] Relatórios de consistência
- [ ] Documentação completa

## 📝 **Conclusão**

O problema não está na lógica de cálculo do orçamento (que está correta), mas sim na **desconexão entre orçamento e OS**. A solução é fazer a OS espelhar exatamente o que foi calculado e aprovado no orçamento, eliminando recálculos desnecessários e garantindo consistência total.

---

**Documento criado em:** 2025-01-27  
**Versão:** 1.0  
**Status:** Problema Identificado - Solução Proposta  
**Responsável:** Equipe de Desenvolvimento OS/PCP





