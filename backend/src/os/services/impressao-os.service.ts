import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import TransformacaoDadosHelper from '../helpers/transformacao-dados.helper';
import * as QRCode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Service para geração de template de impressão da OS
 * Objetivo: Template A4 otimizado para impressão física conforme PLANO Fase 1
 */

export interface DadosImpressaoOS {
  os: any;
  cliente: any;
  loja: any;
  orcamento?: any;
  produtos: any[];
  insumos: any[];
  maquinas: any[];
  servicosManuais: any[];
  dadosTransformados: any;
  qrCodeDataUrl: string;
}

export interface ConfiguracaoImpressao {
  incluirQRCode: boolean;
  incluirLogo: boolean;
  incluirDetalhesTecnicos: boolean;
  formato: 'html' | 'pdf';
  versao: 'simples' | 'completa';
}

@Injectable()
export class ImpressaoOSService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Gerar dados completos para impressão da OS
   * @param osId ID da OS
   * @param config Configurações de impressão
   * @returns Dados formatados para impressão
   */
  async gerarDadosImpressao(
    osId: string,
    config: ConfiguracaoImpressao = {
      incluirQRCode: true,
      incluirLogo: true,
      incluirDetalhesTecnicos: true,
      formato: 'html',
      versao: 'simples',
    },
  ): Promise<DadosImpressaoOS> {
    // Carrega a OS com seus `itens_os` (verdade pos-OS) e tambem o orcamento.
    //
    // Por que ainda precisamos do orcamento?
    // O modelo `ItemOS` hoje guarda apenas `insumos_necessarios` (JSON) por
    // item; nao persiste maquinas nem servicos manuais. Enquanto essa
    // estrutura nao existir no ItemOS, esses dois dominios continuam vindo
    // do orcamento via relacao `os.orcamento.produtos`. Esta divida tecnica
    // esta registrada no HANDOFF (secao 4.6) como prerequisito da Fase 4
    // (PCP) para evitar que edicoes posteriores do orcamento afetem o que
    // a OS imprime.
    const os = await this.prisma.ordemServico.findUnique({
      where: { id: osId },
      include: {
        loja: true,
        cliente: true,
        itens: {
          orderBy: [
            { ordem_producao: 'asc' },
            { criado_em: 'asc' },
          ],
        },
        orcamento: {
          include: {
            produtos: {
              include: {
                insumos: {
                  include: { insumo: true },
                },
                maquinas: {
                  include: { maquina: true },
                },
                funcoes: {
                  include: { funcao: true },
                },
                servicos_manuais: {
                  include: { servico: true },
                },
                custos_indiretos: {
                  include: { custo: true },
                },
              },
            },
          },
        },
      },
    });

    if (!os) {
      throw new Error(`OS ${osId} não encontrada`);
    }

    const qrCodeDataUrl = config.incluirQRCode
      ? await this.gerarQRCode(os.numero)
      : '';

    // Fontes de dados para a impressao:
    // - `produtos`: shape esperado por `formatarDimensoes` (largura/altura/
    //   profundidade). Saem dos itens_os quando existem; cai no orcamento
    //   para OS legacy criada antes de Fase 3 (sem ItemOS).
    // - `insumos`: shape esperado pelo helper e pelo template. Saem do JSON
    //   `insumos_necessarios` dos itens_os (com adaptacao de
    //   `quantidade_necessaria -> quantidade`); cai nos insumos do orcamento
    //   como fallback.
    // - `maquinas` / `servicosManuais`: continuam vindo do orcamento
    //   enquanto nao houver schema dedicado no ItemOS.
    const produtosImpressao = this.montarProdutosImpressao(os);
    const insumosImpressao = this.montarInsumosImpressao(os);
    const maquinasImpressao =
      os.orcamento?.produtos?.flatMap((p: any) => p.maquinas ?? []) ?? [];
    const servicosManuaisImpressao =
      os.orcamento?.produtos?.flatMap((p: any) => p.servicos_manuais ?? []) ?? [];

    const dadosTransformados = os.orcamento
      ? TransformacaoDadosHelper.transformarDadosCompletos({
          horasProducao: Number(os.orcamento.horas_producao) || 0,
          prazoEntrega: '10 dias',
          dataAbertura: os.data_abertura,
          insumos: insumosImpressao,
          maquinas: maquinasImpressao,
          servicosManuais: servicosManuaisImpressao,
        })
      : null;

    return {
      os,
      cliente: os.cliente,
      loja: os.loja,
      orcamento: os.orcamento,
      produtos: produtosImpressao,
      insumos: insumosImpressao,
      maquinas: maquinasImpressao,
      servicosManuais: servicosManuaisImpressao,
      dadosTransformados,
      qrCodeDataUrl,
    };
  }

  /**
   * Monta o shape de produtos esperado por `formatarDimensoes`
   * ({ largura, altura, profundidade }).
   *
   * - Quando a OS tem `itens` (caminho moderno pos-Fase 3), le direto deles.
   *   `profundidade` nao existe como coluna no ItemOS; recupero do JSON
   *   `parametros_tecnicos` se presente.
   * - Quando a OS nao tem itens (legacy ou OS criada manualmente sem
   *   `criarOSDeOrcamento`), faz fallback nos produtos do orcamento.
   */
  private montarProdutosImpressao(os: any): any[] {
    if (Array.isArray(os.itens) && os.itens.length > 0) {
      return os.itens.map((item: any) => {
        const parametros = this.parseParametrosTecnicos(
          item.parametros_tecnicos,
        );
        return {
          id: item.id,
          nome: item.produto_servico,
          quantidade: item.quantidade,
          largura: item.largura ?? parametros.largura ?? null,
          altura: item.altura ?? parametros.altura ?? null,
          profundidade: parametros.profundidade ?? null,
          area: item.area ?? null,
          perimetro: item.perimetro ?? null,
          unidade_medida: item.unidade_medida ?? null,
          observacoes: item.observacoes ?? null,
        };
      });
    }

    return os.orcamento?.produtos ?? [];
  }

  /**
   * Monta a lista de insumos para o helper de transformacao e para
   * `formatarTabelaMateriais`. Le do JSON `insumos_necessarios` gravado em
   * cada `ItemOS` (formato `InsumoCalculado` produzido pelo `OSService`).
   *
   * Adaptacao importante: o JSON guarda `quantidade_necessaria`, mas o
   * helper e o template esperam `quantidade`. Espelho o campo aqui para
   * manter compatibilidade sem mexer no helper (que tambem serve para o
   * fluxo legacy de orcamento).
   *
   * Fallback: se nao houver itens com insumos validos, cai nos insumos do
   * orcamento para nao quebrar impressao de OS legacy.
   */
  private montarInsumosImpressao(os: any): any[] {
    const dosItens: any[] = [];

    if (Array.isArray(os.itens)) {
      for (const item of os.itens) {
        const insumosItem = this.parseInsumosNecessarios(
          item.insumos_necessarios,
        );
        for (const insumo of insumosItem) {
          dosItens.push({
            ...insumo,
            quantidade:
              insumo.quantidade ?? insumo.quantidade_necessaria ?? 0,
          });
        }
      }
    }

    if (dosItens.length > 0) {
      return dosItens;
    }

    return (
      os.orcamento?.produtos?.flatMap((p: any) => p.insumos ?? []) ?? []
    );
  }

  /**
   * Parse defensivo do JSON `insumos_necessarios` do ItemOS. Aceita string,
   * array ou null e devolve sempre um array (vazio em caso de erro).
   */
  private parseInsumosNecessarios(valor: unknown): any[] {
    if (!valor) return [];
    if (Array.isArray(valor)) return valor;
    if (typeof valor !== 'string') return [];
    try {
      const parsed = JSON.parse(valor);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /**
   * Parse defensivo do JSON `parametros_tecnicos` do ItemOS. Retorna sempre
   * um objeto plain (vazio em caso de erro).
   */
  private parseParametrosTecnicos(valor: unknown): Record<string, any> {
    if (!valor) return {};
    if (typeof valor === 'object') return valor as Record<string, any>;
    if (typeof valor !== 'string') return {};
    try {
      const parsed = JSON.parse(valor);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  /**
   * Gerar template HTML para impressão
   * @param dados Dados da OS
   * @param config Configurações
   * @returns HTML otimizado para impressão
   */
  async gerarTemplateHTML(
    dados: DadosImpressaoOS,
    config: ConfiguracaoImpressao,
  ): Promise<string> {
    const template = await this.carregarTemplate();

    // Determinar versão do template baseada na configuração
    const isVersaoCompleta =
      config.versao === 'completa' || config.formato === 'pdf';
    const tipoVersao = isVersaoCompleta ? 'Completa' : 'Simplificada';

    // Substituir variáveis no template
    const html = template
      .replace('{{OS_NUMERO}}', dados.os.numero)
      .replace('{{OS_DATA}}', this.formatarData(dados.os.data_abertura))
      .replace('{{CLIENTE_NOME}}', dados.cliente.nome || 'N/A')
      .replace('{{CLIENTE_DOCUMENTO}}', dados.cliente.documento || 'N/A')
      .replace('{{CLIENTE_TELEFONE}}', dados.cliente.telefone || 'N/A')
      .replace('{{CLIENTE_EMAIL}}', dados.cliente.email || 'N/A')
      .replace('{{CLIENTE_ENDERECO}}', this.formatarEndereco(dados.cliente))
      .replace('{{PROJETO_DESCRICAO}}', dados.os.nome_servico)
      .replace('{{PROJETO_QUANTIDADE}}', dados.os.quantidade.toString())
      .replace('{{PROJETO_DIMENSOES}}', this.formatarDimensoes(dados.produtos))
      .replace('{{PROJETO_PRAZO}}', this.formatarPrazo(dados.os.data_prazo))
      .replace('{{PROJETO_PRIORIDADE}}', dados.os.status)
      .replace(
        '{{MATERIAIS_PRINCIPAIS}}',
        this.formatarMateriaisPrincipais(
          dados.dadosTransformados?.materiaisPrincipais,
        ),
      )
      .replace(
        '{{TIPO_IMPRESSAO}}',
        dados.dadosTransformados?.tipoImpressao?.tipo || 'N/A',
      )
      .replace(
        '{{ACABAMENTOS}}',
        this.formatarAcabamentos(dados.dadosTransformados?.acabamentos),
      )
      .replace(
        '{{INSTALACAO_NECESSARIA}}',
        dados.dadosTransformados?.instalacaoNecessaria ? 'Sim' : 'Não',
      )
      .replace(
        '{{MATERIAIS_TABELA}}',
        this.formatarTabelaMateriais(dados.insumos),
      )
      .replace('{{OBSERVACOES}}', dados.os.observacoes || '')
      .replace('{{APROVACAO_TECNICA}}', this.formatarAprovacaoTecnica(dados.os))
      .replace(
        '{{APROVACAO_TECNICA_POR}}',
        dados.os.aprovacao_tecnica_por || 'N/A',
      )
      .replace(
        '{{APROVACAO_TECNICA_DATA}}',
        dados.os.aprovacao_tecnica_em
          ? this.formatarData(dados.os.aprovacao_tecnica_em)
          : 'N/A',
      )
      .replace(
        '{{APROVACAO_TECNICA_OBS}}',
        dados.os.aprovacao_tecnica_observacoes || 'N/A',
      )
      .replace(
        '{{AGENDAMENTO_INSTALACAO}}',
        this.formatarAgendamentoInstalacao(dados.os),
      )
      .replace(
        '{{INSTALACAO_STATUS}}',
        dados.os.data_instalacao_agendada ? 'agendada' : 'nao-agendada',
      )
      .replace(
        '{{OBSERVACOES_INSTALACAO}}',
        dados.os.observacoes_instalacao || 'N/A',
      )
      .replace(
        '{{QR_CODE}}',
        dados.qrCodeDataUrl
          ? `<img src="${dados.qrCodeDataUrl}" alt="QR Code" class="qr-code">`
          : '',
      )
      .replace('{{LOJA_NOME}}', dados.loja.nome || 'N/A')
      .replace('{{LOJA_ENDERECO}}', this.formatarEnderecoLoja(dados.loja))
      .replace('{{DATA_IMPRESSAO}}', this.formatarData(new Date()))
      .replace('{{RESPONSAVEL_IMPRESSAO}}', 'Sistema')
      // Novos placeholders para checklists
      .replace(
        '{{CHECKLIST_FILA}}',
        this.gerarCheckboxStatus(dados.os.status, 'FILA'),
      )
      .replace(
        '{{CHECKLIST_PRODUCAO}}',
        this.gerarCheckboxStatus(dados.os.status, 'PRODUCAO'),
      )
      .replace(
        '{{CHECKLIST_IMPRESSAO}}',
        this.gerarCheckboxStatus(dados.os.status, 'IMPRESSAO'),
      )
      .replace(
        '{{CHECKLIST_ACABAMENTO}}',
        this.gerarCheckboxStatus(dados.os.status, 'ACABAMENTO'),
      )
      .replace(
        '{{CHECKLIST_INSTALACAO}}',
        this.gerarCheckboxStatus(dados.os.status, 'INSTALACAO'),
      )
      .replace(
        '{{CHECKLIST_ENTREGA}}',
        this.gerarCheckboxStatus(dados.os.status, 'ENTREGA'),
      )
      // Placeholders para apontamentos
      .replace(
        '{{APONTAMENTO_SEPARACAO_INICIO}}',
        this.gerarCampoApontamento('SEPARACAO', 'inicio'),
      )
      .replace(
        '{{APONTAMENTO_SEPARACAO_TERMINO}}',
        this.gerarCampoApontamento('SEPARACAO', 'termino'),
      )
      .replace(
        '{{APONTAMENTO_SEPARACAO_RESPONSAVEL}}',
        this.gerarCampoApontamento('SEPARACAO', 'responsavel'),
      )
      .replace(
        '{{APONTAMENTO_SEPARACAO_OBS}}',
        this.gerarCampoApontamento('SEPARACAO', 'observacoes'),
      )
      .replace(
        '{{APONTAMENTO_IMPRESSAO_INICIO}}',
        this.gerarCampoApontamento('IMPRESSAO', 'inicio'),
      )
      .replace(
        '{{APONTAMENTO_IMPRESSAO_TERMINO}}',
        this.gerarCampoApontamento('IMPRESSAO', 'termino'),
      )
      .replace(
        '{{APONTAMENTO_IMPRESSAO_RESPONSAVEL}}',
        this.gerarCampoApontamento('IMPRESSAO', 'responsavel'),
      )
      .replace(
        '{{APONTAMENTO_IMPRESSAO_OBS}}',
        this.gerarCampoApontamento('IMPRESSAO', 'observacoes'),
      )
      .replace(
        '{{APONTAMENTO_ACABAMENTO_INICIO}}',
        this.gerarCampoApontamento('ACABAMENTO', 'inicio'),
      )
      .replace(
        '{{APONTAMENTO_ACABAMENTO_TERMINO}}',
        this.gerarCampoApontamento('ACABAMENTO', 'termino'),
      )
      .replace(
        '{{APONTAMENTO_ACABAMENTO_RESPONSAVEL}}',
        this.gerarCampoApontamento('ACABAMENTO', 'responsavel'),
      )
      .replace(
        '{{APONTAMENTO_ACABAMENTO_OBS}}',
        this.gerarCampoApontamento('ACABAMENTO', 'observacoes'),
      )
      .replace(
        '{{APONTAMENTO_INSTALACAO_INICIO}}',
        this.gerarCampoApontamento('INSTALACAO', 'inicio'),
      )
      .replace(
        '{{APONTAMENTO_INSTALACAO_TERMINO}}',
        this.gerarCampoApontamento('INSTALACAO', 'termino'),
      )
      .replace(
        '{{APONTAMENTO_INSTALACAO_RESPONSAVEL}}',
        this.gerarCampoApontamento('INSTALACAO', 'responsavel'),
      )
      .replace(
        '{{APONTAMENTO_INSTALACAO_OBS}}',
        this.gerarCampoApontamento('INSTALACAO', 'observacoes'),
      )
      // Placeholders para qualidade
      .replace(
        '{{QUALIDADE_DIMENSOES}}',
        this.gerarCheckboxQualidade('dimensoes'),
      )
      .replace(
        '{{QUALIDADE_IMPRESSAO}}',
        this.gerarCheckboxQualidade('impressao'),
      )
      .replace(
        '{{QUALIDADE_ACABAMENTO}}',
        this.gerarCheckboxQualidade('acabamento'),
      )
      .replace(
        '{{QUALIDADE_MATERIAIS}}',
        this.gerarCheckboxQualidade('materiais'),
      )
      .replace('{{QUALIDADE_LIMPEZA}}', this.gerarCheckboxQualidade('limpeza'))
      .replace(
        '{{QUALIDADE_EMBALAGEM}}',
        this.gerarCheckboxQualidade('embalagem'),
      )
      .replace(
        '{{QUALIDADE_DATA_CONFERENCIA}}',
        this.gerarCampoQualidade('data'),
      )
      .replace(
        '{{QUALIDADE_HORARIO_CONFERENCIA}}',
        this.gerarCampoQualidade('horario'),
      )
      // Versão do template
      .replace('{{VERSAO_TEMPLATE}}', '2.0')
      .replace('{{TIPO_VERSAO}}', tipoVersao);

    return html;
  }

  /**
   * Gerar QR Code para acesso digital
   * @param numeroOS Número da OS
   * @returns Data URL do QR Code
   */
  private async gerarQRCode(numeroOS: string): Promise<string> {
    try {
      const url = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/os/${numeroOS}`;
      const qrCodeDataUrl = await QRCode.toDataURL(url, {
        width: 100,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      return qrCodeDataUrl;
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      return '';
    }
  }

  /**
   * Carregar template HTML
   * @returns Template HTML
   */
  private async carregarTemplate(): Promise<string> {
    const templatePath = path.join(__dirname, '../templates/os-impressao.html');

    try {
      return fs.readFileSync(templatePath, 'utf8');
    } catch (error) {
      // Template inline como fallback
      return this.getTemplateInline();
    }
  }

  /**
   * Template HTML inline como fallback
   * @returns Template HTML
   */
  private getTemplateInline(): string {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OS {{OS_NUMERO}}</title>
    <style>
        @page {
            size: A4;
            margin: 1cm;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        
        .logo {
            font-size: 18px;
            font-weight: bold;
        }
        
        .os-info {
            text-align: right;
        }
        
        .os-numero {
            font-size: 24px;
            font-weight: bold;
            color: #000;
        }
        
        .os-data {
            font-size: 12px;
            color: #666;
        }
        
        .qr-code {
            width: 80px;
            height: 80px;
        }
        
        .section {
            margin-bottom: 15px;
            page-break-inside: avoid;
        }
        
        .section-title {
            font-size: 14px;
            font-weight: bold;
            background-color: #f0f0f0;
            padding: 5px 10px;
            border-left: 4px solid #000;
            margin-bottom: 10px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 10px;
        }
        
        .info-item {
            display: flex;
            flex-direction: column;
        }
        
        .info-label {
            font-weight: bold;
            font-size: 10px;
            color: #666;
        }
        
        .info-value {
            font-size: 12px;
        }
        
        .materiais-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        
        .materiais-table th,
        .materiais-table td {
            border: 1px solid #000;
            padding: 5px;
            text-align: left;
        }
        
        .materiais-table th {
            background-color: #f0f0f0;
            font-weight: bold;
        }
        
        .footer {
            margin-top: 30px;
            padding-top: 10px;
            border-top: 1px solid #000;
            font-size: 10px;
            text-align: center;
        }
        
        .aprovacao-box {
            border: 1px solid #000;
            padding: 10px;
            margin-top: 10px;
        }
        
        .aprovacao-status {
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .aprovacao-aprovada {
            color: #008000;
        }
        
        .aprovacao-pendente {
            color: #ff8c00;
        }
        
        .aprovacao-rejeitada {
            color: #ff0000;
        }
        
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .no-print {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">{{LOJA_NOME}}</div>
        <div class="os-info">
            <div class="os-numero">{{OS_NUMERO}}</div>
            <div class="os-data">{{OS_DATA}}</div>
        </div>
        <div class="qr-code">{{QR_CODE}}</div>
    </div>
    
    <div class="section">
        <div class="section-title">CLIENTE</div>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Nome</div>
                <div class="info-value">{{CLIENTE_NOME}}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Documento</div>
                <div class="info-value">{{CLIENTE_DOCUMENTO}}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Telefone</div>
                <div class="info-value">{{CLIENTE_TELEFONE}}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Email</div>
                <div class="info-value">{{CLIENTE_EMAIL}}</div>
            </div>
        </div>
        <div class="info-item">
            <div class="info-label">Endereço</div>
            <div class="info-value">{{CLIENTE_ENDERECO}}</div>
        </div>
    </div>
    
    <div class="section">
        <div class="section-title">PROJETO</div>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Descrição</div>
                <div class="info-value">{{PROJETO_DESCRICAO}}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Quantidade</div>
                <div class="info-value">{{PROJETO_QUANTIDADE}}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Dimensões</div>
                <div class="info-value">{{PROJETO_DIMENSOES}}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Prazo</div>
                <div class="info-value">{{PROJETO_PRAZO}}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Prioridade</div>
                <div class="info-value">{{PROJETO_PRIORIDADE}}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Instalação</div>
                <div class="info-value">{{INSTALACAO_NECESSARIA}}</div>
            </div>
        </div>
    </div>
    
    <div class="section">
        <div class="section-title">ESPECIFICAÇÕES TÉCNICAS</div>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Materiais Principais</div>
                <div class="info-value">{{MATERIAIS_PRINCIPAIS}}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Tipo de Impressão</div>
                <div class="info-value">{{TIPO_IMPRESSAO}}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Acabamentos</div>
                <div class="info-value">{{ACABAMENTOS}}</div>
            </div>
        </div>
    </div>
    
    <div class="section">
        <div class="section-title">MATERIAIS NECESSÁRIOS</div>
        <table class="materiais-table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Quantidade</th>
                    <th>Unidade</th>
                    <th>Observação</th>
                </tr>
            </thead>
            <tbody>
                {{MATERIAIS_TABELA}}
            </tbody>
        </table>
    </div>
    
    <div class="section">
        <div class="section-title">APROVAÇÃO TÉCNICA</div>
        <div class="aprovacao-box">
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Status</div>
                    <div class="info-value aprovacao-status {{APROVACAO_TECNICA}}">{{APROVACAO_TECNICA}}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Data</div>
                    <div class="info-value">{{AGENDAMENTO_INSTALACAO}}</div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="section">
        <div class="section-title">OBSERVAÇÕES</div>
        <div class="info-value">{{OBSERVACOES}}</div>
    </div>
    
    <div class="footer">
        <div>Impresso em: {{DATA_IMPRESSAO}} por {{RESPONSAVEL_IMPRESSAO}}</div>
        <div>{{LOJA_NOME}} - {{LOJA_ENDERECO}}</div>
    </div>
</body>
</html>`;
  }

  // Métodos auxiliares de formatação
  private formatarData(data: Date): string {
    return data.toLocaleDateString('pt-BR');
  }

  private formatarEndereco(cliente: any): string {
    if (!cliente) return 'N/A';

    const endereco = [];
    if (cliente.endereco) endereco.push(cliente.endereco);
    if (cliente.cidade) endereco.push(cliente.cidade);
    if (cliente.estado) endereco.push(cliente.estado);
    if (cliente.cep) endereco.push(cliente.cep);

    return endereco.join(', ') || 'N/A';
  }

  private formatarEnderecoLoja(loja: any): string {
    if (!loja) return 'N/A';

    const endereco = [];
    if (loja.endereco) endereco.push(loja.endereco);
    if (loja.cidade) endereco.push(loja.cidade);
    if (loja.estado) endereco.push(loja.estado);

    return endereco.join(', ') || 'N/A';
  }

  private formatarDimensoes(produtos: any[]): string {
    if (!produtos || produtos.length === 0) return 'N/A';

    const dimensoes = produtos.map((p) => {
      const dims = [];
      if (p.largura) dims.push(`L: ${p.largura}cm`);
      if (p.altura) dims.push(`A: ${p.altura}cm`);
      if (p.profundidade) dims.push(`P: ${p.profundidade}cm`);
      return dims.join(' x ');
    });

    return dimensoes.join(' | ') || 'N/A';
  }

  private formatarPrazo(dataPrazo: Date | null): string {
    return dataPrazo ? this.formatarData(dataPrazo) : 'N/A';
  }

  private formatarMateriaisPrincipais(materiais: any[]): string {
    if (!materiais || !Array.isArray(materiais) || materiais.length === 0)
      return 'N/A';

    return (
      materiais
        .filter((m) => m && m.nome)
        .map((m) => `${m.nome} (${m.quantidade || 0} ${m.unidade || 'un'})`)
        .join(', ') || 'N/A'
    );
  }

  private formatarAcabamentos(acabamentos: any[]): string {
    if (!acabamentos || !Array.isArray(acabamentos) || acabamentos.length === 0)
      return 'N/A';

    return (
      acabamentos
        .filter((a) => a && a.nome)
        .map((a) => a.nome)
        .join(', ') || 'N/A'
    );
  }

  private formatarTabelaMateriais(insumos: any[]): string {
    if (!insumos || !Array.isArray(insumos) || insumos.length === 0) {
      return '<tr><td colspan="4">Nenhum material listado</td></tr>';
    }

    return (
      insumos
        .filter((insumo) => insumo)
        .map(
          (insumo) => `
      <tr>
        <td>${insumo.insumo?.nome || insumo.nome || 'Material'}</td>
        <td>${insumo.quantidade || 0}</td>
        <td>${insumo.unidade || insumo.insumo?.unidade_uso || 'un'}</td>
        <td>${insumo.observacoes || ''}</td>
      </tr>
    `,
        )
        .join('') || '<tr><td colspan="4">Nenhum material listado</td></tr>'
    );
  }

  private formatarAprovacaoTecnica(os: any): string {
    const status = os.aprovacao_tecnica_status || 'PENDENTE';
    return status.toLowerCase();
  }

  private formatarAgendamentoInstalacao(os: any): string {
    if (!os.data_instalacao_agendada) return 'Não agendado';

    return this.formatarData(os.data_instalacao_agendada);
  }

  /**
   * Gerar checkbox para status do workflow
   * @param statusAtual Status atual da OS
   * @param statusEtapa Status da etapa específica
   * @returns HTML do checkbox
   */
  private gerarCheckboxStatus(
    statusAtual: string,
    statusEtapa: string,
  ): string {
    // Mapear status para ordem de execução
    const ordemStatus = [
      'FILA',
      'PRODUCAO',
      'IMPRESSAO',
      'ACABAMENTO',
      'INSTALACAO',
      'ENTREGA',
    ];
    const indiceAtual = ordemStatus.indexOf(statusAtual);
    const indiceEtapa = ordemStatus.indexOf(statusEtapa);

    // Se a etapa já foi concluída ou está em andamento
    const isConcluida = indiceAtual > indiceEtapa;
    const isEmAndamento = indiceAtual === indiceEtapa;

    if (isConcluida) {
      return '<div class="checklist-checkbox checked">✓</div>';
    } else if (isEmAndamento) {
      return '<div class="checklist-checkbox">○</div>';
    } else {
      return '<div class="checklist-checkbox">☐</div>';
    }
  }

  /**
   * Gerar campo para apontamentos
   * @param etapa Etapa do apontamento
   * @param tipo Tipo do campo (inicio, termino, responsavel, observacoes)
   * @returns Campo vazio para preenchimento manual
   */
  private gerarCampoApontamento(etapa: string, tipo: string): string {
    // TODO: Implementar busca de apontamentos reais do banco de dados
    // Por enquanto, retorna campos vazios para preenchimento manual
    return '_________________';
  }

  /**
   * Gerar checkbox para qualidade
   * @param tipo Tipo do item de qualidade
   * @returns HTML do checkbox vazio
   */
  private gerarCheckboxQualidade(tipo: string): string {
    // TODO: Implementar busca de status de qualidade real do banco de dados
    // Por enquanto, retorna checkbox vazio para preenchimento manual
    return '<div class="checklist-checkbox">☐</div>';
  }

  /**
   * Gerar campo para qualidade
   * @param tipo Tipo do campo (data, horario)
   * @returns Campo vazio para preenchimento manual
   */
  private gerarCampoQualidade(tipo: string): string {
    // TODO: Implementar busca de dados de qualidade reais do banco de dados
    // Por enquanto, retorna campo vazio para preenchimento manual
    return '_________________';
  }
}
