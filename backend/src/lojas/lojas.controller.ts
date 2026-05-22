import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UnauthorizedException,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';
import { LojasService } from './lojas.service';
import { CreateOnboardingDto } from './dto/create-onboarding.dto';
import { UpdateLojaDto } from './dto/update-loja.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyTwoFactorLoginDto } from './dto/verify-two-factor-login.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public, CurrentUser, CurrentLojaId } from '../auth/decorators';
import { AuthenticatedUser } from '../auth/auth.service';
import { UpdateConfiguracoesLojaDto } from './dto/update-configuracoes-loja.dto';
import { Request } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('lojas')
export class LojasController {
  constructor(private readonly lojasService: LojasService) {}

  @Public()
  @Post()
  create(@Body() createOnboardingDto: CreateOnboardingDto) {
    return this.lojasService.create(createOnboardingDto);
  }

  @Public()
  @Post('login')
  login(@Body() loginDto: LoginDto, @Req() req: Request) {
    const clientIp = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim();
    const userAgent = req.headers['user-agent']?.toString() || 'unknown';
    return this.lojasService.login(loginDto, clientIp || req.ip, userAgent);
  }

  @Public()
  @Post('login/2fa')
  verifyTwoFactorLogin(
    @Body() dto: VerifyTwoFactorLoginDto,
    @Req() req: Request,
  ) {
    const clientIp = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim();
    const userAgent = req.headers['user-agent']?.toString() || 'unknown';
    return this.lojasService.verifyTwoFactorLogin(
      dto,
      clientIp || req.ip,
      userAgent,
    );
  }

  @Public()
  @Post('verificar-email')
  verifyEmail(@Body() body: VerifyEmailDto) {
    return this.lojasService.verifyEmail(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('user-by-email')
  findUserByEmail(@Query('email') email: string) {
    return this.lojasService.findUserByEmail(email);
  }

  @UseGuards(JwtAuthGuard)
  @Get('loja-trial/:lojaId')
  findLojaWithTrial(@Param('lojaId') lojaId: string) {
    return this.lojasService.findLojaWithTrial(lojaId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getCurrentUser(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-loja-trial')
  getMyLojaWithTrial(@CurrentLojaId() lojaId: string) {
    return this.lojasService.findLojaWithTrial(lojaId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('minha-loja')
  findMyLoja(@CurrentUser() user) {
    return this.lojasService.findLojaWithTrial(user.loja_id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('configuracoes')
  updateConfiguracoes(
    @CurrentLojaId() lojaId: string,
    @Body() updateConfiguracoesLojaDto: UpdateConfiguracoesLojaDto,
  ) {
    return this.lojasService.updateConfiguracoes(
      lojaId,
      updateConfiguracoesLojaDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('logo')
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = uuidv4();
          const extension = extname(file.originalname);
          cb(null, `${uniqueSuffix}${extension}`);
        },
      }),
      limits: {
        fileSize: 2 * 1024 * 1024,
        files: 1,
      },
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = new Set([
          'image/jpeg',
          'image/png',
          'image/webp',
        ]);
        const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);
        const extension = extname(file.originalname).toLowerCase();

        if (
          allowedMimeTypes.has(file.mimetype) &&
          allowedExtensions.has(extension)
        ) {
          return cb(null, true);
        }

        return cb(
          new UnauthorizedException(
            'Tipo de logo não permitido. Use JPG, PNG ou WEBP.',
          ),
          false,
        );
      },
    }),
  )
  uploadLogo(
    @CurrentLojaId() lojaId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new UnauthorizedException('Arquivo de logo não encontrado.');
    }
    return this.lojasService.updateLogoUrl(lojaId, file.filename);
  }

  @Get()
  findAll() {
    return this.lojasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.lojasService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLojaDto: UpdateLojaDto) {
    return this.lojasService.update(id, updateLojaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.lojasService.remove(id);
  }
}
