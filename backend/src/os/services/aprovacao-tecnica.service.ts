import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AprovarTecnicaDto,
  AgendarInstalacaoDto,
  AprovacaoTecnicaResponseDto,
} from '../dto/aprovacao-tecnica.dto';
import { ValidacaoEstoqueService } from '../../orcamentos-v2/services/validacao-estoque.service';
import { OSService } from './os.service';

@Injectable()
export class AprovacaoTecnicaService {
  constructor(
    private prisma: PrismaService,
    private validacaoEstoque: ValidacaoEstoqueService,
    // forwardRef evita ciclo de inicializacao com OSService (ambos estao no
    // mesmo modulo e podem se referenciar mutuamente em runtime futuro).
    @Inject(forwardRef(() => OSService))
    private osService: OSService,
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
    //
    // Leitura B (decisão de 2026-05-26, Fase 7.A): a imagem/DXF anexada ao
    // produto no orçamento (`ItemOS.arquivo_geometria_url`, propagada da
    // Fase 3) **conta como arte** para fins desse critério. Isso evita o
    // duplo trabalho de subir a imagem no orçamento e depois subir uma
    // `ArteVersao` separada para a OS quando o trabalho é simples (banner,
    // adesivo, recorte). O módulo `Arte & Aprovação` continua disponível
    // para casos que precisam de revisão profissional com link público.
    //
    // NÃO bloqueia aprovação — serve apenas como alerta, para que o
    // aprovador decida sob sua responsabilidade.
    try {
      const [versoesArte, itensComGeometria] = await Promise.all([
        this.prisma.arteVersao.count({
          where: {
            os_id: osId,
            deletado: false,
          },
        }),
        this.prisma.itemOS.count({
          where: {
            os_id: osId,
            arquivo_geometria_url: { not: null },
          },
        }),
      ]);
      arte_anexada = versoesArte > 0 || itensComGeometria > 0;
      if (!arte_anexada) {
        alertas.push('Nenhuma arte ou imagem de geometria anexada a esta OS');
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

    // Aceita aprovacao tecnica em qualquer status NAO-terminal. Suporta tanto
    // o fluxo padrao quanto regularizacao retroativa de OS legadas.
    const statusBloqueados = [
      'FINALIZADA',
      'CANCELADA',
      'REJEITADA',
      'APROVADA_TECNICA',
    ];
    if (statusBloqueados.includes(os.status)) {
      throw new BadRequestException(
        `OS em status "${os.status}" nao pode receber aprovacao tecnica`,
      );
    }

    const aprovacaoAtual = (
      os.aprovacao_tecnica_status || 'PENDENTE'
    ).toUpperCase();
    if (aprovacaoAtual !== 'PENDENTE') {
      throw new BadRequestException(
        `OS ja possui decisao de aprovacao tecnica: ${aprovacaoAtual}`,
      );
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

    // Decidir novo status:
    // - Fluxo padrao (FILA / AGUARDANDO_APROVACAO_TECNICA): aprovacao promove
    //   a OS direto para LIBERADA_PARA_PCP (decisao de produto tomada em
    //   2026-05-25). O estado APROVADA_TECNICA deixou de ser estado de
    //   repouso porque a etapa seguinte (liberar para PCP) era sempre
    //   manual e ninguem fazia, deixando a OS invisivel ao kanban.
    // - Fluxo retroativo (qualquer outro status): aprovacao apenas registra
    //   a decisao mas MANTEM o status operacional atual.
    // - Rejeicao sempre marca status como REJEITADA.
    const statusFluxoPadrao = ['AGUARDANDO_APROVACAO_TECNICA', 'FILA'];
    const eFluxoPadrao = statusFluxoPadrao.includes(os.status);

    let statusNovo: string;
    if (dto.aprovado) {
      statusNovo = eFluxoPadrao ? 'LIBERADA_PARA_PCP' : os.status;
    } else {
      statusNovo = 'REJEITADA';
    }

    // Prazos por item da OS, definidos no modal de aprovação. Em fluxo
    // padrão TODOS os itens precisam ter data_prazo_produto (cobre o caso
    // histórico em que OS aprovadas sem prazo travavam o PCP). Em fluxo
    // retroativo o array é opcional.
    const prazosPorItem = await this.validarEPrepararPrazosItens(
      osId,
      dto.prazos_itens || [],
      eFluxoPadrao && dto.aprovado,
    );

    // Atualiza prazo guarda-chuva da OS, se for o caso. Regra:
    //  - Se a OS ainda não tem data_prazo, usa o max(data_prazo_produto) dos
    //    itens enviados.
    //  - Se já tem, valida que todos os itens caibam dentro.
    const dataPrazoOS = this.calcularPrazoGuardaChuva(
      os.data_prazo,
      prazosPorItem,
    );

    const osAtualizada = await this.prisma.ordemServico.update({
      where: { id: osId },
      data: {
        status: statusNovo,
        aprovacao_tecnica_status: dto.aprovado ? 'APROVADA' : 'REJEITADA',
        aprovacao_tecnica_por: usuarioId,
        aprovacao_tecnica_em: new Date(),
        aprovacao_tecnica_obs: dto.observacoes,
        ...(dataPrazoOS !== undefined ? { data_prazo: dataPrazoOS } : {}),
      },
    });

    // Persiste prazos por item em batch (após atualizar a OS para garantir
    // que o estado da OS reflete o que foi aprovado).
    if (prazosPorItem.length > 0) {
      await Promise.all(
        prazosPorItem.map((p) =>
          this.prisma.itemOS.update({
            where: { id: p.item_id },
            data: {
              ...(p.data_inicio_producao !== undefined
                ? { data_inicio_producao: p.data_inicio_producao }
                : {}),
              ...(p.data_prazo_produto !== undefined
                ? { data_prazo_produto: p.data_prazo_produto }
                : {}),
            },
          }),
        ),
      );
    }

    // Auto-promocao para o PCP no fluxo padrao: libera itens PENDENTE,
    // notifica eventos e tenta atribuir um workflow inteligente. Falhas sao
    // absorvidas em warn dentro do proprio helper para nao reverter a
    // aprovacao.
    if (dto.aprovado && eFluxoPadrao) {
      await this.osService.promoverAprovacaoParaPCP(
        osId,
        os.loja_id,
        usuarioId,
      );
    }

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
      data_prazo: osAtualizada.data_prazo,
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

    // A partir de 2026-05-25 o status APROVADA_TECNICA deixou de ser estado
    // de repouso (a aprovacao agora promove direto para LIBERADA_PARA_PCP /
    // EM_WORKFLOW). Mantemos APROVADA_TECNICA na lista permitida para nao
    // quebrar OS legadas que ainda estejam nesse estado. O que realmente
    // importa neste ponto e a OS ja ter passado pela aprovacao tecnica, nao
    // o status operacional em si.
    const statusPermitidosInstalacao = new Set([
      'APROVADA_TECNICA',
      'LIBERADA_PARA_PCP',
      'EM_WORKFLOW',
      'PRODUCAO',
      'ACABAMENTO',
      'AGUARDANDO_MATERIAL',
    ]);
    if (
      !statusPermitidosInstalacao.has(os.status) ||
      (os.aprovacao_tecnica_status || '').toUpperCase() !== 'APROVADA'
    ) {
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
      include: {
        itens: {
          select: {
            id: true,
            produto_servico: true,
            data_inicio_producao: true,
            data_prazo_produto: true,
            status_liberacao_pcp: true,
          },
        },
      },
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
      data_prazo: os.data_prazo,
      itens: os.itens.map((it) => ({
        item_id: it.id,
        produto_servico: it.produto_servico,
        data_inicio_producao: it.data_inicio_producao,
        data_prazo_produto: it.data_prazo_produto,
        status_liberacao_pcp: it.status_liberacao_pcp,
      })),
      validacoes,
    };
  }

  /**
   * Valida e prepara prazos por item enviados no modal de aprovação.
   *
   * Regras:
   *  - Em fluxo padrão (exigirCompleto=true) todos os itens da OS devem ter
   *    `data_prazo_produto` informado. Caso contrário, 400.
   *  - Cada item enviado precisa pertencer à OS (segurança contra IDs
   *    alheios).
   *  - Para cada item: se ambas as datas foram enviadas, início <= fim.
   *
   * Retorna a lista de prazos validados, prontos para persistir.
   */
  private async validarEPrepararPrazosItens(
    osId: string,
    prazos: Array<{
      item_id: string;
      data_inicio_producao?: string;
      data_prazo_produto?: string;
    }>,
    exigirCompleto: boolean,
  ): Promise<
    Array<{
      item_id: string;
      data_inicio_producao?: Date;
      data_prazo_produto?: Date;
    }>
  > {
    const itensDaOS = await this.prisma.itemOS.findMany({
      where: { os_id: osId },
      select: { id: true, produto_servico: true },
    });
    const idsValidos = new Set(itensDaOS.map((i) => i.id));
    const indexPrazos = new Map(prazos.map((p) => [p.item_id, p]));

    if (exigirCompleto) {
      const semPrazo: string[] = [];
      for (const item of itensDaOS) {
        const p = indexPrazos.get(item.id);
        if (!p?.data_prazo_produto) {
          semPrazo.push(item.produto_servico);
        }
      }
      if (semPrazo.length > 0) {
        throw new BadRequestException(
          `Defina a data de entrega de cada serviço antes de aprovar: ${semPrazo.join(', ')}`,
        );
      }
    }

    const preparados: Array<{
      item_id: string;
      data_inicio_producao?: Date;
      data_prazo_produto?: Date;
    }> = [];

    for (const p of prazos) {
      if (!idsValidos.has(p.item_id)) {
        throw new BadRequestException(
          `Item ${p.item_id} não pertence a esta OS`,
        );
      }

      let inicio: Date | undefined;
      let fim: Date | undefined;

      if (p.data_inicio_producao) {
        inicio = new Date(p.data_inicio_producao);
        if (Number.isNaN(inicio.getTime())) {
          throw new BadRequestException(
            `Data de início inválida no item ${p.item_id}`,
          );
        }
      }
      if (p.data_prazo_produto) {
        fim = new Date(p.data_prazo_produto);
        if (Number.isNaN(fim.getTime())) {
          throw new BadRequestException(
            `Data de entrega inválida no item ${p.item_id}`,
          );
        }
      }
      if (inicio && fim && inicio > fim) {
        throw new BadRequestException(
          `Data de início não pode ser posterior à data de entrega (item ${p.item_id})`,
        );
      }

      preparados.push({
        item_id: p.item_id,
        ...(inicio ? { data_inicio_producao: inicio } : {}),
        ...(fim ? { data_prazo_produto: fim } : {}),
      });
    }

    return preparados;
  }

  /**
   * Calcula o prazo guarda-chuva (`OrdemServico.data_prazo`) com base nos
   * prazos individuais dos itens. Regras:
   *
   *  - Se a OS ainda não tem `data_prazo` e ao menos 1 item tem
   *    `data_prazo_produto`: usa o MAIOR `data_prazo_produto` (data de
   *    entrega mais tardia). Garante que o prazo da OS engloba todos os
   *    serviços.
   *  - Se a OS já tem `data_prazo` definido E algum item enviado o excede:
   *    bloqueia com 400. Evita estado inconsistente em que o prazo da OS é
   *    menor do que algum serviço.
   *  - Caso contrário retorna `undefined` (não atualizar).
   */
  private calcularPrazoGuardaChuva(
    dataPrazoAtual: Date | null,
    prazosItens: Array<{ data_prazo_produto?: Date }>,
  ): Date | undefined {
    const fins = prazosItens
      .map((p) => p.data_prazo_produto)
      .filter((d): d is Date => !!d);

    if (fins.length === 0) {
      return undefined;
    }

    const maiorFim = fins.reduce((max, d) => (d > max ? d : max));

    if (!dataPrazoAtual) {
      return maiorFim;
    }

    if (maiorFim > dataPrazoAtual) {
      throw new BadRequestException(
        'Algum serviço tem prazo maior que o prazo limite atual da OS. Atualize o prazo da OS antes.',
      );
    }

    return undefined;
  }
}
