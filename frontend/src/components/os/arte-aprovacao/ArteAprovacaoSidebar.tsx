'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Copy, 
  Mail, 
  CheckCircle, 
  ExternalLink,
  MessageSquare,
  User,
  Send
} from 'lucide-react';

interface ArteAprovacaoSidebarProps {
  osId: string;
  onEnviarTodasArtes?: () => void;
  hasVersoesRascunho?: boolean;
}

export function ArteAprovacaoSidebar({ osId, onEnviarTodasArtes, hasVersoesRascunho = false }: ArteAprovacaoSidebarProps) {
  const comentarios = [
    {
      autor: 'Cliente',
      texto: 'Aumentar 10% o logo na fachada lateral.',
      data: '07/10 09:15'
    },
    {
      autor: 'Design',
      texto: 'Aplicado e reenviado na v3.',
      data: '08/10 10:05'
    }
  ];

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
          
          <Button variant="outline" className="w-full justify-start text-left min-w-0">
            <Copy className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">Copiar link público</span>
          </Button>
          <Button variant="outline" className="w-full justify-start text-left min-w-0">
            <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">Reenviar e-mail</span>
          </Button>
          <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-left min-w-0">
            <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">Registrar aprovação</span>
          </Button>
          <Button variant="outline" className="w-full justify-start text-left min-w-0">
            <ExternalLink className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">Ver arte (link público)</span>
          </Button>
        </div>
      </div>

      {/* Comentários */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Comentários</h3>
        
        <div className="space-y-4">
          {comentarios.map((comentario, index) => (
            <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-sm text-gray-900">{comentario.autor}</span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-500">{comentario.data}</span>
                  </div>
                  <p className="text-sm text-gray-700 break-words">{comentario.texto}</p>
                </div>
              </div>
            </div>
          ))}
          
          {/* Botão para adicionar comentário */}
          <div className="pt-4">
            <Button variant="outline" className="w-full justify-start text-left min-w-0">
              <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">Adicionar comentário</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Informações da OS */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações da OS</h3>
        
        <div className="text-sm text-gray-600 space-y-1">
          <div className="break-all"><strong>OS ID:</strong> {osId}</div>
          <div><strong>Status:</strong> Arte & Aprovação</div>
          <div><strong>Última atualização:</strong></div>
          <div>{new Date().toLocaleString('pt-BR')}</div>
        </div>
      </div>
    </div>
  );
}

