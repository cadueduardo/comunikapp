> **Documento substituído:** use `docs/modulo fornecedores/plano-acao-matriz-insumo-fornecedor.md`. Este arquivo permanece como origem histórica e não deve orientar implementação.

# 🏢 Especificação Técnica: Módulo de Fornecedores & Matriz de Insumos

Este documento define a reestruturação do cadastro de fornecedores no Comunikapp para suportar múltiplos fornecedores por insumo, evitando a duplicação de cadastros físicos no estoque e provendo rastreabilidade histórica.

---

## 1. Banco de Dados `schema.prisma`)

Substitua o modelo simplificado de `fornecedor` e implemente a tabela de relacionamento `InsumoFornecedor` para gerenciar a precificação dinâmica e vinculação de terceiros.

```prisma

enum TipoFornecedor {

  INSUMO        // Fornece matéria-prima (lona, vinil, tintas, chapas)

  TERCEIRIZADO  // Executa produção ou instalação externa

  AMBOS

}

model fornecedor {

  id                String             @id @default(cuid())

  loja_id           String

  nome              String             // Nome fantasia ou marca

  razao_social      String?            // Razão social (V2)

  cnpj_cpf          String?            // Identificação fiscal

  tipo              TipoFornecedor     @default(INSUMO)

  ativo             Boolean            @default(true)

  // Contatos

  contato_nome      String?

  telefone          String?

  whatsapp          String?

  email             String?

  // Endereço

  cep               String?

  endereco          String?

  numero            String?

  complemento       String?

  bairro            String?

  cidade            String?

  estado            String?

  // Especialidades (Serviços que o parceiro realiza, ex: ["fachadas", "instalacao", "router"])

  especialidades    Json?

  // Relacionamentos

  loja              loja               @relation(fields: [loja_id], references: [id], onDelete: Cascade)

  insumos_associados InsumoFornecedor[]

  ordens_terceiros  OrdemTerceirizacao[]

  createdAt         DateTime           @default(now())

  updatedAt         DateTime           @updatedAt

  @@unique([loja_id, nome])

  @@index([loja_id])

}

model InsumoFornecedor {

  insumo_id     String

  fornecedor_id String

  preco_custo   Decimal    @db.Decimal(10, 2)

  codigo_ref    String?    // Código SKU ou referência do item no catálogo do fornecedor

  padrao        Boolean    @default(false)

  // Relacionamentos

  insumo        Insumo     @relation(fields: [insumo_id], references: [id], onDelete: Cascade)

  fornecedor    fornecedor @relation(fields: [fornecedor_id], references: [id], onDelete: Cascade)

  createdAt     DateTime   @default(now())

  updatedAt     DateTime   @updatedAt

  @@id([insumo_id, fornecedor_id])

  @@index([insumo_id])

  @@index([fornecedor_id])

}

```




## 2. Backend (NestJS)

### 2.1 Fornecedores Controller & Service

Crie endpoints RESTful básicos para gerenciar CRUD de fornecedores em `fornecedores.controller.ts` e `fornecedores.service.ts` injetando o contexto de `loja_id`.

### 2.2 Endpoint de Vinculação de Preços do Insumo

Em `insumos.controller.ts`, adicione a rota para gerenciar a matriz de preços:



@Patch(':insumoId/fornecedores')

async atualizarFornecedoresInsumo(

  @Param('insumoId') insumoId: string,

  @Headers('x-loja-id') lojaId: string,

  @Body() data: { fornecedor_id: string; preco_custo: number; codigo_ref?: string; padrao: boolean }[]

) {

  return this.insumosService.updateFornecedores(insumoId, lojaId, data);

}



No `insumos.service.ts`:

1. Use uma transação do Prisma (`$transaction`).
2. Delete os vínculos antigos do `insumo_id`.
3. Insira os novos vínculos vindos do array. Se `padrao: true` for passado em algum item, garanta que todos os outros sejam salvos como `padrao: false`.

## 3. Frontend (Next.js / React)

### 3.1 Tela Lateral Dedicada `/fornecedores`

Substitua modais flutuantes por uma listagem de alta densidade no menu lateral.

- Inclua filtros rápidos por `TipoFornecedor` (Insumos, Terceirizados ou Ambos).
- Card de fornecedor com botão de clique rápido para abrir chat direto no WhatsApp: `window.open(`https://wa.me/${fornecedor.whatsapp.replace(/\D/g, '')}`, '_blank')`

### 3.2 Cadastro de Insumo (Painel de Custos Multi-Fornecedor)

Na edição de um `Insumo` no estoque, adicione a seção **"Fornecedores Disponíveis"**:

- Um componente dinâmico de tabela onde o usuário seleciona um fornecedor de uma lista suspensa (dropdown), define o preço de custo e preenche o SKU de referência do parceiro.
- Um botão de rádio (*Radio button*) para marcar quem é o fornecedor **Padrão/Preferencial**.

[+] Adicionar Linha de Fornecedor ---------------------------------------------------------------------- | Fornecedor | Preço Custo (R$) | Código Ref | Padrão | Ações| |---------------------|------------------|------------|--------|------| | [ Fornecedor A ] | [ R$ 15,00 ] | [ VIN-12 ] | (o) | [X] | | [ Fornecedor B ] | [ R$ 18,00 ] | [ CO-559 ] | ( ) | [X] | ----------------------------------------------------------------------
