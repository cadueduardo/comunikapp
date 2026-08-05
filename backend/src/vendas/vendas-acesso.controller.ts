import {
  Controller,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { extrairIdentidadeAutenticada } from '../auth/decorators';
import { VendasPermissionsService } from './permissions/vendas-permissions.service';
import { VENDAS_PERMISSOES } from './permissions/vendas-permissoes';

/**
 * Contexto de acesso ao módulo Vendas para navegação (Fase 3).
 * A autorização real continua no backend; o frontend só esconde/mostra UI.
 * Nunca confia em role/loja enviados pelo cliente.
 */
@ApiTags('Vendas — Acesso')
@ApiBearerAuth()
@Controller('vendas')
@UseGuards(JwtAuthGuard)
export class VendasAcessoController {
  constructor(private readonly vendasPermissions: VendasPermissionsService) {}

  @Get('acesso')
  @ApiOperation({
    summary: 'Contexto de acesso ao módulo Vendas',
    description:
      'Indica se o usuário autenticado pode ver o hub Vendas, com base em VendasPermissionsService.',
  })
  async obterAcesso(@Request() req: unknown) {
    const { usuarioId, lojaId } = extrairIdentidadeAutenticada(req);

    const pode = (permissao: string) =>
      this.vendasPermissions.pode(usuarioId, lojaId, permissao);

    const [
      propostaVer,
      propostaCriar,
      propostaEditar,
      propostaEnviar,
      propostaExcluir,
      carteiraVerPropria,
      carteiraVerEquipe,
      carteiraVerTodos,
      carteiraVerSemResponsavel,
      carteiraTransferir,
      clienteCriar,
      clienteEditar,
      clienteInativar,
      clienteMesclar,
      contatoGerenciar,
      atividadeVerPropria,
      atividadeVerEquipe,
      atividadeGerenciar,
    ] = await Promise.all([
      pode(VENDAS_PERMISSOES.PROPOSTA_VER),
      pode(VENDAS_PERMISSOES.PROPOSTA_CRIAR),
      pode(VENDAS_PERMISSOES.PROPOSTA_EDITAR),
      pode(VENDAS_PERMISSOES.PROPOSTA_ENVIAR),
      pode(VENDAS_PERMISSOES.PROPOSTA_EXCLUIR),
      pode(VENDAS_PERMISSOES.CARTEIRA_VER_PROPRIA),
      pode(VENDAS_PERMISSOES.CARTEIRA_VER_EQUIPE),
      pode(VENDAS_PERMISSOES.CARTEIRA_VER_TODOS),
      pode(VENDAS_PERMISSOES.CARTEIRA_VER_SEM_RESPONSAVEL),
      pode(VENDAS_PERMISSOES.CARTEIRA_TRANSFERIR),
      pode(VENDAS_PERMISSOES.CLIENTE_CRIAR),
      pode(VENDAS_PERMISSOES.CLIENTE_EDITAR),
      pode(VENDAS_PERMISSOES.CLIENTE_INATIVAR),
      pode(VENDAS_PERMISSOES.CLIENTE_MESCLAR),
      pode(VENDAS_PERMISSOES.CONTATO_GERENCIAR),
      pode(VENDAS_PERMISSOES.ATIVIDADE_VER_PROPRIA),
      pode(VENDAS_PERMISSOES.ATIVIDADE_VER_EQUIPE),
      pode(VENDAS_PERMISSOES.ATIVIDADE_GERENCIAR),
    ]);

    return {
      pode_acessar_modulo: propostaVer || atividadeVerPropria,
      permissoes: {
        proposta_ver: propostaVer,
        proposta_criar: propostaCriar,
        proposta_editar: propostaEditar,
        proposta_enviar: propostaEnviar,
        proposta_excluir: propostaExcluir,
        // Carteira / cliente / contato (Fase 4) — só controlam UI; o
        // backend revalida tudo de novo em ClientesService.
        carteira_ver_propria: carteiraVerPropria,
        carteira_ver_equipe: carteiraVerEquipe,
        carteira_ver_todos: carteiraVerTodos,
        carteira_ver_sem_responsavel: carteiraVerSemResponsavel,
        carteira_transferir: carteiraTransferir,
        cliente_criar: clienteCriar,
        cliente_editar: clienteEditar,
        cliente_inativar: clienteInativar,
        cliente_mesclar: clienteMesclar,
        contato_gerenciar: contatoGerenciar,
        atividade_ver_propria: atividadeVerPropria,
        atividade_ver_equipe: atividadeVerEquipe,
        atividade_gerenciar: atividadeGerenciar,
      },
    };
  }
}
