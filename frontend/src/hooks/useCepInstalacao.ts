'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import type { EnderecoLoteForm } from '@/lib/instalacao/instalacao.types';
import { formatarCepInput } from '@/lib/instalacao/instalacao.types';

type BuscarCepFn = (cep: string) => Promise<{
  sucesso: boolean;
  endereco?: {
    logradouro: string;
    complemento: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
  };
  erro?: string;
  permitir_preenchimento_manual: boolean;
}>;

interface UseCepInstalacaoOptions {
  buscarCep: BuscarCepFn;
  onEnderecoPreenchido?: (campos: Partial<EnderecoLoteForm>) => void;
}

export function useCepInstalacao({
  buscarCep,
  onEnderecoPreenchido,
}: UseCepInstalacaoOptions) {
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [modoManual, setModoManual] = useState(false);
  const [erroCep, setErroCep] = useState<string | null>(null);

  const handleCepChange = useCallback(
    async (valor: string, atualizar: (parcial: Partial<EnderecoLoteForm>) => void) => {
      const formatado = formatarCepInput(valor);
      atualizar({ cep: formatado });

      const cepLimpo = formatado.replace(/\D/g, '');
      if (cepLimpo.length !== 8) {
        setErroCep(null);
        return formatado;
      }

      setBuscandoCep(true);
      setErroCep(null);

      try {
        const resultado = await buscarCep(cepLimpo);

        if (resultado.sucesso && resultado.endereco) {
          const campos: Partial<EnderecoLoteForm> = {
            cep: resultado.endereco.cep || formatado,
            logradouro: resultado.endereco.logradouro || '',
            complemento: resultado.endereco.complemento || '',
            bairro: resultado.endereco.bairro || '',
            cidade: resultado.endereco.cidade || '',
            uf: resultado.endereco.uf || '',
          };
          atualizar(campos);
          onEnderecoPreenchido?.(campos);
          setModoManual(false);
          toast.success('Endereço preenchido automaticamente.');
        } else {
          setModoManual(true);
          setErroCep(
            resultado.erro ||
              'CEP não encontrado. Preencha o endereço manualmente.',
          );
          if (resultado.permitir_preenchimento_manual) {
            toast.message('Preencha o endereço manualmente.');
          }
        }
      } catch {
        setModoManual(true);
        setErroCep('Serviço de CEP indisponível. Preencha manualmente.');
        toast.error('CEP indisponível — modo manual ativado.');
      } finally {
        setBuscandoCep(false);
      }

      return formatado;
    },
    [buscarCep, onEnderecoPreenchido],
  );

  return {
    buscandoCep,
    modoManual,
    erroCep,
    setModoManual,
    handleCepChange,
  };
}
