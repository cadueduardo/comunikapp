import { IsIn } from 'class-validator';

export class AtualizarOnboardingStepDto {
  @IsIn(['ignorar', 'reativar'])
  acao!: 'ignorar' | 'reativar';
}
