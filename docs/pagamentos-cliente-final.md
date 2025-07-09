# Pagamentos do Cliente Final na Plataforma da Loja

Este documento descreve a arquitetura para permitir que as lojas (clientes do Comunikapp) recebam pagamentos de seus próprios clientes finais através da plataforma.

## Visão Geral

Esta funcionalidade será oferecida como um **módulo opcional** que a loja pode instalar a partir do marketplace interno. Uma vez instalado e configurado, ele permite adicionar um botão de "Pagar Agora" nos orçamentos enviados, facilitando o fechamento do negócio para a loja.

O Comunikapp atua como o orquestrador da transação, mas nunca retém ou processa diretamente o dinheiro do cliente final. Os fundos são transferidos diretamente do cliente final para o gateway de pagamento configurado pela loja.

## Arquitetura Flexível (Padrão de Adaptador)

A mesma arquitetura flexível usada para o pagamento das assinaturas do Comunikapp será reutilizada aqui, garantindo que a loja possa escolher o gateway de sua preferência entre os que oferecemos suporte.

1.  **Configuração pela Loja:**
    - A loja instala o módulo de pagamento.
    - Em uma tela de configuração, a loja escolhe um gateway suportado (ex: Mercado Pago, PagSeguro).
    - A loja insere suas próprias credenciais de API para o gateway escolhido. Essas credenciais são armazenadas de forma segura e criptografada, associadas exclusivamente àquela `loja_id`.

2.  **Fluxo de Pagamento:**
    - Ao gerar um orçamento, o sistema verifica se a loja tem um gateway de pagamento ativo.
    - Se sim, o link do orçamento incluirá uma opção de pagamento online.
    - Quando o cliente final decide pagar, o sistema Comunikapp:
        a. Identifica qual gateway a loja utiliza.
        b. Carrega o **Adaptador** correspondente.
        c. Utiliza as **credenciais da loja** para iniciar a transação.
        d. O cliente final interage com a interface do gateway (ex: checkout do Mercado Pago) para concluir o pagamento.

3.  **Confirmação:**
    - O gateway de pagamento notifica nosso sistema (via webhook) sobre o sucesso da transação.
    - O sistema, então, atualiza o status do orçamento/pedido para "Pago".

Essa arquitetura garante segurança, isolamento de credenciais entre as lojas e a flexibilidade para que cada negócio utilize a ferramenta de pagamento que melhor lhe convier. 