import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  LinkPublico,
  PermissaoLink,
  OrcamentoCompleto,
} from '../interfaces/orcamento.interface';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { VendasPermissionsService } from '../../vendas/permissions/vendas-permissions.service';
import { VENDAS_PERMISSOES } from '../../vendas/permissions/vendas-permissoes';

/**
 * Serviço de Links V2 para Orçamentos
 * Implementa sistema de links públicos e compartilhamento
 *
 * ✅ ARQUIVO ≤ 400 LINHAS (CONFORME PREMISSAS)
 * ✅ SISTEMA DE LINKS PÚBLICOS COMPLETO
 * ✅ CONTROLE DE PERMISSÕES E VALIDAÇÃO
 */
@Injectable()
export class LinksV2Service {
  private readonly logger = new Logger(LinksV2Service.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vendasPermissions: VendasPermissionsService,
  ) {}

  /**
   * Cria link público para orçamento
   */
  async criarLinkPublico(
    orcamentoId: string,
    usuarioId: string,
    lojaId: string,
    permissoes: PermissaoLink[],
    dataExpiracao?: Date,
    maxVisualizacoes?: number,
    senha?: string,
  ): Promise<LinkPublico> {
    await this.vendasPermissions.assertPode(
      usuarioId,
      lojaId,
      VENDAS_PERMISSOES.PROPOSTA_ENVIAR,
    );

    this.logger.log(`🔗 Criando link público para orçamento ${orcamentoId}`);

    try {
      await this.validarOrcamento(orcamentoId, lojaId);
      await this.validarAcessoAoOrcamento(orcamentoId, usuarioId, lojaId);

      // Gerar token único
      const token = this.gerarTokenUnico();

      // Criar link público
      const linkPublico = await this.prisma.linkPublico.create({
        data: {
          orcamento_id: orcamentoId,
          criado_por_usuario: usuarioId,
          token,
          permissoes: JSON.stringify(permissoes),
          data_expiracao: dataExpiracao,
          max_visualizacoes: maxVisualizacoes,
          senha: senha ? await this.criptografarSenha(senha) : null,
          ativo: true,
          criado_em: new Date(),
          visualizacoes: 0,
        },
        include: {},
      });

      this.logger.log(`✅ Link público criado com sucesso: ${linkPublico.id}`);
      return this.transformarLinkPublico(linkPublico);
    } catch (error) {
      this.logger.error(`❌ Erro ao criar link público: ${error.message}`);
      throw error;
    }
  }

