*📦 Atualização Comunikapp — Jun/2026*

Segue o resumo do que esta entrega traz para o dia a dia da operação:

━━━━━━━━━━━━━━━━━━━━

*📋 ORÇAMENTO*

*Correções*
• Preview de metragem ao carregar produto — área, perímetro e medidas 3D agora calculam corretamente
• Custo do insumo aparece na primeira seleção, sem precisar escolher de novo
• Correção ao salvar orçamento com quantidade maior (ex.: 10 unidades)
• PDF exibe a *forma de pagamento real* configurada no orçamento (não mais texto fixo antigo)
• *Logo da loja* volta a aparecer no PDF do orçamento

*Melhorias*
• *Medidas por insumo* em produtos compostos — cada material pode ter L × A × P próprios, com custo correto e *1 linha só no PDF* para o cliente
• Insumos cadastrados pelo modal do orçamento atualizam o preview de forma mais consistente

━━━━━━━━━━━━━━━━━━━━

*🏷️ CADASTRO DE PRODUTOS (TEMPLATES)*

• Salvar e editar produto sem erro
• *Serviços manuais* passam a ser salvos no template e carregam no orçamento
• *Foto do produto* persiste no cadastro e vem ao carregar no orçamento
• Geometria e medidas do produto salvam corretamente no template

━━━━━━━━━━━━━━━━━━━━

*🎨 ARTE E APROVAÇÃO*

• Status de aprovação atualiza *sem precisar recarregar a página* (F5)
• Correção na exibição de imagens no link público e nas telas internas

━━━━━━━━━━━━━━━━━━━━

*💰 FINANCEIRO*

• Status de cobrança *Prevista* não aparece mais como "Em prospecção" — evita confusão com orçamento em elaboração

━━━━━━━━━━━━━━━━━━━━

*⚙️ CONFIGURAÇÕES DA LOJA*

*Novo:*
• Campo *Comissão padrão do vendedor* em Configurações → Loja (inclui *0%* para quem não usa comissão)
• Onboarding atualizado — etapa inicial inclui comissão junto com margem e impostos
• "Aplicar configuração recomendada" define comissão *0%* por padrão (ajustável depois)

━━━━━━━━━━━━━━━━━━━━

*✨ EXPERIÊNCIA DE USO*

• Botão *Beta* redesenhado — ícone compacto, não cobre mais botões e campos importantes

━━━━━━━━━━━━━━━━━━━━

*⏳ FORA DESTA ENTREGA (próximas versões)*

• Editar/finalizar OS já entregue
• PCP simplificado para produção externa
• Pós-produção: faturamento, NF e entrega
• Produtos de revenda separados de templates
• Cadastro ampliado de fornecedores e alertas

━━━━━━━━━━━━━━━━━━━━

*🔧 Deploy (equipe técnica)*

Após publicar, rodar no servidor:
```
cd backend
npx prisma migrate deploy
```

━━━━━━━━━━━━━━━━━━━━

*Em resumo:* orçamento, produto, PDF, arte e financeiro mais confiáveis no dia a dia — com cálculos corretos, templates que salvam de verdade e comissão configurável na loja.

Qualquer dúvida na validação, estamos à disposição. ✅
