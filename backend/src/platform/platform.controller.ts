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
import { PlatformAdminGuard } from './platform-admin.guard';
import { PlatformService } from './platform.service';

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
    const ip =
      req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
      req.ip ||
      'unknown';
    return this.platformService.registerBetaInterest(dto, ip);
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
