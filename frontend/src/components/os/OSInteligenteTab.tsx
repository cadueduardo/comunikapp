'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

interface OSInteligenteTabProps {
  osId: string;
}

export function OSInteligenteTab({ osId }: OSInteligenteTabProps) {
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
  };

  const handleCalculoChange = (resultado: any) => {
    setStatus(prev => ({
      ...prev,
      materiais: resultado.resumo.materiais_suficientes === resultado.resumo.total_materiais
    }));
  };

  const getStatusIcon = () => {
    if (status.validacoes && status.materiais) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (!status.validacoes || !status.materiais) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    } else {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
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
    <div className="space-y-6">
      {/* Status Geral */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5" />
              <CardTitle className="text-lg">Análise Inteligente</CardTitle>
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
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center space-y-1">
              <Shield className="h-4 w-4" />
              <span className="text-sm">Validações</span>
              <Badge variant={status.validacoes ? "default" : "destructive"} className="text-xs">
                {status.validacoes ? "OK" : "Pendente"}
              </Badge>
            </div>
            <div className="flex flex-col items-center space-y-1">
              <Package className="h-4 w-4" />
              <span className="text-sm">Materiais</span>
              <Badge variant={status.materiais ? "default" : "destructive"} className="text-xs">
                {status.materiais ? "OK" : "Insuficiente"}
              </Badge>
            </div>
            <div className="flex flex-col items-center space-y-1">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Aprovação</span>
              <Badge variant={status.podeAprovar ? "default" : "secondary"} className="text-xs">
                {status.podeAprovar ? "Liberada" : "Bloqueada"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Abas de Detalhes */}
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
    </div>
  );
}








