# Evidência MySQL — M4.1 a M4.3

**Ambiente:** XAMPP MariaDB `10.4.32` em `localhost:3306` (não é produção).
**Banco:** `comunikapp` (local).
**Nota:** o pedido cita MySQL 8; o ambiente local do projeto é MariaDB 10.4 via XAMPP.
A migration F1 `20260804183000` usa `CAST(... AS JSON)`, incompatível nesse MariaDB;
foi recuperada localmente (colunas já presentes + `migrate resolve --applied`) sem editar o arquivo da migration. Em MySQL 8 a cadeia completa deve aplicar sem esse workaround.

> Esta evidência não fecha o requisito de MySQL 8. A migration M4.4 criada no
> code review também precisa ser incluída no ensaio final.

## Ordem aplicada

1. `20260805120000_vendas_add_responsavel_comercial_cliente`
2. `20260805120100_vendas_add_participantes_e_transferencia_carteira`
3. `20260805120200_vendas_add_contatos_cliente_e_deduplicacao`

(Precedidas no mesmo `migrate deploy` local por M1.3 validade e M1.4 evento, após resolver M1.2.)

## Comprovação (`comprovar-m4-schema-mysql.sql`)

```text
cliente.responsavel_comercial_id = 1
cliente_participante = 1
cliente_transferencia_carteira = 1
cliente_contato = 1
índices normalizados + loja_id+responsavel_comercial_id presentes
colunas documento/email/telefone_normalizado + responsavel_desde presentes
```

## `prisma validate`

Schema válido (executado em 2026-08-05).
