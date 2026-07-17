*📦 Novidade Comunikapp — Módulo de Produtos (Prateleira)*

Temos uma atualização importante para quem vende itens prontos, revenda ou produtos de catálogo — além dos orçamentos sob medida que vocês já usam.

━━━━━━━━━━━━━━━━━━━━

*🆕 O QUE É O NOVO MÓDULO*

Agora o sistema separa claramente dois tipos de cadastro:

• *Modelos de Orçamento* — produtos sob medida (com insumos, máquinas, geometria e cálculo completo)
• *Produtos* — itens de prateleira/revenda (preço fixo, estoque, foto e SKU)

Isso deixa o catálogo organizado e o orçamento mais rápido para itens que não precisam de engenharia de produção.

━━━━━━━━━━━━━━━━━━━━

*🏷️ CADASTRO DE PRODUTOS (PRATELEIRA)*

*Novo menu:* Produtos

Você pode cadastrar e gerenciar:
• Nome, SKU e categoria
• Preço de venda e preço promocional
• Estoque atual
• Peso e dimensões (logística)
• *Fotos do produto* (upload com múltiplas imagens)
• Descrição resumida (vai no orçamento/PDF) e descrição detalhada (cadastro completo)

*Visualização:*
• Modo *Tabela* ou *Cards* (estilo vitrine/e-commerce)
• No celular: 1 card por linha
• No computador: vários cards lado a lado

━━━━━━━━━━━━━━━━━━━━

*📋 ORÇAMENTO V2 — PRODUTOS DE PRATELEIRA*

No orçamento, cada item pode ser:
• *Sob demanda* — cálculo normal (insumos, máquinas, margem etc.)
• *Produto de prateleira* — preço do catálogo, sem passar pelo motor de custo

*Como usar:*
1. Abra um orçamento V2
2. No item, escolha adicionar produto de prateleira
3. Selecione no catálogo (com foto, preço e estoque)
4. O valor entra direto no total do orçamento

*Benefícios:*
• Orçamento misto: itens sob medida + itens de revenda no mesmo documento
• Preview e PDF com imagem e descrição resumida do produto
• Estoque visível na seleção

━━━━━━━━━━━━━━━━━━━━

*📄 PDF DO ORÇAMENTO (MELHORIAS)*

• Preço dos produtos sob medida *não inclui mais o frete diluído* no unitário
• Linha separada de *Entrega* antes do total, com:
  - Nome da modalidade (ex.: Entrega Própria)
  - Valor cobrado de frete
• Total final continua correto (produtos + entrega)

━━━━━━━━━━━━━━━━━━━━

*💾 MODELOS DE ORÇAMENTO (TEMPLATES)*

Correções e melhorias importantes:
• Salvar modelo *sem trocar o título* pelo nome do produto
• Modelos com *produtos de prateleira* carregam corretamente ao reutilizar
• Snapshot completo dos itens do modelo preservado no banco
• Ordem dos botões ajustada: Cancelar → Salvar como modelo → Salvar rascunho → Aprovar

━━━━━━━━━━━━━━━━━━━━

*🚚 ENTREGA NO ORÇAMENTO*

• Valor cobrado de entrega *persiste ao reabrir rascunho*
• Modalidade de entrega aparece no PDF (não mais texto genérico)
• Nome da modalidade salvo junto com o orçamento

━━━━━━━━━━━━━━━━━━━━

*🧭 ONDE ENCONTRAR NO MENU*

• *Produtos* → catálogo de prateleira (novo)
• *Modelos de Orçamento* → templates sob medida (nome atualizado, mesma função de antes)

━━━━━━━━━━━━━━━━━━━━

*⏳ PRÓXIMAS EVOLUÇÕES (ainda não nesta versão)*

• Baixa automática de estoque na aprovação do orçamento
• Integração com módulo de expedição
• Relatórios de giro de produtos de prateleira

━━━━━━━━━━━━━━━━━━━━

*🔧 EQUIPE TÉCNICA — DEPLOY*

Após publicar em produção:
```
cd backend
npx prisma migrate deploy
pm2 restart <processo-backend>
```

Rebuild do frontend se aplicável.

━━━━━━━━━━━━━━━━━━━━

*✅ EM RESUMO*

Agora dá para vender *produto pronto* e *produto sob medida* no mesmo fluxo, com catálogo visual, preço fixo, estoque e PDF mais claro para o cliente.

Qualquer dúvida na validação ou no uso do novo módulo, estamos à disposição. 🚀
