'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home, Mail } from 'lucide-react';

export default function ArteAprovacaoSucessoPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="max-w-md mx-auto">
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Aprovação Processada!
          </h1>
          
          <p className="text-gray-600 mb-6">
            Sua resposta foi enviada com sucesso. O designer será notificado e entrará em contato em breve.
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={() => window.close()}
              className="w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              Fechar Janela
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.location.href = 'mailto:contato@comunikapp.com'}
              className="w-full"
            >
              <Mail className="h-4 w-4 mr-2" />
              Entrar em Contato
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 mt-6">
            Obrigado por usar o sistema de aprovação da Comunikapp!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


