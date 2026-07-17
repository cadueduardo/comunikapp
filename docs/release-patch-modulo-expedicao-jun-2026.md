# Atualização Comunikapp — Módulo de Expedição (Jun/2026)

**Branch:** `feature/modulo-expedicao`  
**Commit de referência:** `ac9daa4`  
**Público:** comunicação com clientes + nota interna de deploy

---

## Versão para WhatsApp / e-mail (copiar e colar)

*📦 Atualização Comunikapp — Expedição e Pós-Produção*

A partir desta versão, o fluxo *da produção até a entrega* fica organizado em um módulo próprio de *Expedição*.

━━━━━━━━━━━━━━━━━━━━

*🚚 NOVO: MÓDULO DE EXPEDIÇÃO*

• Quando a OS é *concluída no PCP*, ela entra automaticamente no *Kanban de Expedição*
• Colunas do fluxo logístico: *Aguardando separação → Pronto para retirada / Em rota / Aguardando instalação → Entregue*
• *Painel lateral* com dados do cliente, endereço, rastreio e histórico da OS
• *Busca* por número da OS, cliente ou código de rastreio
• *Arquivo morto* para expedições já entregues e arquivadas (`/expedicao/arquivo`)
• Item *Expedição* no menu para perfis *Administrador, Produção e Estoque*

━━━━━━━━━━━━━━━━━━━━

*✅ CONCLUIR ENTREGA*

• Registro de *quem recebeu* (nome e documento opcional)
• *Assinatura digital* desenhada na tela (canvas) — salva automaticamente no sistema
• Administrador pode concluir *sem assinatura* quando necessário (fica registrado no histórico da OS)
• Data de entrega ao cliente gravada na OS

━━━━━━━━━━━━━━━━━━━━

*💰 INTEGRAÇÃO COM FINANCEIRO*

• A entrega pode ser *bloqueada* se houver parcelas em aberto ou vencidas
• Tela de bloqueio mostra as pendências e link direto para *Recebimentos*
• Na listagem de recebimentos, a cobrança da OS em questão é *destacada* ao abrir pelo link da expedição

━━━━━━━━━━━━━━━━━━━━

*↩️ DEVOLVER PARA PRODUÇÃO*

• Se algo saiu errado após ir para expedição, é possível *devolver a OS ao PCP* com motivo obrigatório
• A OS volta como *retrabalho* (destaque visual no PCP e na expedição)
• Histórico preservado — não apaga o que já aconteceu

━━━━━━━━━━━━━━━━━━━━

*📁 ARQUIVAR E REUTILIZAR*

• Após *entregue*, a expedição pode ser *arquivada* manualmente (vai para o arquivo morto)
• Opção *Salvar como template*: clona os produtos do orçamento da OS para o cadastro de *Produtos (templates)*, agilizando orçamentos futuros semelhantes

━━━━━━━━━━━━━━━━━━━━

*🏠 HOME E PCP*

• Na Home operacional, coluna *Prontos* agora leva direto à expedição da OS (`/expedicao?os=...`)
• No PCP, cards *Prontos* ficam visíveis por *24 horas* após a conclusão (filtro mais preciso)
• *Badge de retrabalho* quando a OS já voltou da expedição para produção

━━━━━━━━━━━━━━━━━━━━

*🔢 NUMERAÇÃO DE DOCUMENTOS*

• OS criada a partir de orçamento passa a seguir o *mesmo número* do orçamento (ex.: `ORC-2026-010` → `OS-2026-010`)
• OS antigas com numeração diferente continuam normais; o financeiro indica *legado* quando os números não batem

━━━━━━━━━━━━━━━━━━━━

*⏳ FORA DESTA VERSÃO (próximas entregas)*

• PDF de comprovante de entrega com assinatura
• Liberação financeira manual pelo admin na conclusão (override)
• Faturamento / NF no pós-produção

━━━━━━━━━━━━━━━━━━━━

*Em resumo:* produção concluída → expedição organizada em kanban → entrega com assinatura e trava financeira → arquivamento e templates para acelerar o próximo orçamento.

