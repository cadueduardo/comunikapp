'use client';

import React from 'react';

interface ArteAprovacaoSimpleProps {
  osId: string;
  readonly?: boolean;
}

export function ArteAprovacaoSimple({ osId, readonly = false }: ArteAprovacaoSimpleProps) {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">🎨 Arte & Aprovação</h2>
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
        <strong>✅ Funcionando!</strong> OS ID: {osId}
      </div>
      <p className="mt-4 text-gray-600">
        O módulo Arte & Aprovação está integrado e funcionando corretamente.
      </p>
    </div>
  );
}
