
# 🛠️ Solução para o erro `Cannot find module '../../generated/client'`

## 💡 Problema
Ao rodar o sistema, aparece o seguinte erro:

```
Error: Cannot find module '../../generated/client'
Require stack:
- .../estoque-prisma-client.util.js
...
```

## 🎯 Objetivo
Corrigir o caminho de importação do Prisma Client para evitar erro no build e execução.

---

## ✅ Solução recomendada

### 1. Verificar e corrigir o import no arquivo TypeScript

No arquivo `src/estoque/utils/estoque-prisma-client.util.ts`, **substitua**:

```ts
import { PrismaClient } from '../../generated/client';
```

**por**:

```ts
import { PrismaClient } from '@prisma/client';
```

---

### 2. Garantir que o Prisma Client esteja gerado corretamente

Execute o comando:

```bash
npx prisma generate
```

Este comando vai gerar o Prisma Client na pasta padrão `node_modules/@prisma/client`.

---

### 3. Verificar o `schema.prisma`

No arquivo `prisma/schema.prisma`, verifique se o bloco do `generator` está assim:

```prisma
generator client {
  provider = "prisma-client-js"
  // Remover ou comentar a linha abaixo se estiver presente:
  // output   = "../../generated/client"
}
```

Se estiver usando o output customizado, altere para o padrão ou veja a próxima seção alternativa.

---

## ⚙️ Alternativa: Manter client em `generated/client`

Se você **precisa** manter o Prisma Client em `generated/client`, adicione um script para copiar esse client no build:

### No `package.json`

```json
"scripts": {
  "build": "tsc && cp -r src/generated dist/generated"
}
```

E mantenha o import como está:

```ts
import { PrismaClient } from '../../generated/client';
```

---

## 🧪 Teste final

1. Rode o build: `npm run build`
2. Inicie a aplicação: `npm run start:prod`
3. Verifique se o erro desapareceu.

---

## ✅ Resultado esperado

Sistema funcionando sem o erro:

```
Error: Cannot find module '../../generated/client'
```

---

## 📌 Observação

Utilizar o caminho padrão `@prisma/client` simplifica o projeto e evita erros comuns com caminhos relativos.
