'use client';

import React from 'react';
import { ClienteFicha } from '@/components/clientes/cliente-ficha';

export default function ClienteFichaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  return <ClienteFicha clienteId={id} />;
}
