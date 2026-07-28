import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateDominioCustomDto {
  @IsString()
  @MinLength(3)
  @MaxLength(253)
  @Matches(
    /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i,
    { message: 'Informe um domínio válido (ex.: sistema.minhaloja.com.br).' },
  )
  dominio: string;
}
