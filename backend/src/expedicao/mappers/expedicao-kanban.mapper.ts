import {
  ExpedicaoCardKanban,
  ExpedicaoKanbanStats,
} from '../interfaces/expedicao.interface';

type ExpedicaoComRelacoes = {
  id: string;
  os_id: string;
  status: string;
  modalidade: string;
  codigo_rastreio: string | null;
  data_expedida: Date | null;
  criado_em: Date;
  atualizado_em: Date;
  ordem_servico: {
    id: string;
    numero: string;
    nome_servico: string;
    data_prazo: Date | null;
    orcamento_id: string | null;
    retrabalho: boolean;
    cliente: {
      nome: string;
      telefone: string | null;
      whatsapp: string | null;
      endereco: string | null;
      numero: string | null;
      complemento: string | null;
      bairro: string | null;
      cidade: string | null;
      estado: string | null;
      cep: string | null;
    } | null;
    orcamento: {
      entrega_usar_endereco_cliente: boolean;
      entrega_logradouro: string | null;
      entrega_numero: string | null;
      entrega_complemento: string | null;
      entrega_bairro: string | null;
      entrega_cidade: string | null;
      entrega_estado: string | null;
      entrega_cep: string | null;
    } | null;
  };
};

export class ExpedicaoKanbanMapper {
  static mapearParaCard(expedicao: ExpedicaoComRelacoes): ExpedicaoCardKanban {
    const os = expedicao.ordem_servico;
    const cliente = os.cliente;

    return {
      id: expedicao.id,
      os_id: os.id,
      os_numero: os.numero,
      status: expedicao.status,
      modalidade: expedicao.modalidade,
      codigo_rastreio: expedicao.codigo_rastreio,
      titulo: os.nome_servico,
      cliente: cliente?.nome ?? 'Cliente não informado',
      cliente_telefone: cliente?.whatsapp ?? cliente?.telefone ?? null,
      endereco_entrega: this.formatarEnderecoEntrega(os),
      data_prazo: os.data_prazo ? os.data_prazo.toISOString() : null,
      data_expedida: expedicao.data_expedida
        ? expedicao.data_expedida.toISOString()
        : null,
      criado_em: expedicao.criado_em.toISOString(),
      atualizado_em: expedicao.atualizado_em.toISOString(),
      orcamento_id: os.orcamento_id,
      retrabalho: os.retrabalho,
      bloqueado_financeiro: false,
      link_financeiro: null,
    };
  }

  static agruparPorStatus(
    cards: ExpedicaoCardKanban[],
    ordemColunas: string[],
  ): Record<string, ExpedicaoCardKanban[]> {
    const colunas = ordemColunas.reduce<Record<string, ExpedicaoCardKanban[]>>(
      (acc, status) => {
        acc[status] = [];
        return acc;
      },
      {},
    );

    for (const card of cards) {
      if (!colunas[card.status]) {
        colunas[card.status] = [];
      }
      colunas[card.status].push(card);
    }

    return colunas;
  }

  static calcularEstatisticas(
    cards: ExpedicaoCardKanban[],
  ): ExpedicaoKanbanStats {
    const por_status: Record<string, number> = {};

    for (const card of cards) {
      por_status[card.status] = (por_status[card.status] ?? 0) + 1;
    }

    return {
      total: cards.length,
      por_status,
    };
  }

  private static formatarEnderecoEntrega(
    os: ExpedicaoComRelacoes['ordem_servico'],
  ): string | null {
    const orcamento = os.orcamento;

    if (orcamento && !orcamento.entrega_usar_endereco_cliente) {
      const partes = [
        orcamento.entrega_logradouro,
        orcamento.entrega_numero,
        orcamento.entrega_complemento,
        orcamento.entrega_bairro,
        orcamento.entrega_cidade,
        orcamento.entrega_estado,
        orcamento.entrega_cep,
      ].filter((p) => Boolean(p?.trim()));

      if (partes.length > 0) {
        return partes.join(', ');
      }
    }

    const cliente = os.cliente;
    if (!cliente) {
      return null;
    }

    const partesCliente = [
      cliente.endereco,
      cliente.numero,
      cliente.complemento,
      cliente.bairro,
      cliente.cidade,
      cliente.estado,
      cliente.cep,
    ].filter((p) => Boolean(p?.trim()));

    return partesCliente.length > 0 ? partesCliente.join(', ') : null;
  }
}
