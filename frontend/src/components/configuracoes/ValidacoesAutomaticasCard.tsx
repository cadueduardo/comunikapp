'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Settings, 
  Activity, 
  AlertTriangle, 
  CheckCircle,
  Plus,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';

interface ValidacoesAutomaticasCardProps {
  stats?: {
    totalRegras: number;
    regrasAtivas: number;
    execucoesHoje: number;
    taxaSucesso: number;
  };
}

export function ValidacoesAutomaticasCard({ stats }: ValidacoesAutomaticasCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg transition-colors">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Validações Automáticas</CardTitle>
              <CardDescription>
                Configure regras de validação para OSs
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
        
        <CardContent className="pt-0">
          {/* Estatísticas */}
          {stats && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Settings className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Regras Ativas</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-green-600">
                    {stats.regrasAtivas}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    de {stats.totalRegras}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Execuções Hoje</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-blue-600">
                    {stats.execucoesHoje}
                  </span>
                  <div className="flex items-center space-x-1">
                    {stats.taxaSucesso >= 90 ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : stats.taxaSucesso >= 70 ? (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-xs text-gray-500">
                      {stats.taxaSucesso}% sucesso
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ações Rápidas */}
          <div className="space-y-2">
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                asChild
              >
                <Link href="/configuracoes/validacoes-automaticas/regras">
                  <Settings className="h-4 w-4 mr-2" />
                  Gerenciar Regras
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                asChild
              >
                <Link href="/configuracoes/validacoes-automaticas/regras/nova">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Regra
                </Link>
              </Button>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full"
              asChild
            >
              <Link href="/configuracoes/validacoes-automaticas/execucoes">
                <BarChart3 className="h-4 w-4 mr-2" />
                Ver Histórico de Execuções
              </Link>
            </Button>
          </div>

          {/* Status das Validações */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Status do Sistema</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-600 font-medium">Ativo</span>
              </div>
            </div>
          </div>
        </CardContent>
    </Card>
  );
}









