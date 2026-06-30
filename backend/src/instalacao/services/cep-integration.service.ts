import { Injectable, Logger } from '@nestjs/common';

export interface EnderecoViaCep {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  ibge?: string;
}

export interface ResultadoBuscaCep {
  sucesso: boolean;
  endereco?: EnderecoViaCep;
  erro?: string;
  permitir_preenchimento_manual: boolean;
}

interface ViaCepResponse {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  ibge?: string;
  erro?: boolean;
}

@Injectable()
export class CepIntegrationService {
  private readonly logger = new Logger(CepIntegrationService.name);
  private readonly timeoutMs = 8000;

  async buscarEnderecoPorCep(cep: string): Promise<ResultadoBuscaCep> {
    const cepLimpo = cep.replace(/\D/g, '');

    if (cepLimpo.length !== 8) {
      return {
        sucesso: false,
        erro: 'CEP inválido. Informe 8 dígitos ou preencha o endereço manualmente.',
        permitir_preenchimento_manual: true,
      };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(
        `https://viacep.com.br/ws/${cepLimpo}/json/`,
        {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        },
      );

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`ViaCEP respondeu HTTP ${response.status}`);
      }

      const dados = (await response.json()) as ViaCepResponse;

      if (dados.erro) {
        return {
          sucesso: false,
          erro: 'CEP não encontrado. Preencha o endereço manualmente.',
          permitir_preenchimento_manual: true,
        };
      }

      return {
        sucesso: true,
        endereco: {
          cep: this.formatarCep(cepLimpo),
          logradouro: dados.logradouro?.trim() || '',
          complemento: dados.complemento?.trim() || '',
          bairro: dados.bairro?.trim() || '',
          cidade: dados.localidade?.trim() || '',
          uf: (dados.uf?.trim() || '').toUpperCase(),
          ibge: dados.ibge,
        },
        permitir_preenchimento_manual: false,
      };
    } catch (error) {
      this.logger.warn(
        `Falha ao consultar ViaCEP para ${cepLimpo}: ${error instanceof Error ? error.message : String(error)}`,
      );

      return {
        sucesso: false,
        erro: 'Serviço de CEP indisponível no momento. Preencha o endereço manualmente.',
        permitir_preenchimento_manual: true,
      };
    }
  }

  private formatarCep(cepLimpo: string): string {
    return `${cepLimpo.slice(0, 5)}-${cepLimpo.slice(5)}`;
  }
}
