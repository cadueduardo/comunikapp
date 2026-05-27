# Integração entre Insumos e Estoque

## Objetivo

Permitir que um insumo cadastrado também vire um item controlado no estoque quando a loja decidir controlar saldo físico daquele material.

Antes desta mudança, o cadastro de insumos e o módulo de estoque eram independentes. Isso fazia sentido para insumos apenas referenciais, mas deixava retrabalho quando um material deveria ter saldo, lote, localização e validação em orçamento.

## Comportamento implementado

- O formulário de insumos agora possui a opção **Controlar este insumo no estoque**.
- Ao marcar a opção, o backend cria ou atualiza um registro em `estoque_itens` vinculado ao `insumoId`.
- A criação é transacional: se o insumo falhar, o estoque não é criado; se o estoque falhar, o insumo também não fica salvo parcialmente.
- Se nenhuma localização for informada, o backend usa a primeira localização ativa da loja ou cria uma localização padrão segura para aquela loja.
- Quando há quantidade inicial maior que zero, o sistema cria uma movimentação de entrada em `estoque_movimentacoes`.
- Quando há lote e quantidade inicial, o sistema cria também o lote em `estoque_lotes`.
- A validação de estoque do Orçamento V2 agora consulta primeiro `estoque_itens` e só depois usa as tabelas/campos legados.

## Segurança e isolamento por loja

- Toda consulta de localização, item de estoque e insumo é filtrada por `lojaId`.
- Uma localização de outra loja não pode ser usada no cadastro do insumo.
- As queries novas que usam SQL bruto usam parâmetros seguros do Prisma, sem concatenação de strings.
- O formulário não permite quantidade inicial negativa.
- O backend valida números não negativos e rejeita data de validade inválida.
- A opção de estoque não apaga estoque existente ao desmarcar o controle; isso evita perda acidental de saldo auditável.

## Regras de negócio

- Nem todo insumo precisa ser controlado em estoque.
- Insumos sem controle continuam funcionando como antes.
- O saldo de estoque deve ser alterado preferencialmente por movimentações de estoque, mantendo histórico.
- O cadastro do insumo serve para criar o vínculo inicial e manter metadados como nome, unidade, custo, mínimo, máximo, lote e validade.

## Validações para deploy

1. Executar build/TypeScript do backend.
2. Cadastrar um insumo sem controle de estoque e confirmar que não cria item em `estoque_itens`.
3. Cadastrar um insumo com controle de estoque, quantidade inicial e localização.
4. Confirmar o item criado em Estoque > Itens.
5. Confirmar movimentação inicial em Estoque > Movimentações.
6. Criar orçamento usando esse insumo e confirmar que a validação de estoque usa o saldo do estoque novo.

## Observação de compatibilidade

Não foi necessária nova migration porque as tabelas `estoque_itens`, `estoque_movimentacoes`, `estoque_lotes` e `estoque_localizacoes` já existem no schema atual.
