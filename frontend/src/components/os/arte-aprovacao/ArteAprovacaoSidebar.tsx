'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Copy, 
  Mail, 
  CheckCircle, 
  ExternalLink,
  MessageSquare,
  User,
  Send,
  Clock
} from 'lucide-react';
import { useUltimasMensagens } from './hooks/useUltimasMensagens';
import { ModalAprovacaoMultipla } from './components/ModalAprovacaoMultipla';
import { ArteMessagesModal } from './components/ArteMessagesModal';
import { useArteProdutos } from './hooks/useArteProdutos';
import { useArteVersoes } from './hooks/useArteVersoes';
import { toast } from 'sonner';

interface ArteAprovacaoSidebarProps {
  osId: string;
  osNumero?: string; // Número da OS (ex: OS-2025-001)
  onEnviarTodasArtes?: () => void;
  hasVersoesRascunho?: boolean;
}

export function ArteAprovacaoSidebar({ osId, osNumero, onEnviarTodasArtes, hasVersoesRascunho = false }: ArteAprovacaoSidebarProps) {
  const { produtos } = useArteProdutos(osId);
  const { versoes } = useArteVersoes(osId);
  const { ultimasMensagens, loading: loadingMensagens } = useUltimasMensagens(osId);
  
  // Estados para modais
  const [showModalAprovacao, setShowModalAprovacao] = useState(false);
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [selectedProdutoId, setSelectedProdutoId] = useState<string>('');
  const [selectedVersaoId, setSelectedVersaoId] = useState<string>('');

  // Verificar se há múltiplos produtos para aprovação
  const produtosParaAprovacao = produtos.filter(p => p.status === 'ENVIADA_CLIENTE');
  const temMultiplosProdutos = produtosParaAprovacao.length > 1;

  const handleRegistrarAprovacao = () => {
    if (temMultiplosProdutos) {
      setShowModalAprovacao(true);
    } else {
      // Aprovação direta para um produto
      const produto = produtosParaAprovacao[0];
      if (produto) {
        handleAprovarProduto(produto.id);
      }
    }
  };

  const handleAprovarProduto = async (produtoId: string) => {
    try {
      // Buscar versões do produto que estão prontas para aprovação
      const versoesProduto = versoes.filter(v => 
        v.produto_id === produtoId && v.status === 'ENVIADA_CLIENTE'
      );

      if (versoesProduto.length === 0) {
        toast.error('Nenhuma versão encontrada para aprovação');
        return;
      }

      // Aprovar a versão mais recente
      const versaoParaAprovar = versoesProduto[0];
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const response = await fetch(`/api/arte-aprovacao/versoes/${versaoParaAprovar.id}/aprovar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao aprovar versão');
      }

      toast.success('Produto aprovado com sucesso!');
      
      // Recarregar dados
      window.location.reload();
    } catch (error) {
      console.error('Erro ao aprovar produto:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao aprovar produto');
    }
  };

  const handleAprovarMultiplosProdutos = async (produtosIds: string[]) => {
    try {
      // Coletar todas as versões que precisam ser aprovadas
      const versoesParaAprovar: string[] = [];
      
      for (const produtoId of produtosIds) {
        const versoesProduto = versoes.filter(v => 
          v.produto_id === produtoId && v.status === 'ENVIADA_CLIENTE'
        );
        
        if (versoesProduto.length > 0) {
          // Pegar a versão mais recente de cada produto
          versoesParaAprovar.push(versoesProduto[0].id);
        }
      }

      if (versoesParaAprovar.length === 0) {
        throw new Error('Nenhuma versão encontrada para aprovação');
      }

      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const response = await fetch('/api/arte-aprovacao/versoes/aprovar-multiplas', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          versaoIds: versoesParaAprovar
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao aprovar versões');
      }

      const result = await response.json();
      
      if (result.erros && result.erros.length > 0) {
        toast.warning(`${result.aprovadas} produto(s) aprovado(s), mas houve ${result.erros.length} erro(s)`);
        console.error('Erros na aprovação múltipla:', result.erros);
      } else {
        toast.success(`${result.aprovadas} produto(s) aprovado(s) com sucesso!`);
      }

      // Recarregar dados
      window.location.reload();
    } catch (error) {
      console.error('Erro ao aprovar produtos:', error);
      throw error;
    }
  };

  const handleCopiarLinkPublico = async () => {
    try {
      // Buscar versões que precisam de link público
      const versoesParaLink = versoes.filter(v => v.status === 'ENVIADA_CLIENTE');
      
      if (versoesParaLink.length === 0) {
        toast.error('Nenhuma versão encontrada para gerar link público');
        return;
      }

      // Para múltiplas versões, vamos criar um link geral da OS
      // Para uma versão específica, criar link individual
      const versaoParaLink = versoesParaLink[0]; // Primeira versão
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      // Criar link de aprovação
      const response = await fetch('/api/arte-aprovacao/links', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          versao_id: versaoParaLink.id,
          expira_em: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao gerar link público');
      }

      const result = await response.json();
      const linkPublico = `${window.location.origin}/arte/aprovacao/${result.data.token_publico}`;
      
      await navigator.clipboard.writeText(linkPublico);
      toast.success('Link público copiado para a área de transferência!');
    } catch (error) {
      console.error('Erro ao copiar link:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao copiar link');
    }
  };

  const handleReenviarEmail = async () => {
    try {
      // Buscar versões que precisam de notificação
      const versoesParaEmail = versoes.filter(v => v.status === 'ENVIADA_CLIENTE');
      
      if (versoesParaEmail.length === 0) {
        toast.error('Nenhuma versão encontrada para reenvio de email');
        return;
      }

      const versaoParaEmail = versoesParaEmail[0]; // Primeira versão
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      // Criar link de aprovação e enviar email
      const response = await fetch('/api/arte-aprovacao/links', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          versao_id: versaoParaEmail.id,
          expira_em: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
          enviar_email: true, // Flag para enviar email automaticamente
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao reenviar email');
      }

      toast.success('Email reenviado com sucesso!');
    } catch (error) {
      console.error('Erro ao reenviar email:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao reenviar email');
    }
  };

  const handleVerArtePublica = async () => {
    try {
      // Buscar versões que têm link público ativo
      const versoesParaLink = versoes.filter(v => v.status === 'ENVIADA_CLIENTE');
      
      if (versoesParaLink.length === 0) {
        toast.error('Nenhuma versão encontrada com link público');
        return;
      }

      // Se já existe um link, usar ele. Senão, criar um novo
      let linkPublico = '';
      
      // TODO: Verificar se já existe link ativo para esta versão
      // Por enquanto, vamos criar um novo link
      const versaoParaLink = versoesParaLink[0];
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const response = await fetch('/api/arte-aprovacao/links', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          versao_id: versaoParaLink.id,
          expira_em: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao gerar link público');
      }

      const result = await response.json();
      linkPublico = `${window.location.origin}/arte/aprovacao/${result.data.token_publico}`;
      
      window.open(linkPublico, '_blank');
    } catch (error) {
      console.error('Erro ao abrir arte pública:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao abrir arte pública');
    }
  };

  const handleClickMensagem = (mensagem: any) => {
    setSelectedProdutoId(mensagem.produto_id);
    setSelectedVersaoId(mensagem.versao_id || '');
    setShowMessagesModal(true);
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="w-full space-y-6 px-2">
      {/* Aprovação do Cliente */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Aprovação do Cliente</h3>
        
        <div className="space-y-3">
          {/* Botão Enviar Todas as Artes */}
          {hasVersoesRascunho && onEnviarTodasArtes && (
            <Button 
              onClick={onEnviarTodasArtes}
              className="w-full justify-start bg-green-600 hover:bg-green-700 text-left min-w-0"
            >
              <Send className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">Enviar Todas as Artes</span>
            </Button>
          )}
          
          <Button 
            variant="outline" 
            className="w-full justify-start text-left min-w-0"
            onClick={handleCopiarLinkPublico}
          >
            <Copy className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">Copiar link público</span>
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start text-left min-w-0"
            onClick={handleReenviarEmail}
          >
            <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">Reenviar e-mail</span>
          </Button>
          <Button 
            className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-left min-w-0"
            onClick={handleRegistrarAprovacao}
            disabled={produtosParaAprovacao.length === 0}
          >
            <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">
              Registrar aprovação{temMultiplosProdutos ? '...' : ''}
            </span>
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start text-left min-w-0"
            onClick={handleVerArtePublica}
          >
            <ExternalLink className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">Ver arte (link público)</span>
          </Button>
        </div>
      </div>

      {/* Comentários Recentes */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Comentários Recentes</h3>
        
        <div className="space-y-4">
          {loadingMensagens ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : ultimasMensagens.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Nenhuma mensagem ainda</p>
            </div>
          ) : (
            ultimasMensagens.map((mensagem) => (
              <div 
                key={mensagem.id} 
                className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
                onClick={() => handleClickMensagem(mensagem)}
              >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      mensagem.autor_tipo?.toLowerCase() === 'cliente' ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <User className={`h-4 w-4 ${
                        mensagem.autor_tipo?.toLowerCase() === 'cliente' ? 'text-blue-600' : 'text-gray-600'
                      }`} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-sm text-gray-900">{mensagem.autor_nome}</span>
                    <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">{formatarData(mensagem.created_at)}</span>
                    </div>
                    <p 
                      className="text-sm text-gray-700 break-words mb-1"
                      dangerouslySetInnerHTML={{ 
                        __html: mensagem.mensagemProcessada || mensagem.mensagem
                      }}
                    />
                    <p className="text-xs text-gray-500">Produto: {mensagem.produto_nome}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Informações da OS */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações da OS</h3>
        
        <div className="text-sm text-gray-600 space-y-1">
          {osNumero && (
            <div><strong>Número da OS:</strong> {osNumero}</div>
          )}
          <div className="break-all"><strong>OS ID:</strong> {osId}</div>
          <div><strong>Status:</strong> Arte & Aprovação</div>
          <div><strong>Última atualização:</strong></div>
          <div>{new Date().toLocaleString('pt-BR')}</div>
        </div>
      </div>

      {/* Modais */}
      <ModalAprovacaoMultipla
        isOpen={showModalAprovacao}
        onClose={() => setShowModalAprovacao(false)}
        produtos={produtosParaAprovacao}
        onConfirmarAprovacao={handleAprovarMultiplosProdutos}
      />

      <ArteMessagesModal
        isOpen={showMessagesModal}
        onClose={() => {
          setShowMessagesModal(false);
          setSelectedProdutoId('');
          setSelectedVersaoId('');
        }}
        produtoId={selectedProdutoId}
        produtoNome={produtos.find(p => p.id === selectedProdutoId)?.nome || 'Produto'}
        osId={osId}
        versaoId={selectedVersaoId}
      />
    </div>
  );
}

