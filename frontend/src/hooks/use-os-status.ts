'use client';

import { useState, useEffect } from 'react';

interface ArteVersao {
  id: string;
  status: string;
  aprovado_por_cliente: boolean;
  liberado_para_pcp: boolean;
  versao: string;
}

/**
 * Hook para buscar o status dinâmico da OS baseado nas versões de arte
 */
export function useOsStatus(osId: string) {
  const [statusTexto, setStatusTexto] = useState<string>('Carregando...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const buscarStatus = async () => {
      if (!osId) {
        setStatusTexto('Em análise de materiais e aguardando aprovação final.');
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          setStatusTexto('Em análise de materiais e aguardando aprovação final.');
          setLoading(false);
          return;
        }

        // Buscar versões de arte da OS
        const response = await fetch(`/api/arte-aprovacao/versoes/os/${osId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Erro ao buscar versões de arte');
        }

        const versoes: ArteVersao[] = await response.json();

        // Analisar versões para determinar status
        let status = 'Em análise de materiais e aguardando aprovação final.';

        if (versoes.length === 0) {
          status = 'Aguardando upload de arte.';
        } else {
          // Verificar se há arte aprovada pelo designer mas não pelo cliente
          const arteAprovadaDesigner = versoes.some(
            v => v.status === 'APROVADA' && !v.aprovado_por_cliente && !v.liberado_para_pcp
          );

          if (arteAprovadaDesigner) {
            status = 'Arte aprovada pelo designer, aguardando liberação para PCP.';
          } else {
            // Verificar se há arte liberada para PCP
            const arteLiberadaPCP = versoes.some(v => v.liberado_para_pcp);

            if (arteLiberadaPCP) {
              status = 'Arte liberada para PCP, pronto para produção.';
            } else {
              // Verificar se há arte enviada ao cliente
              const arteEnviadaCliente = versoes.some(v => v.status === 'ENVIADA_CLIENTE');

              if (arteEnviadaCliente) {
                status = 'Aguardando aprovação do cliente.';
              } else {
                // Verificar se há arte em revisão
                const arteRevisao = versoes.some(v => v.status === 'REVISAO_SOLICITADA');

                if (arteRevisao) {
                  status = 'Cliente solicitou revisão de arte, aguardando correções.';
                } else {
                  // Verificar se há arte em rascunho
                  const arteRascunho = versoes.some(v => v.status === 'RASCUNHO');

                  if (arteRascunho) {
                    status = 'Arte em desenvolvimento, aguardando envio ao cliente.';
                  }
                }
              }
            }
          }
        }

        setStatusTexto(status);
      } catch (error) {
        console.error('Erro ao buscar status da OS:', error);
        setStatusTexto('Em análise de materiais e aguardando aprovação final.');
      } finally {
        setLoading(false);
      }
    };

    buscarStatus();
  }, [osId]);

  return { statusTexto, loading };
}






