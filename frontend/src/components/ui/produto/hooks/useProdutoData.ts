import { useState, useEffect } from 'react';
import { Insumo, Maquina, Funcao } from '../../shared/types/common.types';

export function useProdutoData() {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [funcoes, setFuncoes] = useState<Funcao[]>([]);

  const fetchInsumos = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('http://localhost:3001/insumos', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setInsumos(data);
      }
    } catch (error) {
      console.error('Erro ao buscar insumos:', error);
    }
  };

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
      }
    } catch (error) {
      console.error('Erro ao buscar máquinas:', error);
    }
  };

  const fetchFuncoes = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('http://localhost:3001/funcoes', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setFuncoes(data);
      }
    } catch (error) {
      console.error('Erro ao buscar funções:', error);
    }
  };

  useEffect(() => {
    fetchInsumos();
    fetchMaquinas();
    fetchFuncoes();
  }, []);

  return {
    insumos,
    maquinas,
    funcoes,
    fetchInsumos,
    fetchMaquinas,
    fetchFuncoes,
  };
} 