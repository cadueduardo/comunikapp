#!/usr/bin/env bash
# Gate 0S / deploy — confere que HEAD é exatamente o artefato autorizado.
#
# Quando EXPECTED_COMMIT está vazio, a checagem é um no-op (compatibilidade com
# deploys que ainda não fixam o commit). Quando está preenchido, o deploy aborta
# se HEAD divergir ou se o valor for ambíguo (mais de um objeto casa com o
# prefixo).
#
# Uso (após git pull, antes de npm ci / build / backup / migrate):
#   assert_expected_commit
#
# Depende de: git no PATH, cwd = raiz do repositório (ou GIT_DIR apontando).

assert_expected_commit() {
  local expected="${EXPECTED_COMMIT:-}"
  local head resolved

  if [ -z "$expected" ]; then
    return 0
  fi

  # Só hex (prefixo ou hash completo). Qualquer outra forma (ref, tag solta)
  # seria ambígua demais para um artefato de produção.
  case "$expected" in
    *[!0-9a-fA-F]* | '')
      printf '%s\n' "EXPECTED_COMMIT invalido: informe um hash SHA-1 (ou prefixo hex unico)." >&2
      return 1
      ;;
  esac

  if [ "${#expected}" -lt 7 ]; then
    printf '%s\n' "EXPECTED_COMMIT muito curto (${#expected}); use pelo menos 7 hex." >&2
    return 1
  fi

  head="$(git rev-parse HEAD)" || return 1

  # --disambiguate lista todos os objetos que batem com o prefixo. Um unico
  # resultado e o caso feliz; zero ou varios abortam — varios e o "prefixo
  # ambiguo" que o contrato do Gate 0S proibe aceitar.
  # shellcheck disable=SC2207
  local matches
  matches=($(git rev-parse --disambiguate="$expected" 2>/dev/null || true))

  if [ "${#matches[@]}" -eq 0 ]; then
    printf '%s\n' "EXPECTED_COMMIT=${expected} nao resolve nenhum commit neste repositorio." >&2
    return 1
  fi

  if [ "${#matches[@]}" -gt 1 ]; then
    printf '%s\n' "EXPECTED_COMMIT=${expected} e ambiguo (${#matches[@]} correspondencias). Use um prefixo mais longo ou o hash completo." >&2
    return 1
  fi

  resolved="$(git rev-parse --verify "${matches[0]}^{commit}" 2>/dev/null)" || {
    printf '%s\n' "EXPECTED_COMMIT=${expected} nao aponta para um commit." >&2
    return 1
  }

  if [ "$resolved" != "$head" ]; then
    printf '%s\n' "HEAD (${head}) diverge de EXPECTED_COMMIT (${resolved}). Abortando antes de build/backup/migration." >&2
    return 1
  fi

  printf '%s\n' "EXPECTED_COMMIT confirmado: ${head}"
  return 0
}
