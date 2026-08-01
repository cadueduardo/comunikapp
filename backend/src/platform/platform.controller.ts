import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/decorators';
import { CreateConviteCadastroDto } from './dto/create-convite-cadastro.dto';
import { InteresseBetaDto } from './dto/interesse-beta.dto';
import { BetaFeedbackDto } from './dto/beta-feedback.dto';
import { PlatformAdminGuard } from './platform-admin.guard';
import { PlatformService } from './platform.service';
import { CurrentUser } from '../auth/decorators';
import { AuthenticatedUser } from '../auth/auth.service';
import { extrairContextoDaRequisicao } from '../common/security/contexto-requisicao';

@Controller('platform')
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Request() req: any) {
    return this.platformService.getPlatformAccess(req.user?.email);
  }

  @Get('convites/validar')
  @Public()
  validateInvite(@Query('token') token: string) {
    return this.platformService.validateInviteToken(token);
  }

  @Post('interesse-beta')
  @Public()
  registerBetaInterest(@Body() dto: InteresseBetaDto, @Request() req: any) {
    // Gate 0S / HS-03: o IP vem de `req.ip`, resolvido pela política
    // `trust proxy` do bootstrap. Ler o primeiro elemento de
    // `x-forwarded-for` deixava o valor à escolha do chamador — bastava
    // prefixar o cabeçalho. Hoje o Nginx sobrescreve o cabeçalho na borda, mas
    // essa é uma propriedade da configuração do proxy, não do código.
    const { ip } = extrairContextoDaRequisicao(req);
    return this.platformService.registerBetaInterest(dto, ip ?? 'unknown');
  }

  @Post('feedback-beta')
  @UseGuards(JwtAuthGuard)
  submitBetaFeedback(
    @Body() dto: BetaFeedbackDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.platformService.submitBetaFeedback(dto, user);
  }

  @Get('convites')
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  listInvites() {
    return this.platformService.listInvites();
  }

  @Post('convites')
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  createInvite(@Body() dto: CreateConviteCadastroDto, @Request() req: any) {
    return this.platformService.createInvite(dto, req.user?.email);
  }

  @Post('convites/:id/revogar')
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  revokeInvite(@Param('id') id: string) {
    return this.platformService.revokeInvite(id);
  }
}
