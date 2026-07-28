# Subdomínio por loja

Especificação para servir cada loja em um hostname próprio
(`{slug}.comunikapp.com.br`), com login já no subdomínio certo.

## Documento principal

- [RP — Subdomínio por loja](./RP-subdominio-por-loja.md)
- [Runbook Cloudflare for SaaS](./CF-saas-runbook.md) (Fatia D)

## Fatias

| Fatia | Conteúdo | Status |
|---|---|---|
| **A** | `loja.slug` + cadastro/endereço (pré-NF) + reformulação `/configuracoes/loja` + onboarding `definir_slug` | feito |
| **B** | Runtime tenant-by-host (DNS wildcard, Nginx, middleware, CORS, login) | feito |
| **B+** | Polimento UX (modal, `#acesso-url` + highlight, 404 estável) | feito |
| **C** | Domínio custom (wizard DNS + verify + `slug_anterior` 301) | feito |
| **D** | HTTPS domínio próprio via Cloudflare for SaaS Free (só subdomínio do cliente) | em implementação |

## Objetivo da primeira entrega (Fatia A)

Deixar identidade, URL canônica e dados cadastrais/endereço prontos na loja,
com etapa obrigatória de onboarding para lojas novas e legadas — sem ainda
ativar o runtime de hostname.
