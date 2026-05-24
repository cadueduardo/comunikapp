import { apiRequest } from './api';

// ====================================================================
// Tipos espelhados do backend:
//   backend/src/estimativa-tempo/interfaces/estimativa-tempo.interface.ts
//   backend/src/estimativa-tempo/services/compatibilidade-material-maquina.service.ts
// ====================================================================

export type ModoProducaoMaquina = 'M2_H' | 'ML_H' | 'MANUAL';

export interface DetalhamentoEstimativa {
  modo_producao: ModoProducaoMaquina;
  velocidade_usada: number | null;
  unidade_velocidade: 'm2/h' | 'm/h' | null;
  setup_horas: number;
  eficiencia_percent: number | null;
  tempo_bruto_horas: number;
  tempo_com_eficiencia_horas: number;
  tempo_total_horas: number;
  mensagens: string[];
}

export interface ResultadoEstimativaMaquina {
  maquina_id: string;
  maquina_nome: string;
  estimativa_possivel: boolean;
  tempo_horas: number;
  detalhamento: DetalhamentoEstimativa;
}

export type NivelCompatibilidade = 'compativel' | 'alerta' | 'bloqueado';

export interface ResultadoCompatibilidade {
  insumo_id: string;
  maquina_id: string;
  nivel: NivelCompatibilidade;
  motivos: string[];
  regras_avaliadas: string[];
}

interface Envelope<T> {
  data: T;
}

async function unwrap<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let mensagem = `Erro HTTP ${response.status}`;
    try {
      const erro = await response.json();
      if (erro?.message) {
        mensagem = Array.isArray(erro.message)
          ? erro.message.join(' | ')
          : String(erro.message);
      }
    } catch {
      // ignora
    }
    throw new Error(mensagem);
  }
  const body = (await response.json()) as Envelope<T>;
  return body.data;
}

export interface EntradaEstimativaMaquina {
  maquina_id: string;
  quantidade: number;
  area_m2?: number;
  perimetro_mm?: number;
}

export async function postEstimarTempoMaquina(
  entrada: EntradaEstimativaMaquina,
): Promise<ResultadoEstimativaMaquina> {
  const r = await apiRequest('/estimativa-tempo/maquina', {
    method: 'POST',
    body: JSON.stringify(entrada),
  });
  return unwrap<ResultadoEstimativaMaquina>(r);
}

export async function postVerificarCompatibilidade(
  insumo_id: string,
  maquina_id: string,
): Promise<ResultadoCompatibilidade> {
  const r = await apiRequest('/estimativa-tempo/compatibilidade-material-maquina', {
    method: 'POST',
    body: JSON.stringify({ insumo_id, maquina_id }),
  });
  return unwrap<ResultadoCompatibilidade>(r);
}
