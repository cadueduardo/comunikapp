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
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import {
  Public,
  CurrentUser,
  CurrentLojaId,
} from 'src/auth/decorators';
import { AuthenticatedUser } from 'src/auth/auth.service';
import { UpdateConfiguracoesLojaDto } from './dto/update-configuracoes-loja.dto';

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
  login(@Body() loginDto: LoginDto) {
    return this.lojasService.login(loginDto);
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
