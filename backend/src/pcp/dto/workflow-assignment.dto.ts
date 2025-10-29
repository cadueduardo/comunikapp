import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  ArrayNotEmpty,
} from 'class-validator';

export class AssignWorkflowDto {
  @IsString()
  osId!: string;

  @IsOptional()
  @IsString()
  workflowId?: string;

  /**
   * Quando true, reaplica o workflow mesmo se já existir uma instância.
   */
  @IsOptional()
  @IsBoolean()
  forcar?: boolean;

  /**
   * Lista de itens/produtos da OS selecionados para a instancia.
   * Quando omitida, aplica o workflow a todos os itens liberados.
   */
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  itemOsIds?: string[];

  /**
   * Usuário responsável por disparar a atribuição (opcional).
   */
  @IsOptional()
  @IsString()
  usuarioId?: string;
}

export class PreviewWorkflowDto {
  @IsString()
  osId!: string;
}
