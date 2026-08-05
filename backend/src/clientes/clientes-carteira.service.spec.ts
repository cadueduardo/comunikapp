import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, usuario_funcao } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { VendasPermissionsService } from '../vendas/permissions/vendas-permissions.service';
import {
  DEFAULTS_CONCEDIDOS_FASE_4,
  separarModuloEAcao,
} from '../vendas/permissions/vendas-permissoes';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';

/**
 * Suite da Fase 4 (Clientes/carteira/contatos). Segue o padrão de Prisma
 * fake de `vendas-permissions.service.spec.ts`: sem MySQL, com um "banco" em
 * memória que honra exatamente os formatos de `where`/`include`/`select`
 * que `ClientesService` produz.
 */

// --------------------------------------------------------------------------
// Fixtures / tipos do banco fake
// --------------------------------------------------------------------------

interface PerfilFake {
  nome: string;
  ativo: boolean;
  permissoes: { modulo: string; acao: string; permitido: boolean }[];
}

interface UsuarioFake {
  id: string;
  loja_id: string;
  nome_completo: string;
  status: string;
  ativo: boolean;
  funcao: usuario_funcao | string;
  perfis: PerfilFake[];
}

interface ClienteFake {
  id: string;
  loja_id: string;
  nome: string;
  tipo_pessoa: string;
  documento: string;
  email: string | null;
  telefone: string | null;
  whatsapp: string | null;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  razao_social: string | null;
  nome_fantasia: string | null;
  inscricao_estadual: string | null;
  responsavel: string | null;
  cargo_responsavel: string | null;
  observacoes: string | null;
  status_cliente: string;
  ativo: boolean;
  origem: string | null;
  segmento: string | null;
  responsavel_comercial_id: string | null;
  responsavel_desde: Date | null;
  documento_normalizado: string | null;
  email_normalizado: string | null;
  telefone_normalizado: string | null;
  criado_em: Date;
  atualizado_em: Date;
}

interface ParticipanteFake {
  id: string;
  loja_id: string;
  cliente_id: string;
  usuario_id: string;
  criado_em: Date;
}

interface ContatoFake {
  id: string;
  loja_id: string;
  cliente_id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  whatsapp: string | null;
  cargo: string | null;
  papeis: unknown;
  principal: boolean;
  ativo: boolean;
  criado_em: Date;
  atualizado_em: Date;
}

interface TransferenciaFake {
  id: string;
  loja_id: string;
  cliente_id: string;
  de_usuario_id: string | null;
  para_usuario_id: string;
  autor_id: string;
  motivo: string;
  chave_operacao: string;
  criado_em: Date;
}

class BancoFake {
  usuarios: UsuarioFake[] = [];
  clientes: ClienteFake[] = [];
  participantes: ParticipanteFake[] = [];
  contatos: ContatoFake[] = [];
  transferencias: TransferenciaFake[] = [];
}

const LOJA_A = 'loja-a';
const LOJA_B = 'loja-b';

let contador = 0;
function proximoId(prefixo: string): string {
  contador += 1;
  return `${prefixo}-${contador}`;
}

function usuarioFake(
  id: string,
  overrides: Partial<UsuarioFake> = {},
): UsuarioFake {
  return {
    id,
    loja_id: LOJA_A,
    nome_completo: id,
    status: 'ATIVO',
    ativo: true,
    funcao: usuario_funcao.VENDAS,
    perfis: [],
    ...overrides,
  };
}

function perfilComPermissoes(nome: string, permissoes: readonly string[]): PerfilFake {
  return {
    nome,
    ativo: true,
    permissoes: permissoes.map((chave) => {
      const { modulo, acao } = separarModuloEAcao(chave);
      return { modulo, acao, permitido: true };
    }),
  };
}

function clienteFake(overrides: Partial<ClienteFake> & { id: string }): ClienteFake {
  const agora = new Date();
  return {
    loja_id: LOJA_A,
    nome: 'Cliente Teste',
    tipo_pessoa: 'PESSOA_FISICA',
    documento: '11111111111',
    email: null,
    telefone: null,
    whatsapp: null,
    cep: null,
    endereco: null,
    numero: null,
    complemento: null,
    bairro: null,
    cidade: null,
    estado: null,
    razao_social: null,
    nome_fantasia: null,
    inscricao_estadual: null,
    responsavel: null,
    cargo_responsavel: null,
    observacoes: null,
    status_cliente: 'ATIVO',
    ativo: true,
    origem: null,
    segmento: null,
    responsavel_comercial_id: null,
    responsavel_desde: null,
    documento_normalizado: null,
    email_normalizado: null,
    telefone_normalizado: null,
    criado_em: agora,
    atualizado_em: agora,
    ...overrides,
  };
}

// --------------------------------------------------------------------------
// Avaliador de `where` mínimo (só os operadores usados pelo service real)
// --------------------------------------------------------------------------

function avaliarValor(valorCampo: unknown, condicao: unknown): boolean {
  if (condicao === null) return valorCampo === null;
  if (typeof condicao === 'object' && condicao !== null) {
    const cond = condicao as Record<string, unknown>;
    if ('in' in cond) return (cond.in as unknown[]).includes(valorCampo);
    if ('not' in cond) return valorCampo !== cond.not;
    if ('contains' in cond) {
      return (
        typeof valorCampo === 'string' &&
        valorCampo.toLowerCase().includes(String(cond.contains).toLowerCase())
      );
    }
    return false;
  }
  return valorCampo === condicao;
}

function avaliarCondicaoCliente(
  cliente: ClienteFake,
  banco: BancoFake,
  condicao: Record<string, unknown>,
): boolean {
  const participantesDoCliente = banco.participantes.filter(
    (p) => p.cliente_id === cliente.id,
  );

  return Object.entries(condicao).every(([chave, valor]) => {
    if (chave === 'OR') {
      return (valor as Record<string, unknown>[]).some((sub) =>
        avaliarCondicaoCliente(cliente, banco, sub),
      );
    }
    if (chave === 'AND') {
      return (valor as Record<string, unknown>[]).every((sub) =>
        avaliarCondicaoCliente(cliente, banco, sub),
      );
    }
    if (chave === 'participantes') {
      const some = (valor as { some?: { usuario_id: unknown } }).some;
      if (!some) return true;
      return participantesDoCliente.some((p) => avaliarValor(p.usuario_id, some.usuario_id));
    }
    return avaliarValor((cliente as unknown as Record<string, unknown>)[chave], valor);
  });
}

function omitirUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}

function criarErroUnicidade(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed (fake)', {
    code: 'P2002',
    clientVersion: 'fake',
  });
}

// --------------------------------------------------------------------------
// Prisma fake
// --------------------------------------------------------------------------

function montarClienteComInclude(
  cliente: ClienteFake,
  include: Record<string, unknown> | undefined,
  banco: BancoFake,
): Record<string, unknown> {
  const resultado: Record<string, unknown> = { ...cliente };
  if (!include) return resultado;

  if (include.responsavel_comercial) {
    const responsavel = banco.usuarios.find(
      (u) => u.id === cliente.responsavel_comercial_id,
    );
    resultado.responsavel_comercial = responsavel
      ? { id: responsavel.id, nome_completo: responsavel.nome_completo }
      : null;
  }

  if (include.participantes) {
    resultado.participantes = banco.participantes
      .filter((p) => p.cliente_id === cliente.id)
      .map((p) => {
        const usuario = banco.usuarios.find((u) => u.id === p.usuario_id);
        return {
          id: p.id,
          usuario_id: p.usuario_id,
          criado_em: p.criado_em,
          usuario: usuario
            ? { id: usuario.id, nome_completo: usuario.nome_completo }
            : { id: p.usuario_id, nome_completo: p.usuario_id },
        };
      });
  }

  if (include.contatos) {
    const config = include.contatos as { where?: { ativo?: boolean } };
    let lista = banco.contatos.filter((c) => c.cliente_id === cliente.id);
    if (config.where?.ativo !== undefined) {
      lista = lista.filter((c) => c.ativo === config.where!.ativo);
    }
    resultado.contatos = [...lista].sort(
      (a, b) => a.criado_em.getTime() - b.criado_em.getTime(),
    );
  }

  return resultado;
}

