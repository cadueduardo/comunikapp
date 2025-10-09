'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Copy, 
  Mail, 
  CheckCircle, 
  ExternalLink,
  MessageSquare,
  User
} from 'lucide-react';

interface ArteAprovacaoSidebarProps {
  osId: string;
}

export function ArteAprovacaoSidebar({ osId }: ArteAprovacaoSidebarProps) {
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
    <div className="w-full lg:w-[25%] space-y-6">
      {/* Aprovação do Cliente */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Aprovação do Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Copy className="h-4 w-4 mr-2" />
              Copiar link público
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Mail className="h-4 w-4 mr-2" />
              Reenviar e-mail
            </Button>
            <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Registrar aprovação
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver arte (link público)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comentários */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Comentários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {comentarios.map((comentario, index) => (
              <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-sm text-gray-900">{comentario.autor}</span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">{comentario.data}</span>
                    </div>
                    <p className="text-sm text-gray-700">{comentario.texto}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Botão para adicionar comentário */}
            <div className="pt-4">
              <Button variant="outline" className="w-full">
                <MessageSquare className="h-4 w-4 mr-2" />
                Adicionar comentário
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações da OS */}
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-gray-600 space-y-1">
            <div><strong>OS ID:</strong> {osId}</div>
            <div><strong>Status:</strong> Arte & Aprovação</div>
            <div><strong>Última atualização:</strong></div>
            <div>{new Date().toLocaleString('pt-BR')}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
