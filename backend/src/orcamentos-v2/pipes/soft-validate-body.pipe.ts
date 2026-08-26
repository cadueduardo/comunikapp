import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
  Type,
  ValidationError,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

function formatarErros(errors: ValidationError[], prefix = ''): string[] {
  const msgs: string[] = [];
  for (const err of errors) {
    const path = prefix ? `${prefix}.${err.property}` : err.property;
    if (err.constraints) {
      msgs.push(...Object.values(err.constraints).map((m) => `${path}: ${m}`));
    }
    if (err.children?.length) {
      msgs.push(...formatarErros(err.children, path));
    }
  }
  return msgs;
}

/**
 * Valida o body contra um DTO sem a ValidationPipe global
 * (`forbidNonWhitelisted`). Mantém propriedades extras que o service consome
 * (custos, entrega, arte, etc.).
 *
 * Tipar o parâmetro como `any`/`Record` faz a pipe global pular o metatype;
 * esta pipe assume a validação tipada.
 */
@Injectable()
export class SoftValidateBodyPipe implements PipeTransform {
  constructor(private readonly dto: Type<object>) {}

  async transform(value: unknown, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body') {
      return value;
    }

    const plain =
      value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

    const instance = plainToInstance(this.dto, plain, {
      enableImplicitConversion: true,
      exposeDefaultValues: true,
    });

    const errors = await validate(instance as object, {
      whitelist: false,
      forbidNonWhitelisted: false,
      skipMissingProperties: true,
      validationError: { target: false },
    });

    if (errors.length > 0) {
      const msgs = formatarErros(errors);
      throw new BadRequestException(msgs.join(' | ') || 'Dados inválidos');
    }

    // Devolve o payload original: o service espera campos além do DTO canônico.
    return plain;
  }
}
