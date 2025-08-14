'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface LocalizacaoCardProps {
  localizacao: {
    id: string;
    codigo: string;
    deposito: string;
    corredor?: string;
    prateleira?: string;
    nivel?: string;
    posicao?: string;
    descricao?: string;
    capacidade?: number | null;
    ativo: boolean;
  };
  onDelete?: (id: string) => void;
}

export function LocalizacaoCard({ localizacao, onDelete }: LocalizacaoCardProps) {
  const getLocalizacaoCompleta = () => {
    const partes = [
      localizacao.deposito,
      localizacao.corredor,
      localizacao.prateleira,
      localizacao.nivel,
      localizacao.posicao
    ].filter(Boolean);
    
    return partes.join(' - ');
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              {localizacao.deposito}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">{localizacao.codigo}</p>
            {(localizacao.corredor || localizacao.prateleira || localizacao.nivel || localizacao.posicao) && (
              <p className="text-xs text-gray-500 mt-1">
                {getLocalizacaoCompleta()}
              </p>
            )}
          </div>
          <Badge variant={localizacao.ativo ? 'default' : 'secondary'} className="ml-2">
            {localizacao.ativo ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {localizacao.descricao && (
          <div className="text-sm text-gray-600 mb-3">
            <span className="font-medium">Descrição:</span> {localizacao.descricao}
          </div>
        )}
        
        {localizacao.capacidade && (
          <div className="text-sm text-gray-600 mb-4">
            <span className="font-medium">Capacidade:</span> {localizacao.capacidade} unidades
          </div>
        )}
        
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline" className="flex-1">
            <Link href={`/estoque/localizacoes/editar/${localizacao.id}`}>
              <Edit className="h-3 w-3 mr-1" />
              Editar
            </Link>
          </Button>
          
          {onDelete && (
            <Button 
              size="sm" 
              variant="outline" 
              className="text-red-600 hover:text-red-700"
              onClick={() => {
                console.log('🔘 Botão excluir clicado para localização:', localizacao.id, localizacao.deposito);
                onDelete(localizacao.id);
              }}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Excluir
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 