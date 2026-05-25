import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AprovarTecnicaDto,
  AgendarInstalacaoDto,
  AprovacaoTecnicaResponseDto,
} from '../dto/aprovacao-tecnica.dto';
import { ValidacaoEstoqueService } from '../../orcamentos-v2/services/validacao-estoque.service';

@Injectable()
export class AprovacaoTecnicaService {
  constructor(
    private prisma: PrismaService,
    private validacaoEstoque: ValidacaoEstoqueService,
  ) {}

  async validarPreAprovacao(osId: string): Promise<{
    estoque_ok: boolean;
    arte_anexada: boolean;
    dados_completos: boolean;
    prazo_viavel: boolean;
    alertas: string[];
  }> {
    const os = await this.prisma.ordemServico.findUnique({
      where: { id: osId },
      include: {
        itens: true,
        orcamento: {
          include: {
            produtos: true,
          },
        },
      },
    });

    if (!os) {
      throw new NotFoundException('Ordem de Serviço não encontrada');
    }

    const alertas: string[] = [];
    let estoque_ok = true;
    let arte_anexada = true;
    let dados_completos = true;
    let prazo_viavel = true;

    // 1. Validar estoque disponivel (usa flag materiais_disponivel da OS)
    // OBS: nao bloqueia aprovacao; serve apenas como alerta para o aprovador.
    try {
      estoque_ok = os.materiais_disponivel === true;
      if (!estoque_ok) {
        alertas.push('Materiais ainda nao confirmados como disponiveis');
      }
    } catch (error) {
      estoque_ok = false;
      alertas.push('Erro ao validar estoque');
    }

    // 2. Validar se arte foi anexada / aprovada pelo cliente.
    // Consideramos "arte anexada" quando existe pelo menos uma versao de arte
    // nao deletada para a OS. NAO bloqueia aprovacao - serve apenas como alerta,
    // para que o aprovador decida sob sua responsabilidade (ex.: OS recorrente
    // que nao requer ciclo de arte).
    try {
      const versoesArte = await this.prisma.arteVersao.count({
        where: {
          os_id: osId,
          deletado: false,
        },
      });
      arte_anexada = versoesArte > 0;
      if (!arte_anexada) {
        alertas.push('Nenhuma versao de arte anexada a esta OS');
      }
    } catch (error) {
      arte_anexada = false;
      alertas.push('Erro ao validar arte anexada');
    }

    // 3. Validar dados completos
    if (!os.nome_servico || !os.descricao) {
      dados_completos = false;
      alertas.push('Nome do serviço ou descrição não preenchidos');
    }

    if (!os.quantidade || Number(os.quantidade) <= 0) {
      dados_completos = false;
      alertas.push('Quantidade inválida');
    }

    if (!os.parametros_tecnicos) {
      dados_completos = false;
      alertas.push('Parâmetros técnicos não preenchidos');
    }

    // 4. Validar prazo viável
    if (!os.data_prazo) {
      prazo_viavel = false;
      alertas.push('Data de prazo não definida');
    } else {
      const hoje = new Date();
      const prazo = new Date(os.data_prazo);
      const diasRestantes = Math.ceil(
        (prazo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diasRestantes < 1) {
        prazo_viavel = false;
        alertas.push('Prazo muito apertado (menos de 1 dia)');
      } else if (diasRestantes < 3) {
        alertas.push('Prazo apertado (menos de 3 dias)');
      }
    }

    return {
      estoque_ok,
      arte_anexada,
      dados_completos,
      prazo_viavel,
      alertas,
    };
  }

  async aprovarTecnica(
    osId: string,
    dto: AprovarTecnicaDto,
    usuarioId: string,
  ): Promise<AprovacaoTecnicaResponseDto> {
    const os = await this.prisma.ordemServico.findUnique({
      where: { id: osId },
    });

    if (!os) {
      throw new NotFoundException('Ordem de Serviço não encontrada');
    }

    if (os.status !== 'AGUARDANDO_APROVACAO_TECNICA') {
      throw new BadRequestException('OS não está aguardando aprovação técnica');
    }

    // Verificar permissões do usuário
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario) {
      throw new ForbiddenException('Usuário não encontrado');
    }

    // TODO: Implementar verificação de permissões baseada em funções
    // Por enquanto, permitir para todos os usuários autenticados

    // Executar validacoes pre-aprovacao
    const validacoes = await this.validarPreAprovacao(osId);

    // POLITICA DE BLOQUEIO (intencionalmente restrita):
    // - Estoque insuficiente: NAO bloqueia. Vira alerta no payload.
    // - Arte nao anexada: NAO bloqueia. Vira alerta no payload (suporta o
    //   caso de OS recorrente que nao requer ciclo de arte).
    // - Dados incompletos (nome_servico, descricao, quantidade, parametros): BLOQUEIA.
    //   Esses sao requisitos minimos para a OS sequer existir tecnicamente.
    // - Prazo nao definido: NAO bloqueia (vira alerta). Apenas prazo no passado
    //   tambem nao bloqueia, pois e responsabilidade do aprovador decidir.
    if (dto.aprovado && !validacoes.dados_completos) {
      throw new BadRequestException(
        `Nao e possivel aprovar: dados incompletos. ${validacoes.alertas.join(' | ')}`,
      );
    }

    // Atualizar OS com resultado da aprovação
    const statusNovo = dto.aprovado ? 'APROVADA_TECNICA' : 'REJEITADA';

    const osAtualizada = await this.prisma.ordemServico.update({
      where: { id: osId },
      data: {
        status: statusNovo,
        aprovacao_tecnica_status: dto.aprovado ? 'APROVADA' : 'REJEITADA',
        aprovacao_tecnica_por: usuarioId,
        aprovacao_tecnica_em: new Date(),
        aprovacao_tecnica_obs: dto.observacoes,
      },
    });

    // TODO: Enviar notificação se rejeitada

    return {
      id: osAtualizada.id,
      status: osAtualizada.status,
      aprovacao_tecnica_status: osAtualizada.aprovacao_tecnica_status,
      aprovacao_tecnica_por: osAtualizada.aprovacao_tecnica_por,
      aprovacao_tecnica_em: osAtualizada.aprovacao_tecnica_em,
      aprovacao_tecnica_obs: osAtualizada.aprovacao_tecnica_obs,
      data_instalacao_agendada: osAtualizada.data_instalacao_agendada,
      observacoes_instalacao: osAtualizada.observacoes_instalacao,
      validacoes,
    };
  }

