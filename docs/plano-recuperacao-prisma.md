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
- Caso seja necessário reimplantar a numeração de documentos, planejar migração incremental do schema (novas tabelas e serviços dedicados) sem alterar nomes/IDs existentes.

## Atualização set/2025

- [x] Adicionar tabela `document_sequences` e índice único `Orcamento_loja_id_numero_key`.
- [x] Implementar DocumentCodeService isolado e integrar com OrcamentosService.
- [x] Criar módulo DocumentosModule para compartilhar o serviço.
- [x] Injetar dependência nos testes de OrcamentosService.
- [ ] Executar script de backfill das sequências existentes antes de migrar dados reais.
