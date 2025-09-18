import { useState, useEffect } from 'react';
import { Cliente, Insumo, Maquina, Funcao, ServicoManual } from '../../shared/types/common.types';
import { clientesApi, insumosApi, maquinasApi, funcoesApi, servicosManuaisApi, custosIndiretosApi } from '@/lib/api-client';

export function useOrcamentoData() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [funcoes, setFuncoes] = useState<Funcao[]>([]);
  const [servicos, setServicos] = useState<ServicoManual[]>([]);
  const [custosIndiretos, setCustosIndiretos] = useState<any[]>([]);

  const fetchClientes = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const data = await clientesApi.getAll(token);
      setClientes(data);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    }
  };

  const fetchInsumos = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const data = await insumosApi.getAll(token);
      setInsumos(data);
    } catch (error) {
      console.error('Erro ao buscar insumos:', error);
    }
  };

  const fetchMaquinas = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const data = await maquinasApi.getAll(token);
      setMaquinas(data);
    } catch (error) {
      console.error('Erro ao buscar máquinas:', error);
    }
  };

  const fetchFuncoes = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const data = await funcoesApi.getAll(token);
      setFuncoes(data);
    } catch (error) {
      console.error('Erro ao buscar funções:', error);
    }
  };

  const fetchServicos = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const data = await servicosManuaisApi.getAll(token);
      setServicos(data);
    } catch (error) {
      console.error('Erro ao buscar serviços manuais:', error);
    }
  };

  const fetchCustosIndiretos = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const data = await custosIndiretosApi.getAll(token);
      setCustosIndiretos(data);
    } catch (error) {
      console.error('Erro ao buscar custos indiretos:', error);
    }
  };

  useEffect(() => {
    fetchClientes();
    fetchInsumos();
    fetchMaquinas();
    fetchFuncoes();
    fetchServicos();
    fetchCustosIndiretos();
  }, []);

  return {
    clientes,
    insumos,
    maquinas,
    funcoes,
    servicos,
    custosIndiretos,
    fetchClientes,
    fetchInsumos,
    fetchMaquinas,
    fetchFuncoes,
    fetchServicos,
    fetchCustosIndiretos,
  };
} 