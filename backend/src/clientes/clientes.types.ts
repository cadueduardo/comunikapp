import { cliente_status_cliente, cliente_tipo_pessoa } from '@prisma/client';
import { PapelContatoCliente } from './dto/create-contato.dto';

/** Responsável comercial exposto sem nenhum dado sensível (só id + nome). */
export interface ResponsavelComercialResumo {
  id: string;
  nome: string;
}

export interface ClienteResumo {
  id: string;
  nome: string;
  tipo_pessoa: cliente_tipo_pessoa;
  documento: string;
  email: string | null;
  telefone: string | null;
  whatsapp: string | null;
  cidade: string | null;
  estado: string | null;
  status_cliente: cliente_status_cliente;
  ativo: boolean;
  responsavel_comercial_id: string | null;
  responsavel_desde: Date | null;
  responsavel_comercial: ResponsavelComercialResumo | null;
  criado_em: Date;
  atualizado_em: Date;
}

export interface ClienteContatoResumo {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  whatsapp: string | null;
  cargo: string | null;
  papeis: PapelContatoCliente[];
  principal: boolean;
  ativo: boolean;
  criado_em: Date;
  atualizado_em: Date;
}

/** Transferência de carteira exibida na ficha (sem dado sensível do usuário). */
export interface TransferenciaCarteiraResumo {
  id: string;
  de_usuario: ResponsavelComercialResumo | null;
  para_usuario: ResponsavelComercialResumo;
  autor: ResponsavelComercialResumo;
  motivo: string;
  criado_em: Date;
}

/** Ficha do cliente com dados completos + relações de exibição segura. */
export interface ClienteDetalhe extends ClienteResumo {
  razao_social: string | null;
  nome_fantasia: string | null;
  inscricao_estadual: string | null;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  responsavel: string | null;
  cargo_responsavel: string | null;
  observacoes: string | null;
  origem: string | null;
  segmento: string | null;
  contatos: ClienteContatoResumo[];
  /**
   * Últimas 20 transferências de carteira (mais recente primeiro).
   * Só populado em `GET /clientes/:id` (ficha) — as demais operações
   * (criar/atualizar/inativar/transferir) não pagam este custo extra.
   */
  transferencias_carteira?: TransferenciaCarteiraResumo[];
}

export interface ClientesMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ClientesPaginados {
  data: ClienteResumo[];
  meta: ClientesMeta;
}

/** Alerta de possível duplicidade — nunca bloqueia a criação. */
export interface AlertaDuplicidadeCliente {
  campo: 'documento' | 'email' | 'telefone';
}

export interface ClienteCriadoResultado {
  cliente: ClienteDetalhe;
  avisos: AlertaDuplicidadeCliente[];
}
