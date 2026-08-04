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

    const [
      propostaVer,
      propostaCriar,
      propostaEditar,
      propostaEnviar,
      propostaExcluir,
    ] = await Promise.all([
      this.vendasPermissions.pode(
        usuarioId,
        lojaId,
        VENDAS_PERMISSOES.PROPOSTA_VER,
      ),
      this.vendasPermissions.pode(
        usuarioId,
        lojaId,
        VENDAS_PERMISSOES.PROPOSTA_CRIAR,
      ),
      this.vendasPermissions.pode(
        usuarioId,
        lojaId,
        VENDAS_PERMISSOES.PROPOSTA_EDITAR,
      ),
      this.vendasPermissions.pode(
        usuarioId,
        lojaId,
        VENDAS_PERMISSOES.PROPOSTA_ENVIAR,
      ),
      this.vendasPermissions.pode(
        usuarioId,
        lojaId,
        VENDAS_PERMISSOES.PROPOSTA_EXCLUIR,
      ),
    ]);

    return {
      pode_acessar_modulo: propostaVer,
      permissoes: {
        proposta_ver: propostaVer,
        proposta_criar: propostaCriar,
        proposta_editar: propostaEditar,
        proposta_enviar: propostaEnviar,
        proposta_excluir: propostaExcluir,
      },
    };
  }
}
