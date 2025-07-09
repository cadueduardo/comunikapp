# Estratégia de Gestão de Pagamentos e Assinaturas

Este documento detalha a estratégia para a gestão de pagamentos de assinaturas do Comunikapp, um pilar fundamental do modelo de negócio SaaS.

## Gateway de Pagamento Inicial: Stripe

O gateway de pagamento escolhido para a implementação inicial é o **Stripe**.
- **Justificativa:** É o padrão de mercado para plataformas SaaS, com excelente documentação, segurança robusta (conformidade PCI), APIs amigáveis para desenvolvedores e um ambiente de testes completo que permite o desenvolvimento de todo o fluxo sem transações reais.

## Arquitetura Flexível e Desacoplada (Padrão de Adaptador)

Para evitar a dependência de um único fornecedor (vendor lock-in) e permitir a troca ou adição de outros gateways de pagamento no futuro (ex: Mercado Pago, Pagar.me), o sistema será construído usando o **Padrão de Adaptador**.

### Como Funciona:

1.  **Interface de Pagamento Interna:** Será definida uma interface de serviço de pagamento dentro do Comunikapp. Esta interface terá métodos genéricos que representam as necessidades do negócio, como `criarAssinatura()`, `cancelarAssinatura()`, `tratarWebhookDePagamento()`.

2.  **Adaptadores Específicos:** Para cada gateway suportado, um "Adaptador" será criado. Este adaptador implementará a nossa interface interna, traduzindo as chamadas genéricas para as chamadas específicas da API daquele gateway.
    - `AdaptadorStripe` implementará `criarAssinatura()` chamando a API do Stripe.
    - Se necessário no futuro, um `AdaptadorMercadoPago` implementará a mesma função `criarAssinatura()` chamando a API do Mercado Pago.

3.  **Configuração Dinâmica:** O restante da aplicação conversará apenas com a nossa interface interna. Uma variável de ambiente no servidor irá definir qual adaptador estará ativo (`GATEWAY_DE_PAGAMENTO_ATIVO="stripe"`). Isso torna a troca de provedor uma questão de configuração, após a construção do novo adaptador.

Essa abordagem garante flexibilidade estratégica para o negócio, isolando a lógica de pagamentos e permitindo futuras mudanças com impacto mínimo no resto do sistema.

## Implementação no Banco de Dados

Para suportar a integração com o gateway, a tabela `lojas` (ou uma tabela `cobranca_assinaturas` relacionada) conterá campos para mapear o estado da assinatura, como:

- `gateway_customer_id` (ex: `stripe_customer_id`)
- `gateway_subscription_id` (ex: `stripe_subscription_id`)
- `subscription_status` (ex: `trialing`, `active`, `past_due`, `canceled`)
- `trial_ends_at`
- `current_period_ends_at`

Isso permite que nosso sistema consulte rapidamente o status de uma assinatura sem precisar chamar a API do gateway a todo momento. O status é mantido sincronizado através de webhooks. 