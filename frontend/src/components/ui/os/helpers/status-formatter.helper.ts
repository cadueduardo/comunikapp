/**
 * Helper para formatar status da OS de forma amigável
 */

export class StatusFormatterHelper {
  
  /**
   * Converte status técnico para formato amigável
   */
  static formatarStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'FILA': 'Na Fila',
      'AGUARDANDO_APROVACAO_TECNICA': 'Aguardando Aprovação Técnica',
      'APROVADA_TECNICA': 'Aprovada Tecnicamente',
      'REJEITADA': 'Rejeitada',
      'PRODUCAO': 'Em Produção',
      'ACABAMENTO': 'Em Acabamento',
      'FINALIZADA': 'Finalizada',
      'CANCELADA': 'Cancelada',
      'AGUARDANDO_MATERIAL': 'Aguardando Material',
      'PAUSADA': 'Pausada',
      'AGUARDANDO_APROVACAO_ORCAMENTARIA': 'Aguardando Aprovação Orçamentária',
      'APROVADA_ORCAMENTARIA': 'Aprovada Orçamentariamente',
    };

    return statusMap[status] || status;
  }

  /**
   * Converte status técnico para cor do badge
   */
  static obterCorStatus(status: string): string {
    const corMap: Record<string, string> = {
      'FILA': 'bg-gray-100 text-gray-800',
      'AGUARDANDO_APROVACAO_TECNICA': 'bg-yellow-100 text-yellow-800',
      'APROVADA_TECNICA': 'bg-green-100 text-green-800',
      'REJEITADA': 'bg-red-100 text-red-800',
      'PRODUCAO': 'bg-blue-100 text-blue-800',
      'ACABAMENTO': 'bg-purple-100 text-purple-800',
      'FINALIZADA': 'bg-green-100 text-green-800',
      'CANCELADA': 'bg-red-100 text-red-800',
      'AGUARDANDO_MATERIAL': 'bg-orange-100 text-orange-800',
      'PAUSADA': 'bg-gray-100 text-gray-800',
      'AGUARDANDO_APROVACAO_ORCAMENTARIA': 'bg-yellow-100 text-yellow-800',
      'APROVADA_ORCAMENTARIA': 'bg-green-100 text-green-800',
    };

    return corMap[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Converte status técnico para ícone
   */
  static obterIconeStatus(status: string): string {
    const iconeMap: Record<string, string> = {
      'FILA': '⏳',
      'AGUARDANDO_APROVACAO_TECNICA': '⏳',
      'APROVADA_TECNICA': '✅',
      'REJEITADA': '❌',
      'PRODUCAO': '🏭',
      'ACABAMENTO': '🎨',
      'FINALIZADA': '✅',
      'CANCELADA': '❌',
      'AGUARDANDO_MATERIAL': '📦',
      'PAUSADA': '⏸️',
      'AGUARDANDO_APROVACAO_ORCAMENTARIA': '💰',
      'APROVADA_ORCAMENTARIA': '✅',
    };

    return iconeMap[status] || '❓';
  }
}
















