'use client';

import { ClientesCarteiraListagem } from '@/components/clientes/ClientesCarteiraListagem';

/** Casa comercial da carteira — default Minha carteira (escopo propria). */
export default function VendasCarteiraPage() {
  return (
    <ClientesCarteiraListagem
      titulo="Minha carteira"
      subtitulo="Clientes sob sua responsabilidade comercial e escopos autorizados."
      escopoInicial="propria"
    />
  );
}
