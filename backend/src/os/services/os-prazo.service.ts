/**
 * Service para gerenciamento de prazo da OS
 * Implementa regras de negócio para definição de prazo e logs de auditoria
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DefinirPrazoDTO, LogPrazoRetroativoDTO, StatusPrazoResponse } from '../dto/os-prazo.dto';

interface DefinirPrazoRequest {
  osId: string;
  lojaId: string;
  usuarioId: string;
  dataPrazo: Date;
  motivo?: string;
  ipOrigem?: string;
  userAgent?: string;
  confirmarRetroativa?: boolean;
  isUpdate?: boolean;
}

@Injectable()
export class OSPrazoService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Define ou atualiza o prazo de uma OS
   * Implementa todas as regras de negócio definidas
   */
  async definirPrazo(request: DefinirPrazoRequest) {
    const {
      osId,
      lojaId,
      usuarioId,
      dataPrazo,
      motivo,
      ipOrigem,
      userAgent,
      confirmarRetroativa = false,
      isUpdate = false
    } = request;

    // 1. Verificar se a OS existe e pertence à loja
    const os = await this.prisma.ordemServico.findFirst({
      where: {
        id: osId,
        loja_id: lojaId
      },
      select: {
        id: true,
        numero: true,
        nome_servico: true,
        data_prazo: true,
        status: true
      }
    });

    if (!os) {
      throw new NotFoundException('OS não encontrada ou não pertence à sua loja');
    }

    // 2. Validar data
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Zerar horário para comparação de dias
    
    const dataComparacao = new Date(dataPrazo);
    dataComparacao.setHours(0, 0, 0, 0);

    const isRetroativa = dataComparacao < hoje;
    const isHoje = dataComparacao.getTime() === hoje.getTime();
    const isFutura = dataComparacao > hoje;

    // 3. Verificar se é data retroativa e se precisa de confirmação
    if (isRetroativa && !confirmarRetroativa) {
      const diasAtras = Math.ceil((hoje.getTime() - dataComparacao.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        requires_confirmation: true,
        is_retroativa: true,
        dias_atras: diasAtras,
        message: `A data informada é ${diasAtras} dia(s) anterior à data atual. Deseja continuar?`,
        data_original: dataPrazo,
        data_atual: hoje
      };
    }

    // 4. Definir novo status baseado na data
    let novoStatus: string;
    if (isHoje || isRetroativa) {
      novoStatus = 'PRONTA_PRODUCAO';
    } else {
      novoStatus = 'AGUARDANDO_INICIO';
    }

    // 5. Atualizar a OS
    const osAtualizada = await this.prisma.ordemServico.update({
      where: { id: osId },
      data: {
        data_prazo: dataPrazo,
        status: novoStatus,
        atualizado_em: new Date(),
        modificado_por: usuarioId,
        motivo_modificacao: motivo || (isUpdate ? 'Prazo atualizado' : 'Prazo definido')
      }
    });

    // 6. Se for data retroativa, criar log de auditoria
    if (isRetroativa) {
      await this.criarLogPrazoRetroativo({
        os_id: osId,
        usuario_id: usuarioId,
        data_definida: dataPrazo.toISOString(),
        data_atual: hoje.toISOString(),
        motivo: motivo,
        ip_origem: ipOrigem,
        user_agent: userAgent
      });
    }

    // 7. Calcular dias restantes
    const diasRestantes = isFutura ? Math.ceil((dataComparacao.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    // 8. Determinar mensagem do status
    let mensagem: string;
    if (isRetroativa) {
      mensagem = 'OS pronta para produção (prazo retroativo)';
    } else if (isHoje) {
      mensagem = 'OS pronta para produção (prazo hoje)';
    } else {
      mensagem = `OS aguardando início (${diasRestantes} dias restantes)`;
    }

    return {
      success: true,
      os_id: osId,
      data_prazo: dataPrazo,
      status: novoStatus,
      dias_restantes: diasRestantes,
      is_retroativo: isRetroativa,
      mensagem: mensagem,
      updated_at: osAtualizada.atualizado_em
    };
  }

  /**
   * Consulta o status atual do prazo de uma OS
   */
  async consultarStatusPrazo(osId: string, lojaId: string): Promise<StatusPrazoResponse> {
    const os = await this.prisma.ordemServico.findFirst({
      where: {
        id: osId,
        loja_id: lojaId
      },
      select: {
        id: true,
        data_prazo: true,
        status: true
      }
    });

    if (!os) {
      throw new NotFoundException('OS não encontrada ou não pertence à sua loja');
    }

    if (!os.data_prazo) {
      return {
        os_id: osId,
        status: 'SEM_PRAZO',
        is_retroativo: false,
        mensagem: 'Prazo não definido'
      };
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const dataPrazo = new Date(os.data_prazo);
    dataPrazo.setHours(0, 0, 0, 0);

    const isRetroativa = dataPrazo < hoje;
    const isHoje = dataPrazo.getTime() === hoje.getTime();
    const isFutura = dataPrazo > hoje;

    let status: 'SEM_PRAZO' | 'AGUARDANDO_INICIO' | 'PRONTA_PRODUCAO' | 'EM_PRODUCAO';
    let diasRestantes: number | undefined;
    let mensagem: string;

    if (isRetroativa || isHoje) {
      status = 'PRONTA_PRODUCAO';
      diasRestantes = 0;
      mensagem = isRetroativa ? 'OS pronta para produção (prazo retroativo)' : 'OS pronta para produção (prazo hoje)';
    } else {
      status = 'AGUARDANDO_INICIO';
      diasRestantes = Math.ceil((dataPrazo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      mensagem = `OS aguardando início (${diasRestantes} dias restantes)`;
    }

    return {
      os_id: osId,
      data_prazo: os.data_prazo,
      status,
      dias_restantes: diasRestantes,
      is_retroativo: isRetroativa,
      mensagem
    };
  }

  /**
   * Consulta logs de alteração de prazo de uma OS
   */
  async consultarLogsPrazo(osId: string, lojaId: string) {
    // Verificar se a OS existe
    const os = await this.prisma.ordemServico.findFirst({
      where: {
        id: osId,
        loja_id: lojaId
      },
      select: { id: true }
    });

    if (!os) {
      throw new NotFoundException('OS não encontrada ou não pertence à sua loja');
    }

    // Buscar logs de prazo retroativo
    const logs = await this.prisma.ordemServicoLog.findMany({
      where: {
        os_id: osId,
        tipo_acao: 'PRAZO_RETROATIVO'
      },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      },
      orderBy: {
        criado_em: 'desc'
      }
    });

    return logs.map(log => ({
      id: log.id,
      data_prazo_definida: log.dados_extras?.data_prazo_definida,
      data_atual: log.dados_extras?.data_atual,
      motivo: log.dados_extras?.motivo,
      usuario: log.usuario,
      ip_origem: log.ip_origem,
      user_agent: log.user_agent,
      criado_em: log.criado_em
    }));
  }

  /**
   * Cria log de auditoria para prazo retroativo
   */
  private async criarLogPrazoRetroativo(logData: LogPrazoRetroativoDTO) {
    try {
      await this.prisma.ordemServicoLog.create({
        data: {
          os_id: logData.os_id,
          tipo_acao: 'PRAZO_RETROATIVO',
          descricao: `Prazo retroativo definido: ${logData.data_definida}`,
          dados_extras: {
            data_prazo_definida: logData.data_definida,
            data_atual: logData.data_atual,
            motivo: logData.motivo,
            dias_atras: Math.ceil(
              (new Date(logData.data_atual).getTime() - new Date(logData.data_definida).getTime()) / (1000 * 60 * 60 * 24)
            )
          },
          usuario_id: logData.usuario_id,
          ip_origem: logData.ip_origem,
          user_agent: logData.user_agent
        }
      });
    } catch (error) {
      console.error('Erro ao criar log de prazo retroativo:', error);
      // Não falhar a operação principal por causa do log
    }
  }

  /**
   * Valida se o usuário pode definir prazo
   */
  async podeDefinirPrazo(usuarioId: string, lojaId: string): Promise<boolean> {
    try {
      const usuario = await this.prisma.usuario.findFirst({
        where: {
          id: usuarioId,
          loja_id: lojaId,
          status: 'ATIVO',
          ativo: true
        },
        select: {
          funcao: true,
          perfis: {
            include: {
              perfil: {
                include: {
                  permissoes: {
                    where: {
                      modulo: 'OS',
                      acao: 'DEFINIR_PRAZO',
                      permitido: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!usuario) {
        return false;
      }

      // ADMINISTRADOR tem acesso total
      if (usuario.funcao === 'ADMINISTRADOR') {
        return true;
      }

      // Verificar permissão via perfil
      const temPermissaoPerfil = usuario.perfis.some(up => 
        up.perfil.ativo && up.perfil.permissoes.length > 0
      );

      if (temPermissaoPerfil) {
        return true;
      }

      // PRODUCAO tem permissão padrão
      if (usuario.funcao === 'PRODUCAO') {
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erro ao verificar permissão de prazo:', error);
      return false;
    }
  }
}
