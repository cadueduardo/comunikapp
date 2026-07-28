import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateDominioCustomDto {
  @IsString()
  @MinLength(3)
  @MaxLength(253)
  @Matches(
    /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?){2,}$/i,
    {
      message:
        'Informe um endereço com prefixo (ex.: sistema.minhaloja.com.br). O domínio sozinho ainda não é aceito.',
    },
  )
  dominio: string;
}