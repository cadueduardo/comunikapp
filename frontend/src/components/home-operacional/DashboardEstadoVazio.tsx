'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useAcessoModulos } from '@/contexts/AcessoModulosContext';
import { useFavoritos } from '@/contexts/FavoritosContext';

const MODULOS_COM_BLOCO_NA_HOME = [
  'vendas',
  'os',
  'pcp',
  'estoque',
  'financeiro',
  'configuracoes',
] as const;

/**
 * Mensagem honesta quando o perfil não tem nenhum widget da Home
 * (nem favorito). Não inventa card de outro módulo.
 */
export function DashboardEstadoVazio() {
  const { pode, carregado } = useAcessoModulos();
  const { destinos, carregado: favoritosProntos } = useFavoritos();

  if (!carregado || !favoritosProntos) return null;

  const temBloco = MODULOS_COM_BLOCO_NA_HOME.some((modulo) => pode(modulo));
  if (temBloco || destinos.length > 0) return null;

  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">
          Nada para mostrar nesta visão. Use o menu para abrir as áreas que
          você tem acesso.
        </p>
      </CardContent>
    </Card>
  );
}
