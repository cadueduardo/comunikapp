# Subdomínio por loja

Especificação para servir cada loja em um hostname próprio
(`{slug}.comunikapp.com.br`), com login já no subdomínio certo.

## Documento principal

- [RP — Subdomínio por loja](./RP-subdominio-por-loja.md)

## Fatias

| Fatia | Conteúdo | Status |
|---|---|---|
| **A** | `loja.slug` + cadastro/endereço (pré-NF) + reformulação `/configuracoes/loja` + onboarding `definir_slug` | em implementação |
| **B** | DNS wildcard, Nginx, middleware tenant-by-host, login no subdomain | depois |
| **C** | Domínio custom do cliente + wizard DNS | depois |

## Objetivo da primeira entrega (Fatia A)

Deixar identidade, URL canônica e dados cadastrais/endereço prontos na loja,
com etapa obrigatória de onboarding para lojas novas e legadas — sem ainda
ativar o runtime de hostname.
