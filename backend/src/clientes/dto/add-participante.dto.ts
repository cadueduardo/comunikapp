import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Inclusão de vendedor participante na carteira (DV-11).
 * Elegibilidade (mesma loja, ativo, função comercial) é revalidada no service.
 */
export class AddParticipanteDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  usuario_id: string;
}
