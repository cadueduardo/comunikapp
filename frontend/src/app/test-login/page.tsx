'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TestLoginPage() {
  const [email, setEmail] = useState('teste3@teste.com');
  const [password, setPassword] = useState('123456');
  const [result, setResult] = useState<string>('');

  const handleTest = async () => {
    try {
      const loginData = { email, password };
      const response = await fetch('/api/lojas/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(prev => prev + `✅ Login bem-sucedido!\nToken: ${data.access_token.substring(0, 50)}...\n\n`);
        
        // Testar endpoint /me
        const meResponse = await fetch('/api/lojas/me', {
          headers: {
            'Authorization': `Bearer ${data.access_token}`,
          },
        });
        
        if (meResponse.ok) {
          const meData = await meResponse.json();
          setResult(prev => prev + `✅ Endpoint /me funcionando! Usuário: ${meData.nome_completo}`);
        } else {
          setResult(prev => prev + `\n❌ Endpoint /me falhou: ${meResponse.status}`);
        }
      } else {
        const data = await response.json();
        setResult(`❌ Login falhou: ${data.message}`);
      }
    } catch (error) {
      setResult(`❌ Erro: ${error}`);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Teste de Login</h1>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        
        <Button onClick={handleTest}>Testar Login</Button>
        
        {result && (
          <pre className="bg-gray-100 p-4 rounded mt-4 whitespace-pre-wrap">
            {result}
          </pre>
        )}
      </div>
    </div>
  );
} 