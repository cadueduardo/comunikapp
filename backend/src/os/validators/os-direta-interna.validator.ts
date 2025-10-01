import { Injectable, BadRequestException } from '@nestjs/common';
import { TipoOS, OrigemOS, PrioridadeOS, StatusAprovacao } from '../interfaces/os-direta-interna.interface';

/**
 * Validador para OS Direta e Interna
 * Objetivo: Validações específicas conforme PLANO Fase 1
 */

@Injectable()
export class OSDiretaInternaValidator {
  
  /**
   * Valida se o tipo de OS é válido
   */
  validarTipoOS(tipo: string): boolean {
    return Object.values(TipoOS).includes(tipo as TipoOS);
  }
  
  /**
   * Valida se a origem da OS é válida
   */
  validarOrigemOS(origem: string): boolean {
    return Object.values(OrigemOS).includes(origem as OrigemOS);
  }
  
  /**
   * Valida se a prioridade é válida
   */
  validarPrioridade(prioridade: string): boolean {
    return Object.values(PrioridadeOS).includes(prioridade as PrioridadeOS);
  }
  
  /**
   * Valida se o status de aprovação é válido
   */
  validarStatusAprovacao(status: string): boolean {
    return Object.values(StatusAprovacao).includes(status as StatusAprovacao);
  }
  
  /**
   * Valida campos obrigatórios para OS Interna
   */
  validarCamposOSInterna(dados: any): void {
    const camposObrigatorios = [
      'departamento_solicitante',
      'centro_custo'
    ];
    
    for (const campo of camposObrigatorios) {
      if (!dados[campo] || dados[campo].trim() === '') {
        throw new BadRequestException(
          `Campo obrigatório para OS Interna: ${campo}`
        );
      }
    }
    
    // Validar formato do centro de custo (ex: CC-001, DEP-2024-001)
    if (dados.centro_custo && !this.validarFormatoCentroCusto(dados.centro_custo)) {
      throw new BadRequestException(
        'Centro de custo deve ter formato válido (ex: CC-001, DEP-2024-001)'
      );
    }
  }
  
  /**
   * Valida campos obrigatórios para OS Comercial
   */
  validarCamposOSComercial(dados: any): void {
    // Para OS comercial, cliente_id é obrigatório
    if (!dados.cliente_id) {
      throw new BadRequestException(
        'Cliente é obrigatório para OS Comercial'
      );
    }
    
    // Validar satisfação do cliente (1-5)
    if (dados.satisfacao_cliente !== undefined) {
      if (!Number.isInteger(dados.satisfacao_cliente) || 
          dados.satisfacao_cliente < 1 || 
          dados.satisfacao_cliente > 5) {
        throw new BadRequestException(
          'Satisfação do cliente deve ser um número inteiro entre 1 e 5'
        );
      }
    }
    
    // Validar valores monetários
    if (dados.valor_orcado !== undefined && dados.valor_orcado < 0) {
      throw new BadRequestException(
        'Valor orçado não pode ser negativo'
      );
    }
    
    if (dados.valor_realizado !== undefined && dados.valor_realizado < 0) {
      throw new BadRequestException(
        'Valor realizado não pode ser negativo'
      );
    }
    
    // Validar margem de lucro (0-100%)
    if (dados.margem_lucro_real !== undefined) {
      if (dados.margem_lucro_real < 0 || dados.margem_lucro_real > 100) {
        throw new BadRequestException(
          'Margem de lucro deve estar entre 0 e 100%'
        );
      }
    }
  }
  
  /**
   * Valida aprovação gerencial
   */
  validarAprovacaoGerencial(dados: any): void {
    if (!dados.aprovacao_gerencial) {
      throw new BadRequestException(
        'Status de aprovação gerencial é obrigatório'
      );
    }
    
    if (!this.validarStatusAprovacao(dados.aprovacao_gerencial)) {
      throw new BadRequestException(
        'Status de aprovação gerencial inválido'
      );
    }
    
    if (dados.aprovacao_gerencial === StatusAprovacao.APROVADA && !dados.aprovacao_gerencial_por) {
      throw new BadRequestException(
        'Aprovador é obrigatório quando status é APROVADA'
      );
    }
  }
  
  /**
   * Valida campos de controle e auditoria
   */
  validarCamposControle(dados: any): void {
    if (dados.versao !== undefined && (!Number.isInteger(dados.versao) || dados.versao < 1)) {
      throw new BadRequestException(
        'Versão deve ser um número inteiro maior que 0'
      );
    }
    
    if (dados.motivo_modificacao && dados.motivo_modificacao.trim().length < 10) {
      throw new BadRequestException(
        'Motivo da modificação deve ter pelo menos 10 caracteres'
      );
    }
  }
  
