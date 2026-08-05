import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { cliente_tipo_pessoa, Prisma } from '@prisma/client';
import { IdentidadeAutenticada } from '../../auth/decorators';
import { PrismaService } from '../../prisma/prisma.service';
import { VendasPermissionsService } from '../permissions/vendas-permissions.service';
import { VENDAS_PERMISSOES } from '../permissions/vendas-permissoes';
import { OutboxEmailVendasService } from '../outbox/outbox-email-vendas.service';
import { CriarAtendimentoDto } from './dto/criar-atendimento.dto';
import { normalizarCamposCliente } from '../../clientes/utils/cliente-normalizacao.util';
import { VendasCarteiraEscopoService } from '../carteira/vendas-carteira-escopo.service';

function ordenarRecursivamente(valor: unknown): unknown {
  if (Array.isArray(valor)) return valor.map(ordenarRecursivamente);
  if (valor && typeof valor === 'object') {
    return Object.fromEntries(
      Object.entries(valor as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([chave, item]) => [chave, ordenarRecursivamente(item)]),
    );
  }
  return valor;
}

function hashPayloadCanonico(dto: CriarAtendimentoDto): string {
  const relevante = {
    cliente_id: dto.cliente_id ?? null,
    prospect: dto.prospect
      ? {
          nome: dto.prospect.nome?.trim() ?? null,
          telefone: dto.prospect.telefone ?? null,
          email: dto.prospect.email?.trim().toLowerCase() ?? null,
          documento: dto.prospect.documento ?? null,
        }
      : null,
    contato_id: dto.contato_id ?? null,
    necessidade: dto.necessidade.trim(),
    descricao: dto.descricao?.trim() ?? null,
    origem: dto.origem ?? null,
    prazo: dto.prazo,
    prazo_desejado: dto.prazo_desejado ?? null,
    tipo_proxima_acao: dto.tipo_proxima_acao ?? 'demanda',
    criar_orcamento: !!dto.criar_orcamento,
  };
  const canonico = JSON.stringify(ordenarRecursivamente(relevante));
  return createHash('sha256').update(canonico, 'utf8').digest('hex');
}

function deepLinkOrcamento(clienteId: string, contatoId?: string | null): string {
  const params = new URLSearchParams();
  params.set('clienteId', clienteId);
  if (contatoId) params.set('contatoId', contatoId);
  return `/orcamentos-v2/novo?${params.toString()}`;
}

/**
 * Novo atendimento atômico.
 * Estratégia de orçamento: fallback seguro — prospect + atividade + deep-link
 * canônico (sem Prisma direto / sem segundo contrato de criação).
 */
