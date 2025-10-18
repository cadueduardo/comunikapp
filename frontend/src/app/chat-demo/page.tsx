'use client';

import React, { useState } from 'react';
import { ChatInterface, Message } from '@/components/chat';
import { MentionItem } from '@/components/ui/tiptap';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ChatDemoPage() {
  // Mock data - Versões disponíveis para menção
  const mockMentions: MentionItem[] = [
    { id: 'v1', label: 'V1 - Banner Aprovação' },
    { id: 'v2', label: 'V2 - Adesivo Laminado' },
    { id: 'v3', label: 'V3 - Flyer Promocional' },
  ];

  // Mock data - Mensagens iniciais
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      autor: 'Gráfica XYZ',
      autorTipo: 'equipe',
      mensagem:
        'Olá! Enviamos a primeira versão do <span class="mention">@V1 - Banner Aprovação</span> para sua análise.',
      created_at: new Date(Date.now() - 60000).toISOString(),
    },
    {
      id: '2',
      autor: 'Carlos Eduardo',
      autorTipo: 'cliente',
      mensagem: 'Obrigado! Vou analisar e retorno em breve.',
      created_at: new Date(Date.now() - 30000).toISOString(),
    },
  ]);

  // Usuário atual (mock)
  const currentUser = {
    nome: 'Gráfica XYZ',
    tipo: 'equipe' as const,
  };

  const handleSendMessage = (content: string) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      autor: currentUser.nome,
      autorTipo: currentUser.tipo,
      mensagem: content,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMessage]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Dashboard</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Chat de Aprovação - Demonstração
          </h1>
          <p className="text-gray-600">
            Interface de chat com sistema de menções usando Tiptap
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="text-sm font-semibold text-blue-900 mb-2">
            💡 Como usar:
          </h2>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Digite <strong>@</strong> para mencionar uma versão</li>
            <li>• Use as <strong>setas ↑↓</strong> para navegar nas opções</li>
            <li>• Pressione <strong>Enter</strong> para selecionar</li>
            <li>• Pressione <strong>Shift+Enter</strong> para quebra de linha</li>
            <li>• Pressione <strong>Enter</strong> para enviar</li>
          </ul>
        </div>

        {/* Chat Interface */}
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          mentions={mockMentions}
          currentUser={currentUser}
        />

        {/* Technical Info */}
        <div className="mt-6 bg-white rounded-lg shadow p-4 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            📋 Informações Técnicas:
          </h3>
          <div className="text-xs text-gray-600 space-y-1">
            <p>
              <strong>Editor:</strong> Tiptap (baseado em ProseMirror)
            </p>
            <p>
              <strong>Menções:</strong> @tiptap/extension-mention
            </p>
            <p>
              <strong>Dropdown:</strong> Tippy.js
            </p>
            <p>
              <strong>Estado:</strong> React useState (ready for integration)
            </p>
            <p>
              <strong>Próximos passos:</strong> Integrar com WebSocket e API de
              mensagens
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

