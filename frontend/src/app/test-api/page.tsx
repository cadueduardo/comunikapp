'use client';

import { useState } from 'react';
import { apiRequest, authAPI } from '@/lib/api';

export default function TestAPIPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setResult('Testando conexão...');
    
    try {
      console.log('🔍 Testando conexão com backend...');
      const response = await fetch('/api', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        setResult(`✅ API funcionando!\n\nDados recebidos:\n${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(`❌ API retornou status: ${response.status}`);
      }
    } catch (error) {
      setResult(`❌ Erro ao conectar com a API: ${error}`);
    }
  };

  const testAuth = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setResult('❌ Nenhum token encontrado no localStorage');
        return;
      }

      setResult('🔑 Testando autenticação...\n');
      
      const response = await fetch('/api/lojas/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      console.log('✅ Auth OK:', response.status, data);
      setResult(`Auth OK! Status: ${response.status}\nResposta: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      console.error('❌ Erro de autenticação:', error);
      setResult(`Erro de autenticação: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    setResult('Testando login...');
    
    try {
      console.log('🔍 Testando login...');
      const response = await authAPI.login('test@example.com', 'password');
      console.log('✅ Login OK:', response);
      setResult(`Login OK! Token: ${JSON.stringify(response, null, 2)}`);
    } catch (error) {
      console.error('❌ Erro de login:', error);
      setResult(`Erro de login: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testCORS = async () => {
    setLoading(true);
    setResult('Testando CORS...');
    
    try {
      console.log('🔍 Testando CORS...');
      const response = await fetch('http://localhost:4000/lojas/me', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:4000',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Authorization, Content-Type',
        },
      });
      console.log('✅ CORS OK:', response.status);
      setResult(`CORS OK! Status: ${response.status}\nHeaders: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}`);
    } catch (error) {
      console.error('❌ Erro de CORS:', error);
      setResult(`Erro de CORS: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Teste da API</h1>
      
      <div className="space-y-4">
        <button
          onClick={testConnection}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Testar Conexão
        </button>
        
        <button
          onClick={testCORS}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 ml-2"
        >
          Testar CORS
        </button>
        
        <button
          onClick={testAuth}
          disabled={loading}
          className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:opacity-50 ml-2"
        >
          Testar Autenticação
        </button>
        
        <button
          onClick={testLogin}
          disabled={loading}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50 ml-2"
        >
          Testar Login
        </button>
      </div>
      
      {loading && (
        <div className="mt-4 text-blue-600">
          Testando...
        </div>
      )}
      
      {result && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Resultado:</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
} 