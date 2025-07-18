import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { CurrentLojaId } from '../auth/decorators';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('clientes')
@UseGuards(JwtAuthGuard)
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Post()
  create(@Body() createClienteDto: CreateClienteDto, @CurrentLojaId() lojaId: string) {
    return this.clientesService.create(createClienteDto, lojaId);
  }

  @Get()
  findAll(@CurrentLojaId() lojaId: string) {
    return this.clientesService.findAll(lojaId);
  }

  @Get('search')
  search(@Query('q') query: string, @CurrentLojaId() lojaId: string) {
    return this.clientesService.search(query, lojaId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentLojaId() lojaId: string) {
    return this.clientesService.findOne(id, lojaId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateClienteDto: UpdateClienteDto, @CurrentLojaId() lojaId: string) {
    return this.clientesService.update(id, updateClienteDto, lojaId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentLojaId() lojaId: string) {
    return this.clientesService.remove(id, lojaId);
  }
}
