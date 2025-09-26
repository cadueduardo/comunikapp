## Escopo atual (set/2025)

- Foco apenas no modulo de orcamentos V2.
- Codigos seguem o formato ORC-AAAA-NNN por loja com controle anual.
- Sequencias persistidas na tabela document_sequences e gerenciadas pelo servico DocumentCodeService.
- Integracao feita apenas no backend; frontend continua exibindo o campo numero.

### Checklist da Fase 1 (Pronto para QA)
- [x] Criar tabela de sequencia multi-tenant (document_sequences).
- [x] Garantir @@unique([loja_id, numero]) em orcamento.
- [x] Isolar DocumentCodeService e modulo compartilhado.
- [x] Consumir o servico em OrcamentosService (criacao/duplicacao).
- [ ] Popular sequencias legadas (script opcional).
- [ ] Atualizar frontend para exibir formato ORC-AAAA-NNN quando necessario.

### Proximos passos planejados
1. Especificar endpoints de consulta de codigos e rastreabilidade (fase 2).
2. Modelar OS/NF apenas quando os respectivos modulos forem iniciados.
3. Definir plano de migracao de dados reais e roteiro de QA.
# Sistema de Numeração e Rastreabilidade de Documentos

## 📋 Objetivo

Implantar um sistema de numeração e rastreabilidade de documentos (Orçamentos, Ordens de Serviço e Notas Fiscais) que seja escalável, claro e garanta vínculos entre todas as fases do processo, seguindo as premissas de arquitetura modular e multi-tenant do projeto.

## 🎯 Regras de Negócio

### Identificadores Únicos por Tipo
- **Orçamento** → `ORC-AAAA-NNN`
- **Ordem de Serviço** → `OS-AAAA-NNN`
- **Nota Fiscal** → `NF-AAAA-NNN`

### Princípios Fundamentais
- **Nenhum documento compartilha número** - cada tipo segue sua própria sequência
- **Referência obrigatória** - cada documento mantém referência ao documento de origem
- **Rastreabilidade completa** - possível rastrear do orçamento até a nota fiscal e vice-versa
- **Flexibilidade de relacionamentos**:
  - Um Orçamento pode gerar uma ou várias OS
  - Uma OS pode gerar uma ou várias NFs
- **Controle de versões** - revisões de orçamento controladas por sufixo (ex.: `ORC-2025-001-V2`)

## 🏗️ Arquitetura e Implementação

### Estrutura de Dados (Prisma Schema)

```prisma
// ===== ORÇAMENTOS =====
model Orcamento {
  id              String   @id @default(cuid())
  codigo          String   @unique // ORC-2025-001
  cliente_id      String
  loja_id         String   // Multi-tenant isolation
  valor_total     Decimal
  status          OrcamentoStatus
  versao          Int      @default(1)
  orcamento_pai_id String? // Para revisões
  criado_em       DateTime @default(now())
  atualizado_em   DateTime @updatedAt
  
  // Relacionamentos
  cliente         Cliente  @relation(fields: [cliente_id], references: [id])
  loja            Loja     @relation(fields: [loja_id], references: [id])
  ordens_servico  OrdemServico[]
  orcamento_pai   Orcamento? @relation("OrcamentoRevisoes", fields: [orcamento_pai_id], references: [id])
  revisoes        Orcamento[] @relation("OrcamentoRevisoes")
  
  @@map("orcamentos")
  @@index([loja_id, codigo])
  @@index([cliente_id])
}

// ===== ORDENS DE SERVIÇO =====
model OrdemServico {
  id           String   @id @default(cuid())
  codigo       String   @unique // OS-2025-001
  orcamento_id String   // FK obrigatória
  cliente_id   String
  loja_id      String   // Multi-tenant isolation
  valor_total  Decimal
  status       OSStatus
  criado_em    DateTime @default(now())
  atualizado_em DateTime @updatedAt
  
  // Relacionamentos
  orcamento    Orcamento    @relation(fields: [orcamento_id], references: [id])
  cliente      Cliente      @relation(fields: [cliente_id], references: [id])
  loja         Loja         @relation(fields: [loja_id], references: [id])
  notas_fiscais NotaFiscal[]
  
  @@map("ordens_servico")
  @@index([loja_id, codigo])
  @@index([orcamento_id])
  @@index([cliente_id])
}

// ===== NOTAS FISCAIS =====
model NotaFiscal {
  id        String   @id @default(cuid())
  codigo    String   @unique // NF-2025-001
  os_id     String   // FK obrigatória
  cliente_id String
  loja_id   String   // Multi-tenant isolation
  valor_total Decimal
  status    NFStatus
  criado_em DateTime @default(now())
  atualizado_em DateTime @updatedAt
  
  // Relacionamentos
  ordem_servico OrdemServico @relation(fields: [os_id], references: [id])
  cliente       Cliente      @relation(fields: [cliente_id], references: [id])
  loja          Loja         @relation(fields: [loja_id], references: [id])
  
  @@map("notas_fiscais")
  @@index([loja_id, codigo])
  @@index([os_id])
  @@index([cliente_id])
}

// ===== ENUMS =====
enum OrcamentoStatus {
  RASCUNHO
  ENVIADO
  APROVADO
  REJEITADO
  REVISADO
  CONCLUIDO
  CANCELADO
}

enum OSStatus {
  EM_PRODUCAO
  ENTREGUE
  CANCELADA
  PAUSADA
}

enum NFStatus {
  EMITIDA
  CANCELADA
  PAGA
  VENCIDA
}
```

