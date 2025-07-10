import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { LojasService } from './lojas.service';
import { CreateOnboardingDto } from './dto/create-onboarding.dto';
import { UpdateLojaDto } from './dto/update-loja.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

@Controller('lojas')
export class LojasController {
  constructor(private readonly lojasService: LojasService) {}

  @Post()
  create(@Body() createOnboardingDto: CreateOnboardingDto) {
    return this.lojasService.create(createOnboardingDto);
  }

  @Post('verificar-email')
  verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.lojasService.verifyEmail(verifyEmailDto);
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