  async agendarInstalacao(
    osId: string,
    dto: AgendarInstalacaoDto,
  ): Promise<AprovacaoTecnicaResponseDto> {
    const os = await this.prisma.ordemServico.findUnique({
      where: { id: osId },
    });

    if (!os) {
      throw new NotFoundException('Ordem de Serviço não encontrada');
    }

    if (os.status !== 'APROVADA_TECNICA') {
      throw new BadRequestException(
        'OS deve estar aprovada tecnicamente para agendar instalação',
      );
    }

    // Verificar se há serviço de instalação
    const temInstalacao = await this.verificarInstalacaoNecessaria(osId);
    if (!temInstalacao) {
      throw new BadRequestException('OS não possui serviço de instalação');
    }

    const dataInstalacao = new Date(dto.data_instalacao);
    const hoje = new Date();

    if (dataInstalacao <= hoje) {
      throw new BadRequestException('Data de instalação deve ser futura');
    }

    const osAtualizada = await this.prisma.ordemServico.update({
      where: { id: osId },
      data: {
        data_instalacao_agendada: dataInstalacao,
        observacoes_instalacao: dto.observacoes,
        status: 'INSTALACAO_AGENDADA',
      },
    });

    return {
      id: osAtualizada.id,
      status: osAtualizada.status,
      aprovacao_tecnica_status: osAtualizada.aprovacao_tecnica_status,
      aprovacao_tecnica_por: osAtualizada.aprovacao_tecnica_por,
      aprovacao_tecnica_em: osAtualizada.aprovacao_tecnica_em,
      aprovacao_tecnica_obs: osAtualizada.aprovacao_tecnica_obs,
      data_instalacao_agendada: osAtualizada.data_instalacao_agendada,
      observacoes_instalacao: osAtualizada.observacoes_instalacao,
      validacoes: await this.validarPreAprovacao(osId),
    };
  }

  private async verificarInstalacaoNecessaria(osId: string): Promise<boolean> {
    // TODO: Implementar verificação de instalação quando estrutura estiver completa
    // Por enquanto, assumir que não há instalação necessária
    return false;
  }

  async getStatusAprovacao(osId: string): Promise<AprovacaoTecnicaResponseDto> {
    const os = await this.prisma.ordemServico.findUnique({
      where: { id: osId },
    });

    if (!os) {
      throw new NotFoundException('Ordem de Serviço não encontrada');
    }

    const validacoes = await this.validarPreAprovacao(osId);

    return {
      id: os.id,
      status: os.status,
      aprovacao_tecnica_status: os.aprovacao_tecnica_status,
      aprovacao_tecnica_por: os.aprovacao_tecnica_por,
      aprovacao_tecnica_em: os.aprovacao_tecnica_em,
      aprovacao_tecnica_obs: os.aprovacao_tecnica_obs,
      data_instalacao_agendada: os.data_instalacao_agendada,
      observacoes_instalacao: os.observacoes_instalacao,
      validacoes,
    };
  }
}
