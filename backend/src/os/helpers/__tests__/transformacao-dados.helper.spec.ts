import { TransformacaoDadosHelper } from '../transformacao-dados.helper';

describe('TransformacaoDadosHelper', () => {
  
  describe('calcularPrazoProducaoDias', () => {
    it('deve calcular dias úteis corretamente', () => {
      expect(TransformacaoDadosHelper.calcularPrazoProducaoDias(16)).toBe(2);
      expect(TransformacaoDadosHelper.calcularPrazoProducaoDias(8)).toBe(1);
      expect(TransformacaoDadosHelper.calcularPrazoProducaoDias(25)).toBe(4);
    });
    
    it('deve retornar mínimo de 1 dia', () => {
      expect(TransformacaoDadosHelper.calcularPrazoProducaoDias(0)).toBe(0);
      expect(TransformacaoDadosHelper.calcularPrazoProducaoDias(1)).toBe(1);
    });
    
    it('deve usar horas por dia personalizadas', () => {
      expect(TransformacaoDadosHelper.calcularPrazoProducaoDias(20, 10)).toBe(2);
      expect(TransformacaoDadosHelper.calcularPrazoProducaoDias(15, 5)).toBe(3);
    });
  });
  
  describe('converterPrazoEntregaParaData', () => {
    const dataAbertura = new Date('2025-01-01'); // Quarta-feira
    
    it('deve converter texto simples', () => {
      const data = TransformacaoDadosHelper.converterPrazoEntregaParaData('5 dias', dataAbertura);
      expect(data).toBeInstanceOf(Date);
      expect(data.getTime()).toBeGreaterThan(dataAbertura.getTime());
    });
    
    it('deve usar o maior número em intervalos', () => {
      const data = TransformacaoDadosHelper.converterPrazoEntregaParaData('10 a 15 dias', dataAbertura);
      expect(data).toBeInstanceOf(Date);
    });
    
    it('deve retornar data padrão para texto inválido', () => {
      const data = TransformacaoDadosHelper.converterPrazoEntregaParaData('texto inválido', dataAbertura);
      expect(data).toBeInstanceOf(Date);
      expect(data.getTime()).toBeGreaterThan(dataAbertura.getTime());
    });
  });
  
  describe('extrairMateriaisPrincipais', () => {
    const insumosMock = [
      { nome: 'Material A', quantidade: 10, unidade: 'm²', custo_total: 100 },
      { nome: 'Material B', quantidade: 5, unidade: 'un', custo_total: 200 },
      { nome: 'Material C', quantidade: 2, unidade: 'kg', custo_total: 50 },
      { nome: 'Material D', quantidade: 1, unidade: 'un', custo_total: 300 }
    ];
    
    it('deve retornar top 3 materiais por custo', () => {
      const materiais = TransformacaoDadosHelper.extrairMateriaisPrincipais(insumosMock);
      
      expect(materiais).toHaveLength(3);
      expect(materiais[0].nome).toBe('Material D'); // Maior custo
      expect(materiais[1].nome).toBe('Material B');
      expect(materiais[2].nome).toBe('Material A');
    });
    
    it('deve filtrar insumos sem custo', () => {
      const insumosComZero = [
        ...insumosMock,
        { nome: 'Material Zero', quantidade: 1, unidade: 'un', custo_total: 0 }
      ];
      
      const materiais = TransformacaoDadosHelper.extrairMateriaisPrincipais(insumosComZero);
      expect(materiais).toHaveLength(3);
    });
    
    it('deve retornar array vazio para lista vazia', () => {
      const materiais = TransformacaoDadosHelper.extrairMateriaisPrincipais([]);
      expect(materiais).toHaveLength(0);
    });
  });
  
  describe('identificarTipoImpressao', () => {
    const maquinasMock = [
      { tipo: 'DIGITAL', nome: 'Impressora Digital' },
      { tipo: 'DIGITAL', nome: 'Plotter' },
      { tipo: 'CNC', nome: 'Corte CNC' }
    ];
    
    it('deve identificar tipo predominante', () => {
      const tipo = TransformacaoDadosHelper.identificarTipoImpressao(maquinasMock);
      
      expect(tipo).not.toBeNull();
      expect(tipo?.tipo).toBe('Impressão Digital');
      expect(tipo?.confianca).toBeGreaterThan(50);
    });
    
    it('deve retornar null para lista vazia', () => {
      const tipo = TransformacaoDadosHelper.identificarTipoImpressao([]);
      expect(tipo).toBeNull();
    });
  });
  
  describe('extrairAcabamentos', () => {
    const servicosMock = [
      { nome: 'Laminação', categorias: ['acabamento'], custo_total: 50 },
      { nome: 'Instalação', categorias: ['instalacao'], custo_total: 100 },
      { nome: 'Corte', categorias: ['acabamento'], custo_total: 30 }
    ];
    
    it('deve filtrar serviços de instalação', () => {
      const acabamentos = TransformacaoDadosHelper.extrairAcabamentos(servicosMock);
      
      expect(acabamentos).toHaveLength(2);
      expect(acabamentos.map(a => a.nome)).not.toContain('Instalação');
    });
    
    it('deve retornar array vazio para lista vazia', () => {
      const acabamentos = TransformacaoDadosHelper.extrairAcabamentos([]);
      expect(acabamentos).toHaveLength(0);
    });
  });
  
  describe('verificarInstalacaoNecessaria', () => {
    it('deve retornar true quando há instalação', () => {
      const servicos = [
        { categorias: ['acabamento'] },
        { categorias: ['instalacao'] }
      ];
      
      const necessaria = TransformacaoDadosHelper.verificarInstalacaoNecessaria(servicos);
      expect(necessaria).toBe(true);
    });
    
    it('deve retornar false quando não há instalação', () => {
      const servicos = [
        { categorias: ['acabamento'] },
        { categorias: ['corte'] }
      ];
      
      const necessaria = TransformacaoDadosHelper.verificarInstalacaoNecessaria(servicos);
      expect(necessaria).toBe(false);
    });
  });
  
  describe('transformarDadosCompletos', () => {
    const dadosOrcamentoMock = {
      horasProducao: 16,
      prazoEntrega: '10 dias',
      dataAbertura: new Date('2025-01-01'),
      insumos: [
        { nome: 'Material A', quantidade: 10, unidade: 'm²', custo_total: 100 }
      ],
      maquinas: [
        { tipo: 'DIGITAL', nome: 'Impressora' }
      ],
      servicosManuais: [
        { nome: 'Laminação', categorias: ['acabamento'], custo_total: 50 }
      ]
    };
    
    it('deve transformar dados completos', () => {
      const dados = TransformacaoDadosHelper.transformarDadosCompletos(dadosOrcamentoMock);
      
      expect(dados.prazoProducaoDias).toBeGreaterThan(0);
      expect(dados.dataEntregaCalculada).toBeInstanceOf(Date);
      expect(dados.materiaisPrincipais).toHaveLength(1);
      expect(dados.tipoImpressao).not.toBeNull();
      expect(dados.acabamentos).toHaveLength(1);
      expect(typeof dados.instalacaoNecessaria).toBe('boolean');
    });
  });
  
  describe('validarDadosTransformados', () => {
    const dadosValidos = {
      prazoProducaoDias: 5,
      dataEntregaCalculada: new Date(),
      materiaisPrincipais: [
        { nome: 'Material A', quantidade: 10, unidade: 'm²', custo_total: 100 }
      ],
      tipoImpressao: { tipo: 'Digital', maquina: 'Impressora', confianca: 90 },
      acabamentos: [
        { nome: 'Laminação', descricao: 'Teste', categoria: 'acabamento', custo_total: 50 }
      ],
      instalacaoNecessaria: false
    };
    
    it('deve validar dados corretos', () => {
      const validacao = TransformacaoDadosHelper.validarDadosTransformados(dadosValidos);
      
      expect(validacao.valido).toBe(true);
      expect(validacao.erros).toHaveLength(0);
    });
    
    it('deve detectar dados inválidos', () => {
      const dadosInvalidos = {
        ...dadosValidos,
        prazoProducaoDias: 0,
        materiaisPrincipais: []
      };
      
      const validacao = TransformacaoDadosHelper.validarDadosTransformados(dadosInvalidos);
      
      expect(validacao.valido).toBe(false);
      expect(validacao.erros.length).toBeGreaterThan(0);
    });
  });
  
  describe('formatarParaExibicao', () => {
    const dadosMock = {
      prazoProducaoDias: 5,
      dataEntregaCalculada: new Date(),
      materiaisPrincipais: [
        { nome: 'Material A', quantidade: 10, unidade: 'm²', custo_total: 100 }
      ],
      tipoImpressao: { tipo: 'Digital', maquina: 'Impressora', confianca: 90 },
      acabamentos: [
        { nome: 'Laminação', descricao: 'Teste', categoria: 'acabamento', custo_total: 50 }
      ],
      instalacaoNecessaria: true
    };
    
    it('deve formatar dados para exibição', () => {
      const formatado = TransformacaoDadosHelper.formatarParaExibicao(dadosMock);
      
      expect(formatado.prazoFormatado).toContain('dias úteis');
      expect(formatado.materiaisFormatados).toHaveLength(1);
      expect(formatado.impressaoFormatada).toContain('Digital');
      expect(formatado.acabamentosFormatados).toHaveLength(1);
      expect(formatado.instalacaoFormatada).toBe('Sim');
    });
  });
});
