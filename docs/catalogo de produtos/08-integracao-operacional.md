# 08 — Integração operacional (OS, PCP, expedição, estoque)

**Versão:** 0.1  
**Data:** 2026-06-26

---

## 1. Visão por modo de fulfillment

| Modo comercial | Pick (estoque) | Make (PCP) | Expedição |
|----------------|----------------|------------|-----------|
| Sem personalização | Sim | Não | Após separar |
| Estampa catalogada | Reservar base | Sim (processo da estampa) | Após personalizar |
| Imprint livre | Opcional | Sim | Após personalizar |
| Arte sob medida | — | Sim + ciclo arte | Após aprovar |

---

## 2. Roteamento na OS (por item)

Cada `ItemOS` derivado de produto finito personalizado deve carregar:

- `modo_fulfillment`: `PICK` | `MAKE` | `HIBRIDO`
- `personalizacao_modo`: espelho do orçamento
- `estampa_id` / `processo_id` / `valores_personalizacao`

### 2.1 Elegibilidade PCP (alinhado ao já implementado)

Item elegível para liberação PCP quando:

- Prazo de produção definido
- Materiais OK (se aplicável)
- Arte OK **por item**: sem arte OU `status_arte` ∈ {APROVADA, ARQUIVO_RECEBIDO, NAO_APLICA}
- Para estampa VDP com variáveis validadas: `status_arte` pode nascer `APROVADA` ou `NAO_APLICA` (decisão)

### 2.2 Produto só estoque

- `modo_fulfillment = PICK`
- **Não** liberar para PCP
- Após aprovação OS → fila **expedição** / separação

---

## 3. Arte & Aprovação

| Origem | Passa pela fila de arte? |
|--------|--------------------------|
| Estampa VDP (só variáveis) | Geralmente **não** — prova automática |
| Imprint livre com upload | **Sim** |
| Imprint só texto | Configurável por processo |
| Arte sob medida | **Sim** — ciclo completo |

**Arte de produção** para estampa: gerar arquivo (mestra + valores) e anexar ao item/OS.

---

## 4. PCP

- Card no kanban por item que `modo_fulfillment` inclui MAKE.
- Workflow pode ser sugerido pelo `setor_pcp_sugerido` do processo.
- Produto pick **não** aparece no kanban PCP.

Integração com liberação parcial já existente: liberar caneca estampada e deixar adesivo pendente na mesma OS.

---

## 5. Expedição

- Item PICK: disponível para separação quando OS aprovada / estoque reservado.
- Item HIBRIDO: expedir só quando personalização concluída **e** base separada.
- OS mista: expedição parcial por item (alinhado a expedição por produto).

---

## 6. Estoque

### v1

- Baixa de `produto_finito.estoque_atual` na expedição ou separação (política a alinhar).
- Personalização não baixa insumos de processo automaticamente.

### v2 (futuro)

- Vínculo `produto_finito` ↔ `estoque_itens` para SKU único.
- Reserva no momento da aprovação da OS.

---

## 7. Diagrama OS mista (exemplo)

```
OS #1042
├── Item 1: Caneca + Estampa 2     → HIBRIDO → PCP (silk) → Expedição
├── Item 2: Caneca sem personalizar → PICK → Expedição direta
└── Item 3: Adesivo (modelo calc.) → MAKE → Arte → PCP
```

Status OS agregado: **Parcialmente liberada** (já suportado).

---

## 8. Eventos / notificações (sugestão)

- Estampa VDP pronta para produção → notificar setor silk (sem passar arte cliente).
- Falha validação campo → bloquear liberação com motivo “Arte pendente”.

---

## 9. Critérios de aceite (operacional)

- [ ] Caneca sem personalização não entra no PCP.
- [ ] Caneca com estampa entra no PCP com processo correto.
- [ ] Liberação parcial por item respeita elegibilidade por arte.
- [ ] Expedição não envia item híbrido antes da personalização concluída.