function projetarCliente(
  cliente: ClienteFake,
  args: { include?: Record<string, unknown>; select?: Record<string, boolean> },
  banco: BancoFake,
): Record<string, unknown> {
  if (args.select) {
    const resultado: Record<string, unknown> = {};
    for (const campo of Object.keys(args.select)) {
      resultado[campo] = (cliente as unknown as Record<string, unknown>)[campo];
    }
    return resultado;
  }
  return montarClienteComInclude(cliente, args.include, banco);
}

function ordenarClientes(
  lista: ClienteFake[],
  orderBy: Record<string, 'asc' | 'desc'>,
): ClienteFake[] {
  const [[campo, direcao]] = Object.entries(orderBy);
  return [...lista].sort((a, b) => {
    const av = (a as unknown as Record<string, unknown>)[campo];
    const bv = (b as unknown as Record<string, unknown>)[campo];
    let cmp = 0;
    if (av instanceof Date && bv instanceof Date) cmp = av.getTime() - bv.getTime();
    else if (typeof av === 'string' && typeof bv === 'string') cmp = av.localeCompare(bv);
    return direcao === 'asc' ? cmp : -cmp;
  });
}

function criarPrismaFake(banco: BancoFake): PrismaService {
  const fake = {
    usuario: {
      findFirst: (args: {
        where: Record<string, unknown>;
        select?: Record<string, unknown>;
      }) => {
        const where = args.where;
        const usuario = banco.usuarios.find(
          (u) =>
            (where.id === undefined || u.id === where.id) &&
            u.loja_id === where.loja_id &&
            u.status === where.status &&
            u.ativo === where.ativo &&
            (where.funcao === undefined || avaliarValor(u.funcao, where.funcao)),
        );
        if (!usuario) return Promise.resolve(null);

        // Formato do VendasPermissionsService (select.funcao + perfis aninhado).
        if (args.select?.funcao !== undefined) {
          const selecaoPerfis = args.select.perfis as {
            select: {
              perfil: {
                select: { permissoes: { where: { modulo: string; acao: string } } };
              };
            };
          };
          const filtroPermissao =
            selecaoPerfis.select.perfil.select.permissoes.where;
          return Promise.resolve({
            funcao: usuario.funcao,
            perfis: usuario.perfis.map((perfil) => ({
              perfil: {
                ativo: perfil.ativo,
                permissoes: perfil.permissoes
                  .filter(
                    (p) =>
                      p.modulo === filtroPermissao.modulo &&
                      p.acao === filtroPermissao.acao,
                  )
                  .map((p) => ({ permitido: p.permitido })),
              },
            })),
          });
        }

        // Formato do ClientesService (select: { id: true }).
        return Promise.resolve({ id: usuario.id });
      },
      findMany: (args: {
        where: Record<string, unknown>;
        select?: Record<string, boolean>;
        orderBy?: Record<string, 'asc' | 'desc'>;
      }) => {
        const where = args.where;
        let resultado = banco.usuarios.filter(
          (u) =>
            u.loja_id === where.loja_id &&
            u.status === where.status &&
            u.ativo === where.ativo &&
            avaliarValor(u.funcao, where.funcao),
        );
        if (args.orderBy?.nome_completo) {
          resultado = [...resultado].sort((a, b) =>
            a.nome_completo.localeCompare(b.nome_completo),
          );
        }
        return Promise.resolve(
          resultado.map((u) =>
            args.select?.nome_completo
              ? { id: u.id, nome_completo: u.nome_completo }
              : { id: u.id },
          ),
        );
      },
    },
    cliente: {
      findFirst: (args: {
        where: Record<string, unknown>;
        include?: Record<string, unknown>;
        select?: Record<string, boolean>;
      }) => {
        const encontrado = banco.clientes.find((c) =>
          avaliarCondicaoCliente(c, banco, args.where),
        );
        if (!encontrado) return Promise.resolve(null);
        return Promise.resolve(projetarCliente(encontrado, args, banco));
      },
      findMany: (args: {
        where: Record<string, unknown>;
        include?: Record<string, unknown>;
        orderBy?: Record<string, 'asc' | 'desc'>;
        skip?: number;
        take?: number;
      }) => {
        let resultado = banco.clientes.filter((c) =>
          avaliarCondicaoCliente(c, banco, args.where),
        );
        if (args.orderBy) resultado = ordenarClientes(resultado, args.orderBy);
        if (args.skip) resultado = resultado.slice(args.skip);
        if (args.take !== undefined) resultado = resultado.slice(0, args.take);
        return Promise.resolve(
          resultado.map((c) => projetarCliente(c, args, banco)),
        );
      },
      count: (args: { where: Record<string, unknown> }) => {
        return Promise.resolve(
          banco.clientes.filter((c) => avaliarCondicaoCliente(c, banco, args.where))
            .length,
        );
      },
      create: (args: {
        data: Record<string, unknown>;
        include?: Record<string, unknown>;
      }) => {
        const { loja, responsavel_comercial, ...resto } = args.data as {
          loja?: { connect: { id: string } };
          responsavel_comercial?: { connect: { id: string } };
        } & Record<string, unknown>;

        const agora = new Date();
        const registro = clienteFake({
          id: proximoId('cliente'),
          ...(resto as Partial<ClienteFake>),
          loja_id: loja?.connect.id ?? LOJA_A,
          responsavel_comercial_id: responsavel_comercial?.connect.id ?? null,
          criado_em: agora,
          atualizado_em: agora,
        });

        // Undefined -> null (mesma semântica de coluna nula do Prisma real).
        const registroIndexavel = registro as unknown as Record<string, unknown>;
        for (const chave of Object.keys(registro)) {
          if (registroIndexavel[chave] === undefined) {
            registroIndexavel[chave] = null;
          }
        }

        banco.clientes.push(registro);
        return Promise.resolve(projetarCliente(registro, args, banco));
      },
      update: (args: {
        where: { id: string };
        data: Record<string, unknown>;
        include?: Record<string, unknown>;
      }) => {
        const idx = banco.clientes.findIndex((c) => c.id === args.where.id);
        if (idx === -1) throw new Error('cliente inexistente (fake)');
        banco.clientes[idx] = {
          ...banco.clientes[idx],
          ...omitirUndefined(args.data as Partial<ClienteFake>),
          atualizado_em: new Date(),
        };
        return Promise.resolve(projetarCliente(banco.clientes[idx], args, banco));
      },
      updateMany: (args: {
        where: Record<string, unknown>;
        data: Record<string, unknown>;
      }) => {
        const indices = banco.clientes
          .map((cliente, index) =>
            avaliarCondicaoCliente(cliente, banco, args.where) ? index : -1,
          )
          .filter((index) => index >= 0);
        for (const index of indices) {
          banco.clientes[index] = {
            ...banco.clientes[index],
            ...omitirUndefined(args.data as Partial<ClienteFake>),
            atualizado_em: new Date(),
          };
        }
        return Promise.resolve({ count: indices.length });
      },
    },
    cliente_contato: {
      create: (args: { data: Record<string, unknown> }) => {
        const dados = args.data as Partial<ContatoFake> & {
          loja_id: string;
          cliente_id: string;
          nome: string;
        };
        if (dados.email) {
          const conflito = banco.contatos.some(
            (c) =>
              c.loja_id === dados.loja_id &&
              c.cliente_id === dados.cliente_id &&
              c.email === dados.email,
          );
          if (conflito) throw criarErroUnicidade();
        }
        const agora = new Date();
        const novo: ContatoFake = {
          id: proximoId('contato'),
          email: null,
          telefone: null,
          whatsapp: null,
          cargo: null,
          papeis: [],
          principal: false,
          ativo: true,
          criado_em: agora,
          atualizado_em: agora,
          ...dados,
        };
        banco.contatos.push(novo);
        return Promise.resolve(novo);
      },
      update: (args: { where: { id: string }; data: Record<string, unknown> }) => {
        const idx = banco.contatos.findIndex((c) => c.id === args.where.id);
        if (idx === -1) throw new Error('contato inexistente (fake)');
        const atualizado: ContatoFake = {
          ...banco.contatos[idx],
          ...omitirUndefined(args.data as Partial<ContatoFake>),
          atualizado_em: new Date(),
        };
        if (atualizado.email) {
          const conflito = banco.contatos.some(
            (c, i) =>
              i !== idx &&
              c.loja_id === atualizado.loja_id &&
              c.cliente_id === atualizado.cliente_id &&
              c.email === atualizado.email,
          );
          if (conflito) throw criarErroUnicidade();
        }
        banco.contatos[idx] = atualizado;
        return Promise.resolve(atualizado);
      },
      findFirst: (args: { where: Record<string, unknown> }) => {
        const where = args.where;
        const encontrado = banco.contatos.find(
          (c) =>
            c.id === where.id &&
            c.cliente_id === where.cliente_id &&
            c.loja_id === where.loja_id,
        );
        return Promise.resolve(encontrado ?? null);
      },
    },
    cliente_participante: {
      findFirst: (args: {
        where: Record<string, unknown>;
        select?: Record<string, unknown>;
      }) => {
        const where = args.where;
        const encontrado = banco.participantes.find(
          (p) =>
            (where.loja_id === undefined || p.loja_id === where.loja_id) &&
            (where.cliente_id === undefined || p.cliente_id === where.cliente_id) &&
            (where.usuario_id === undefined || p.usuario_id === where.usuario_id) &&
            (where.id === undefined || p.id === where.id),
        );
        if (!encontrado) return Promise.resolve(null);
        const usuario = banco.usuarios.find((u) => u.id === encontrado.usuario_id);
        return Promise.resolve({
          id: encontrado.id,
          usuario_id: encontrado.usuario_id,
          criado_em: encontrado.criado_em,
          usuario: usuario
            ? { id: usuario.id, nome_completo: usuario.nome_completo }
            : { id: encontrado.usuario_id, nome_completo: encontrado.usuario_id },
        });
      },
      create: (args: {
        data: Record<string, unknown>;
        select?: Record<string, unknown>;
      }) => {
        const dados = args.data as {
          loja_id: string;
          cliente_id: string;
          usuario_id: string;
        };
        if (
          banco.participantes.some(
            (p) =>
              p.cliente_id === dados.cliente_id &&
              p.usuario_id === dados.usuario_id,
          )
        ) {
          throw criarErroUnicidade();
        }
        const novo: ParticipanteFake = {
          id: proximoId('part'),
          loja_id: dados.loja_id,
          cliente_id: dados.cliente_id,
          usuario_id: dados.usuario_id,
          criado_em: new Date(),
        };
        banco.participantes.push(novo);
        const usuario = banco.usuarios.find((u) => u.id === novo.usuario_id);
        return Promise.resolve({
          id: novo.id,
          usuario_id: novo.usuario_id,
          criado_em: novo.criado_em,
          usuario: usuario
            ? { id: usuario.id, nome_completo: usuario.nome_completo }
            : { id: novo.usuario_id, nome_completo: novo.usuario_id },
        });
      },
      deleteMany: (args: { where: Record<string, unknown> }) => {
        const where = args.where;
        const antes = banco.participantes.length;
        banco.participantes = banco.participantes.filter(
          (p) =>
            !(
              (where.loja_id === undefined || p.loja_id === where.loja_id) &&
              (where.cliente_id === undefined || p.cliente_id === where.cliente_id) &&
              (where.usuario_id === undefined || p.usuario_id === where.usuario_id)
            ),
        );
        return Promise.resolve({ count: antes - banco.participantes.length });
      },
    },
    cliente_transferencia_carteira: {
      findUnique: (args: {
        where: {
          loja_id_chave_operacao: {
            loja_id: string;
            chave_operacao: string;
          };
        };
      }) => {
        const chave = args.where.loja_id_chave_operacao;
        const encontrada = banco.transferencias.find(
          (t) =>
            t.loja_id === chave.loja_id &&
            t.chave_operacao === chave.chave_operacao,
        );
        return Promise.resolve(encontrada ?? null);
      },
      findMany: (args: {
        where: Record<string, unknown>;
        orderBy?: Record<string, 'asc' | 'desc'>;
        take?: number;
        include?: Record<string, unknown>;
      }) => {
        let lista = banco.transferencias.filter(
          (t) =>
            (args.where.cliente_id === undefined ||
              t.cliente_id === args.where.cliente_id) &&
            (args.where.loja_id === undefined || t.loja_id === args.where.loja_id),
        );
        if (args.orderBy?.criado_em === 'desc') {
          lista = [...lista].sort(
            (a, b) => b.criado_em.getTime() - a.criado_em.getTime(),
          );
        }
        if (args.take !== undefined) lista = lista.slice(0, args.take);
        return Promise.resolve(
          lista.map((t) => {
            const de = banco.usuarios.find((u) => u.id === t.de_usuario_id);
            const para = banco.usuarios.find((u) => u.id === t.para_usuario_id);
            const autor = banco.usuarios.find((u) => u.id === t.autor_id);
            return {
              ...t,
              de_usuario: de
                ? { id: de.id, nome_completo: de.nome_completo }
                : null,
              para_usuario: para
                ? { id: para.id, nome_completo: para.nome_completo }
                : { id: t.para_usuario_id, nome_completo: t.para_usuario_id },
              autor: autor
                ? { id: autor.id, nome_completo: autor.nome_completo }
                : { id: t.autor_id, nome_completo: t.autor_id },
            };
          }),
        );
      },
      create: (args: { data: Record<string, unknown> }) => {
        const dados = args.data as Omit<TransferenciaFake, 'id' | 'criado_em'>;
        if (
          banco.transferencias.some(
            (t) =>
              t.loja_id === dados.loja_id &&
              t.chave_operacao === dados.chave_operacao,
          )
        ) {
          throw criarErroUnicidade();
        }
        const nova: TransferenciaFake = {
          id: proximoId('transferencia'),
          criado_em: new Date(),
          ...dados,
        };
        banco.transferencias.push(nova);
        return Promise.resolve(nova);
      },
    },
    $transaction: (
      arg: unknown[] | ((tx: typeof fake) => Promise<unknown>),
    ) => {
      if (Array.isArray(arg)) return Promise.all(arg);
      // Serializa callbacks concorrentes (aproxima CAS/row lock do MySQL).
      const executar = async () => {
        const snapshot = {
          clientes: structuredClone(banco.clientes),
          transferencias: structuredClone(banco.transferencias),
          participantes: structuredClone(banco.participantes),
        };
        try {
          return await arg(fake);
        } catch (erro) {
          banco.clientes = snapshot.clientes;
          banco.transferencias = snapshot.transferencias;
          banco.participantes = snapshot.participantes;
          throw erro;
        }
      };
      const anterior = (fake as { __txChain?: Promise<unknown> }).__txChain ??
        Promise.resolve();
      const atual = anterior.then(executar, executar);
      (fake as { __txChain?: Promise<unknown> }).__txChain = atual.then(
        () => undefined,
        () => undefined,
      );
      return atual;
    },
  };

  return fake as unknown as PrismaService;
}

