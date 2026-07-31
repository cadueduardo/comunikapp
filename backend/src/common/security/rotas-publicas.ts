/**
 * Fonte única de verdade da fronteira pública do backend (Gate 0S — HS-03).
 *
 * Antes existiam duas listas independentes: a allowlist embutida no
 * `JwtGlobalMiddleware` e o decorador `@Public()` espalhado pelos controllers.
 * Elas divergiam nos dois sentidos — havia rota aberta pelo middleware sem
 * `@Public()` no handler e havia `@Public()` inerte em rota que o middleware
 * bloqueava. Agora o middleware decide exclusivamente por este catálogo, e o
 * `RotasPublicasValidator` recusa a inicialização se algum handler alcançável
 * pelo catálogo não estiver declarado como público.
 *
 * Regras:
 * - Toda rota pública é declarada por método e caminho. Método não listado no
 *   mesmo caminho continua exigindo autenticação.
 * - O prefixo `/api` é aceito porque o proxy de produção o mantém.
 * - Rota ausente deste catálogo exige autenticação. Não existe curinga de
 *   subcaminho: `/x` não libera `/x/y`.
 */

export type MetodoHttp = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RotaPublica {
  /** Métodos liberados neste caminho. */
  metodos: MetodoHttp[];
  /** Caminho sem o prefixo `/api`, usando `:param` para segmento variável. */
  caminho: string;
  /** Por que a rota precisa ser anônima. */
  finalidade: string;
  /** Liberada apenas fora de produção (diagnóstico local). */
  somenteDesenvolvimento?: boolean;
  /**
   * Exige `?token=` na query. Usado por download público servido por link
   * assinado, onde o token é a única credencial.
   */
  exigeTokenNaQuery?: boolean;
  /**
   * Dispensa a checagem de declaração `@Public()` feita na inicialização.
   * Usado por caminho estático e pelos controllers de diagnóstico, que só
   * respondem anonimamente fora de produção.
   */
  dispensaDeclaracaoPublic?: boolean;
}

export const ROTAS_PUBLICAS: readonly RotaPublica[] = [
  // Onboarding e autenticação de loja
  {
    metodos: ['POST'],
    caminho: '/lojas',
    finalidade: 'Cadastro inicial da loja (onboarding anônimo).',
  },
  {
    metodos: ['POST'],
    caminho: '/lojas/login',
    finalidade: 'Login da loja.',
  },
  {
    metodos: ['POST'],
    caminho: '/lojas/login/2fa',
    finalidade: 'Segundo fator do login da loja.',
  },
  {
    metodos: ['POST'],
    caminho: '/lojas/verificar-email',
    finalidade: 'Confirmação de e-mail no onboarding.',
  },
  {
    metodos: ['POST'],
    caminho: '/lojas/reenviar-verificacao',
    finalidade: 'Reenvio do e-mail de verificação.',
  },
  {
    metodos: ['GET'],
    caminho: '/lojas/public/by-slug/:slug',
    finalidade: 'Identificação do tenant pela URL antes do login.',
  },
  {
    metodos: ['GET'],
    caminho: '/lojas/public/by-host/:host',
    finalidade: 'Identificação do tenant pelo host antes do login.',
  },

  // Ciclo de vida de credencial do usuário
  {
    metodos: ['POST'],
    caminho: '/usuarios/reenviar-codigo',
    finalidade: 'Reenvio do código de primeiro acesso.',
  },
  {
    metodos: ['POST'],
    caminho: '/usuarios/definir-senha',
    finalidade: 'Definição da senha inicial.',
  },
  {
    metodos: ['POST'],
    caminho: '/usuarios/solicitar-redefinicao-senha',
    finalidade: 'Solicitação de redefinição de senha.',
  },
  {
    metodos: ['POST'],
    caminho: '/usuarios/redefinir-senha',
    finalidade: 'Redefinição de senha por token.',
  },

  // Plataforma
  {
    metodos: ['GET'],
    caminho: '/platform/convites/validar',
    finalidade: 'Validação de convite antes de existir sessão.',
  },
  {
    metodos: ['POST'],
    caminho: '/platform/interesse-beta',
    finalidade: 'Captação pública de interesse no beta.',
  },
  {
    metodos: ['GET'],
    caminho: '/public/v1/product-updates',
    finalidade: 'Changelog público do produto.',
  },
  {
    metodos: ['GET'],
    caminho: '/public/v1/product-updates/:slug',
    finalidade: 'Detalhe do changelog público.',
  },

  // Integrações
  {
    metodos: ['GET'],
    caminho: '/conexoes/google/callback',
    finalidade: 'Retorno do OAuth do Google, chamado pelo provedor.',
  },

  // Aprovação de arte pelo cliente final
  {
    metodos: ['GET'],
    caminho: '/arte-aprovacao/links/public/:token',
    finalidade: 'Abertura do link de aprovação pelo cliente.',
  },
  {
    metodos: ['GET'],
    caminho: '/arte-aprovacao/links/public/:token/validate',
    finalidade: 'Validação do link de aprovação.',
  },
  {
    metodos: ['POST'],
    caminho: '/arte-aprovacao/links/public/:token/approve',
    finalidade: 'Aprovação da arte pelo cliente.',
  },
  {
    metodos: ['POST'],
    caminho: '/arte-aprovacao/mensagens/publico/:token',
    finalidade: 'Mensagem do cliente no link de aprovação.',
  },
  {
    metodos: ['GET'],
    caminho: '/arte-aprovacao/mensagens/publico/:token/versao/:versaoId',
    finalidade: 'Leitura das mensagens da versão pelo cliente.',
  },
  {
    metodos: ['GET'],
    caminho:
      '/arte-aprovacao/versoes/:versaoId/arquivos/public/download/:filename',
    finalidade: 'Download do arquivo pelo link de aprovação.',
    exigeTokenNaQuery: true,
  },

  // Proposta comercial vista pelo cliente final (legado de Orçamentos V2)
  {
    metodos: ['GET'],
    caminho: '/orcamentos-v2/:id/publico',
    finalidade: 'Leitura da proposta pelo cliente.',
  },
  {
    metodos: ['POST'],
    caminho: '/orcamentos-v2/:id/publico/acao',
    finalidade: 'Aprovação, recusa ou negociação pelo cliente.',
  },
  {
    metodos: ['POST'],
    caminho: '/orcamentos-v2/:id/reenviar-codigo',
    finalidade: 'Reenvio do código de aprovação da proposta.',
  },

  // Estático
  {
    metodos: ['GET'],
    caminho: '/favicon.ico',
    finalidade: 'Ícone solicitado pelo navegador.',
    dispensaDeclaracaoPublic: true,
  },

  // Diagnóstico local
  {
    metodos: ['GET', 'POST'],
    caminho: '/test-validacoes',
    finalidade: 'Diagnóstico de validações.',
    somenteDesenvolvimento: true,
    dispensaDeclaracaoPublic: true,
  },
  {
    metodos: ['GET', 'POST'],
    caminho: '/test-campos-validacao',
    finalidade: 'Diagnóstico de campos de validação.',
    somenteDesenvolvimento: true,
    dispensaDeclaracaoPublic: true,
  },
  {
    metodos: ['GET', 'POST'],
    caminho: '/test-os-validacoes',
    finalidade: 'Diagnóstico de validações da OS.',
    somenteDesenvolvimento: true,
    dispensaDeclaracaoPublic: true,
  },
];

