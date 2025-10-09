'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText } from 'lucide-react';

interface ArteAprovacaoTabTestProps {
  osId: string;
  readonly?: boolean;
}

export function ArteAprovacaoTabTest({ osId, readonly = false }: ArteAprovacaoTabTestProps) {
  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">🎨 Arte & Aprovação</CardTitle>
            {!readonly && (
              <div className="flex space-x-2">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Versão
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Conteúdo de teste */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">🎉 Módulo Arte & Aprovação Ativo!</p>
            <p className="text-sm mb-4">
              OS ID: <code className="bg-gray-100 px-2 py-1 rounded">{osId}</code>
            </p>
            <div className="space-y-2 text-sm text-left max-w-md mx-auto">
              <p>✅ Backend: Funcionando</p>
              <p>✅ Frontend: Integrado</p>
              <p>✅ API Routes: Configuradas</p>
              <p>✅ Componentes: Criados</p>
              <p>✅ Hooks: Implementados</p>
              <p>🔄 Próximo: Implementar funcionalidades visuais</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
