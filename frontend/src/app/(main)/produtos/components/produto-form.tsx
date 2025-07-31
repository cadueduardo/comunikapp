'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import OrcamentoForm from '@/components/ui/orcamento-form';

interface ProdutoFormProps {
  mode: 'novo' | 'editar';
  initialData?: Record<string, unknown>;
  produtoId?: string;
  onSuccess?: () => void;
}

export default function ProdutoForm({ mode, initialData, produtoId, onSuccess }: ProdutoFormProps) {
  const router = useRouter();

  // Adaptar dados do produto para o formato do orcamento
  const adaptarDadosParaOrcamento = (produtoData: Record<string, unknown>) => {
    if (!produtoData) return undefined;
    
    return {
      cliente_id: 'template', // Cliente ficticio para template
      margem_lucro_customizada: '',
      impostos_customizados: '',
      condicoes_comerciais: '',
      itens_produto: [{
        nome_servico: (produtoData.nome_servico as string) || '',
        quantidade_produto: (produtoData.quantidade_padrao as number)?.toString() || '1',
        descricao: (produtoData.descricao_produto as string) || '',
        largura_produto: (produtoData.largura_produto as number)?.toString() || '',
        altura_produto: (produtoData.altura_produto as number)?.toString() || '',
        unidade_medida_produto: (produtoData.unidade_medida_produto as string) || '',
        area_produto: (produtoData.area_produto as number)?.toString() || '',
        materiais: (produtoData.itens as Array<Record<string, unknown>>)?.map((item) => ({
          insumo_id: item.insumo_id as string,
          quantidade: (item.quantidade as number)?.toString() || '',
        })) || [],
        maquinas: (produtoData.maquinas as Array<Record<string, unknown>>)?.map((maquina) => ({
          maquina_id: maquina.maquina_id as string,
          horas_utilizadas: (maquina.horas_utilizadas as number)?.toString() || '',
        })) || [],
        funcoes: (produtoData.funcoes as Array<Record<string, unknown>>)?.map((funcao) => ({
          funcao_id: funcao.funcao_id as string,
          horas_trabalhadas: (funcao.horas_trabalhadas as number)?.toString() || '',
        })) || [],
      }],
    };
  };

  // Salvar como produto template
  const onSalvarProduto = async (orcamentoData?: Record<string, unknown>) => {
    try {
      const token = localStorage.getItem('access_token');
      const url = mode === 'novo' 
        ? 'http://localhost:3001/produtos'
        : `http://localhost:3001/produtos/${produtoId}`;
      
      const method = mode === 'novo' ? 'POST' : 'PATCH';
      
      // Se nao houver dados do orcamento, usar os dados iniciais
      const dadosParaUsar = orcamentoData || initialData;
      
      // Extrair dados do primeiro item de forma segura
      let primeiroItem: Record<string, unknown> = {};
      
      if (dadosParaUsar && typeof dadosParaUsar === 'object') {
        // Se temos itens_produto, pegar o primeiro
        if (Array.isArray((dadosParaUsar as Record<string, unknown>)?.itens_produto)) {
          primeiroItem = (((dadosParaUsar as Record<string, unknown>).itens_produto as Array<Record<string, unknown>>)[0] || {});
        } else {
          // Se nao temos itens_produto, usar os dados diretamente
          primeiroItem = dadosParaUsar;
        }
      }
      
      // Validar se temos os dados necessarios
      if (!primeiroItem.nome_servico) {
        toast.error('Nome do servico e obrigatorio');
        return;
      }
      
      const dadosProduto = {
        nome: primeiroItem.nome_servico as string, // Usar nome do servico como nome do produto
        categoria: 'Banners', // Categoria padrao, pode ser ajustada depois
        descricao: (primeiroItem.descricao as string) || '',
        nome_servico: primeiroItem.nome_servico as string,
        descricao_produto: (primeiroItem.descricao as string) || '',
        horas_producao: (dadosParaUsar as Record<string, unknown>)?.horas_producao || 0,
        largura_produto: primeiroItem.largura_produto ? Number(primeiroItem.largura_produto) : null,
        altura_produto: primeiroItem.altura_produto ? Number(primeiroItem.altura_produto) : null,
        area_produto: primeiroItem.area_produto ? Number(primeiroItem.area_produto) : null,
        unidade_medida_produto: (primeiroItem.unidade_medida_produto as string) || '',
        quantidade_padrao: primeiroItem.quantidade_produto ? Number(primeiroItem.quantidade_produto) : 1,
        ativo: true,
        itens: (Array.isArray(primeiroItem.materiais) ? primeiroItem.materiais : [])?.map((material: Record<string, unknown>) => ({
          insumo_id: material.insumo_id as string,
          quantidade: Number(material.quantidade as number),
        })) || [],
        maquinas: (Array.isArray(primeiroItem.maquinas) ? primeiroItem.maquinas : [])?.map((maquina: Record<string, unknown>) => ({
          maquina_id: maquina.maquina_id as string,
          horas_utilizadas: Number(maquina.horas_utilizadas as number),
        })) || [],
        funcoes: (Array.isArray(primeiroItem.funcoes) ? primeiroItem.funcoes : [])?.map((funcao: Record<string, unknown>) => ({
          funcao_id: funcao.funcao_id as string,
          horas_trabalhadas: Number(funcao.horas_trabalhadas as number),
        })) || [],
      };
      
      console.log('🔍 Debug - Dados do produto sendo enviados:', dadosProduto);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dadosProduto),
      });

      if (response.ok) {
        toast.success(mode === 'novo' ? 'Produto criado com sucesso!' : 'Produto atualizado com sucesso!');
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/produtos');
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Erro ao salvar produto');
      }
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast.error('Erro ao salvar produto');
    } finally {
      // setLoading(false); // This line was removed as per the edit hint
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {mode === 'novo' ? 'Novo Produto Template' : 'Editar Produto Template'}
          </h1>
          <p className="text-gray-600">
            {mode === 'novo' 
              ? 'Crie um novo template de produto para reutilizacao em orcamentos.'
              : 'Edite as configuracoes do produto template.'
            }
          </p>
        </div>
      </div>

      <OrcamentoForm
        mode="template"
        initialData={initialData ? adaptarDadosParaOrcamento(initialData) : undefined}
        orcamentoId={produtoId}
        onSuccess={onSalvarProduto}
        orcamentoStatus="template"
      />
    </div>
  );
} 