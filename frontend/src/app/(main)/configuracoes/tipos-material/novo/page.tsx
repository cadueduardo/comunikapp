'use client';

import { TipoMaterialForm } from '../tipo-material-form';

export default function NovoTipoMaterialPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Adicionar Novo Tipo de Material</h1>
        <p className="text-gray-600">Configure um novo tipo de material para cálculo automático.</p>
      </div>
      
      <TipoMaterialForm />
    </div>
  );
} 