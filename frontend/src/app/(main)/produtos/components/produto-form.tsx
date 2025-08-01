'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ProdutoTemplateForm } from '@/components/ui/produto';

interface ProdutoFormProps {
  mode: 'novo' | 'editar';
  initialData?: Record<string, unknown>;
  onSuccess?: () => void;
}

export default function ProdutoForm({ mode, initialData, onSuccess }: ProdutoFormProps) {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [produtoData, setProdutoData] = useState<Record<string, unknown> | null>(null);

  const produtoId = params?.id as string;

  // Buscar dados do produto se for edição
  useEffect(() => {
    if (mode === 'editar' && produtoId && !initialData) {
      fetchProdutoData();
    }
  }, [mode, produtoId, initialData]);

  const fetchProdutoData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Token de acesso não encontrado');
        return;
      }

      const response = await fetch(`http://localhost:3001/produtos/${produtoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setProdutoData(data);
      } else {
        toast.error('Erro ao carregar dados do produto');
        router.push('/produtos');
      }
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      toast.error('Erro ao carregar dados do produto');
      router.push('/produtos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Carregando produto...</p>
        </div>
      </div>
    );
  }

  return (
    <ProdutoTemplateForm
      mode={mode}
      initialData={initialData || produtoData || undefined}
      produtoId={produtoId}
      onSuccess={onSuccess}
    />
  );
} 