function criarServicos(banco: BancoFake) {
  const prisma = criarPrismaFake(banco);
  const vendasPermissions = new VendasPermissionsService(prisma);
  const service = new ClientesService(prisma, vendasPermissions);
  return { service, vendasPermissions, prisma };
}

function criarDtoBase(overrides: Partial<CreateClienteDto> = {}): CreateClienteDto {
  return {
    nome: 'Novo Cliente',
    tipo_pessoa: 'PESSOA_FISICA' as CreateClienteDto['tipo_pessoa'],
    documento: '52998224725', // CPF válido
    ...overrides,
  } as CreateClienteDto;
}

const identidade = (usuarioId: string, lojaId = LOJA_A) => ({
  usuarioId,
  lojaId,
  funcao: usuario_funcao.VENDAS,
});

// ============================================================================
// Testes
// ============================================================================

describe('ClientesService — escopos de carteira', () => {
  it('vendedor vê por padrão apenas própria carteira (responsável OU participante)', async () => {
    const banco = new BancoFake();
    banco.usuarios.push(usuarioFake('vend-1'), usuarioFake('vend-2'));
    banco.clientes.push(
      clienteFake({ id: 'cli-proprio', responsavel_comercial_id: 'vend-1' }),
      clienteFake({ id: 'cli-participante' }),
      clienteFake({ id: 'cli-de-outro', responsavel_comercial_id: 'vend-2' }),
    );
    banco.participantes.push({
      id: 'part-1',
      loja_id: LOJA_A,
      cliente_id: 'cli-participante',
      usuario_id: 'vend-1',
      criado_em: new Date(),
    });

    const { service } = criarServicos(banco);
    const resultado = await service.listar(identidade('vend-1'), {} as any);

    const ids = (resultado as any).data.map((c: any) => c.id).sort();
    expect(ids).toEqual(['cli-participante', 'cli-proprio']);
  });

  it('cliente fora do escopo próprio retorna 404 em findOne (anti-IDOR)', async () => {
    const banco = new BancoFake();
    banco.usuarios.push(usuarioFake('vend-1'), usuarioFake('vend-2'));
    banco.clientes.push(
      clienteFake({ id: 'cli-de-outro', responsavel_comercial_id: 'vend-2' }),
    );

    const { service } = criarServicos(banco);

    await expect(
      service.obterUm(identidade('vend-1'), 'cli-de-outro'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('cliente de outra loja também retorna 404, mesmo com id válido em outro tenant', async () => {
    const banco = new BancoFake();
    banco.usuarios.push(
      usuarioFake('admin-b', { loja_id: LOJA_B, funcao: usuario_funcao.ADMINISTRADOR }),
    );
    banco.clientes.push(
      clienteFake({ id: 'cli-loja-a', loja_id: LOJA_A, responsavel_comercial_id: 'admin-b' }),
    );

    const { service } = criarServicos(banco);

    await expect(
      service.obterUm(identidade('admin-b', LOJA_B), 'cli-loja-a'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('gestor com perfil de equipe vê carteira de todos os VENDAS ativos da loja', async () => {
    const banco = new BancoFake();
    banco.usuarios.push(
      usuarioFake('vend-1'),
      usuarioFake('vend-2'),
      usuarioFake('gestor-1', {
        perfis: [
          perfilComPermissoes('Gestor de Vendas', DEFAULTS_CONCEDIDOS_FASE_4.GESTOR),
        ],
      }),
    );
    banco.clientes.push(
      clienteFake({ id: 'cli-vend-1', responsavel_comercial_id: 'vend-1' }),
      clienteFake({ id: 'cli-vend-2', responsavel_comercial_id: 'vend-2' }),
      clienteFake({ id: 'cli-sem-resp', responsavel_comercial_id: null }),
    );

    const { service } = criarServicos(banco);
    const resultado = await service.listar(identidade('gestor-1'), {
      escopo: 'equipe',
    } as any);

    const ids = (resultado as any).data.map((c: any) => c.id).sort();
    // "sem responsável" não é VENDAS ativo, então fica fora do escopo equipe.
    expect(ids).toEqual(['cli-vend-1', 'cli-vend-2']);
  });

  it('vendedor sem permissão de equipe recebe ForbiddenException ao tentar esse escopo', async () => {
    const banco = new BancoFake();
    banco.usuarios.push(usuarioFake('vend-1'));
    const { service } = criarServicos(banco);

    await expect(
      service.listar(identidade('vend-1'), { escopo: 'equipe' } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('admin vê toda a carteira da loja no escopo "todos"', async () => {
    const banco = new BancoFake();
    banco.usuarios.push(
      usuarioFake('admin-1', { funcao: usuario_funcao.ADMINISTRADOR }),
      usuarioFake('vend-1'),
      usuarioFake('vend-2'),
    );
    banco.clientes.push(
      clienteFake({ id: 'cli-1', responsavel_comercial_id: 'vend-1' }),
      clienteFake({ id: 'cli-2', responsavel_comercial_id: 'vend-2' }),
      clienteFake({ id: 'cli-3', responsavel_comercial_id: null }),
    );

    const { service } = criarServicos(banco);
    const resultado = await service.listar(identidade('admin-1'), {
      escopo: 'todos',
    } as any);

    expect((resultado as any).data).toHaveLength(3);
  });

  it('escopo "sem_responsavel" só retorna carteira órfã', async () => {
    const banco = new BancoFake();
    banco.usuarios.push(
      usuarioFake('gestor-1', {
        perfis: [
          perfilComPermissoes('Gestor de Vendas', DEFAULTS_CONCEDIDOS_FASE_4.GESTOR),
        ],
      }),
      usuarioFake('vend-1'),
    );
    banco.clientes.push(
      clienteFake({ id: 'cli-orfao', responsavel_comercial_id: null }),
      clienteFake({ id: 'cli-com-dono', responsavel_comercial_id: 'vend-1' }),
    );

    const { service } = criarServicos(banco);
    const resultado = await service.listar(identidade('gestor-1'), {
      escopo: 'sem_responsavel',
    } as any);

    const ids = (resultado as any).data.map((c: any) => c.id);
    expect(ids).toEqual(['cli-orfao']);
  });
});

describe('ClientesService — paginação e busca', () => {
  it('pagina com take/skip reais e devolve meta com total/totalPages', async () => {
    const banco = new BancoFake();
    banco.usuarios.push(
      usuarioFake('admin-1', { funcao: usuario_funcao.ADMINISTRADOR }),
    );
    for (let i = 1; i <= 5; i += 1) {
      banco.clientes.push(
        clienteFake({
          id: `cli-${i}`,
          nome: `Cliente ${i}`,
          criado_em: new Date(2026, 0, i),
        }),
      );
    }

    const { service } = criarServicos(banco);
    const pagina1 = (await service.listar(identidade('admin-1'), {
      escopo: 'todos',
      page: 1,
      pageSize: 2,
      orderBy: 'criado_em',
      orderDir: 'asc',
    } as any)) as any;

    expect(pagina1.data.map((c: any) => c.id)).toEqual(['cli-1', 'cli-2']);
    expect(pagina1.meta).toEqual({ total: 5, page: 1, pageSize: 2, totalPages: 3 });

    const pagina2 = (await service.listar(identidade('admin-1'), {
      escopo: 'todos',
      page: 2,
      pageSize: 2,
      orderBy: 'criado_em',
      orderDir: 'asc',
    } as any)) as any;
    expect(pagina2.data.map((c: any) => c.id)).toEqual(['cli-3', 'cli-4']);
  });

  it('respeita pageSize máximo de 100 mesmo se o cliente pedir mais', async () => {
    const banco = new BancoFake();
    banco.usuarios.push(
      usuarioFake('admin-1', { funcao: usuario_funcao.ADMINISTRADOR }),
    );
    const { service } = criarServicos(banco);
    const resultado = (await service.listar(identidade('admin-1'), {
      escopo: 'todos',
      pageSize: 999 as any,
    } as any)) as any;
    expect(resultado.meta.pageSize).toBe(100);
  });

  it('busca textual encontra por nome e por documento normalizado', async () => {
    const banco = new BancoFake();
    banco.usuarios.push(
      usuarioFake('admin-1', { funcao: usuario_funcao.ADMINISTRADOR }),
    );
    banco.clientes.push(
      clienteFake({
        id: 'cli-joao',
        nome: 'João da Silva',
        documento: '52998224725',
        documento_normalizado: '52998224725',
      }),
      clienteFake({ id: 'cli-maria', nome: 'Maria Souza', documento: '11111111111' }),
    );

    const { service } = criarServicos(banco);

    const porNome = (await service.listar(identidade('admin-1'), {
      escopo: 'todos',
      q: 'joão',
    } as any)) as any;
    expect(porNome.data.map((c: any) => c.id)).toEqual(['cli-joao']);

    const porDocumento = (await service.listar(identidade('admin-1'), {
      escopo: 'todos',
      q: '529.982.247-25',
    } as any)) as any;
    expect(porDocumento.data.map((c: any) => c.id)).toEqual(['cli-joao']);
  });

  it('dual-read legado (?legado=1) devolve array puro com o mesmo escopo', async () => {
    const banco = new BancoFake();
    banco.usuarios.push(usuarioFake('vend-1'));
    banco.clientes.push(
      clienteFake({ id: 'cli-1', responsavel_comercial_id: 'vend-1' }),
    );

    const { service } = criarServicos(banco);
    const resultado = await service.listar(identidade('vend-1'), {
      legado: '1',
    } as any);

    expect(Array.isArray(resultado)).toBe(true);
    expect((resultado as any[])[0].id).toBe('cli-1');
  });

  it('GET /clientes/search aplica escopo, normalização e limita a 50', async () => {
    const banco = new BancoFake();
    banco.usuarios.push(usuarioFake('vend-1'), usuarioFake('vend-2'));
    banco.clientes.push(
      clienteFake({ id: 'cli-meu', nome: 'Cliente Meu', responsavel_comercial_id: 'vend-1' }),
      clienteFake({ id: 'cli-outro', nome: 'Cliente Outro', responsavel_comercial_id: 'vend-2' }),
    );

    const { service } = criarServicos(banco);
    const resultado = await service.buscar(identidade('vend-1'), 'Cliente');

    expect(resultado.map((c) => c.id)).toEqual(['cli-meu']);
  });
});

describe('ClientesService — criação', () => {
  it('exige CLIENTE_CRIAR e nega quando a função não concede', async () => {
    const banco = new BancoFake();
    banco.usuarios.push(usuarioFake('producao-1', { funcao: usuario_funcao.PRODUCAO }));
    const { service } = criarServicos(banco);

    await expect(
      service.criar(identidade('producao-1'), criarDtoBase()),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('define responsavel_comercial_id = criador e responsavel_desde = agora', async () => {
    const banco = new BancoFake();
    banco.usuarios.push(usuarioFake('vend-1'));
    const { service } = criarServicos(banco);

    const antes = Date.now();
    const resultado = await service.criar(identidade('vend-1'), criarDtoBase());
    const depois = Date.now();

    expect(resultado.cliente.responsavel_comercial_id).toBe('vend-1');
    expect(resultado.cliente.responsavel_desde).not.toBeNull();
    const desde = new Date(resultado.cliente.responsavel_desde as Date).getTime();
    expect(desde).toBeGreaterThanOrEqual(antes);
    expect(desde).toBeLessThanOrEqual(depois);
  });

  it('preserva o campo legado `responsavel` (contato interno) distinto do responsável comercial', async () => {
    const banco = new BancoFake();
    banco.usuarios.push(usuarioFake('vend-1'));
    const { service } = criarServicos(banco);

    const resultado = await service.criar(
      identidade('vend-1'),
      criarDtoBase({ responsavel: 'Fulano do Financeiro', cargo_responsavel: 'Financeiro' }),
    );

    expect(resultado.cliente.responsavel).toBe('Fulano do Financeiro');
    expect(resultado.cliente.cargo_responsavel).toBe('Financeiro');
    expect(resultado.cliente.responsavel_comercial_id).toBe('vend-1');
  });

  it('alerta duplicidade por documento SEM bloquear a criação (dentro da mesma loja)', async () => {
    const bancoFake = new BancoFake();
    bancoFake.usuarios.push(usuarioFake('vend-1'));
    bancoFake.clientes.push(
      clienteFake({
        id: 'cli-existente',
        nome: 'Cliente Existente',
        documento: '52998224725',
        documento_normalizado: '52998224725',
      }),
    );

    const { service } = criarServicos(bancoFake);
    const resultado = await service.criar(
      identidade('vend-1'),
      criarDtoBase({ documento: '529.982.247-25' }),
    );

    expect(resultado.cliente.id).not.toBe('cli-existente');
    expect(resultado.avisos).toEqual([{ campo: 'documento' }]);
  });

  it('duplicidade é calculada só dentro da loja (outra loja não gera aviso)', async () => {
    const banco = new BancoFake();
    banco.usuarios.push(usuarioFake('vend-1'));
    banco.clientes.push(
      clienteFake({
        id: 'cli-loja-b',
        loja_id: LOJA_B,
        documento: '52998224725',
        documento_normalizado: '52998224725',
      }),
    );

    const { service } = criarServicos(banco);
    const resultado = await service.criar(
      identidade('vend-1'),
      criarDtoBase({ documento: '52998224725' }),
    );

    expect(resultado.avisos).toEqual([]);
  });
});

describe('ClientesService — atualização e inativação', () => {
  it('update genérico ignora responsavel_comercial_id mesmo se enviado no body', async () => {
    const banco = new BancoFake();
    banco.usuarios.push(usuarioFake('vend-1'), usuarioFake('vend-2'));
    banco.clientes.push(
      clienteFake({ id: 'cli-1', responsavel_comercial_id: 'vend-1' }),
    );

    const { service } = criarServicos(banco);
    const dtoMalicioso = { nome: 'Nome Atualizado', responsavel_comercial_id: 'vend-2' } as any;

    const atualizado = await service.atualizar(identidade('vend-1'), 'cli-1', dtoMalicioso);

    expect(atualizado.nome).toBe('Nome Atualizado');
    expect(atualizado.responsavel_comercial_id).toBe('vend-1');
  });

  it('update parcial não apaga documento_normalizado quando documento não é enviado', async () => {
    const banco = new BancoFake();
    banco.usuarios.push(usuarioFake('vend-1'));
    banco.clientes.push(
      clienteFake({
        id: 'cli-1',
        responsavel_comercial_id: 'vend-1',
        documento: '52998224725',
        documento_normalizado: '52998224725',
      }),
    );

    const { service } = criarServicos(banco);
    await service.atualizar(identidade('vend-1'), 'cli-1', { nome: 'Só nome' } as any);

    expect(banco.clientes[0].documento_normalizado).toBe('52998224725');
  });

  it('update nega (404) quando o cliente está fora do escopo do chamador', async () => {
    const banco = new BancoFake();
    banco.usuarios.push(usuarioFake('vend-1'), usuarioFake('vend-2'));
    banco.clientes.push(
      clienteFake({ id: 'cli-de-outro', responsavel_comercial_id: 'vend-2' }),
    );

    const { service } = criarServicos(banco);
    await expect(
      service.atualizar(identidade('vend-1'), 'cli-de-outro', { nome: 'X' } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('inativar é soft: mantém o registro e histórico, só marca ativo=false', async () => {
    const banco = new BancoFake();
    banco.usuarios.push(
      usuarioFake('gestor-1', {
        perfis: [
          perfilComPermissoes('Gestor de Vendas', DEFAULTS_CONCEDIDOS_FASE_4.GESTOR),
        ],
      }),
    );
    banco.clientes.push(clienteFake({ id: 'cli-1', responsavel_comercial_id: 'gestor-1' }));

    const { service } = criarServicos(banco);
    const inativado = await service.inativar(identidade('gestor-1'), 'cli-1');

    expect(inativado.ativo).toBe(false);
    expect(inativado.status_cliente).toBe('INATIVO');
    expect(banco.clientes.find((c) => c.id === 'cli-1')).toBeDefined();
  });

  it('vendedor sem CLIENTE_INATIVAR não consegue inativar', async () => {
    const banco = new BancoFake();
    banco.usuarios.push(usuarioFake('vend-1'));
    banco.clientes.push(clienteFake({ id: 'cli-1', responsavel_comercial_id: 'vend-1' }));

    const { service } = criarServicos(banco);
    await expect(
      service.inativar(identidade('vend-1'), 'cli-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('ClientesService — transferência de carteira', () => {
  function bancoComGestorEClientes() {
    const banco = new BancoFake();
    banco.usuarios.push(
      usuarioFake('gestor-1', {
        perfis: [
          perfilComPermissoes('Gestor de Vendas', DEFAULTS_CONCEDIDOS_FASE_4.GESTOR),
        ],
      }),
      usuarioFake('vend-origem'),
      usuarioFake('vend-destino'),
    );
    banco.clientes.push(
      clienteFake({ id: 'cli-1', responsavel_comercial_id: 'vend-origem' }),
    );
    return banco;
  }

  it('lista somente responsáveis comerciais elegíveis da mesma loja', async () => {
    const banco = bancoComGestorEClientes();
    banco.usuarios.push(
      usuarioFake('admin-1', {
        nome_completo: 'Administrador',
        funcao: usuario_funcao.ADMINISTRADOR,
      }),
      usuarioFake('producao-1', {
        nome_completo: 'Produção',
        funcao: usuario_funcao.PRODUCAO,
      }),
      usuarioFake('vend-loja-b', { loja_id: LOJA_B }),
    );
    const { service } = criarServicos(banco);

    const opcoes = await service.listarResponsaveisDisponiveis(
      identidade('gestor-1'),
    );

    expect(opcoes.map((opcao) => opcao.id)).toEqual([
      'admin-1',
      'gestor-1',
      'vend-destino',
      'vend-origem',
    ]);
  });

  it('transfere responsável e grava histórico com chave_operacao na mesma transação', async () => {
    const banco = bancoComGestorEClientes();
    const { service } = criarServicos(banco);

    const resultado = await service.transferirCarteira(identidade('gestor-1'), 'cli-1', {
      para_usuario_id: 'vend-destino',
      motivo: 'Redistribuição de carteira',
      chave_operacao: 'chave-001',
    });

    expect(resultado.responsavel_comercial_id).toBe('vend-destino');
    expect(banco.clientes[0].responsavel_comercial_id).toBe('vend-destino');
    expect(banco.transferencias).toHaveLength(1);
    expect(banco.transferencias[0]).toMatchObject({
      cliente_id: 'cli-1',
      de_usuario_id: 'vend-origem',
      para_usuario_id: 'vend-destino',
      autor_id: 'gestor-1',
      chave_operacao: 'chave-001',
    });
  });

  it('é idempotente: repetir a mesma chave_operacao não duplica histórico nem reprocessa', async () => {
    const banco = bancoComGestorEClientes();
    const { service } = criarServicos(banco);

    const dto = {
      para_usuario_id: 'vend-destino',
      motivo: 'Redistribuição',
      chave_operacao: 'chave-idempotente',
    };

    await service.transferirCarteira(identidade('gestor-1'), 'cli-1', dto);
    // Simula duplo clique / retry de rede com a MESMA chave.
    await service.transferirCarteira(identidade('gestor-1'), 'cli-1', dto);

    expect(banco.transferencias).toHaveLength(1);
    expect(banco.clientes[0].responsavel_comercial_id).toBe('vend-destino');
  });

  it('aborta sem histórico quando outra transferência vence a concorrência', async () => {
    const banco = bancoComGestorEClientes();
    const { service, prisma } = criarServicos(banco);
    jest
      .spyOn(prisma.cliente, 'updateMany')
      .mockResolvedValueOnce({ count: 0 });

    await expect(
      service.transferirCarteira(identidade('gestor-1'), 'cli-1', {
        para_usuario_id: 'vend-destino',
        motivo: 'Redistribuição concorrente',
        chave_operacao: 'chave-concorrente',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(banco.clientes[0].responsavel_comercial_id).toBe('vend-origem');
    expect(banco.transferencias).toHaveLength(0);
  });

  it('permite a mesma chave de idempotência em lojas diferentes', async () => {
    const banco = bancoComGestorEClientes();
    banco.transferencias.push({
      id: 'transferencia-loja-b',
      loja_id: LOJA_B,
      cliente_id: 'cliente-loja-b',
      de_usuario_id: null,
      para_usuario_id: 'usuario-loja-b',
      autor_id: 'admin-loja-b',
      motivo: 'Outra loja',
      chave_operacao: 'chave-por-tenant',
      criado_em: new Date(),
    });
    const { service } = criarServicos(banco);

    await service.transferirCarteira(identidade('gestor-1'), 'cli-1', {
      para_usuario_id: 'vend-destino',
      motivo: 'Transferência da loja A',
      chave_operacao: 'chave-por-tenant',
    });

    expect(banco.transferencias).toHaveLength(2);
    expect(banco.clientes[0].responsavel_comercial_id).toBe('vend-destino');
  });

  it('nega cross-loja: usuário destino de outra loja é rejeitado', async () => {
    const banco = bancoComGestorEClientes();
    banco.usuarios.push(usuarioFake('vend-loja-b', { loja_id: LOJA_B }));
    const { service } = criarServicos(banco);

    await expect(
      service.transferirCarteira(identidade('gestor-1'), 'cli-1', {
        para_usuario_id: 'vend-loja-b',
        motivo: 'Tentativa cross-loja',
        chave_operacao: 'chave-cross-loja',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    // Nenhum efeito parcial: nem responsável trocou, nem histórico foi criado.
    expect(banco.clientes[0].responsavel_comercial_id).toBe('vend-origem');
    expect(banco.transferencias).toHaveLength(0);
  });

  it('nega usuário destino inativo', async () => {
    const banco = bancoComGestorEClientes();
    banco.usuarios.push(usuarioFake('vend-inativo', { ativo: false }));
    const { service } = criarServicos(banco);

    await expect(
      service.transferirCarteira(identidade('gestor-1'), 'cli-1', {
        para_usuario_id: 'vend-inativo',
        motivo: 'Tentativa para usuário inativo',
        chave_operacao: 'chave-inativo',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(banco.transferencias).toHaveLength(0);
  });

  it('nega usuário operacional como responsável comercial', async () => {
    const banco = bancoComGestorEClientes();
    banco.usuarios.push(
      usuarioFake('producao-1', { funcao: usuario_funcao.PRODUCAO }),
    );
    const { service } = criarServicos(banco);

    await expect(
      service.transferirCarteira(identidade('gestor-1'), 'cli-1', {
        para_usuario_id: 'producao-1',
        motivo: 'Destino operacional inválido',
        chave_operacao: 'chave-operacional',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(banco.transferencias).toHaveLength(0);
  });

  it('chave_operacao reaproveitada para outro cliente gera conflito, não idempotência falsa', async () => {
    const banco = bancoComGestorEClientes();
    banco.clientes.push(
      clienteFake({ id: 'cli-2', responsavel_comercial_id: 'vend-origem' }),
    );
    const { service } = criarServicos(banco);

    await service.transferirCarteira(identidade('gestor-1'), 'cli-1', {
      para_usuario_id: 'vend-destino',
      motivo: 'Primeira',
      chave_operacao: 'chave-unica',
    });

    await expect(
      service.transferirCarteira(identidade('gestor-1'), 'cli-2', {
        para_usuario_id: 'vend-destino',
        motivo: 'Segunda com mesma chave',
        chave_operacao: 'chave-unica',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('vendedor sem CARTEIRA_TRANSFERIR não consegue transferir', async () => {
    const banco = bancoComGestorEClientes();
    const { service } = criarServicos(banco);

    await expect(
      service.transferirCarteira(identidade('vend-origem'), 'cli-1', {
        para_usuario_id: 'vend-destino',
        motivo: 'Tentativa sem permissão',
        chave_operacao: 'chave-sem-permissao',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('ClientesService — mesclagem (diferida)', () => {
  it('sempre lança ForbiddenException com mensagem clara', async () => {
    const banco = new BancoFake();
    banco.usuarios.push(usuarioFake('admin-1', { funcao: usuario_funcao.ADMINISTRADOR }));
    const { service } = criarServicos(banco);

    await expect(
      service.mesclar(identidade('admin-1'), 'cli-1'),
    ).rejects.toMatchObject({
      response: { message: expect.stringContaining('não está disponível') },
    });
  });
});

describe('ClientesService — contatos (isolamento por loja)', () => {
  it('cria contato vinculado ao cliente com loja_id da identidade (nunca do body)', async () => {
    const banco = new BancoFake();
    banco.usuarios.push(usuarioFake('vend-1'));
    banco.clientes.push(clienteFake({ id: 'cli-1', responsavel_comercial_id: 'vend-1' }));

    const { service } = criarServicos(banco);
    const contato = await service.criarContato(identidade('vend-1'), 'cli-1', {
      nome: 'Contato Financeiro',
      email: 'financeiro@cliente.com',
      papeis: ['financeiro'],
    } as any);

    expect(contato.nome).toBe('Contato Financeiro');
    expect(banco.contatos[0].loja_id).toBe(LOJA_A);
  });

  it('não permite gerenciar contato de cliente de outra loja (404)', async () => {
    const banco = new BancoFake();
    banco.usuarios.push(usuarioFake('admin-b', { loja_id: LOJA_B, funcao: usuario_funcao.ADMINISTRADOR }));
    banco.clientes.push(clienteFake({ id: 'cli-loja-a', loja_id: LOJA_A }));

    const { service } = criarServicos(banco);
    await expect(
      service.criarContato(identidade('admin-b', LOJA_B), 'cli-loja-a', {
        nome: 'Contato Indevido',
      } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('contato de um cliente não aparece nem é editável via outro cliente/loja', async () => {
    const banco = new BancoFake();
    banco.usuarios.push(
      usuarioFake('admin-a', { funcao: usuario_funcao.ADMINISTRADOR }),
      usuarioFake('admin-b', { loja_id: LOJA_B, funcao: usuario_funcao.ADMINISTRADOR }),
    );
    banco.clientes.push(
      clienteFake({ id: 'cli-a', loja_id: LOJA_A }),
      clienteFake({ id: 'cli-b', loja_id: LOJA_B }),
    );

    const { service } = criarServicos(banco);
    const contatoA = await service.criarContato(identidade('admin-a', LOJA_A), 'cli-a', {
      nome: 'Contato A',
    } as any);

    await expect(
      service.atualizarContato(identidade('admin-b', LOJA_B), 'cli-b', contatoA.id, {
        nome: 'Tentativa de editar contato de outra loja',
      } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('inativação de contato é soft (ativo=false) e some da listagem padrão', async () => {
    const banco = new BancoFake();
    banco.usuarios.push(usuarioFake('vend-1'));
    banco.clientes.push(clienteFake({ id: 'cli-1', responsavel_comercial_id: 'vend-1' }));

    const { service } = criarServicos(banco);
    const contato = await service.criarContato(identidade('vend-1'), 'cli-1', {
      nome: 'Contato Temporário',
    } as any);

    await service.inativarContato(identidade('vend-1'), 'cli-1', contato.id);

    const contatos = await service.listarContatos(identidade('vend-1'), 'cli-1');
    expect(contatos).toEqual([]);
    expect(banco.contatos.find((c) => c.id === contato.id)?.ativo).toBe(false);
  });

  it('e-mail duplicado no mesmo cliente gera ConflictException', async () => {
    const banco = new BancoFake();
    banco.usuarios.push(usuarioFake('vend-1'));
    banco.clientes.push(clienteFake({ id: 'cli-1', responsavel_comercial_id: 'vend-1' }));

    const { service } = criarServicos(banco);
    await service.criarContato(identidade('vend-1'), 'cli-1', {
      nome: 'Contato 1',
      email: 'repetido@cliente.com',
    } as any);

    await expect(
      service.criarContato(identidade('vend-1'), 'cli-1', {
        nome: 'Contato 2',
        email: 'repetido@cliente.com',
      } as any),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('ClientesService — participantes (DV-11)', () => {
  function bancoComGestorEParticipantes() {
    const banco = new BancoFake();
    banco.usuarios.push(
      usuarioFake('gestor-1', {
        funcao: usuario_funcao.ADMINISTRADOR,
        perfis: [
          perfilComPermissoes('Gestor de Vendas', DEFAULTS_CONCEDIDOS_FASE_4.GESTOR),
        ],
      }),
      usuarioFake('vend-origem'),
      usuarioFake('vend-colab'),
      usuarioFake('vend-outro'),
      usuarioFake('producao-1', { funcao: usuario_funcao.PRODUCAO }),
      usuarioFake('vend-loja-b', { loja_id: LOJA_B }),
    );
    banco.clientes.push(
      clienteFake({ id: 'cli-1', responsavel_comercial_id: 'vend-origem' }),
    );
    return banco;
  }

  it('participante da própria carteira consegue visualizar o cliente', async () => {
    const banco = bancoComGestorEParticipantes();
    banco.participantes.push({
      id: 'part-1',
      loja_id: LOJA_A,
      cliente_id: 'cli-1',
      usuario_id: 'vend-colab',
      criado_em: new Date(),
    });
    const { service } = criarServicos(banco);

    const ficha = await service.obterUm(identidade('vend-colab'), 'cli-1');
    expect(ficha.id).toBe('cli-1');
    expect(ficha.participantes.map((p) => p.usuario_id)).toContain('vend-colab');
  });

  it('participante sem CARTEIRA_TRANSFERIR não consegue transferir nem inativar', async () => {
    const banco = bancoComGestorEParticipantes();
    banco.participantes.push({
      id: 'part-1',
      loja_id: LOJA_A,
      cliente_id: 'cli-1',
      usuario_id: 'vend-colab',
      criado_em: new Date(),
    });
    const { service } = criarServicos(banco);

    await expect(
      service.transferirCarteira(identidade('vend-colab'), 'cli-1', {
        para_usuario_id: 'vend-outro',
        motivo: 'Tentativa de participante',
        chave_operacao: 'chave-part-tx',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    await expect(
      service.inativar(identidade('vend-colab'), 'cli-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('inclusão duplicada de participante é idempotente', async () => {
    const banco = bancoComGestorEParticipantes();
    const { service } = criarServicos(banco);

    const a = await service.adicionarParticipante(identidade('gestor-1'), 'cli-1', {
      usuario_id: 'vend-colab',
    });
    const b = await service.adicionarParticipante(identidade('gestor-1'), 'cli-1', {
      usuario_id: 'vend-colab',
    });

    expect(a.id).toBe(b.id);
    expect(banco.participantes).toHaveLength(1);
  });

  it('não duplica responsável principal como participante', async () => {
    const banco = bancoComGestorEParticipantes();
    const { service } = criarServicos(banco);

    await expect(
      service.adicionarParticipante(identidade('gestor-1'), 'cli-1', {
        usuario_id: 'vend-origem',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('nega participante operacional e cross-tenant na inclusão', async () => {
    const banco = bancoComGestorEParticipantes();
    const { service } = criarServicos(banco);

    await expect(
      service.adicionarParticipante(identidade('gestor-1'), 'cli-1', {
        usuario_id: 'producao-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.adicionarParticipante(identidade('gestor-1'), 'cli-1', {
        usuario_id: 'vend-loja-b',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('remoção cross-tenant é negada (404)', async () => {
    const banco = bancoComGestorEParticipantes();
    banco.participantes.push({
      id: 'part-1',
      loja_id: LOJA_A,
      cliente_id: 'cli-1',
      usuario_id: 'vend-colab',
      criado_em: new Date(),
    });
    banco.usuarios.push(
      usuarioFake('gestor-b', {
        loja_id: LOJA_B,
        funcao: usuario_funcao.ADMINISTRADOR,
        perfis: [
          perfilComPermissoes('Gestor de Vendas', DEFAULTS_CONCEDIDOS_FASE_4.GESTOR),
        ],
      }),
    );
    const { service } = criarServicos(banco);

    await expect(
      service.removerParticipante(
        identidade('gestor-b', LOJA_B),
        'cli-1',
        'vend-colab',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(banco.participantes).toHaveLength(1);
  });

  it('transferência remove o destino da lista de participantes', async () => {
    const banco = bancoComGestorEParticipantes();
    banco.participantes.push({
      id: 'part-1',
      loja_id: LOJA_A,
      cliente_id: 'cli-1',
      usuario_id: 'vend-colab',
      criado_em: new Date(),
    });
    const { service } = criarServicos(banco);

    await service.transferirCarteira(identidade('gestor-1'), 'cli-1', {
      para_usuario_id: 'vend-colab',
      motivo: 'Promove participante a responsável',
      chave_operacao: 'chave-promove',
    });

    expect(banco.clientes[0].responsavel_comercial_id).toBe('vend-colab');
    expect(banco.participantes).toHaveLength(0);
  });
});

describe('ClientesService — concorrência e isolamento (gate Fase 4)', () => {
  function bancoDoisGestores() {
    const banco = new BancoFake();
    banco.usuarios.push(
      usuarioFake('gestor-1', {
        funcao: usuario_funcao.ADMINISTRADOR,
        perfis: [
          perfilComPermissoes('Gestor de Vendas', DEFAULTS_CONCEDIDOS_FASE_4.GESTOR),
        ],
      }),
      usuarioFake('gestor-2', {
        funcao: usuario_funcao.ADMINISTRADOR,
        perfis: [
          perfilComPermissoes('Gestor de Vendas', DEFAULTS_CONCEDIDOS_FASE_4.GESTOR),
        ],
      }),
      usuarioFake('vend-origem'),
      usuarioFake('vend-destino-a'),
      usuarioFake('vend-destino-b'),
      usuarioFake('vend-loja-b', { loja_id: LOJA_B }),
      usuarioFake('gestor-b', {
        loja_id: LOJA_B,
        funcao: usuario_funcao.ADMINISTRADOR,
        perfis: [
          perfilComPermissoes('Gestor de Vendas', DEFAULTS_CONCEDIDOS_FASE_4.GESTOR),
        ],
      }),
    );
    banco.clientes.push(
      clienteFake({ id: 'cli-1', responsavel_comercial_id: 'vend-origem' }),
      clienteFake({
        id: 'cli-loja-b',
        loja_id: LOJA_B,
        responsavel_comercial_id: 'vend-loja-b',
      }),
    );
    return banco;
  }

  it('dois gestores transferem simultaneamente com chaves diferentes (CAS)', async () => {
    const banco = bancoDoisGestores();
    const { service } = criarServicos(banco);

    const [r1, r2] = await Promise.allSettled([
      service.transferirCarteira(identidade('gestor-1'), 'cli-1', {
        para_usuario_id: 'vend-destino-a',
        motivo: 'Gestor 1',
        chave_operacao: 'chave-g1',
      }),
      service.transferirCarteira(identidade('gestor-2'), 'cli-1', {
        para_usuario_id: 'vend-destino-b',
        motivo: 'Gestor 2',
        chave_operacao: 'chave-g2',
      }),
    ]);

    const ok = [r1, r2].filter((r) => r.status === 'fulfilled');
    const falha = [r1, r2].filter((r) => r.status === 'rejected');
    expect(ok).toHaveLength(1);
    expect(falha).toHaveLength(1);
    expect(falha[0].status).toBe('rejected');
    if (falha[0].status === 'rejected') {
      expect(falha[0].reason).toBeInstanceOf(ConflictException);
    }
    expect(banco.transferencias).toHaveLength(1);
  });

  it('duas requisições simultâneas com a mesma chave são idempotentes', async () => {
    const banco = bancoDoisGestores();
    const { service } = criarServicos(banco);

    const [r1, r2] = await Promise.all([
      service.transferirCarteira(identidade('gestor-1'), 'cli-1', {
        para_usuario_id: 'vend-destino-a',
        motivo: 'Retry A',
        chave_operacao: 'chave-igual',
      }),
      service.transferirCarteira(identidade('gestor-2'), 'cli-1', {
        para_usuario_id: 'vend-destino-a',
        motivo: 'Retry B',
        chave_operacao: 'chave-igual',
      }),
    ]);

    expect(r1.responsavel_comercial_id).toBe('vend-destino-a');
    expect(r2.responsavel_comercial_id).toBe('vend-destino-a');
    expect(banco.transferencias).toHaveLength(1);
  });

  it('mesma chave_operacao pode existir em lojas diferentes', async () => {
    const banco = bancoDoisGestores();
    const { service } = criarServicos(banco);

    await service.transferirCarteira(identidade('gestor-1'), 'cli-1', {
      para_usuario_id: 'vend-destino-a',
      motivo: 'Loja A',
      chave_operacao: 'chave-compartilhada',
    });

    await service.transferirCarteira(identidade('gestor-b', LOJA_B), 'cli-loja-b', {
      para_usuario_id: 'gestor-b',
      motivo: 'Loja B',
      chave_operacao: 'chave-compartilhada',
    });

    expect(banco.transferencias).toHaveLength(2);
    expect(
      banco.transferencias.every((t) => t.chave_operacao === 'chave-compartilhada'),
    ).toBe(true);
  });

  it('endpoint de responsáveis não expõe usuários operacionais nem de outra loja', async () => {
    const banco = bancoDoisGestores();
    banco.usuarios.push(
      usuarioFake('producao-1', { funcao: usuario_funcao.PRODUCAO }),
      usuarioFake('estoque-1', { funcao: usuario_funcao.ESTOQUE }),
    );
    const { service } = criarServicos(banco);

    const lista = await service.listarResponsaveisDisponiveis(identidade('gestor-1'));
    const ids = lista.map((u) => u.id);
    expect(ids).not.toContain('producao-1');
    expect(ids).not.toContain('estoque-1');
    expect(ids).not.toContain('vend-loja-b');
    expect(ids).toContain('vend-destino-a');
  });

  it('cliente legado sem responsável não aparece na carteira própria do vendedor', async () => {
    const banco = new BancoFake();
    banco.usuarios.push(usuarioFake('vend-1'));
    banco.clientes.push(
      clienteFake({ id: 'cli-legado', responsavel_comercial_id: null }),
      clienteFake({ id: 'cli-meu', responsavel_comercial_id: 'vend-1' }),
    );
    const { service } = criarServicos(banco);

    const lista = (await service.listar(identidade('vend-1'), {
      escopo: 'propria',
    } as any)) as { data: { id: string }[] };

    expect(lista.data.map((c) => c.id)).toEqual(['cli-meu']);
  });

  it('alerta de duplicidade não revela id/nome de outro cliente', async () => {
    const banco = new BancoFake();
    banco.usuarios.push(usuarioFake('vend-1'));
    banco.clientes.push(
      clienteFake({
        id: 'cli-existente',
        responsavel_comercial_id: 'vend-1',
        documento: '52998224725',
        documento_normalizado: '52998224725',
      }),
    );
    const { service } = criarServicos(banco);

    const criado = await service.criar(identidade('vend-1'), criarDtoBase({
      nome: 'Outro',
      documento: '52998224725',
    }));

    expect(criado.avisos).toEqual([{ campo: 'documento' }]);
    expect(JSON.stringify(criado.avisos)).not.toContain('cli-existente');
  });
});