function paraExpressaoRegular(caminho: string): RegExp {
  const segmentos = caminho
    .split('/')
    .filter(Boolean)
    .map((segmento) =>
      segmento.startsWith(':')
        ? '[^/]+'
        : segmento.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    );

  return new RegExp(`^/(?:api/)?${segmentos.join('/')}$`);
}

const PADROES: ReadonlyArray<{ rota: RotaPublica; padrao: RegExp }> =
  ROTAS_PUBLICAS.map((rota) => ({
    rota,
    padrao: paraExpressaoRegular(rota.caminho),
  }));

/**
 * Retorna a declaração pública correspondente ou `null` quando a requisição
 * exige autenticação. `producao` controla as rotas de diagnóstico local.
 */
export function encontrarRotaPublica(
  metodo: string,
  caminho: string,
  producao: boolean,
): RotaPublica | null {
  // Express roteia `HEAD` para o handler de `GET`; a fronteira precisa
  // enxergar os dois da mesma forma.
  const metodoBruto = metodo.toUpperCase();
  const metodoNormalizado = (
    metodoBruto === 'HEAD' ? 'GET' : metodoBruto
  ) as MetodoHttp;
  const caminhoSemBarraFinal =
    caminho.length > 1 ? caminho.replace(/\/+$/, '') : caminho;

  for (const { rota, padrao } of PADROES) {
    if (rota.somenteDesenvolvimento && producao) {
      continue;
    }
    if (!rota.metodos.includes(metodoNormalizado)) {
      continue;
    }
    if (padrao.test(caminhoSemBarraFinal)) {
      return rota;
    }
  }

  return null;
}

/**
 * Usado pelo validador de inicialização: um caminho registrado no Nest é
 * considerado público se o catálogo o libera em qualquer ambiente.
 */
export function rotaEstaNoCatalogo(
  metodo: string,
  caminho: string,
): RotaPublica | null {
  return (
    encontrarRotaPublica(metodo, caminho, false) ??
    encontrarRotaPublica(metodo, caminho, true)
  );
}
