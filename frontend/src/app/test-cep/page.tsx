'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Loader2, MapPin, CheckCircle } from "lucide-react";
import { toast } from 'sonner';

export default function TestCepPage() {
  const [cep, setCep] = useState('');
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [enderecoEncontrado, setEnderecoEncontrado] = useState<any>(null);

  // Formatar CEP
  const formatarCep = (cep: string) => {
    const apenasNumeros = cep.replace(/\D/g, '');
    if (apenasNumeros.length <= 5) {
      return apenasNumeros;
    }
    return apenasNumeros.slice(0, 5) + '-' + apenasNumeros.slice(5, 8);
  };

  // Buscar endereço por CEP
  const buscarCep = async () => {
    const cepLimpo = cep.replace(/\D/g, '');
    
    if (cepLimpo.length !== 8) {
      toast.error('CEP deve ter 8 dígitos');
      return;
    }

    setBuscandoCep(true);
    setEnderecoEncontrado(null);
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        toast.error('CEP não encontrado');
        return;
      }

      setEnderecoEncontrado(data);
      toast.success('📍 Endereço encontrado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast.error('Erro ao buscar CEP. Verifique sua conexão.');
    } finally {
      setBuscandoCep(false);
    }
  };

  const handleCepChange = (value: string) => {
    const cepFormatado = formatarCep(value);
    setCep(cepFormatado);
    
    // Buscar automaticamente quando CEP estiver completo
    const cepLimpo = value.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      setTimeout(() => {
        buscarCep();
      }, 500);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">🧪 Teste da API dos Correios</h1>
        <p className="text-gray-600">Teste a busca automática de endereços por CEP usando a API ViaCEP</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Busca de Endereço por CEP
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* CEP Input */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="test-cep">Digite um CEP</Label>
              <div className="relative">
                <Input
                  id="test-cep"
                  placeholder="00000-000"
                  value={cep}
                  onChange={(e) => handleCepChange(e.target.value)}
                  maxLength={9}
                  className={`${buscandoCep ? 'pr-10' : ''}`}
                />
                {buscandoCep && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  </div>
                )}
              </div>
            </div>
            <div className="md:col-span-2">
              <Button
                type="button"
                onClick={buscarCep}
                disabled={buscandoCep || !cep || cep.replace(/\D/g, '').length !== 8}
                className="w-full h-fit mt-6"
              >
                {buscandoCep ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Buscar Endereço
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Resultado da Busca */}
          {enderecoEncontrado && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                <h3 className="font-semibold">Endereço Encontrado!</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-green-800">CEP</Label>
                  <div className="font-mono text-sm p-2 bg-white rounded border">
                    {enderecoEncontrado.cep}
                  </div>
                </div>
                <div>
                  <Label className="text-green-800">Logradouro</Label>
                  <div className="text-sm p-2 bg-white rounded border">
                    {enderecoEncontrado.logradouro || 'Não informado'}
                  </div>
                </div>
                <div>
                  <Label className="text-green-800">Bairro</Label>
                  <div className="text-sm p-2 bg-white rounded border">
                    {enderecoEncontrado.bairro || 'Não informado'}
                  </div>
                </div>
                <div>
                  <Label className="text-green-800">Cidade</Label>
                  <div className="text-sm p-2 bg-white rounded border">
                    {enderecoEncontrado.localidade || 'Não informado'}
                  </div>
                </div>
                <div>
                  <Label className="text-green-800">Estado</Label>
                  <div className="text-sm p-2 bg-white rounded border">
                    {enderecoEncontrado.uf || 'Não informado'}
                  </div>
                </div>
                <div>
                  <Label className="text-green-800">DDD</Label>
                  <div className="text-sm p-2 bg-white rounded border">
                    {enderecoEncontrado.ddd || 'Não informado'}
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-3 rounded border">
                <Label className="text-green-800">JSON Completo da Resposta:</Label>
                <pre className="text-xs mt-2 overflow-x-auto">
                  {JSON.stringify(enderecoEncontrado, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Instruções */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">📋 Instruções para Teste:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Digite um CEP válido</strong> (ex: 01310-100, 20040-020, 04567-890)</li>
              <li>• <strong>Formatação automática:</strong> O CEP será formatado automaticamente</li>
              <li>• <strong>Busca automática:</strong> A busca acontece automaticamente quando você digita 8 números</li>
              <li>• <strong>Feedback visual:</strong> Veja o loading e mensagens de sucesso/erro</li>
              <li>• <strong>Dados completos:</strong> Todos os dados retornados pela API são exibidos</li>
            </ul>
          </div>

          {/* CEPs de Exemplo */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">🎯 CEPs de Exemplo para Teste:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              {['01310-100', '20040-020', '30112-000', '40070-110', '50030-230', '60160-230', '70040-010', '80020-320'].map((cepExemplo) => (
                <Button
                  key={cepExemplo}
                  variant="outline"
                  size="sm"
                  onClick={() => handleCepChange(cepExemplo)}
                  className="text-xs"
                >
                  {cepExemplo}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}