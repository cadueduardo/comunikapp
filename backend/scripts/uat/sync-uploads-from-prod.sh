#!/usr/bin/env bash
# Copia uploads de produção para o UAT. Nunca o caminho inverso.
set -euo pipefail

SRC="${UAT_UPLOADS_SRC:-/opt/comunikapp/app/backend/uploads/}"
DST="${UAT_UPLOADS_DST:-/srv/apps/comunikapp-uat/shared/uploads/}"

case "$DST" in
  /srv/apps/comunikapp-uat/shared/uploads | /srv/apps/comunikapp-uat/shared/uploads/)
    ;;
  *)
    echo "destino recusado (nao e o UAT): $DST" >&2
    exit 1
    ;;
esac

case "$SRC" in
  /opt/comunikapp/app/backend/uploads | /opt/comunikapp/app/backend/uploads/)
    ;;
  *)
    echo "origem recusada (nao e producao): $SRC" >&2
    exit 1
    ;;
esac

if [[ ! -d "$SRC" ]]; then
  echo "origem ausente: $SRC" >&2
  exit 1
fi

sudo mkdir -p "$DST"
sudo chmod 751 /srv/apps/comunikapp-uat /srv/apps/comunikapp-uat/shared
sudo rsync -a --chmod=Du=rwx,Dg=rx,Do=rx,Fu=rw,Fg=r,Fo=r "$SRC" "$DST"
sudo chown -R comunikapp:comunikapp "$DST"
echo "ok arquivos=$(sudo find "$DST" -type f | wc -l)"