Dúvidas ou feedback? Estamos à disposição.

---

## Detalhamento (referência interna)

| Área | O que mudou |
|------|-------------|
| **Backend** | Novo `ExpedicaoModule`: criação automática pós-PCP/OS, kanban, conclusão, devolução transacional, bloqueio financeiro, upload de assinatura, transformar orçamento em template, WebSocket de atualização |
| **Banco** | Migração `20260625100000_add_modulo_expedicao` — tabela `expedicoes_logistica`, campo `retrabalho` na OS |
| **Frontend** | Páginas `/expedicao` e `/expedicao/arquivo`, kanban, modais (detalhe, concluir, devolver, bloqueio, arquivar, template), canvas de assinatura |
| **Integrações** | PCP (hook + filtro 24h UTC), OS (hook manual), Home (link Prontos), Financeiro (recebimentos com contexto da OS), Produtos (templates) |

---

## Deploy na VPS

### Comando (branch da feature, antes do merge em `main`)

```bash
sudo BRANCH=feature/modulo-expedicao PRISMA_APPLY=migrate bash /srv/apps/comunikapp/releases/current/scripts/deploy-vps.sh
```

### Depois do merge em `main` / `master`

```bash
sudo BRANCH=main PRISMA_APPLY=migrate bash /srv/apps/comunikapp/releases/current/scripts/deploy-vps.sh
```

(Ajuste `BRANCH` se o trunk do repositório for outro nome.)

### Por que `PRISMA_APPLY=migrate`?

O script usa `PRISMA_APPLY=push` por padrão. Nesta entrega existe migração versionada (`20260625100000_add_modulo_expedicao`). Em produção, use **`migrate`** para aplicar com `prisma migrate deploy` — mais seguro e rastreável que `db push`.

### Checklist pós-deploy (uma vez)

1. **Pasta de uploads** — o backend cria automaticamente, mas o usuário do serviço precisa de permissão de escrita:

   ```bash
   sudo mkdir -p /var/comunikapp/anexos/expedicao
   sudo chown -R comunikapp:comunikapp /var/comunikapp/anexos
   ```

   Se não usar `COMUNIKAPP_ANEXOS_DIR`, o fallback é `uploads/anexos` dentro do projeto — garanta permissão nesse caminho.

2. **Variável opcional** — `COMUNIKAPP_ANEXOS_DIR` em `/srv/apps/comunikapp/shared/env/backend.env` (mesma já usada para anexos de geometria no orçamento). Nenhuma variável nova é obrigatória.

3. **Smoke test** — após o restart:
   - Login e menu *Expedição* visível
   - `GET /expedicao` retorna 200 (não 502)
   - Concluir uma entrega de teste e confirmar arquivo em `.../expedicao/<loja_id>/*.png`

4. **CORS** (se Nginx na frente) — validar `OPTIONS` e `POST` com `Origin` conforme checklist de produção.

### O que o script faz (7 passos)

1. `git pull` da branch informada  
2. `npm ci` backend  
3. `npm ci` frontend  
4. Prisma (`migrate deploy` com `PRISMA_APPLY=migrate`)  
5. Build backend + frontend  
6. `npm prune --omit=dev`  
7. Restart `comunikapp-backend` e `comunikapp-frontend` (systemd)

---

## Roteiro rápido de UAT (validação antes de avisar clientes)

1. Criar orçamento → aprovar → gerar OS  
2. Concluir todos os setores no PCP  
3. Abrir *Expedição* — card deve aparecer  
4. Mover no kanban → *Concluir entrega* com assinatura no canvas  
5. Se houver parcela em aberto, confirmar bloqueio e link para *Recebimentos*  
6. *Arquivar* → conferir em */expedicao/arquivo*  
7. (Opcional) *Salvar template* → conferir em */produtos*  
8. *Devolver para produção* em outra OS de teste → badge retrabalho no PCP  

---

*Documento gerado para a release do módulo de Expedição — Jun/2026.*