  /**
   * Valida se a OS pode ser modificada
   */
  validarPermissaoModificacao(os: any, usuarioId: string): void {
    // Verificar se o usuário tem permissão para modificar
    if (os.criado_por && os.criado_por !== usuarioId) {
      // Verificar se é supervisor ou admin (implementar lógica de permissões)
      // Por enquanto, apenas verificar se é o criador
      throw new BadRequestException(
        'Apenas o criador da OS pode modificá-la'
      );
    }
    
    // Verificar se a OS não está em status que impede modificação
    const statusBloqueados = ['FINALIZADA', 'CANCELADA'];
    if (statusBloqueados.includes(os.status)) {
      throw new BadRequestException(
        `OS não pode ser modificada no status: ${os.status}`
      );
    }
  }
  
  /**
   * Valida transição de status
   */
  validarTransicaoStatus(statusAtual: string, novoStatus: string): void {
    const transicoesValidas: { [key: string]: string[] } = {
      'FILA': ['EM_PRODUCAO', 'CANCELADA'],
      'EM_PRODUCAO': ['FINALIZADA', 'CANCELADA'],
      'FINALIZADA': [], // Status final
      'CANCELADA': [] // Status final
    };
    
    const statusPermitidos = transicoesValidas[statusAtual] || [];
    if (!statusPermitidos.includes(novoStatus)) {
      throw new BadRequestException(
        `Transição de status inválida: ${statusAtual} -> ${novoStatus}`
      );
    }
  }
  
  /**
   * Valida se a OS pode ser aprovada
   */
  validarPermissaoAprovacao(os: any, tipoAprovacao: 'tecnica' | 'gerencial'): void {
    if (tipoAprovacao === 'gerencial' && os.tipo_os !== TipoOS.INTERNA) {
      throw new BadRequestException(
        'Aprovação gerencial só é aplicável para OS Interna'
      );
    }
    
    if (tipoAprovacao === 'tecnica' && os.tipo_os !== TipoOS.COMERCIAL) {
      throw new BadRequestException(
        'Aprovação técnica só é aplicável para OS Comercial'
      );
    }
  }
  
  /**
   * Valida formato do centro de custo
   */
  private validarFormatoCentroCusto(centroCusto: string): boolean {
    // Formato: CC-001, DEP-2024-001, PROJ-ABC-001
    const regex = /^[A-Z]{2,4}-[A-Z0-9-]+$/;
    return regex.test(centroCusto);
  }
  
  /**
   * Valida se a OS tem todos os campos necessários para aprovação
   */
  validarCamposParaAprovacao(os: any, tipoAprovacao: 'tecnica' | 'gerencial'): void {
    if (tipoAprovacao === 'tecnica') {
      if (!os.parametros_tecnicos) {
        throw new BadRequestException(
          'Parâmetros técnicos são obrigatórios para aprovação técnica'
        );
      }
      
      if (!os.insumos_calculados) {
        throw new BadRequestException(
          'Insumos calculados são obrigatórios para aprovação técnica'
        );
      }
    }
    
    if (tipoAprovacao === 'gerencial') {
      if (!os.departamento_solicitante) {
        throw new BadRequestException(
          'Departamento solicitante é obrigatório para aprovação gerencial'
        );
      }
      
      if (!os.centro_custo) {
        throw new BadRequestException(
          'Centro de custo é obrigatório para aprovação gerencial'
        );
      }
    }
  }
  
  /**
   * Valida dados completos da OS
   */
  validarOSCompleta(dados: any): void {
    // Validar campos básicos
    if (!dados.tipo_os || !this.validarTipoOS(dados.tipo_os)) {
      throw new BadRequestException('Tipo de OS inválido');
    }
    
    if (!dados.prioridade || !this.validarPrioridade(dados.prioridade)) {
      throw new BadRequestException('Prioridade inválida');
    }
    
    if (dados.origem_os && !this.validarOrigemOS(dados.origem_os)) {
      throw new BadRequestException('Origem da OS inválida');
    }
    
    // Validar campos específicos por tipo
    if (dados.tipo_os === TipoOS.INTERNA) {
      this.validarCamposOSInterna(dados);
    } else if (dados.tipo_os === TipoOS.COMERCIAL) {
      this.validarCamposOSComercial(dados);
    }
    
    // Validar campos de controle
    this.validarCamposControle(dados);
  }
}
