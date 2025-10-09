'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { 
  Brain, 
  Shield, 
  Calculator, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Package,
  DollarSign,
  Recycle
} from 'lucide-react';
import { ValidacoesOSCard } from './ValidacoesOSCard';
import { CalculoMaterialCard } from './CalculoMaterialCard';

interface OSInteligenteCardProps {
  osId: string;
  onStatusChange?: (status: {
    validacoes: boolean;
    materiais: boolean;
    podeAprovar: boolean;
  }) => void;
}

export function OSInteligenteCard({ osId, onStatusChange }: OSInteligenteCardProps) {
  const [status, setStatus] = useState({
    validacoes: false,
    materiais: false,
    podeAprovar: false
  });

  const handleValidacaoChange = (resultado: any) => {
    setStatus(prev => ({
      ...prev,
      validacoes: resultado.valida,
      podeAprovar: resultado.pode_aprovar_automaticamente
    }));
    onStatusChange?.(status);
  };

  const handleCalculoChange = (resultado: any) => {
    setStatus(prev => ({
      ...prev,
      materiais: resultado.resumo.materiais_suficientes === resultado.resumo.total_materiais
    }));
    onStatusChange?.(status);
  };

  const getStatusIcon = () => {
    if (status.validacoes && status.materiais) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (!status.validacoes || !status.materiais) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    } else {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusText = () => {
    if (status.validacoes && status.materiais) {
      return "OS Pronta para Produção";
    } else if (!status.validacoes) {
      return "Validações Pendentes";
    } else if (!status.materiais) {
      return "Materiais Insuficientes";
    } else {
      return "Aguardando Análise";
    }
  };

  const getStatusBadge = () => {
    if (status.validacoes && status.materiais) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Pronta</Badge>;
    } else if (!status.validacoes) {
      return <Badge variant="destructive">Validações</Badge>;
    } else if (!status.materiais) {
      return <Badge variant="destructive">Materiais</Badge>;
    } else {
      return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <CardTitle>Análise Inteligente da OS</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            {getStatusBadge()}
          </div>
        </div>
        <CardDescription>
          {getStatusText()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="validacoes" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="validacoes" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Validações</span>
            </TabsTrigger>
            <TabsTrigger value="materiais" className="flex items-center space-x-2">
              <Calculator className="h-4 w-4" />
              <span>Materiais</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="validacoes" className="mt-4">
            <ValidacoesOSCard 
              osId={osId} 
              onValidacaoChange={handleValidacaoChange}
            />
          </TabsContent>
          
          <TabsContent value="materiais" className="mt-4">
            <CalculoMaterialCard 
              osId={osId} 
              onCalculoChange={handleCalculoChange}
            />
          </TabsContent>
        </Tabs>

        {/* Resumo de Status */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span className="text-sm">Validações:</span>
                <Badge variant={status.validacoes ? "default" : "destructive"}>
                  {status.validacoes ? "OK" : "Pendente"}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <span className="text-sm">Materiais:</span>
                <Badge variant={status.materiais ? "default" : "destructive"}>
                  {status.materiais ? "OK" : "Insuficiente"}
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm">Aprovação:</span>
              <Badge variant={status.podeAprovar ? "default" : "secondary"}>
                {status.podeAprovar ? "Liberada" : "Bloqueada"}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