### Serviço de Geração de Códigos

```typescript
// src/shared/services/codigo-documento.service.ts
@Injectable()
export class CodigoDocumentoService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Gera código sequencial para orçamentos
   * Formato: ORC-AAAA-NNN
   */
  async gerarCodigoOrcamento(lojaId: string, ano: number): Promise<string> {
    const prefixo = `ORC-${ano}-`;
    
    const ultimo = await this.prisma.orcamento.findFirst({
      where: { 
        loja_id: lojaId,
        codigo: { startsWith: prefixo }
      },
      orderBy: { codigo: 'desc' }
    });
    
    const proximoNumero = ultimo ? 
      parseInt(ultimo.codigo.split('-')[2]) + 1 : 1;
    
    return `${prefixo}${proximoNumero.toString().padStart(3, '0')}`;
  }

  /**
   * Gera código sequencial para ordens de serviço
   * Formato: OS-AAAA-NNN
   */
  async gerarCodigoOS(lojaId: string, ano: number): Promise<string> {
    const prefixo = `OS-${ano}-`;
    
    const ultimo = await this.prisma.ordemServico.findFirst({
      where: { 
        loja_id: lojaId,
        codigo: { startsWith: prefixo }
      },
      orderBy: { codigo: 'desc' }
    });
    
    const proximoNumero = ultimo ? 
      parseInt(ultimo.codigo.split('-')[2]) + 1 : 1;
    
    return `${prefixo}${proximoNumero.toString().padStart(3, '0')}`;
  }

  /**
   * Gera código sequencial para notas fiscais
   * Formato: NF-AAAA-NNN
   */
  async gerarCodigoNF(lojaId: string, ano: number): Promise<string> {
    const prefixo = `NF-${ano}-`;
    
    const ultimo = await this.prisma.notaFiscal.findFirst({
      where: { 
        loja_id: lojaId,
        codigo: { startsWith: prefixo }
      },
      orderBy: { codigo: 'desc' }
    });
    
    const proximoNumero = ultimo ? 
      parseInt(ultimo.codigo.split('-')[2]) + 1 : 1;
    
    return `${prefixo}${proximoNumero.toString().padStart(3, '0')}`;
  }

  /**
   * Gera código para revisão de orçamento
   * Formato: ORC-AAAA-NNN-VN
   */
  async gerarCodigoRevisaoOrcamento(orcamentoOriginal: string): Promise<string> {
    const base = orcamentoOriginal.split('-V')[0];
    const versaoAtual = orcamentoOriginal.includes('-V') ? 
      parseInt(orcamentoOriginal.split('-V')[1]) + 1 : 2;
    
    return `${base}-V${versaoAtual}`;
  }
}
```

### Serviço de Rastreabilidade

