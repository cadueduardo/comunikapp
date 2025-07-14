'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Maquina {
  id: string;
  nome: string;
  tipo: string;
  custo_hora: number | string;
  status: string;
  capacidade?: string;
  observacoes?: string;
  criado_em: string;
}

// Mapeamento completo dos tipos de máquinas
const tipoLabels = {
  // Impressão Digital
  PLOTTER_GRANDE_FORMATO: 'Plotter Grande Formato',
  IMPRESSORA_UV: 'Impressora UV',
  IMPRESSORA_LATEX: 'Impressora Latex',
  IMPRESSORA_SOLVENTE: 'Impressora Solvente',
  IMPRESSORA_ECO_SOLVENTE: 'Impressora Eco-Solvente',
  IMPRESSORA_DTG: 'Impressora DTG',
  IMPRESSORA_SUBLIMACAO: 'Impressora Sublimação',
  IMPRESSORA_TERMICA: 'Impressora Térmica',
  
  // Corte e Acabamento
  PLOTTER_CORTE: 'Plotter de Corte',
  ROUTER_CNC: 'Router CNC',
  LASER_CO2: 'Laser CO2',
  LASER_FIBRA: 'Laser Fibra',
  CORTE_VINIL: 'Cortadora de Vinil',
  CORTE_PAPEL: 'Cortadora de Papel',
  CORTE_TECIDO: 'Cortadora de Tecido',
  DOBRADEIRA: 'Dobradeira',
  VINCO: 'Máquina de Vinco',
  REFRIGO: 'Refrigo',
  
  // Acabamento e Laminagem
  LAMINADORA: 'Laminadora',
  LAMINADORA_FRIA: 'Laminadora a Frio',
  LAMINADORA_QUENTE: 'Laminadora a Quente',
  ACABAMENTO: 'Máquina de Acabamento',
  VINCO_DOBRA: 'Vinco e Dobra',
  CORTE_ANGULO: 'Corte em Ângulo',
  
  // Impressão Offset e Flexografia
  OFFSET_PLANA: 'Offset Plana',
  OFFSET_ROTATIVA: 'Offset Rotativa',
  FLEXOGRAFIA: 'Flexografia',
  SERIGRAFIA: 'Serigrafia',
  TAMPOGRAFIA: 'Tampografia',
  
  // Acabamento Especializado
  FOIL_STAMPING: 'Foil Stamping',
  RELEVO: 'Máquina de Relevo',
  PERFURACAO: 'Perfuração',
  COSIDURA: 'Cosidura',
  ESPIRAL: 'Espiral',
  WIRE_O: 'Wire-O',
  ANEL: 'Anel',
  
  // Encadernação
  ENCADERNADORA: 'Encadernadora',
  GRAMPEADORA: 'Grampeadora',
  COLADEIRA: 'Coladeira',
  COSTURA: 'Máquina de Costura',
  
  // Acabamento de Superfície
  VERNIZ: 'Verniz',
  VERNIZ_UV: 'Verniz UV',
  VERNIZ_LOCALIZADO: 'Verniz Localizado',
  EMBOSSING: 'Embossing',
  DEBOSSING: 'Debossing',
  
  // Equipamentos Auxiliares
  SECADORA: 'Secadora',
  CURADORA_UV: 'Curadora UV',
  LAMINADOR: 'Laminador',
  CORTE_PRECISAO: 'Corte de Precisão',
  FURADEIRA: 'Furadeira',
  POLIDORA: 'Polidora',
  
  // Equipamentos de Produção
  MONTADORA: 'Montadora',
  EMBALADORA: 'Embaladora',
  ETIQUETADORA: 'Etiquetadora',
  SELADORA: 'Seladora',
  ENFARDADEIRA: 'Enfardadeira',
  
  // Equipamentos de Qualidade
  ESPECTROFOTOMETRO: 'Espectrofotômetro',
  DENSITOMETRO: 'Densitômetro',
  LUPAS: 'Lupas de Controle',
  MICROMETRO: 'Micrômetro',
  
  // Equipamentos de Suporte
  COMPRESSOR: 'Compressor',
  GERADOR: 'Gerador',
  AR_CONDICIONADO: 'Ar Condicionado Industrial',
  VENTILACAO: 'Sistema de Ventilação',
  EXAUSTAO: 'Sistema de Exaustão',
  
  // Outros
  OUTROS: 'Outros',
};

