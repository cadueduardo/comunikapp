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
  async gerarDadosImpressao(osId: string, config: ConfiguracaoImpressao = {
    incluirQRCode: true,
    incluirLogo: true,
    incluirDetalhesTecnicos: true,
    formato: 'html'
  }): Promise<DadosImpressaoOS> {
    
    // Buscar dados completos da OS
    const os = await this.prisma.ordemServico.findUnique({
      where: { id: osId },
      include: {
        loja: true,
        cliente: true,
        orcamento: {
          include: {
            produtos: {
              include: {
                insumos: {
                  include: { insumo: true }
                },
                maquinas: {
                  include: { maquina: true }
                },
                funcoes: {
                  include: { funcao: true }
                },
                servicos_manuais: {
                  include: { servico: true }
                },
                custos_indiretos: {
                  include: { custo: true }
                }
              }
            }
          }
        }
      }
    });
    
    if (!os) {
      throw new Error(`OS ${osId} não encontrada`);
    }
    
    // Gerar QR Code
    const qrCodeDataUrl = config.incluirQRCode 
      ? await this.gerarQRCode(os.numero)
      : '';
    
    // Transformar dados do orçamento
    const dadosTransformados = os.orcamento ? 
      TransformacaoDadosHelper.transformarDadosCompletos({
        horasProducao: Number(os.orcamento.horas_producao) || 0,
        prazoEntrega: '10 dias', // Seria extraído do orçamento
        dataAbertura: os.data_abertura,
        insumos: os.orcamento.produtos.flatMap(p => p.insumos),
        maquinas: os.orcamento.produtos.flatMap(p => p.maquinas),
        servicosManuais: os.orcamento.produtos.flatMap(p => p.servicos_manuais)
      }) : null;
    
    return {
      os,
      cliente: os.cliente,
      loja: os.loja,
      orcamento: os.orcamento,
      produtos: os.orcamento?.produtos || [],
      insumos: os.orcamento?.produtos.flatMap(p => p.insumos) || [],
      maquinas: os.orcamento?.produtos.flatMap(p => p.maquinas) || [],
      servicosManuais: os.orcamento?.produtos.flatMap(p => p.servicos_manuais) || [],
      dadosTransformados,
      qrCodeDataUrl
    };
  }
  
  /**
   * Gerar template HTML para impressão
   * @param dados Dados da OS
   * @param config Configurações
   * @returns HTML otimizado para impressão
   */
  async gerarTemplateHTML(dados: DadosImpressaoOS, config: ConfiguracaoImpressao): Promise<string> {
    const template = await this.carregarTemplate();
    
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
      .replace('{{MATERIAIS_PRINCIPAIS}}', this.formatarMateriaisPrincipais(dados.dadosTransformados?.materiaisPrincipais))
      .replace('{{TIPO_IMPRESSAO}}', dados.dadosTransformados?.tipoImpressao?.tipo || 'N/A')
      .replace('{{ACABAMENTOS}}', this.formatarAcabamentos(dados.dadosTransformados?.acabamentos))
      .replace('{{INSTALACAO_NECESSARIA}}', dados.dadosTransformados?.instalacaoNecessaria ? 'Sim' : 'Não')
      .replace('{{MATERIAIS_TABELA}}', this.formatarTabelaMateriais(dados.insumos))
      .replace('{{OBSERVACOES}}', dados.os.observacoes || '')
      .replace('{{APROVACAO_TECNICA}}', this.formatarAprovacaoTecnica(dados.os))
      .replace('{{AGENDAMENTO_INSTALACAO}}', this.formatarAgendamentoInstalacao(dados.os))
      .replace('{{QR_CODE}}', dados.qrCodeDataUrl ? `<img src="${dados.qrCodeDataUrl}" alt="QR Code" class="qr-code">` : '')
      .replace('{{LOJA_NOME}}', dados.loja.nome || 'N/A')
      .replace('{{LOJA_ENDERECO}}', this.formatarEnderecoLoja(dados.loja))
      .replace('{{DATA_IMPRESSAO}}', this.formatarData(new Date()))
      .replace('{{RESPONSAVEL_IMPRESSAO}}', 'Sistema'); // Seria o usuário logado
    
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
          light: '#FFFFFF'
        }
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
    
    const dimensoes = produtos.map(p => {
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
    if (!materiais || materiais.length === 0) return 'N/A';
    
    return materiais.map(m => `${m.nome} (${m.quantidade} ${m.unidade})`).join(', ');
  }
  
  private formatarAcabamentos(acabamentos: any[]): string {
    if (!acabamentos || acabamentos.length === 0) return 'N/A';
    
    return acabamentos.map(a => a.nome).join(', ');
  }
  
  private formatarTabelaMateriais(insumos: any[]): string {
    if (!insumos || insumos.length === 0) {
      return '<tr><td colspan="4">Nenhum material listado</td></tr>';
    }
    
    return insumos.map(insumo => `
      <tr>
        <td>${insumo.insumo?.nome || insumo.nome || 'Material'}</td>
        <td>${insumo.quantidade}</td>
        <td>${insumo.unidade || insumo.insumo?.unidade_uso || 'un'}</td>
        <td>${insumo.observacoes || ''}</td>
      </tr>
    `).join('');
  }
  
  private formatarAprovacaoTecnica(os: any): string {
    const status = os.aprovacao_tecnica_status || 'PENDENTE';
    return status.toLowerCase();
  }
  
  private formatarAgendamentoInstalacao(os: any): string {
    if (!os.data_instalacao_agendada) return 'Não agendado';
    
    return this.formatarData(os.data_instalacao_agendada);
  }
}
