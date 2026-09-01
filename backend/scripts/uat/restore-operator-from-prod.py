#!/usr/bin/env python3
"""Restaura operadores escolhidos de `comunikapp` para `comunikapp_uat`.

Copia e-mail, nome, senha (hash), telefone, status e e-mail da loja.
Não copia 2FA. Não imprime hash nem senha.

Uso (VPS, com sudo mysql via socket):

  sudo python3 backend/scripts/uat/restore-operator-from-prod.py

E-mails: /srv/apps/comunikapp-uat/shared/env/operator-restore.env
  UAT_OPERATOR_EMAILS=operador@dominio.com
"""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

ENV_PATH = Path("/srv/apps/comunikapp-uat/shared/env/operator-restore.env")
EMAIL_RE = re.compile(r"^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$", re.I)


def load_emails(path: Path) -> list[str]:
    if not path.is_file():
        sys.exit(f"arquivo ausente: {path}")
    emails: list[str] = []
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        if key.strip() != "UAT_OPERATOR_EMAILS":
            continue
        for part in value.replace('"', "").replace("'", "").split(","):
            email = part.strip().lower()
            if not email:
                continue
            if not EMAIL_RE.match(email):
                sys.exit(f"e-mail inválido em UAT_OPERATOR_EMAILS: {email}")
            emails.append(email)
    if not emails:
        sys.exit("UAT_OPERATOR_EMAILS vazio")
    return list(dict.fromkeys(emails))


def sql_quote(email: str) -> str:
    return "'" + email.replace("\\", "\\\\").replace("'", "''") + "'"


def mysql_sql(sql: str) -> str:
    result = subprocess.run(
        [
            "mysql",
            "--default-character-set=utf8mb4",
            "-N",
            "-e",
            sql,
        ],
        check=False,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        sys.stderr.write(result.stderr)
        sys.exit(result.returncode)
    return result.stdout


def main() -> None:
    emails = load_emails(ENV_PATH)
    values = ", ".join(f"({sql_quote(e)})" for e in emails)
    sql = f"""
SET SESSION sql_safe_updates = 0;

DROP TEMPORARY TABLE IF EXISTS _uat_operator_emails;
CREATE TEMPORARY TABLE _uat_operator_emails (
  email VARCHAR(255) PRIMARY KEY
) ENGINE=Memory;
INSERT INTO _uat_operator_emails (email) VALUES {values};

SELECT
  CONCAT('prod_encontrados=', COUNT(*))
FROM comunikapp.usuario u
JOIN _uat_operator_emails o ON o.email = u.email;

UPDATE comunikapp_uat.usuario dest
INNER JOIN comunikapp.usuario src ON src.id = dest.id
INNER JOIN _uat_operator_emails o ON o.email = src.email
SET
  dest.email = src.email,
  dest.nome_completo = src.nome_completo,
  dest.nome = src.nome,
  dest.telefone = src.telefone,
  dest.senha = src.senha,
  dest.email_verificado = 1,
  dest.status = src.status,
  dest.ativo = src.ativo,
  dest.codigo_verificacao_email = NULL,
  dest.codigo_verificacao_email_expiracao = NULL,
  dest.two_factor_secret = NULL,
  dest.two_factor_enabled = 0,
  dest.two_factor_confirmed_at = NULL;

SELECT CONCAT('usuarios_restaurados=', ROW_COUNT());

UPDATE comunikapp_uat.loja dest
INNER JOIN comunikapp.loja src ON src.id = dest.id
INNER JOIN comunikapp.usuario u ON u.loja_id = src.id
INNER JOIN _uat_operator_emails o ON o.email = u.email
SET dest.email = src.email;

SELECT CONCAT('lojas_email_restaurado=', ROW_COUNT());

SELECT
  l.slug,
  u.funcao,
  u.status,
  (u.email = src.email) AS email_igual_prod,
  (dest_loja.email = src_loja.email) AS loja_email_igual_prod,
  (u.two_factor_enabled = 0) AS dois_fa_desligado
FROM comunikapp_uat.usuario u
JOIN comunikapp.usuario src ON src.id = u.id
JOIN comunikapp_uat.loja dest_loja ON dest_loja.id = u.loja_id
JOIN comunikapp.loja src_loja ON src_loja.id = dest_loja.id
JOIN comunikapp.loja l ON l.id = u.loja_id
JOIN _uat_operator_emails o ON o.email = src.email;
"""
    sys.stdout.write(mysql_sql(sql))


if __name__ == "__main__":
    main()
