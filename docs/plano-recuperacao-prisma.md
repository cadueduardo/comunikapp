# Plano de Reversão Temporária da Numeração de Documentos

## Contexto
- Commit base: feature/preview-calculo-multiplos-produtos@c09cef7
- Problema: introspecção do Prisma gerou modelos snake_case e removeu `@default(cuid())`, quebrando serviços (`prisma.categoria`, `prisma.insumo`, etc.) do orçamento V2.
- Objetivo: restaurar o schema anterior sem perder melhorias do orçamento V2 e retirar a implementação experimental do `CodigoDocumentoService`.

## Checklist de Ação
- [x] Restaurar `backend/prisma/schema.prisma` para a versão pré-introspecção (commit 810b4e0).
- [x] Executar `npm run db:generate` no backend para reconstruir o Prisma Client com os modelos antigos.
- [x] Remover diretório `backend/src/shared/` criado para o `CodigoDocumentoService` (arquivos `shared.module.ts`, `codigo-documento.service.ts`, `codigo-documento.service.spec.ts`).
- [ ] Validar `npm run start:dev --prefix backend` para garantir que o backend volta a iniciar sem erros de compilação.
- [ ] Revisar impactos residuais no frontend relacionados a códigos/documentação e alinhar nova estratégia antes de reintroduzir a numeração.

## Observações
- As alterações do orçamento V2 permanecem intactas; nenhuma modificação foi feita nos módulos `orcamentos-v2`.
- Caso seja necessário reimplantar a numeração de documentos, planejar migração incremental do schema (novas tabelas e serviços dedicados) sem alterar nomes/IDs existentes.\r\n## Atualizacao set/2025\r\n- [x] Adicionar tabela document_sequences e indice unico Orcamento_loja_id_numero_key.\r\n- [x] Implementar DocumentCodeService isolado e integrar com OrcamentosService.\r\n- [x] Criar modulo DocumentosModule para compartilhar o servico.\r\n- [x] Injetar dependencia nos testes de OrcamentosService.\r\n- [ ] Executar script de backfill das sequencias existentes antes de migrar dados reais.\r\n
