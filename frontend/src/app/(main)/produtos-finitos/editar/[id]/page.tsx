'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ProdutoFinitoForm,
  formatCampoNumerico,
} from '@/components/forms/produtos-finitos/ProdutoFinitoForm';
import { produtosFinitosApi } from '@/lib/api-client';

type ModoVinculo = { modo: string };
type EstampaVinculo = { estampa: { id: string } };
type ProcessoVinculo = { processo: { id: string } };

export default function EditarProdutoFinitoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [initialData, setInitialData] = useState<Record<string, unknown> | null>(
    null,
  );

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        const produto = (await produtosFinitosApi.getById(
          params.id,
          token,
        )) as Record<string, unknown>;

        const modos = Array.isArray(produto.modos)
          ? (produto.modos as ModoVinculo[]).map((m) => m.modo)
          : [];
        const estampaIds = Array.isArray(produto.estampas)
          ? (produto.estampas as EstampaVinculo[]).map((v) => v.estampa.id)
          : [];
        const processoIds = Array.isArray(produto.processos)
          ? (produto.processos as ProcessoVinculo[]).map((v) => v.processo.id)
          : [];

        const fulfillment = String(produto.fulfillment_padrao || 'HIBRIDO');
        const fulfillmentPadrao =
          fulfillment === 'ESTOQUE' ||
          fulfillment === 'PRODUCAO' ||
          fulfillment === 'HIBRIDO'
            ? fulfillment
            : 'HIBRIDO';

        setInitialData({
          nome: String(produto.nome || ''),
          descricao_resumida: String(produto.descricao_resumida || ''),
          descricao: String(produto.descricao || ''),
          sku: String(produto.sku || ''),
          ean: String(produto.ean || ''),
          categoriaId: (produto.categoria as { id?: string } | null)?.id || '',
          categoria: produto.categoria,
          preco_venda: String(produto.preco_venda ?? ''),
          preco_promocional: String(produto.preco_promocional ?? ''),
          preco_custo: formatCampoNumerico(produto.preco_custo),
          peso_kg: formatCampoNumerico(produto.peso_kg),
          largura_cm: formatCampoNumerico(produto.largura_cm),
          altura_cm: formatCampoNumerico(produto.altura_cm),
          profundidade_cm: formatCampoNumerico(produto.profundidade_cm),
          estoque_atual: formatCampoNumerico(produto.estoque_atual),
          estoque_minimo: formatCampoNumerico(produto.estoque_minimo),
          ativo: produto.ativo !== false,
          imagens: produto.imagens,
          personalizavel: produto.personalizavel === true,
          fulfillment_padrao: fulfillmentPadrao,
          modo_estampa: modos.includes('ESTAMPA'),
          modo_imprint_livre: modos.includes('IMPRINT_LIVRE'),
          estampa_ids: estampaIds,
          processo_ids: processoIds,
        });
      } catch {
        toast.error('Erro ao carregar produto.');
      }
    })();
  }, [params.id]);

  if (!initialData) {
    return <p className="p-6 text-muted-foreground">Carregando...</p>;
  }

  return (
    <div className="p-2 md:p-0">
      <ProdutoFinitoForm
        produtoId={params.id}
        initialData={initialData as never}
        onSuccess={() => router.push('/produtos-finitos')}
      />
    </div>
  );
}
