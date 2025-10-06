import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OSApprovalPermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Verifica se o usuário pode aprovar tecnicamente uma OS
   */
  async podeAprovarTecnica(usuarioId: string, lojaId: string): Promise<{
    pode: boolean;
    motivo?: string;
  }> {
    try {
      // Buscar usuário com seus perfis e permissões
      const usuario = await this.prisma.usuario.findFirst({
        where: { 
          id: usuarioId, 
          loja_id: lojaId,
          status: 'ATIVO',
          ativo: true
        },
        include: {
          perfis: {
            include: {
              perfil: {
                include: {
                  permissoes: {
                    where: {
                      modulo: 'OS',
                      acao: 'APROVAR_TECNICA',
                      permitido: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!usuario) {
        return {
          pode: false,
          motivo: 'Usuário não encontrado ou inativo'
        };
      }

      // Verificar se é ADMINISTRADOR (acesso total)
      if (usuario.funcao === 'ADMINISTRADOR') {
        return { pode: true };
      }

      // Verificar se tem permissão específica via perfil
      const temPermissaoPerfil = usuario.perfis.some(up => 
        up.perfil.ativo && up.perfil.permissoes.length > 0
      );

      if (temPermissaoPerfil) {
        return { pode: true };
      }

      // Verificar se é PRODUCAO (permissão padrão)
      if (usuario.funcao === 'PRODUCAO') {
        return { pode: true };
      }

      return {
        pode: false,
        motivo: 'Usuário não tem permissão para aprovar tecnicamente'
      };

    } catch (error) {
      console.error('Erro ao verificar permissão de aprovação técnica:', error);
      return {
        pode: false,
        motivo: 'Erro interno ao verificar permissões'
      };
    }
  }

  /**
   * Verifica se o usuário pode aprovar orçamentariamente uma OS
   */
  async podeAprovarOrcamentaria(usuarioId: string, lojaId: string): Promise<{
    pode: boolean;
    motivo?: string;
  }> {
    try {
      const usuario = await this.prisma.usuario.findFirst({
        where: { 
          id: usuarioId, 
          loja_id: lojaId,
          status: 'ATIVO',
          ativo: true
        },
        include: {
          perfis: {
            include: {
              perfil: {
                include: {
                  permissoes: {
                    where: {
                      modulo: 'OS',
                      acao: 'APROVAR_ORCAMENTARIA',
                      permitido: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!usuario) {
        return {
          pode: false,
          motivo: 'Usuário não encontrado ou inativo'
        };
      }

      // ADMINISTRADOR e FINANCEIRO podem aprovar orçamentariamente
      if (['ADMINISTRADOR', 'FINANCEIRO'].includes(usuario.funcao)) {
        return { pode: true };
      }

      // Verificar permissão via perfil
      const temPermissaoPerfil = usuario.perfis.some(up => 
        up.perfil.ativo && up.perfil.permissoes.length > 0
      );

      if (temPermissaoPerfil) {
        return { pode: true };
      }

      return {
        pode: false,
        motivo: 'Usuário não tem permissão para aprovar orçamentariamente'
      };

    } catch (error) {
      console.error('Erro ao verificar permissão de aprovação orçamentária:', error);
      return {
        pode: false,
        motivo: 'Erro interno ao verificar permissões'
      };
    }
  }

  /**
   * Verifica se o usuário pode aprovar gerencialmente uma OS
   */
  async podeAprovarGerencial(usuarioId: string, lojaId: string): Promise<{
    pode: boolean;
    motivo?: string;
  }> {
    try {
      const usuario = await this.prisma.usuario.findFirst({
        where: { 
          id: usuarioId, 
          loja_id: lojaId,
          status: 'ATIVO',
          ativo: true
        },
        include: {
          perfis: {
            include: {
              perfil: {
                include: {
                  permissoes: {
                    where: {
                      modulo: 'OS',
                      acao: 'APROVAR_GERENCIAL',
                      permitido: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!usuario) {
        return {
          pode: false,
          motivo: 'Usuário não encontrado ou inativo'
        };
      }

      // Apenas ADMINISTRADOR e FINANCEIRO podem aprovar gerencialmente
      if (['ADMINISTRADOR', 'FINANCEIRO'].includes(usuario.funcao)) {
        return { pode: true };
      }

      // Verificar permissão via perfil
      const temPermissaoPerfil = usuario.perfis.some(up => 
        up.perfil.ativo && up.perfil.permissoes.length > 0
      );

      if (temPermissaoPerfil) {
        return { pode: true };
      }

      return {
        pode: false,
        motivo: 'Usuário não tem permissão para aprovar gerencialmente'
      };

    } catch (error) {
      console.error('Erro ao verificar permissão de aprovação gerencial:', error);
      return {
        pode: false,
        motivo: 'Erro interno ao verificar permissões'
      };
    }
  }
}
