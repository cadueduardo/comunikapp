'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { TiptapEditor, MentionItem } from '@/components/ui/tiptap';
import { MessageList, Message } from './MessageList';
import { Button } from '@/components/ui/button';

export interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  mentions?: MentionItem[];
  currentUser?: {
    nome: string;
    tipo: 'cliente' | 'equipe';
  };
}

export function ChatInterface({
  messages,
  onSendMessage,
  mentions = [],
  currentUser = { nome: 'Equipe', tipo: 'equipe' },
}: ChatInterfaceProps) {
  const [messageContent, setMessageContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageContent.trim()) return;

    onSendMessage(messageContent);
    setMessageContent('');
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <h2 className="text-lg font-semibold text-gray-900">
          Chat de Aprovação
        </h2>
        <p className="text-sm text-gray-600">
          Converse com o cliente sobre as versões da arte
        </p>
      </div>

      {/* Messages */}
      <MessageList messages={messages} />
      <div ref={messagesEndRef} />

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <div className="flex gap-2">
          <div className="flex-1">
            <TiptapEditor
              content={messageContent}
              onUpdate={setMessageContent}
              onSubmit={handleSendMessage}
              placeholder="Digite @ para mencionar uma versão..."
              mentions={mentions}
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!messageContent.trim()}
            className="self-end"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