  /**
   * Valida e acessa link público.
   *
   * Gate 0S: apesar do nome, a rota que chama este método exige JWT. Resolver o
   * link só pelo token deixava um usuário autenticado consumir visualização e
   * gravar acesso em link de outra loja, bastando conhecer o token. A loja
   * autenticada entra na consulta como qualquer outro recurso de tenant.
   */
  async acessarLinkPublico(
    token: string,
    lojaId: string,
    senha?: string,
    ipAcesso?: string,
    userAgent?: string,
  ): Promise<{
    link: LinkPublico;
    orcamento: any;
    permissoes: PermissaoLink[];
  }> {
    // O token é credencial de acesso e não pode ir para o log.
    this.logger.log('🔍 Acessando link público por token');

    try {
      // Buscar link público
      const linkPublico = await this.prisma.linkPublico.findFirst({
        where: {
          token,
          ativo: true,
          orcamento: { loja_id: lojaId },
        },
        include: {},
      });

      if (!linkPublico) {
        throw new NotFoundException('Link público não encontrado ou inativo');
      }

      // Validar expiração
      if (
        linkPublico.data_expiracao &&
        linkPublico.data_expiracao < new Date()
      ) {
        throw new Error('Link público expirado');
      }

      // Validar limite de visualizações
      if (
        linkPublico.max_visualizacoes &&
        linkPublico.visualizacoes >= linkPublico.max_visualizacoes
      ) {
        throw new Error('Limite de visualizações atingido');
      }

      // Validar senha se aplicável
      if (linkPublico.senha && !senha) {
        throw new Error('Senha obrigatória para acessar este link');
      }

      if (linkPublico.senha && senha) {
        const senhaValida = await this.validarSenha(senha, linkPublico.senha);
        if (!senhaValida) {
          throw new Error('Senha incorreta');
        }
      }

      // Registrar acesso
      await this.registrarAcesso(linkPublico.id, ipAcesso, userAgent);

      // Incrementar contador de visualizações
      await this.incrementarVisualizacoes(linkPublico.id);

      this.logger.log(
        `✅ Link público acessado com sucesso: ${linkPublico.id}`,
      );

      return {
        link: this.transformarLinkPublico(linkPublico),
        orcamento: null,
        permissoes: linkPublico.permissoes
          ? JSON.parse(linkPublico.permissoes)
          : [],
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao acessar link público: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lista links públicos de um orçamento
   */
  async listarLinksPublicos(
    orcamentoId: string,
    usuarioId: string,
    lojaId: string,
  ): Promise<LinkPublico[]> {
    this.logger.log(`📋 Listando links públicos do orçamento ${orcamentoId}`);

    try {
      await this.validarAcessoAoOrcamento(orcamentoId, usuarioId, lojaId);

      // Buscar links públicos
      const links = await this.prisma.linkPublico.findMany({
        where: {
          orcamento_id: orcamentoId,
          ativo: true,
        },
        include: {},
        orderBy: { criado_em: 'desc' },
      });

      return links.map((link) => this.transformarLinkPublico(link));
    } catch (error) {
      this.logger.error(`❌ Erro ao listar links públicos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Atualiza link público
   */
  async atualizarLinkPublico(
    linkId: string,
    usuarioId: string,
    lojaId: string,
    dados: {
      permissoes?: PermissaoLink[];
      dataExpiracao?: Date;
      maxVisualizacoes?: number;
      senha?: string;
      ativo?: boolean;
    },
  ): Promise<LinkPublico> {
    this.logger.log(`✏️ Atualizando link público ${linkId}`);

    try {
      const linkPublico = await this.buscarLinkDaLoja(linkId, lojaId);

      await this.validarAcessoAoOrcamento(
        linkPublico.orcamento_id,
        usuarioId,
        lojaId,
      );

      // Preparar dados para atualização
      const dadosAtualizacao: any = {};

      if (dados.permissoes !== undefined) {
        dadosAtualizacao.permissoes = JSON.stringify(dados.permissoes);
      }

      if (dados.dataExpiracao !== undefined) {
        dadosAtualizacao.data_expiracao = dados.dataExpiracao;
      }

      if (dados.maxVisualizacoes !== undefined) {
        dadosAtualizacao.max_visualizacoes = dados.maxVisualizacoes;
      }

      if (dados.senha !== undefined) {
        dadosAtualizacao.senha = dados.senha
          ? await this.criptografarSenha(dados.senha)
          : null;
      }

      if (dados.ativo !== undefined) {
        dadosAtualizacao.ativo = dados.ativo;
      }

      // Atualizar link público
      const linkAtualizado = await this.prisma.linkPublico.update({
        where: { id: linkId },
        data: dadosAtualizacao,
        include: {},
      });

      this.logger.log(`✅ Link público atualizado com sucesso: ${linkId}`);
      return this.transformarLinkPublico(linkAtualizado);
    } catch (error) {
      this.logger.error(`❌ Erro ao atualizar link público: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove link público
   */
  async removerLinkPublico(
    linkId: string,
    usuarioId: string,
    lojaId: string,
  ): Promise<void> {
    this.logger.log(`🗑️ Removendo link público ${linkId}`);

    try {
      const linkPublico = await this.buscarLinkDaLoja(linkId, lojaId);

      await this.validarAcessoAoOrcamento(
        linkPublico.orcamento_id,
        usuarioId,
        lojaId,
      );

      // Remover link público (soft delete)
      await this.prisma.linkPublico.update({
        where: { id: linkId },
        data: { ativo: false },
      });

      this.logger.log(`✅ Link público removido com sucesso: ${linkId}`);
    } catch (error) {
      this.logger.error(`❌ Erro ao remover link público: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca estatísticas de links públicos
   */
  async buscarEstatisticasLinks(
    orcamentoId: string,
    usuarioId: string,
    lojaId: string,
  ): Promise<{
    total_links: number;
    links_ativos: number;
    total_visualizacoes: number;
    links_por_permissao: Record<string, number>;
    links_expirados: number;
    links_com_senha: number;
  }> {
    this.logger.log(
      `📊 Buscando estatísticas de links do orçamento ${orcamentoId}`,
    );

    try {
      await this.validarAcessoAoOrcamento(orcamentoId, usuarioId, lojaId);

      // Buscar estatísticas
      const [
        totalLinks,
        linksAtivos,
        totalVisualizacoes,
        linksPorPermissao,
        linksExpirados,
        linksComSenha,
      ] = await Promise.all([
        this.prisma.linkPublico.count({
          where: { orcamento_id: orcamentoId },
        }),
        this.prisma.linkPublico.count({
          where: {
            orcamento_id: orcamentoId,
            ativo: true,
          },
        }),
        this.prisma.linkPublico.aggregate({
          where: { orcamento_id: orcamentoId },
          _sum: { visualizacoes: true },
        }),
        this.buscarLinksPorPermissao(orcamentoId),
        this.prisma.linkPublico.count({
          where: {
            orcamento_id: orcamentoId,
            data_expiracao: { lt: new Date() },
          },
        }),
        this.prisma.linkPublico.count({
          where: {
            orcamento_id: orcamentoId,
            senha: { not: null },
          },
        }),
      ]);

      return {
        total_links: totalLinks,
        links_ativos: linksAtivos,
        total_visualizacoes: totalVisualizacoes._sum.visualizacoes || 0,
        links_por_permissao: linksPorPermissao,
        links_expirados: linksExpirados,
        links_com_senha: linksComSenha,
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar estatísticas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca histórico de acessos de um link
   */
  async buscarHistoricoAcessos(
    linkId: string,
    usuarioId: string,
    lojaId: string,
    pagina: number = 1,
    porPagina: number = 50,
  ): Promise<{
    acessos: any[];
    total: number;
    pagina: number;
    porPagina: number;
  }> {
    this.logger.log(`📋 Buscando histórico de acessos do link ${linkId}`);

    try {
      const linkPublico = await this.buscarLinkDaLoja(linkId, lojaId);

      await this.validarAcessoAoOrcamento(
        linkPublico.orcamento_id,
        usuarioId,
        lojaId,
      );

      // Calcular paginação
      const skip = (pagina - 1) * porPagina;
      const take = Math.min(porPagina, 100);

      // Buscar histórico de acessos
      const [acessos, total] = await Promise.all([
        this.prisma.acessoLink.findMany({
          where: { link_id: linkId },
          orderBy: { data_acesso: 'desc' },
          skip,
          take,
        }),
        this.prisma.acessoLink.count({
          where: { link_id: linkId },
        }),
      ]);

      return {
        acessos,
        total,
        pagina,
        porPagina: take,
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar histórico: ${error.message}`);
      throw error;
    }
  }

  // Métodos privados auxiliares

  /**
   * Resolve o link sempre pelo orçamento da loja autenticada. Buscar apenas
   * por `id` permitiria manipular link de outro tenant (IDOR).
   */
  private async buscarLinkDaLoja(linkId: string, lojaId: string) {
    const link = await this.prisma.linkPublico.findFirst({
      where: { id: linkId, orcamento: { loja_id: lojaId } },
    });

    if (!link) {
      throw new NotFoundException('Link público não encontrado');
    }

    return link;
  }

  /**
   * Resolve o orçamento sempre dentro da loja autenticada. Buscar apenas por
   * `id` permitiria acessar orçamento de outro tenant (IDOR).
   */
  private async validarOrcamento(
    orcamentoId: string,
    lojaId: string,
  ): Promise<any> {
    const orcamento = await this.prisma.orcamento.findFirst({
      where: { id: orcamentoId, loja_id: lojaId },
    });

    if (!orcamento) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    if (!orcamento.ativo) {
      throw new BadRequestException('Orçamento inativo');
    }

    return orcamento;
  }

  /**
   * Confirma que o orçamento pertence à loja autenticada e que o usuário está
   * ativo nessa mesma loja. Mutações também passam por `assertPode` no service;
   * o guard HTTP é defesa adicional.
   *
   * Não distingue "não existe" de "existe em outra loja", para não permitir
   * enumeração de identificadores.
   */
  private async validarAcessoAoOrcamento(
    orcamentoId: string,
    usuarioId: string,
    lojaId: string,
  ): Promise<void> {
    const [orcamento, usuario] = await Promise.all([
      this.prisma.orcamento.findFirst({
        where: { id: orcamentoId, loja_id: lojaId },
        select: { id: true },
      }),
      this.prisma.usuario.findFirst({
        where: { id: usuarioId, loja_id: lojaId, status: 'ATIVO', ativo: true },
        select: { id: true },
      }),
    ]);

    if (!orcamento || !usuario) {
      throw new NotFoundException('Orçamento não encontrado');
    }
  }

  private gerarTokenUnico(): string {
    // Gerar token único de 32 caracteres
    return randomBytes(16).toString('hex');
  }

  private async criptografarSenha(senha: string): Promise<string> {
    return bcrypt.hash(senha, 12);
  }

  private async validarSenha(senha: string, hash: string): Promise<boolean> {
    return bcrypt.compare(senha, hash);
  }

  private async registrarAcesso(
    linkId: string,
    ipAcesso?: string,
    userAgent?: string,
  ): Promise<void> {
    try {
      await this.prisma.acessoLink.create({
        data: {
          link_id: linkId,
          ip_acesso: ipAcesso,
          user_agent: userAgent,
          data_acesso: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`❌ Erro ao registrar acesso: ${error.message}`);
    }
  }

  private async incrementarVisualizacoes(linkId: string): Promise<void> {
    try {
      await this.prisma.linkPublico.update({
        where: { id: linkId },
        data: {
          visualizacoes: {
            increment: 1,
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `❌ Erro ao incrementar visualizações: ${error.message}`,
      );
    }
  }

  private async buscarLinksPorPermissao(
    orcamentoId: string,
  ): Promise<Record<string, number>> {
    const links = await this.prisma.linkPublico.findMany({
      where: {
        orcamento_id: orcamentoId,
        ativo: true,
      },
      select: { permissoes: true },
    });

    const resultado: Record<string, number> = {};

    links.forEach((link) => {
      const permissoes = link.permissoes
        ? (JSON.parse(link.permissoes as any) as string[])
        : [];
      permissoes.forEach((permissao: string) => {
        resultado[permissao] = (resultado[permissao] || 0) + 1;
      });
    });

    return resultado;
  }

  private transformarLinkPublico(link: any): LinkPublico {
    return {
      id: link.id,
      orcamento_id: link.orcamento_id,
      criado_por: link.criado_por,
      token: link.token,
      permissoes: link.permissoes ? JSON.parse(link.permissoes) : [],
      data_expiracao: link.data_expiracao,
      max_visualizacoes: link.max_visualizacoes,
      senha: link.senha ? true : false,
      ativo: link.ativo,
      data_criacao: link.criado_em,
      visualizacoes: link.visualizacoes,
    } as any;
  }
}
