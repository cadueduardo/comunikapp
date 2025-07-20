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
      const response = await fetch('http://localhost:3001');
      const data = await response.text();
      setResult(`Conexão OK! Status: ${response.status}\nResposta: ${data}`);
    } catch (error) {
      setResult(`Erro de conexão: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testAuth = async () => {
    setLoading(true);
    setResult('Testando autenticação...');
    
    try {
      const response = await apiRequest('/lojas/me');
      const data = await response.text();
      setResult(`Auth OK! Status: ${response.status}\nResposta: ${data}`);
    } catch (error) {
      setResult(`Erro de autenticação: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    setResult('Testando login...');
    
    try {
      const response = await authAPI.login('test@example.com', 'password');
      setResult(`Login OK! Token: ${JSON.stringify(response, null, 2)}`);
    } catch (error) {
      setResult(`Erro de login: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Teste da API</h1>
      
      <div className="space-y-4">
        <button
          onClick={testConnection}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Testar Conexão
        </button>
        
        <button
          onClick={testAuth}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 ml-2"
        >
          Testar Autenticação
        </button>
        
        <button
          onClick={testLogin}
          disabled={loading}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 ml-2"
        >
          Testar Login
        </button>
      </div>
      
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Resultado:</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {result}
        </pre>
      </div>
    </div>
  );
} 