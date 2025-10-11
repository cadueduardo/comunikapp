import { useState, useEffect } from 'react';

interface UltimaMensagem {
  id: string;
  produto_id: string;
  produto_nome: string;
  autor_nome: string;
  autor_tipo: 'CLIENTE' | 'EQUIPE';
  mensagem: string;
  created_at: string;
  versao_id?: string;
}

interface UseUltimasMensagensReturn {
  ultimasMensagens: UltimaMensagem[];
  loading: boolean;
  error: string | null;
  refreshUltimasMensagens: () => Promise<void>;
}

export function useUltimasMensagens(osId: string): UseUltimasMensagensReturn {
  const [ultimasMensagens, setUltimasMensagens] = useState<UltimaMensagem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUltimasMensagens = async () => {
    if (!osId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      // Buscar últimas mensagens por produto
      const response = await fetch(`/api/arte-aprovacao/mensagens/os/${osId}/ultimas-por-produto`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar últimas mensagens');
      }

      const mensagensData = await response.json();
      
      // Converter para o formato esperado
      const ultimasMensagensArray: UltimaMensagem[] = mensagensData.map((msg: any) => ({
        id: msg.id,
        produto_id: msg.produto_id,
        produto_nome: msg.produto_nome,
        autor_nome: msg.autor_nome,
        autor_tipo: msg.autor_tipo,
        mensagem: msg.mensagem,
        created_at: msg.created_at,
        versao_id: msg.versao_id,
      }));

      setUltimasMensagens(ultimasMensagensArray);
    } catch (err) {
      console.error('Erro ao carregar últimas mensagens:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUltimasMensagens();
  }, [osId]);

  return {
    ultimasMensagens,
    loading,
    error,
    refreshUltimasMensagens: fetchUltimasMensagens,
  };
}
