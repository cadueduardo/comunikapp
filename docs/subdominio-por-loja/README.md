# Subdomínio por loja

Especificação para servir cada loja em um hostname próprio
(`{slug}.comunikapp.com.br`), com login já no subdomínio certo.

## Documento principal

- [RP — Subdomínio por loja](./RP-subdominio-por-loja.md)

## Objetivo da primeira entrega

Permitir que empresas com proxy/firewall liberem acesso apenas ao hostname da
sua loja, sem depender do apex genérico `comunikapp.com.br` após o go-live da
feature.

## Fora de escopo (esta pasta)

- Domínio customizado do cliente (`app.cliente.com.br`) — fase posterior.
- Painel de gestão SaaS (`docs/gestao-comunikapp/`) — consome o slug, mas não
  define o runtime de tenant-by-host.
