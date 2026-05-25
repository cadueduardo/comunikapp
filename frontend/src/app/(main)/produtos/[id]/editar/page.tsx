'use client';

import { useParams } from 'next/navigation';
import ProdutoForm from '../../components/produto-form';

export default function EditarProdutoPage() {
  const params = useParams();
  const produtoId = params.id as string;

  return (
    <div className="p-6">
      <ProdutoForm 
        mode="editar"
        produtoId={produtoId}
      />
    </div>
  );
} 