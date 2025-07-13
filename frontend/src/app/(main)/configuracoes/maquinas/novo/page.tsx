'use client';

import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { MaquinaForm, MaquinaFormValues } from '../maquina-form';

export default function NovaMaquinaPage() {
  const router = useRouter();

  const handleSave = async (data: MaquinaFormValues) => {
    try {
      const token = localStorage.getItem('access_token');
      
      const custo = typeof data.custo_hora === 'string' 
        ? parseFloat(data.custo_hora) 
        : data.custo_hora;
        
      const response = await fetch('http://localhost:3001/maquinas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...data,
          custo_hora: custo,
        }),
      });

      if (response.ok) {
        toast.success('Máquina criada com sucesso!');
        router.push('/configuracoes/maquinas');
      } else {
        const errorData = await response.json();
        toast.error(`Falha ao criar máquina: ${errorData.message}`);
      }
    } catch (error) {
      toast.error('Ocorreu um erro ao conectar com o servidor.');
      console.error(error);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Adicionar Nova Máquina</h1>
        <p className="text-gray-600 mt-1">
          Cadastre uma nova máquina para calcular custos operacionais.
        </p>
      </div>
      <MaquinaForm onSave={handleSave} />
    </div>
  );
} 