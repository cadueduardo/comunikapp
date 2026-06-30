import { Injectable } from '@nestjs/common';
import { ModalidadeExpedicao } from '../enums/modalidade-expedicao.enum';

@Injectable()
export class ExpedicaoModalidadeMapper {
  /**
   * Override: instalação necessária sempre prevalece sobre modalidade de entrega.
   */
  resolver(params: {
    nomeModalidadeEntrega?: string | null;
    instalacaoNecessaria: boolean;
  }): ModalidadeExpedicao {
    if (params.instalacaoNecessaria) {
      return ModalidadeExpedicao.INSTALACAO_NO_LOCAL;
    }

    return this.mapearPorPalavraChave(params.nomeModalidadeEntrega);
  }

  private mapearPorPalavraChave(nome?: string | null): ModalidadeExpedicao {
    const texto = this.normalizar(nome ?? '');

    if (!texto) {
      return ModalidadeExpedicao.RETIRADA_CLIENTE;
    }

    if (
      texto.includes('transportadora') ||
      texto.includes('correios') ||
      texto.includes('envio externo')
    ) {
      return ModalidadeExpedicao.ENTREGA_TRANSPORTADORA;
    }

    if (
      texto.includes('motoboy') ||
      texto.includes('entrega propria') ||
      texto.includes('entrega própria') ||
      (texto.includes('entrega') && !texto.includes('retirada'))
    ) {
      return ModalidadeExpedicao.ENTREGA_FROTA_PROPRIA;
    }

    if (
      texto.includes('retirada') ||
      texto.includes('balcao') ||
      texto.includes('balcão')
    ) {
      return ModalidadeExpedicao.RETIRADA_CLIENTE;
    }

    return ModalidadeExpedicao.RETIRADA_CLIENTE;
  }

  private normalizar(valor: string): string {
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}
