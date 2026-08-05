'use client';

import { ClientesCarteiraListagem } from '@/components/clientes/ClientesCarteiraListagem';

/**
 * Alias `/clientes` dentro do shell Vendas.
 * Usa a mesma listagem da carteira; escopo padrão propria (menor privilégio).
 * Gestores podem alternar para Todos via seletor de escopo.
 */
export default function ClientesPage() {
  return (
    <ClientesCarteiraListagem
      titulo="Clientes"
      subtitulo="Cadastro mestre da loja, operado dentro de Vendas."
      escopoInicial="propria"
    />
  );
}
