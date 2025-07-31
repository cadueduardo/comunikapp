'use client';

import ProdutoForm from '../components/produto-form';

export default function NovoProdutoPage() {
  return (
    <div className="p-6">
      <ProdutoForm 
        mode="novo"
        onSuccess={() => {
          // Redirecionamento será feito pelo próprio componente
        }}
      />
    </div>
  );
} 