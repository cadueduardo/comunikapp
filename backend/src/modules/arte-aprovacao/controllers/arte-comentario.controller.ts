import { 
  Controller, 
  Post, 
  Get, 
  Put,
  Delete,
  Body, 
  Param, 
  Request, 
  HttpException, 
  HttpStatus,
  UseGuards 
} from '@nestjs/common';
import { ArteComentarioService, CreateComentarioDto, ComentarioPublicoDto } from '../services/arte-comentario.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

@Controller('arte-aprovacao/comentarios')
export class ArteComentarioController {
  constructor(private readonly comentarioService: ArteComentarioService) {}

  /**
   * Cria um novo comentário em uma versão (usuário autenticado)
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  async createComentario(@Body() dto: CreateComentarioDto, @Request() req) {
    try {
      const usuario_id = req.user.id;
      const loja_id = req.user.loja_id;
      
      const comentario = await this.comentarioService.createComentario({
        ...dto,
        usuario_id,
        loja_id,
      });

      return {
        success: true,
        data: comentario,
        message: 'Comentário criado com sucesso',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Cria comentário público (do cliente via link de aprovação)
   */
  @Post('public')
  async createComentarioPublico(@Body() dto: ComentarioPublicoDto) {
    try {
      const comentario = await this.comentarioService.createComentarioPublico(dto);

      return {
        success: true,
        data: comentario,
        message: 'Comentário enviado com sucesso',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Lista comentários de uma versão (usuário autenticado)
   */
  @UseGuards(JwtAuthGuard)
  @Get('versao/:versao_id')
  async listarComentariosVersao(@Param('versao_id') versao_id: string, @Request() req) {
    try {
      const loja_id = req.user.loja_id;
      
      const comentarios = await this.comentarioService.listarComentariosVersao(versao_id, loja_id);

      return {
        success: true,
        data: comentarios,
        message: 'Comentários listados com sucesso',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Lista comentários públicos de uma versão (via token)
   */
  @Get('public/:versao_id/:token')
  async listarComentariosPublicos(
    @Param('versao_id') versao_id: string,
    @Param('token') token: string
  ) {
    try {
      const comentarios = await this.comentarioService.listarComentariosPublicos(versao_id, token);

      return {
        success: true,
        data: comentarios,
        message: 'Comentários listados com sucesso',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Atualiza um comentário
   */
  @UseGuards(JwtAuthGuard)
  @Put(':comentario_id')
  async updateComentario(
    @Param('comentario_id') comentario_id: string,
    @Body() body: { comentario: string },
    @Request() req
  ) {
    try {
      const usuario_id = req.user.id;
      const loja_id = req.user.loja_id;
      
      const comentario = await this.comentarioService.updateComentario(
        comentario_id,
        body.comentario,
        usuario_id,
        loja_id
      );

      return {
        success: true,
        data: comentario,
        message: 'Comentário atualizado com sucesso',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Remove um comentário
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':comentario_id')
  async removeComentario(@Param('comentario_id') comentario_id: string, @Request() req) {
    try {
      const usuario_id = req.user.id;
      const loja_id = req.user.loja_id;
      
      await this.comentarioService.removeComentario(comentario_id, usuario_id, loja_id);

      return {
        success: true,
        message: 'Comentário removido com sucesso',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Conta comentários por tipo em uma versão
   */
  @UseGuards(JwtAuthGuard)
  @Get('versao/:versao_id/contagem')
  async contarComentariosPorTipo(@Param('versao_id') versao_id: string, @Request() req) {
    try {
      const loja_id = req.user.loja_id;
      
      const contagem = await this.comentarioService.contarComentariosPorTipo(versao_id, loja_id);

      return {
        success: true,
        data: contagem,
        message: 'Contagem de comentários realizada com sucesso',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
