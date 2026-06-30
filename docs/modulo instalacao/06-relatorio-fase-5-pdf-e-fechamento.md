# Relatório de Conclusão — Fase 5: Relatório Técnico em PDF e Split Fiscal

**Status:** ✅ Finalizada — Módulo de Instalações 100% Concluído!  
**Dependência:** Fases 1, 2, 3 e 4 concluídas e aprovadas  

### 1. Arquivos criados ou alterados
| Arquivo | Ação |
|---------|------|
| `backend/prisma/schema.prisma` | Modificado |
| `backend/prisma/migrations/20260630180000_instalacoes_fase5_relatorio_pdf/migration.sql` | Criado |
| `backend/src/financeiro/enums/cobranca-status.enum.ts` | Modificado |
| `backend/src/financeiro/services/status-rollup.service.ts` | Modificado |
| `backend/src/financeiro/services/status-rollup.service.spec.ts` | Modificado |
| `backend/src/instalacao/utils/split-fiscal.util.ts` | Criado |
| `backend/src/instalacao/utils/anexo-url.util.ts` | Criado |
| `backend/src/instalacao/services/instalacao-split-fiscal.service.ts` | Criado |
| `backend/src/instalacao/services/instalacao-split-fiscal.service.spec.ts` | Criado |
| `backend/src/instalacao/services/instalacao-relatorio-pdf.service.ts` | Criado |
| `backend/src/instalacao/services/instalacao-pos-calculo.service.ts` | Modificado |
| `backend/src/instalacao/services/instalacao-pos-calculo.service.spec.ts` | Modificado |
| `backend/src/instalacao/controllers/instalacao.controller.ts` | Modificado |
| `backend/src/instalacao/controllers/instalacao-relatorio.controller.ts` | Criado |
| `backend/src/instalacao/instalacao.module.ts` | Modificado |
| `frontend/src/lib/instalacao/instalacao.types.ts` | Modificado |
| `frontend/src/lib/instalacao/instalacao-api.ts` | Modificado |
| `frontend/src/components/instalacao/InstalacaoSplitFiscalCard.tsx` | Criado |
| `frontend/src/components/instalacao/InstalacaoOsPainel.tsx` | Modificado |
| `frontend/src/app/api/instalacao/os/[osId]/split-fiscal/route.ts` | Criado |
| `frontend/src/app/api/instalacao/os/[osId]/relatorio-tecnico/route.ts` | Modificado |
| `frontend/src/app/api/instalacao/relatorios/[token]/route.ts` | Criado |

### 2. Verificação de regras de negócio e padrões
* [x] Os comandos `npx prisma migrate deploy` e `generate` foram executados com sucesso? **Sim**
* [x] Motor de PDF renderizando dados, assinaturas e imagens de evidência embutidas? **Sim**
* [x] Split Fiscal separando valores de Produto (NF-e) vs Serviço (NFS-e) corretamente? **Sim**
* [x] Gatilho de encerramento liberando a parcela de Saldo e injetando cobranças extras? **Sim**
* [x] Persistência de dados incondicional mantida em todas as alterações e estados? **Sim**
* [x] Codificação UTF-8 preservada em pt-BR para acentuação? **Sim**

### 3. Resumo técnico das implementações

**Motor PDF (`InstalacaoRelatorioPdfService`):** Geração nativa com `pdf-lib`, persistindo em `uploads/anexos/instalacao-relatorios/<loja_id>/<token>.pdf`. O documento é estruturado em cinco blocos: cabeçalho (OS, proposta, itens), mapeamento logístico (`ItemOSInstalacao`), evidências de campo (lotes `CONCLUIDO` com data, recebedor, assinatura e fotos redimensionadas embutidas), ocorrências técnicas (`OcorrenciaInstalacao`) e fechamento financeiro com split fiscal.

**Split fiscal (`InstalacaoSplitFiscalService`):** Lê linhas do orçamento vinculado à OS — insumos (`preco_total`) → NF-e; serviços manuais, máquinas, funções (`custo_total`) e instalação → NFS-e. Ocorrências com `MATERIAL_EXTRA` classificam como PRODUTO; demais tipos (visita improdutiva, serviço adicional, retrabalho) como SERVICO. Resultado persistido em `relatorios_tecnicos_instalacao.split_detalhes` (JSON).

**Handshake financeiro (`gerarRelatorioTecnicoFinal`):** Após PDF gerado com sucesso, em transação única: parcela SALDO passa de `AGUARDANDO_RELATORIO_TECNICO` para `A_FATURAR` com vencimento padrão; soma de `OcorrenciaInstalacao.preco_cliente` gera parcela complementar extra também em `A_FATURAR`; registro em `RelatorioTecnicoInstalacao` e log `RELATORIO_TECNICO_GERADO`.

**Frontend:** `InstalacaoSplitFiscalCard` exibe instruções mastigadas (*Emitir R$ X em NF-e* / *NFS-e*). `InstalacaoOsPainel` reidrata split e metadados do relatório; botão de geração desabilitado após emissão; download do PDF via BFF autenticado.

### 4. Instruções para Validação e Encerramento

**Pré-requisitos:**
```powershell
cd backend
npx prisma migrate deploy
npx prisma generate
npx jest --testPathPattern="instalacao|status-rollup"
```

**Endpoints (gestão, JWT + `loja_id`):**

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/instalacao/os/:osId/split-fiscal` | Preview do split NF-e / NFS-e |
| `GET` | `/instalacao/os/:osId/relatorio-tecnico` | Metadados do relatório emitido (404 se inexistente) |
| `POST` | `/instalacao/os/:osId/relatorio-tecnico` | Gera PDF, libera saldo e cobranças extras |
| `GET` | `/instalacao/relatorios/:token` | Download do PDF timbrado |

**Fluxo visual:**
1. Acesse `/os/:id?tab=instalacao` com OS em instalação concluída (lotes `CONCLUIDO`, evidências registradas).
2. Verifique o card **Split fiscal para emissão externa** com totais NF-e e NFS-e.
3. Clique em **Relatório técnico** → toast de sucesso → botão muda para **Relatório emitido** + **Baixar PDF**.
4. No financeiro, confirme parcela SALDO em `A_FATURAR` e parcela extra (se houver ocorrências cobráveis).
5. Abra o PDF e audite os cinco blocos (endereços, fotos, assinaturas, ocorrências, fechamento).

**Testes automatizados:** 25 testes passando (`instalacao` + `status-rollup`), incluindo liberação de saldo para `A_FATURAR` e segregação fiscal.
