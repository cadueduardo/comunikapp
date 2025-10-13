'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Send, 
  Edit, 
  Trash2, 
  User,
  Clock,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface Comentario {
  id: string;
  comentario: string;
  tipo: 'INTERNO' | 'CLIENTE' | 'SISTEMA';
  data_comentario: string;
  usuario: {
    nome: string;
    email: string;
  };
}

interface ArteCommentsPanelProps {
  versaoId: string;
  token?: string; // Para modo público
  readonly?: boolean;
  onCommentAdded?: () => void;
}

export function ArteCommentsPanel({ 
  versaoId, 
  token, 
  readonly = false, 
  onCommentAdded 
}: ArteCommentsPanelProps) {
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [novoComentario, setNovoComentario] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Carregar comentários
  useEffect(() => {
    loadComentarios();
  }, [versaoId, token]);

  const loadComentarios = async () => {
    try {
      setLoading(true);
      
      let url: string;
      let headers: Record<string, string> = {};

      if (token) {
        // Modo público
        url = `/api/arte-aprovacao/comentarios/public/${versaoId}/${token}`;
      } else {
        // Modo autenticado
        url = `/api/arte-aprovacao/comentarios/versao/${versaoId}`;
        headers = {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        };
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      if (data.success) {
        setComentarios(data.data);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
      toast.error('Erro ao carregar comentários');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComentario = async () => {
    if (!novoComentario.trim()) {
      toast.error('Digite um comentário');
      return;
    }

    try {
      setSubmitting(true);
      
      let url: string;
      let body: any;
      let headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        // Modo público
        url = '/api/arte-aprovacao/comentarios/public';
        body = {
          versao_id: versaoId,
          comentario: novoComentario,
          token_publico: token,
        };
      } else {
        // Modo autenticado
        url = '/api/arte-aprovacao/comentarios';
        body = {
          versao_id: versaoId,
          comentario: novoComentario,
          tipo: 'INTERNO',
        };
        headers['Authorization'] = `Bearer ${localStorage.getItem('access_token')}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Comentário adicionado com sucesso!');
        setNovoComentario('');
        loadComentarios();
        onCommentAdded?.();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      toast.error('Erro ao adicionar comentário');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = (comentario: Comentario) => {
    setEditingComment(comentario.id);
    setEditText(comentario.comentario);
  };

  const handleUpdateComment = async (comentarioId: string) => {
    if (!editText.trim()) {
      toast.error('Digite um comentário');
      return;
    }

    try {
      setSubmitting(true);
      
      const response = await fetch(`/api/arte-aprovacao/comentarios/${comentarioId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          comentario: editText,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Comentário atualizado com sucesso!');
        setEditingComment(null);
        setEditText('');
        loadComentarios();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Erro ao atualizar comentário:', error);
      toast.error('Erro ao atualizar comentário');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (comentarioId: string) => {
    if (!confirm('Tem certeza que deseja excluir este comentário?')) {
      return;
    }

    try {
      setSubmitting(true);
      
      const response = await fetch(`/api/arte-aprovacao/comentarios/${comentarioId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Comentário excluído com sucesso!');
        loadComentarios();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Erro ao excluir comentário:', error);
      toast.error('Erro ao excluir comentário');
    } finally {
      setSubmitting(false);
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'INTERNO':
        return 'Interno';
      case 'CLIENTE':
        return 'Cliente';
      case 'SISTEMA':
        return 'Sistema';
      default:
        return tipo;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'INTERNO':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CLIENTE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'SISTEMA':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'INTERNO':
        return <User className="h-3 w-3" />;
      case 'CLIENTE':
        return <MessageSquare className="h-3 w-3" />;
      case 'SISTEMA':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <MessageSquare className="h-3 w-3" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5" />
          <span>Comentários ({comentarios.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Formulário para novo comentário */}
        {!readonly && (
          <div className="space-y-3">
            <Textarea
              placeholder="Adicione um comentário..."
              value={novoComentario}
              onChange={(e) => setNovoComentario(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSubmitComentario}
                disabled={submitting || !novoComentario.trim()}
                size="sm"
              >
                <Send className="h-4 w-4 mr-2" />
                {submitting ? 'Enviando...' : 'Enviar'}
              </Button>
            </div>
          </div>
        )}

        {/* Lista de comentários */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Carregando comentários...</p>
            </div>
          ) : comentarios.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum comentário ainda</p>
              <p className="text-sm">Seja o primeiro a comentar!</p>
            </div>
          ) : (
            comentarios.map((comentario) => (
              <div key={comentario.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Badge className={`text-xs ${getTipoColor(comentario.tipo)}`}>
                      {getTipoIcon(comentario.tipo)}
                      <span className="ml-1">{getTipoLabel(comentario.tipo)}</span>
                    </Badge>
                    <span className="text-sm font-medium">{comentario.usuario.nome}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(comentario.data_comentario).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    
                    {!readonly && !token && comentario.tipo === 'INTERNO' && (
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditComment(comentario)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComment(comentario.id)}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                {editingComment === comentario.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={2}
                      className="resize-none"
                    />
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingComment(null);
                          setEditText('');
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleUpdateComment(comentario.id)}
                        disabled={submitting}
                      >
                        {submitting ? 'Salvando...' : 'Salvar'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {comentario.comentario}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}


