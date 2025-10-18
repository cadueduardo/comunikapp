'use client';

import React from 'react';
import { User, Building2 } from 'lucide-react';

export interface Message {
  id: string;
  autor: string;
  autorTipo: 'cliente' | 'equipe';
  mensagem: string;
  created_at: string;
}

export interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <style jsx global>{`
        .mention {
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
          background-color: #dbeafe;
          color: #1e40af;
          border: 1px solid #bfdbfe;
        }
      `}</style>
      {messages.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          Nenhuma mensagem ainda. Seja o primeiro a enviar!
        </div>
      ) : (
        messages.map((msg) => {
          const isCliente = msg.autorTipo === 'cliente';

          return (
            <div
              key={msg.id}
              className={`flex ${isCliente ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex gap-2 max-w-[75%] ${
                  isCliente ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    isCliente ? 'bg-green-100' : 'bg-blue-100'
                  }`}
                >
                  {isCliente ? (
                    <User className="w-4 h-4 text-green-700" />
                  ) : (
                    <Building2 className="w-4 h-4 text-blue-700" />
                  )}
                </div>

                {/* Message bubble */}
                <div
                  className={`flex flex-col ${
                    isCliente ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      isCliente
                        ? 'bg-green-500 text-white rounded-tr-none'
                        : 'bg-gray-100 text-gray-900 rounded-tl-none'
                    }`}
                  >
                    <div className="text-xs font-semibold mb-1 opacity-75">
                      {msg.autor}
                    </div>
                    <div
                      className="text-sm break-words"
                      dangerouslySetInnerHTML={{ __html: msg.mensagem }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1 px-2">
                    {formatTime(msg.created_at)}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

