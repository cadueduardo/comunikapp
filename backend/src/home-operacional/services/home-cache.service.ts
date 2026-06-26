import { Injectable, Logger } from '@nestjs/common';

/**
 * Cache em memoria por chave (`loja_id` na Home) com TTL fixo.
 *
 * Decisao deliberada de NAO usar `@nestjs/cache-manager` na primeira
 * versao da Fase 4:
 * - O dataset eh pequeno (1 entrada por loja, payload em torno de poucos
 *   KB) e a aplicacao roda em um unico processo PM2 em producao.
 * - Mantemos zero dependencias novas e zero infraestrutura externa
 *   (Redis fica para quando houver mais de uma instancia ou se a fase
 *   6+ exigir invalidacao cross-instance).
 * - Disponibilizamos `invalidar(lojaId)` publico para os modulos
 *   downstream (Orcamentos V2, OS, etc.) poderem chamar ao mudar estado.
 *
 * TTL padrao: 60 segundos, conforme docs/fase-0-home-operacional/
 * 02-contratos-home-operacional.md secao "Cache".
 */
@Injectable()
export class HomeCacheService {
  private readonly logger = new Logger(HomeCacheService.name);
  private readonly TTL_MS = 60_000;

  private readonly store = new Map<
    string,
    { gerado_em: number; payload: unknown }
  >();

  /**
   * Le o cache. Retorna `null` se nao houver entrada, estiver expirada ou
   * o consumidor passar `bypass = true`.
   */
  obter<T>(chave: string, bypass = false): T | null {
    if (bypass) {
      return null;
    }

    const entrada = this.store.get(chave);
    if (!entrada) {
      return null;
    }

    const agora = Date.now();
    if (agora - entrada.gerado_em > this.TTL_MS) {
      this.store.delete(chave);
      return null;
    }

    return entrada.payload as T;
  }

  /**
   * Grava no cache. O `gerado_em` retornado deve ser usado no envelope da
   * resposta (`meta.gerado_em`) para o front saber quando o dado foi
   * computado.
   */
  gravar<T>(chave: string, payload: T): { gerado_em: number } {
    const gerado_em = Date.now();
    this.store.set(chave, { gerado_em, payload });
    return { gerado_em };
  }

  /**
   * Remove a entrada do cache, forcando recomputacao na proxima leitura.
   * Pensado para ser chamado por servicos externos (ex.: OSService
   * apos criar uma OS, OrcamentosV2Service apos aprovar um orcamento).
   */
  invalidar(chave: string): void {
    const removido = this.store.delete(chave);
    if (removido) {
      this.logger.debug(`Cache invalidado para chave "${chave}".`);
    }
  }

  /** Remove todas as entradas cuja chave começa com o prefixo informado. */
  invalidarPorPrefixo(prefixo: string): void {
    let removidos = 0;
    for (const chave of [...this.store.keys()]) {
      if (chave.startsWith(prefixo)) {
        this.store.delete(chave);
        removidos++;
      }
    }
    if (removidos > 0) {
      this.logger.debug(
        `Cache invalidado para ${removidos} chave(s) com prefixo "${prefixo}".`,
      );
    }
  }

  /**
   * Util para testes ou diagnostico. Nao expor em rota HTTP.
   */
  limparTudo(): void {
    this.store.clear();
  }
}
