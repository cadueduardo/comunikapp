import { ForbiddenException } from '@nestjs/common';
import { usuario_funcao, usuario_status } from '@prisma/client';

type ClienteComUsuario = {
  usuario: {
    findFirst: (args: {
      where: {
        id: string;
        loja_id: string;
        status: usuario_status;
        ativo: boolean;
      };
      select: { funcao: true };
    }) => Promise<{ funcao: usuario_funcao } | null>;
  };
};

export function contaExigeAdministradorDaLoja(
  funcaoAlvo: usuario_funcao | null | undefined,
  funcaoPretendida?: usuario_funcao,
): boolean {
  return (
    funcaoAlvo === usuario_funcao.ADMINISTRADOR ||
    funcaoPretendida === usuario_funcao.ADMINISTRADOR
  );
}

/**
 * Qualquer mutação que crie, altere ou assuma uma conta `ADMINISTRADOR`
 * exige ator já administrador, ativo e da mesma loja. A prova é o banco
 * na transação corrente — nunca o JWT.
 */
export async function assertAtorPodeAdministrarContaAdministradora(
  tx: ClienteComUsuario,
  lojaId: string,
  atorId: string,
): Promise<void> {
  const ator = await tx.usuario.findFirst({
    where: {
      id: atorId,
      loja_id: lojaId,
      status: usuario_status.ATIVO,
      ativo: true,
    },
    select: { funcao: true },
  });
  if (ator?.funcao !== usuario_funcao.ADMINISTRADOR) {
    throw new ForbiddenException(
      'Somente um administrador da loja pode administrar contas de administrador.',
    );
  }
}