@Injectable()
export class AtendimentoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vendasPermissions: VendasPermissionsService,
    private readonly outbox: OutboxEmailVendasService,
    private readonly carteiraEscopo: VendasCarteiraEscopoService,
  ) {}

  async criar(identidade: IdentidadeAutenticada, dto: CriarAtendimentoDto) {
    await this.vendasPermissions.assertPode(
      identidade.usuarioId,
      identidade.lojaId,
      VENDAS_PERMISSOES.ATIVIDADE_VER_PROPRIA,
    );

    if (dto.prospect) {
      await this.vendasPermissions.assertPode(
        identidade.usuarioId,
        identidade.lojaId,
        VENDAS_PERMISSOES.CLIENTE_CRIAR,
      );
    }

    const chave = dto.chave_operacao.trim();
    if (chave.length < 8 || chave.length > 200) {
      throw new BadRequestException('chave_operacao inválida.');
    }

    const payloadHash = hashPayloadCanonico(dto);

    const existente = await this.prisma.atendimento_idempotencia.findUnique({
      where: {
        loja_id_usuario_id_chave_operacao: {
          loja_id: identidade.lojaId,
          usuario_id: identidade.usuarioId,
          chave_operacao: chave,
        },
      },
    });

    if (existente) {
      if (existente.payload_hash !== payloadHash) {
        throw new ConflictException(
          'chave_operacao reutilizada com payload diferente.',
        );
      }
      return existente.resultado as {
        cliente_id: string;
        atividade_id: string;
        deep_link: string | null;
      };
    }

    if (!dto.cliente_id && !dto.prospect) {
      throw new BadRequestException(
        'Informe cliente_id ou dados de prospect.',
      );
    }

    try {
      const resultado = await this.prisma.$transaction(async (tx) => {
        let clienteId = dto.cliente_id ?? null;

        if (clienteId) {
          await this.carteiraEscopo.assertClienteAcessivel(
            identidade,
            clienteId,
          );
        } else if (dto.prospect) {
          const normalizacaoInformada = normalizarCamposCliente({
            documento: dto.prospect.documento,
            email: dto.prospect.email,
            telefone: dto.prospect.telefone,
          });
          const sinaisDuplicidade = [
            normalizacaoInformada.documento_normalizado
              ? { documento_normalizado: normalizacaoInformada.documento_normalizado }
              : null,
            normalizacaoInformada.email_normalizado
              ? { email_normalizado: normalizacaoInformada.email_normalizado }
              : null,
            normalizacaoInformada.telefone_normalizado
              ? { telefone_normalizado: normalizacaoInformada.telefone_normalizado }
              : null,
          ].filter((item): item is NonNullable<typeof item> => item !== null);

          if (sinaisDuplicidade.length > 0) {
            const duplicado = await tx.cliente.findFirst({
              where: {
                loja_id: identidade.lojaId,
                OR: sinaisDuplicidade,
              },
              select: { id: true },
            });
            if (duplicado) {
              throw new ConflictException({
                codigo: 'DUPLICIDADE_ALERTA',
                message:
                  'Existe um possível cliente duplicado. Pesquise e selecione o cadastro existente.',
              });
            }
          }

          const doc =
            dto.prospect.documento?.replace(/\D/g, '') ||
            `PROSPECT-${randomUUID()}`;
          const normalizacao = normalizarCamposCliente({
            documento: doc,
            email: dto.prospect.email,
            telefone: dto.prospect.telefone,
          });
          const criado = await tx.cliente.create({
            data: {
              nome: dto.prospect.nome.trim(),
              tipo_pessoa: cliente_tipo_pessoa.PESSOA_FISICA,
              documento: doc,
              email: dto.prospect.email ?? null,
              telefone: dto.prospect.telefone ?? null,
              ...normalizacao,
              origem: dto.origem ?? 'atendimento',
              loja: { connect: { id: identidade.lojaId } },
              responsavel_comercial: {
                connect: { id: identidade.usuarioId },
              },
              responsavel_desde: new Date(),
            },
            select: { id: true },
          });
          clienteId = criado.id;
        }

        if (!clienteId) {
          throw new BadRequestException('Cliente obrigatório.');
        }

        if (dto.contato_id) {
          const contato = await tx.cliente_contato.findFirst({
            where: {
              id: dto.contato_id,
              loja_id: identidade.lojaId,
              cliente_id: clienteId,
            },
            select: { id: true },
          });
          if (!contato) {
            throw new NotFoundException('Contato não encontrado.');
          }
        }

        const atividade = await tx.atividade_comercial.create({
          data: {
            loja_id: identidade.lojaId,
            cliente_id: clienteId,
            contato_id: dto.contato_id ?? null,
            responsavel_id: identidade.usuarioId,
            criado_por: identidade.usuarioId,
            tipo: dto.tipo_proxima_acao ?? 'demanda',
            titulo: dto.necessidade.trim(),
            descricao: dto.descricao?.trim() || null,
            origem: dto.origem ?? null,
            prazo: new Date(dto.prazo),
            prazo_desejado: dto.prazo_desejado
              ? new Date(dto.prazo_desejado)
              : null,
          },
        });

        // Sem e-mail quando ator === responsável.
        await this.outbox.enfileirarAtribuida({
          lojaId: identidade.lojaId,
          atividadeId: atividade.id,
          responsavelId: identidade.usuarioId,
          atorId: identidade.usuarioId,
          tx,
        });

        const deep_link = dto.criar_orcamento
          ? deepLinkOrcamento(clienteId, dto.contato_id)
          : null;

        const resultado = {
          cliente_id: clienteId,
          atividade_id: atividade.id,
          deep_link,
        };

        await tx.atendimento_idempotencia.create({
          data: {
            loja_id: identidade.lojaId,
            usuario_id: identidade.usuarioId,
            chave_operacao: chave,
            payload_hash: payloadHash,
            resultado: resultado as unknown as Prisma.InputJsonValue,
          },
        });

        return resultado;
      });

      return resultado;
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        const again = await this.prisma.atendimento_idempotencia.findUnique({
          where: {
            loja_id_usuario_id_chave_operacao: {
              loja_id: identidade.lojaId,
              usuario_id: identidade.usuarioId,
              chave_operacao: chave,
            },
          },
        });
        if (again && again.payload_hash === payloadHash) {
          return again.resultado as {
            cliente_id: string;
            atividade_id: string;
            deep_link: string | null;
          };
        }
        throw new ConflictException(
          'Operação concorrente com chave de idempotência conflitante.',
        );
      }
      throw err;
    }
  }
}
