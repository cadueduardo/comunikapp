'use client';
import { useState, useEffect } from 'react';

/**
 * Hook customizado para media queries em React com suporte para SSR (Server-Side Rendering).
 * Evita erros de hidratação no Next.js ao garantir que a verificação da media query
 * só aconteça no lado do cliente após a montagem do componente.
 *
 * @param query A string da media query (ex: "(min-width: 768px)").
 * @returns `true` se a media query corresponder, `false` caso contrário.
 */
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false); // Inicia como `false` para consistência SSR/cliente

  useEffect(() => {
    // A verificação só ocorre no cliente, onde `window` está disponível.
    const mediaQueryList = window.matchMedia(query);

    // Handler para atualizar o estado quando a correspondência da media query muda.
    const listener = () => setMatches(mediaQueryList.matches);

    // Chama o listener uma vez na montagem para definir o estado inicial no cliente.
    listener();

    // Adiciona o listener para futuras mudanças no tamanho da viewport.
    mediaQueryList.addEventListener('change', listener);

    // Cleanup: remove o listener quando o componente é desmontado.
    return () => {
      mediaQueryList.removeEventListener('change', listener);
    };
  }, [query]); // Re-executa o efeito se a query mudar.

  return matches;
}

export default useMediaQuery; 