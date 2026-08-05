import { PartialType } from '@nestjs/mapped-types';
import { CreateClienteDto } from './create-cliente.dto';

/**
 * `responsavel_comercial_id` propositalmente NÃO existe em `CreateClienteDto`
 * nem aqui: a troca de responsável pela carteira só acontece via
 * `POST /clientes/:id/transferir` (histórico + auditoria obrigatórios).
 * Um update genérico que aceitasse esse campo permitiria reatribuir carteira
 * sem motivo, sem idempotência e sem registro em
 * `cliente_transferencia_carteira`.
 */
export class UpdateClienteDto extends PartialType(CreateClienteDto) {}
