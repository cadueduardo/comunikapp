/**
 * Controller administrativo da OrdemServico. Exp\u00f5e endpoints de manuten\u00e7\u00e3o
 * (recupera\u00e7\u00e3o de status corrompido, etc.). Todas as rotas exigem fun\u00e7\u00e3o
 * ADMINISTRADOR.
 */

import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  ForbiddenException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { OSAdminService } from '../services/os-admin.service';

class RecuperarStatusBodyDto {
  /** Quando true, calcula o plano mas NAO grava nada no banco. */
  dry_run?: boolean;
  /** Quando informado, opera apenas naquela OS especifica. */
  os_id?: string;
}

@ApiTags('OS - Administracao')
@ApiBearerAuth()
@Controller('os/admin')
@UseGuards(JwtAuthGuard)
export class OSAdminController {
  constructor(
    private readonly osAdminService: OSAdminService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('recuperar-status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Recupera o campo `status` operacional de OS que foram corrompidas pelo OSPrazoService historico',
  })
  @ApiBody({ type: RecuperarStatusBodyDto, required: false })
  @ApiResponse({
    status: 200,
    description:
      'Retorna o relatorio de recuperacao (analisadas, corrigidas, detalhes por OS)',
  })
  @ApiResponse({ status: 403, description: 'Apenas ADMINISTRADOR' })
  async recuperarStatus(
    @Body() body: RecuperarStatusBodyDto = {},
    @Request() req: { user: { id: string; loja_id: string } },
  ) {
    const lojaId = req.user.loja_id;
    const usuarioId = req.user.id;

    // Gating manual: apenas ADMINISTRADOR. Mantemos a verificacao aqui (em vez
    // de delegar a um guard generico) porque o controller e novo e esta
    // operacao e destrutiva (atualiza o `status` de varias OS de uma vez).
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { funcao: true },
    });

    if (!usuario || usuario.funcao !== 'ADMINISTRADOR') {
      throw new ForbiddenException(
        'Apenas usuarios com funcao ADMINISTRADOR podem recuperar status de OS',
      );
    }

    return this.osAdminService.recuperarStatusOS({
      lojaId,
      dryRun: body.dry_run === true,
      osId: body.os_id,
    });
  }
}