const statusLabels = {
  ATIVA: 'Ativa',
  MANUTENCAO: 'Manutenção',
  INATIVA: 'Inativa',
};

const statusColors = {
  ATIVA: 'bg-green-100 text-green-800',
  MANUTENCAO: 'bg-yellow-100 text-yellow-800',
  INATIVA: 'bg-red-100 text-red-800',
};

export default function MaquinasPage() {
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    maquinaId: string | null;
    maquinaNome: string;
  }>({
    open: false,
    maquinaId: null,
    maquinaNome: '',
  });

  useEffect(() => {
    fetchMaquinas();
  }, []);

  const fetchMaquinas = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('http://localhost:3001/maquinas', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setMaquinas(data);
      } else {
        toast.error('Erro ao carregar máquinas');
      }
    } catch (error) {
      console.error('Erro ao buscar máquinas:', error);
      toast.error('Erro ao carregar máquinas');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(`http://localhost:3001/maquinas/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Máquina excluída com sucesso!');
        fetchMaquinas();
      } else {
        toast.error('Erro ao excluir máquina');
      }
    } catch (error) {
      console.error('Erro ao excluir máquina:', error);
      toast.error('Erro ao excluir máquina');
    }
  };

  const openDeleteDialog = (id: string, nome: string) => {
    setDeleteDialog({
      open: true,
      maquinaId: id,
      maquinaNome: nome,
    });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({
      open: false,
      maquinaId: null,
      maquinaNome: '',
    });
  };

  const confirmDelete = async () => {
    if (deleteDialog.maquinaId) {
      await handleDelete(deleteDialog.maquinaId);
      closeDeleteDialog();
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Máquinas</h1>
          <p className="text-gray-600 mt-1">
            Gerencie as máquinas e seus custos operacionais.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Máquinas</h1>
        <p className="text-gray-600 mt-1">
          Gerencie as máquinas e seus custos operacionais.
        </p>
      </div>

      <div className="mb-6">
        <Link href="/configuracoes/maquinas/novo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Máquina
          </Button>
        </Link>
      </div>

      {maquinas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Nenhuma máquina cadastrada</h3>
              <p className="text-gray-600 mb-4">
                Comece cadastrando sua primeira máquina para calcular custos operacionais.
              </p>
              <Link href="/configuracoes/maquinas/novo">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar Primeira Máquina
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {maquinas.map((maquina) => (
            <Card key={maquina.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{maquina.nome}</CardTitle>
                  <div className="flex gap-2">
                    <Link href={`/configuracoes/maquinas/editar/${maquina.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteDialog(maquina.id, maquina.nome)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tipo:</span>
                    <Badge variant="outline">
                      {tipoLabels[maquina.tipo as keyof typeof tipoLabels] || maquina.tipo}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge className={statusColors[maquina.status as keyof typeof statusColors]}>
                      {statusLabels[maquina.status as keyof typeof statusLabels]}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Custo/Hora:</span>
                    <span className="font-medium">
                      R$ {Number(maquina.custo_hora).toFixed(2)}
                    </span>
                  </div>
                  
                  {maquina.capacidade && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Capacidade:</span>
                      <span className="text-sm">{maquina.capacidade}</span>
                    </div>
                  )}
                  
                  {maquina.observacoes && (
                    <div className="pt-2 border-t">
                      <span className="text-sm text-muted-foreground">Observações:</span>
                      <p className="text-sm mt-1">{maquina.observacoes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteDialog.open}
        title="Excluir Máquina"
        description={`Tem certeza que deseja excluir a máquina "${deleteDialog.maquinaNome}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onCancel={closeDeleteDialog}
      />
    </div>
  );
} 