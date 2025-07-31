'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestProdutosPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testProdutosAPI = async () => {
    setLoading(true);
    setResult('Testando...\n');
    
    try {
      const token = localStorage.getItem('access_token');
      setResult(prev => prev + `Token encontrado: ${token ? 'Sim' : 'Não'}\n`);
      
      if (!token) {
        setResult(prev => prev + '❌ Erro: Token não encontrado\n');
        return;
      }

      setResult(prev => prev + `Token: ${token.substring(0, 20)}...\n`);
      
      const response = await fetch(`http://localhost:3001/produtos`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      setResult(prev => prev + `Status: ${response.status}\n`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setResult(prev => prev + `❌ Erro: ${JSON.stringify(errorData, null, 2)}\n`);
        return;
      }

      const data = await response.json();
      setResult(prev => prev + `✅ Sucesso! Produtos encontrados: ${data.length}\n`);
      setResult(prev => prev + `Dados: ${JSON.stringify(data, null, 2)}\n`);
      
    } catch (error) {
      setResult(prev => prev + `❌ Erro: ${error}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Teste da API de Produtos</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={testProdutosAPI} disabled={loading}>
            {loading ? 'Testando...' : 'Testar API'}
          </Button>
          
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Resultado:</h3>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
              {result || 'Clique em "Testar API" para começar'}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 