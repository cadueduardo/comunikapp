'use client';

import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ArteMessagesIconProps {
  produtoId: string;
  produtoNome: string;
  mensagensNaoLidas?: number;
  totalMensagens?: number;
  onClick?: () => void;
  className?: string;
}

export function ArteMessagesIcon({ 
  produtoId, 
  produtoNome, 
  mensagensNaoLidas = 0,
  totalMensagens = 0,
  onClick,
  className = ""
}: ArteMessagesIconProps) {
  const hasNotificacao = mensagensNaoLidas > 0;

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClick}
        className="relative p-2 hover:bg-gray-100 rounded-full"
        title={`Mensagens para ${produtoNome}${totalMensagens > 0 ? ` (${totalMensagens})` : ''}${hasNotificacao ? ` - ${mensagensNaoLidas} nova(s)` : ''}`}
      >
        <MessageSquare className="h-5 w-5 text-gray-600" />
        
        {/* Badge de notificação */}
        {hasNotificacao && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs font-bold rounded-full"
          >
            {mensagensNaoLidas > 99 ? '99+' : mensagensNaoLidas}
          </Badge>
        )}
        
        {/* Indicador sutil quando há mensagens mas todas foram lidas */}
        {!hasNotificacao && totalMensagens > 0 && (
          <div className="absolute -top-1 -right-1 h-2 w-2 bg-blue-500 rounded-full"></div>
        )}
      </Button>
    </div>
  );
}
