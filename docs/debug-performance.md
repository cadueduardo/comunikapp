# Debug de Performance - 72 Requests

## Problema Atual
- Ainda há 72 requests sendo feitos
- Editor ainda está travando

## Estratégia de Debug

### Passo 1: Identificar os requests duplicados
Abra o DevTools > Network e filtre por:
1. `versoes/os` - quantos requests?
2. `nao-lidas` - quantos requests?
3. `ultimas-por-produto` - quantos requests?
4. `status-produtos` - quantos requests?
5. `socket.io` - quantas conexões?

### Passo 2: Desabilitar hooks temporariamente para identificar o problema

Edite `ArteAprovacaoTab.tsx` e comente os hooks um por vez:

```typescript
// TESTE 1: Desabilitar useArteMessages
// const { produtosMessages, loading: loadingMessages, refreshMessages } = useArteMessages(osId);

// TESTE 2: Desabilitar useArteProdutos  
// const { produtos, loading: loadingProdutos, error: errorProdutos } = useArteProdutos(osId);

// TESTE 3: Desabilitar useArteVersoes
// const { versoes, loading, error, createVersao, updateVersao, deleteVersao, refreshVersoes } = useArteVersoes(osId);

// TESTE 4: Desabilitar useArteWebSocket
// const { novaMensagem: novaMensagemWS, contadorAtualizado, entrarSalaVersao, sairSalaVersao } = useArteWebSocket(websocketOptions);
```

### Passo 3: Verificar qual hook está causando os requests duplicados

Após cada teste, recarregue a página e conte os requests no Network tab.

### Passo 4: Reportar os resultados

Me informe:
1. Quantos requests cada hook causa?
2. Qual hook está causando mais requests?
3. O editor melhora quando algum hook é desabilitado?

## Possíveis Causas

1. **useArteMessages** fazendo polling excessivo
2. **useArteProdutos** re-executando múltiplas vezes
3. **useArteVersoes** buscando versões repetidamente
4. **useArteWebSocket** criando múltiplas conexões
5. **Componente pai re-renderizando** e causando re-execução dos hooks

## Solução Temporária (Se não quiser fazer os testes)

Posso criar uma versão simplificada do `ArteAprovacaoTab` que usa apenas os dados essenciais, sem os hooks problemáticos, para você testar se o editor melhora.

Você prefere:
A) Fazer os testes de debug acima?
B) Criar uma versão simplificada para testar?
C) Tentar outra abordagem?

