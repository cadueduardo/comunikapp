'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function TestInsumoPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testInsumoAPI = async () => {
    setLoading(true);
    setResult('Testando...\n');
    
    try {
      const token = localStorage.getItem('access_token');
      setResult(prev => prev + `Token encontrado: ${token ? 'Sim' : 'Não'}\n`);
      
      if (!token) {
        setResult(prev => prev + '❌ Erro: Token não encontrado\n');
        return;
      }

      // Dados de teste para um insumo simples
      const testData = {
        nome: 'Teste Insumo',
        categoriaId: 'test-categoria-id', // Será substituído por um ID real
        fornecedorId: 'test-fornecedor-id', // Será substituído por um ID real
        unidade_compra: 'M2',
        custo_unitario: 10.50,
        quantidade_compra: 1,
        unidade_uso: 'M2',
        fator_conversao: 1,
        logica_consumo: 'area', // Valor válido do enum
        ativo: true
      };

      setResult(prev => prev + `Dados de teste: ${JSON.stringify(testData, null, 2)}\n`);
      
      const response = await fetch('/api/insumos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(testData),
      });

      setResult(prev => prev + `Status: ${response.status}\n`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setResult(prev => prev + `❌ Erro: ${JSON.stringify(errorData, null, 2)}\n`);
        return;
      }

      const data = await response.json();
      setResult(prev => prev + `✅ Sucesso! Insumo criado: ${JSON.stringify(data, null, 2)}\n`);
      
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
          <CardTitle>Teste da API de Insumos</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={testInsumoAPI} disabled={loading}>
            {loading ? 'Testando...' : 'Testar Criação de Insumo'}
          </Button>
          
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Resultado:</h3>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
              {result || 'Clique em "Testar Criação de Insumo" para começar'}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 