```typescript
// src/shared/services/rastreabilidade.service.ts
@Injectable()
export class RastreabilidadeService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Busca histórico completo de um orçamento
   * Retorna: ORC → OSs → NFs
   */
  async buscarHistoricoOrcamento(orcamentoId: string, lojaId: string) {
    const orcamento = await this.prisma.orcamento.findFirst({
      where: { id: orcamentoId, loja_id: lojaId },
      include: {
        cliente: true,
        ordens_servico: {
          include: {
            notas_fiscais: true
          }
        },
        revisoes: true
      }
    });

    if (!orcamento) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    return {
      orcamento,
      totalOS: orcamento.ordens_servico.length,
      totalNF: orcamento.ordens_servico.reduce((acc, os) => acc + os.notas_fiscais.length, 0),
      valorTotalOS: orcamento.ordens_servico.reduce((acc, os) => acc + Number(os.valor_total), 0),
      valorTotalNF: orcamento.ordens_servico.reduce((acc, os) => 
        acc + os.notas_fiscais.reduce((acc2, nf) => acc2 + Number(nf.valor_total), 0), 0
      )
    };
  }

  /**
   * Busca origem de uma ordem de serviço
   * Retorna: OS → ORC
   */
  async buscarOrigemOS(osId: string, lojaId: string) {
    const os = await this.prisma.ordemServico.findFirst({
      where: { id: osId, loja_id: lojaId },
      include: {
        orcamento: {
          include: { cliente: true }
        },
        cliente: true
      }
    });

    if (!os) {
      throw new NotFoundException('Ordem de serviço não encontrada');
    }

    return os;
  }

  /**
   * Busca origem de uma nota fiscal
   * Retorna: NF → OS → ORC
   */
  async buscarOrigemNF(nfId: string, lojaId: string) {
    const nf = await this.prisma.notaFiscal.findFirst({
      where: { id: nfId, loja_id: lojaId },
      include: {
        ordem_servico: {
          include: {
            orcamento: {
              include: { cliente: true }
            }
          }
        },
        cliente: true
      }
    });

    if (!nf) {
      throw new NotFoundException('Nota fiscal não encontrada');
    }

    return nf;
  }
}
```

## 🔗 Endpoints de Rastreabilidade

### Controller de Rastreabilidade

```typescript
// src/shared/controllers/rastreabilidade.controller.ts
@Controller('rastreabilidade')
@ApiTags('Rastreabilidade de Documentos')
export class RastreabilidadeController {
  constructor(private readonly rastreabilidadeService: RastreabilidadeService) {}

  /**
   * Buscar histórico completo de um orçamento
   */
  @Get('orcamentos/:id/historico')
  @Roles(UserRole.ADMIN, UserRole.GERENTE, UserRole.VENDEDOR)
  @ApiOperation({ summary: 'Buscar histórico completo de um orçamento' })
  @ApiResponse({ status: 200, description: 'Histórico encontrado' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  async buscarHistoricoOrcamento(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const { loja_id } = req.user;
    return await this.rastreabilidadeService.buscarHistoricoOrcamento(id, loja_id);
  }

  /**
   * Buscar origem de uma ordem de serviço
   */
  @Get('ordens-servico/:id/origem')
  @Roles(UserRole.ADMIN, UserRole.GERENTE, UserRole.VENDEDOR)
  @ApiOperation({ summary: 'Buscar origem de uma ordem de serviço' })
  @ApiResponse({ status: 200, description: 'Origem encontrada' })
  @ApiResponse({ status: 404, description: 'Ordem de serviço não encontrada' })
  async buscarOrigemOS(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const { loja_id } = req.user;
    return await this.rastreabilidadeService.buscarOrigemOS(id, loja_id);
  }

  /**
   * Buscar origem de uma nota fiscal
   */
  @Get('notas-fiscais/:id/origem')
  @Roles(UserRole.ADMIN, UserRole.GERENTE, UserRole.VENDEDOR)
  @ApiOperation({ summary: 'Buscar origem de uma nota fiscal' })
  @ApiResponse({ status: 200, description: 'Origem encontrada' })
  @ApiResponse({ status: 404, description: 'Nota fiscal não encontrada' })
  async buscarOrigemNF(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const { loja_id } = req.user;
    return await this.rastreabilidadeService.buscarOrigemNF(id, loja_id);
  }
}
```

## 📊 Exemplo de Fluxo Completo

### Cenário: Orçamento que gera múltiplas OS e NFs

