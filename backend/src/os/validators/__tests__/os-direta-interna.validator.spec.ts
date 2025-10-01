import { Test, TestingModule } from '@nestjs/testing';
import { OSDiretaInternaValidator } from '../os-direta-interna.validator';
import { BadRequestException } from '@nestjs/common';
import { TipoOS, OrigemOS, PrioridadeOS, StatusAprovacao } from '../../interfaces/os-direta-interna.interface';

describe('OSDiretaInternaValidator', () => {
  let validator: OSDiretaInternaValidator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OSDiretaInternaValidator],
    }).compile();

    validator = module.get<OSDiretaInternaValidator>(OSDiretaInternaValidator);
  });

  describe('validarTipoOS', () => {
    it('deve validar tipos válidos', () => {
      expect(validator.validarTipoOS(TipoOS.COMERCIAL)).toBe(true);
      expect(validator.validarTipoOS(TipoOS.INTERNA)).toBe(true);
    });

    it('deve rejeitar tipos inválidos', () => {
      expect(validator.validarTipoOS('INVALIDO')).toBe(false);
      expect(validator.validarTipoOS('')).toBe(false);
    });
  });

  describe('validarOrigemOS', () => {
    it('deve validar origens válidas', () => {
      expect(validator.validarOrigemOS(OrigemOS.ORCAMENTO)).toBe(true);
      expect(validator.validarOrigemOS(OrigemOS.DIRETA)).toBe(true);
      expect(validator.validarOrigemOS(OrigemOS.INTERNA)).toBe(true);
    });

    it('deve rejeitar origens inválidas', () => {
      expect(validator.validarOrigemOS('INVALIDO')).toBe(false);
      expect(validator.validarOrigemOS('')).toBe(false);
    });
  });

  describe('validarPrioridade', () => {
    it('deve validar prioridades válidas', () => {
      expect(validator.validarPrioridade(PrioridadeOS.URGENTE)).toBe(true);
      expect(validator.validarPrioridade(PrioridadeOS.ALTA)).toBe(true);
      expect(validator.validarPrioridade(PrioridadeOS.NORMAL)).toBe(true);
      expect(validator.validarPrioridade(PrioridadeOS.BAIXA)).toBe(true);
    });

    it('deve rejeitar prioridades inválidas', () => {
      expect(validator.validarPrioridade('INVALIDO')).toBe(false);
      expect(validator.validarPrioridade('')).toBe(false);
    });
  });

  describe('validarStatusAprovacao', () => {
    it('deve validar status válidos', () => {
      expect(validator.validarStatusAprovacao(StatusAprovacao.PENDENTE)).toBe(true);
      expect(validator.validarStatusAprovacao(StatusAprovacao.APROVADA)).toBe(true);
      expect(validator.validarStatusAprovacao(StatusAprovacao.REJEITADA)).toBe(true);
    });

    it('deve rejeitar status inválidos', () => {
      expect(validator.validarStatusAprovacao('INVALIDO')).toBe(false);
      expect(validator.validarStatusAprovacao('')).toBe(false);
    });
  });

  describe('validarCamposOSInterna', () => {
    it('deve validar campos obrigatórios', () => {
      const dados = {
        departamento_solicitante: 'TI',
        centro_custo: 'CC-001'
      };

      expect(() => validator.validarCamposOSInterna(dados)).not.toThrow();
    });

    it('deve rejeitar quando departamento_solicitante está ausente', () => {
      const dados = {
        centro_custo: 'CC-001'
      };

      expect(() => validator.validarCamposOSInterna(dados))
        .toThrow(BadRequestException);
    });

    it('deve rejeitar quando centro_custo está ausente', () => {
      const dados = {
        departamento_solicitante: 'TI'
      };

      expect(() => validator.validarCamposOSInterna(dados))
        .toThrow(BadRequestException);
    });

    it('deve rejeitar centro_custo com formato inválido', () => {
      const dados = {
        departamento_solicitante: 'TI',
        centro_custo: 'centro inválido'
      };

      expect(() => validator.validarCamposOSInterna(dados))
        .toThrow(BadRequestException);
    });

    it('deve aceitar centro_custo com formato válido', () => {
      const dados = {
        departamento_solicitante: 'TI',
        centro_custo: 'CC-001'
      };

      expect(() => validator.validarCamposOSInterna(dados)).not.toThrow();
    });
  });

  describe('validarCamposOSComercial', () => {
    it('deve validar campos obrigatórios', () => {
      const dados = {
        cliente_id: 'cliente-123'
      };

      expect(() => validator.validarCamposOSComercial(dados)).not.toThrow();
    });

    it('deve rejeitar quando cliente_id está ausente', () => {
      const dados = {};

      expect(() => validator.validarCamposOSComercial(dados))
        .toThrow(BadRequestException);
    });

    it('deve rejeitar satisfacao_cliente inválida', () => {
      const dados = {
        cliente_id: 'cliente-123',
        satisfacao_cliente: 6
      };

      expect(() => validator.validarCamposOSComercial(dados))
        .toThrow(BadRequestException);
    });

    it('deve aceitar satisfacao_cliente válida', () => {
      const dados = {
        cliente_id: 'cliente-123',
        satisfacao_cliente: 5
      };

      expect(() => validator.validarCamposOSComercial(dados)).not.toThrow();
    });

    it('deve rejeitar valor_orcado negativo', () => {
      const dados = {
        cliente_id: 'cliente-123',
        valor_orcado: -100
      };

      expect(() => validator.validarCamposOSComercial(dados))
        .toThrow(BadRequestException);
    });

    it('deve rejeitar margem_lucro_real inválida', () => {
      const dados = {
        cliente_id: 'cliente-123',
        margem_lucro_real: 150
      };

      expect(() => validator.validarCamposOSComercial(dados))
        .toThrow(BadRequestException);
    });
  });

  describe('validarAprovacaoGerencial', () => {
    it('deve validar aprovação completa', () => {
      const dados = {
        aprovacao_gerencial: StatusAprovacao.APROVADA,
        aprovacao_gerencial_por: 'usuario-123'
      };

      expect(() => validator.validarAprovacaoGerencial(dados)).not.toThrow();
    });

    it('deve rejeitar quando status está ausente', () => {
      const dados = {};

      expect(() => validator.validarAprovacaoGerencial(dados))
        .toThrow(BadRequestException);
    });

    it('deve rejeitar quando aprovador está ausente para status APROVADA', () => {
      const dados = {
        aprovacao_gerencial: StatusAprovacao.APROVADA
      };

      expect(() => validator.validarAprovacaoGerencial(dados))
        .toThrow(BadRequestException);
    });
  });

  describe('validarCamposControle', () => {
    it('deve validar versão válida', () => {
      const dados = {
        versao: 1
      };

      expect(() => validator.validarCamposControle(dados)).not.toThrow();
    });

    it('deve rejeitar versão inválida', () => {
      const dados = {
        versao: 0
      };

      expect(() => validator.validarCamposControle(dados))
        .toThrow(BadRequestException);
    });

    it('deve rejeitar motivo_modificacao muito curto', () => {
      const dados = {
        motivo_modificacao: 'curto'
      };

      expect(() => validator.validarCamposControle(dados))
        .toThrow(BadRequestException);
    });
  });

  describe('validarPermissaoModificacao', () => {
    it('deve permitir modificação pelo criador', () => {
      const os = {
        criado_por: 'usuario-123',
        status: 'FILA'
      };

      expect(() => validator.validarPermissaoModificacao(os, 'usuario-123')).not.toThrow();
    });

    it('deve rejeitar modificação por outro usuário', () => {
      const os = {
        criado_por: 'usuario-123',
        status: 'FILA'
      };

      expect(() => validator.validarPermissaoModificacao(os, 'usuario-456'))
        .toThrow(BadRequestException);
    });

    it('deve rejeitar modificação de OS finalizada', () => {
      const os = {
        criado_por: 'usuario-123',
        status: 'FINALIZADA'
      };

      expect(() => validator.validarPermissaoModificacao(os, 'usuario-123'))
        .toThrow(BadRequestException);
    });
  });

  describe('validarTransicaoStatus', () => {
    it('deve validar transições válidas', () => {
      expect(() => validator.validarTransicaoStatus('FILA', 'EM_PRODUCAO')).not.toThrow();
      expect(() => validator.validarTransicaoStatus('EM_PRODUCAO', 'FINALIZADA')).not.toThrow();
    });

    it('deve rejeitar transições inválidas', () => {
      expect(() => validator.validarTransicaoStatus('FILA', 'FINALIZADA'))
        .toThrow(BadRequestException);
      expect(() => validator.validarTransicaoStatus('FINALIZADA', 'FILA'))
        .toThrow(BadRequestException);
    });
  });

  describe('validarPermissaoAprovacao', () => {
    it('deve permitir aprovação técnica para OS Comercial', () => {
      const os = {
        tipo_os: TipoOS.COMERCIAL
      };

      expect(() => validator.validarPermissaoAprovacao(os, 'tecnica')).not.toThrow();
    });

    it('deve permitir aprovação gerencial para OS Interna', () => {
      const os = {
        tipo_os: TipoOS.INTERNA
      };

      expect(() => validator.validarPermissaoAprovacao(os, 'gerencial')).not.toThrow();
    });

    it('deve rejeitar aprovação gerencial para OS Comercial', () => {
      const os = {
        tipo_os: TipoOS.COMERCIAL
      };

      expect(() => validator.validarPermissaoAprovacao(os, 'gerencial'))
        .toThrow(BadRequestException);
    });

    it('deve rejeitar aprovação técnica para OS Interna', () => {
      const os = {
        tipo_os: TipoOS.INTERNA
      };

      expect(() => validator.validarPermissaoAprovacao(os, 'tecnica'))
        .toThrow(BadRequestException);
    });
  });

  describe('validarOSCompleta', () => {
    it('deve validar OS Interna completa', () => {
      const dados = {
        tipo_os: TipoOS.INTERNA,
        prioridade: PrioridadeOS.NORMAL,
        departamento_solicitante: 'TI',
        centro_custo: 'CC-001',
        versao: 1
      };

      expect(() => validator.validarOSCompleta(dados)).not.toThrow();
    });

    it('deve validar OS Comercial completa', () => {
      const dados = {
        tipo_os: TipoOS.COMERCIAL,
        prioridade: PrioridadeOS.NORMAL,
        cliente_id: 'cliente-123',
        versao: 1
      };

      expect(() => validator.validarOSCompleta(dados)).not.toThrow();
    });

    it('deve rejeitar OS com tipo inválido', () => {
      const dados = {
        tipo_os: 'INVALIDO',
        prioridade: PrioridadeOS.NORMAL,
        versao: 1
      };

      expect(() => validator.validarOSCompleta(dados))
        .toThrow(BadRequestException);
    });
  });
});