```
ORC-2025-001 (R$ 10.000) - Aprovado
├── OS-2025-001 (R$ 6.000) - Em Produção
│   └── NF-2025-001 (R$ 6.000) - Emitida
└── OS-2025-002 (R$ 4.000) - Em Produção
    └── NF-2025-002 (R$ 4.000) - Emitida
```

### Dados de Rastreabilidade

```json
{
  "orcamento": {
    "codigo": "ORC-2025-001",
    "cliente": "João Silva",
    "valor_total": 10000.00,
    "status": "APROVADO"
  },
  "totalOS": 2,
  "totalNF": 2,
  "valorTotalOS": 10000.00,
  "valorTotalNF": 10000.00,
  "ordens_servico": [
    {
      "codigo": "OS-2025-001",
      "valor_total": 6000.00,
      "status": "EM_PRODUCAO",
      "notas_fiscais": [
        {
          "codigo": "NF-2025-001",
          "valor_total": 6000.00,
          "status": "EMITIDA"
        }
      ]
    },
    {
      "codigo": "OS-2025-002",
      "valor_total": 4000.00,
      "status": "EM_PRODUCAO",
      "notas_fiscais": [
        {
          "codigo": "NF-2025-002",
          "valor_total": 4000.00,
          "status": "EMITIDA"
        }
      ]
    }
  ]
}
```

## 🚀 Benefícios Esperados

### Operacionais
- **Rastreabilidade completa**: ORC → OS → NF
- **Facilidade de comunicação**: Códigos simples e memorizáveis
- **Integridade referencial**: FKs garantem relacionamentos
- **Escalabilidade**: Fácil adicionar novos tipos de documento

### Técnicos
- **Queries eficientes**: Índices otimizados por loja e código
- **Multi-tenant**: Isolamento completo por loja
- **Auditoria**: Logs completos de criação e modificação
- **API consistente**: Endpoints padronizados para rastreabilidade

### Comerciais
- **Cliente sempre referencia o mesmo ORC**: Consistência na comunicação
- **Relatórios consolidados**: Dados agregados por projeto
- **Auditoria completa**: Histórico de todo o ciclo de vida
- **Integração PCP/ERP**: Códigos amigáveis para sistemas externos

## 📋 Tarefas para Implementação

### Fase 1: Estrutura Base
- [ ] Criar schema Prisma com modelos Orcamento, OrdemServico, NotaFiscal
- [ ] Implementar CodigoDocumentoService
- [ ] Criar migrações modulares versionadas
- [ ] Configurar índices para performance

### Fase 2: Serviços de Rastreabilidade
- [ ] Implementar RastreabilidadeService
- [ ] Criar RastreabilidadeController
- [ ] Implementar endpoints de consulta
- [ ] Adicionar validações de multi-tenant

### Fase 3: Integração com Módulos Existentes
- [ ] Modificar OrcamentosV2Service para usar novos códigos
- [ ] Implementar geração automática de códigos
- [ ] Adicionar validações de integridade referencial
- [ ] Criar testes unitários (cobertura ≥ 80%)

### Fase 4: Migração de Dados
- [ ] Script de migração para dados existentes
- [ ] Validação de integridade pós-migração
- [ ] Testes de regressão
- [ ] Documentação de API atualizada

## 🔧 Configurações e Variáveis de Ambiente

```env
# Configuração de códigos de documento
DOCUMENT_CODE_YEAR_START=2025
DOCUMENT_CODE_PADDING=3
DOCUMENT_CODE_PREFIX_ORC=ORC
DOCUMENT_CODE_PREFIX_OS=OS
DOCUMENT_CODE_PREFIX_NF=NF
```

## 📚 Documentação de API

### OpenAPI Specifications
- Todos os endpoints devem ter documentação OpenAPI completa
- Exemplos de payload para cada endpoint
- Códigos de erro padronizados
- Validações de entrada documentadas

### Exemplos de Uso
- Casos de uso comuns documentados
- Fluxos de integração com PCP/ERP
- Troubleshooting de problemas comuns
- Guias de migração de dados

---

**Este documento segue as premissas de arquitetura modular, multi-tenant e melhores práticas definidas no projeto, garantindo escalabilidade, manutenibilidade e integridade dos dados.**



