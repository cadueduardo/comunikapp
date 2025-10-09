'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { CampoValidacaoAutocomplete } from '@/components/configuracoes/CampoValidacaoAutocomplete';
import { 
  ArrowLeft, 
  Save, 
  TestTube, 
  Plus,
  Trash2,
  Shield,
  AlertTriangle,
  CheckCircle,
  Settings
} from 'lucide-react';
import Link from 'next/link';

interface CondicaoRegra {
  campo: string;
  operador: string;
  valor: any;
  mensagem_erro?: string;
  mensagem_alerta?: string;
  expressao?: string;
}

interface AcaoRegra {
  tipo: string;
  status_os?: string;
  notificar?: string[];
  parametros?: Record<string, any>;
  delay?: number;
}

export default function NovaRegraPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    tipo: 'VALIDACAO',
    categoria: 'ESTOQUE',
    ativo: true,
    prioridade: 1,
    loja_id: '',
    condicoes: {
      campo: '',
      operador: 'equals',
      valor: '',
      mensagem_erro: '',
      mensagem_alerta: '',
      expressao: ''
    } as CondicaoRegra,
    acoes: {
      tipo: 'bloquear',
      status_os: '',
      notificar: [],
      parametros: {},
      delay: 0
    } as AcaoRegra
  });

  const categorias = [
    { id: 'ESTOQUE', nome: 'Estoque', cor: 'bg-red-100 text-red-800', icone: '📦' },
    { id: 'ARTE', nome: 'Arte', cor: 'bg-purple-100 text-purple-800', icone: '🎨' },
    { id: 'DADOS', nome: 'Dados', cor: 'bg-blue-100 text-blue-800', icone: '📊' },
    { id: 'PRAZO', nome: 'Prazo', cor: 'bg-yellow-100 text-yellow-800', icone: '⏰' },
    { id: 'TECNICO', nome: 'Técnico', cor: 'bg-indigo-100 text-indigo-800', icone: '⚙️' },
    { id: 'COMERCIAL', nome: 'Comercial', cor: 'bg-pink-100 text-pink-800', icone: '💼' },
    { id: 'FINANCEIRO', nome: 'Financeiro', cor: 'bg-green-100 text-green-800', icone: '💰' }
  ];

  const tipos = [
    { id: 'VALIDACAO', nome: 'Validação', cor: 'bg-blue-100 text-blue-800', icone: Shield },
    { id: 'ALERTA', nome: 'Alerta', cor: 'bg-yellow-100 text-yellow-800', icone: AlertTriangle },
    { id: 'CORRECAO', nome: 'Correção', cor: 'bg-orange-100 text-orange-800', icone: CheckCircle },
    { id: 'APROVACAO', nome: 'Aprovação', cor: 'bg-green-100 text-green-800', icone: CheckCircle }
  ];

  const operadores = [
    { id: 'equals', nome: 'Igual a' },
    { id: 'greater_than', nome: 'Maior que' },
    { id: 'greater_than_or_equal', nome: 'Maior ou igual a' },
    { id: 'less_than', nome: 'Menor que' },
    { id: 'less_than_or_equal', nome: 'Menor ou igual a' },
    { id: 'contains', nome: 'Contém' },
    { id: 'not_equals', nome: 'Diferente de' },
    { id: 'in', nome: 'Está em' },
    { id: 'not_in', nome: 'Não está em' },
    { id: 'is_null', nome: 'É nulo' },
    { id: 'is_not_null', nome: 'Não é nulo' }
  ];

  const acoes = [
    { id: 'bloquear', nome: 'Bloquear', descricao: 'Impede a aprovação da OS' },
    { id: 'notificar', nome: 'Notificar', descricao: 'Envia notificação para usuários' },
    { id: 'aprovar', nome: 'Aprovar', descricao: 'Aprova automaticamente a OS' },
    { id: 'corrigir', nome: 'Corrigir', descricao: 'Aplica correções automáticas' },
    { id: 'alertar', nome: 'Alertar', descricao: 'Exibe alerta sem bloquear' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/configuracoes/regras-validacao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/configuracoes/validacoes-automaticas/regras');
      } else {
        console.error('Erro ao criar regra');
      }
    } catch (error) {
      console.error('Erro ao criar regra:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestar = () => {
    // Implementar teste da regra
    console.log('Testando regra:', formData);
  };

  const categoriaSelecionada = categorias.find(c => c.id === formData.categoria);
  const tipoSelecionado = tipos.find(t => t.id === formData.tipo);
  const TipoIcone = tipoSelecionado?.icone || Shield;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/configuracoes/validacoes-automaticas/regras">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nova Regra de Validação</h1>
          <p className="text-gray-600">Configure uma nova regra de validação automática</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Informações Básicas</span>
              </CardTitle>
              <CardDescription>
                Configure as informações básicas da regra
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome da Regra *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Validação de Estoque Mínimo"
                  required
                />
              </div>

              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descreva o que esta regra faz..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="categoria">Categoria *</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((categoria) => (
                        <SelectItem key={categoria.id} value={categoria.id}>
                          <div className="flex items-center space-x-2">
                            <span>{categoria.icone}</span>
                            <span>{categoria.nome}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {tipos.map((tipo) => (
                        <SelectItem key={tipo.id} value={tipo.id}>
                          <div className="flex items-center space-x-2">
                            <tipo.icone className="h-4 w-4" />
                            <span>{tipo.nome}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="prioridade">Prioridade</Label>
                  <Input
                    id="prioridade"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.prioridade}
                    onChange={(e) => setFormData({ ...formData, prioridade: parseInt(e.target.value) || 1 })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="ativo"
                    checked={formData.ativo}
                    onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                  />
                  <Label htmlFor="ativo">Regra ativa</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Condições */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Condições</span>
              </CardTitle>
              <CardDescription>
                Defina quando a regra deve ser executada
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="campo">Campo a Validar *</Label>
                <CampoValidacaoAutocomplete
                  value={formData.condicoes.campo}
                  onChange={(value) => setFormData({
                    ...formData,
                    condicoes: { ...formData.condicoes, campo: value }
                  })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Selecione o campo que deseja validar. Os campos são organizados por módulo.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="operador">Operador *</Label>
                  <Select
                    value={formData.condicoes.operador}
                    onValueChange={(value) => setFormData({
                      ...formData,
                      condicoes: { ...formData.condicoes, operador: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o operador" />
                    </SelectTrigger>
                    <SelectContent>
                      {operadores.map((op) => (
                        <SelectItem key={op.id} value={op.id}>
                          {op.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="valor">Valor *</Label>
                  <Input
                    id="valor"
                    value={formData.condicoes.valor}
                    onChange={(e) => setFormData({
                      ...formData,
                      condicoes: { ...formData.condicoes, valor: e.target.value }
                    })}
                    placeholder="Ex: 10, 'aprovado', [1,2,3]"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="expressao">Expressão (Opcional)</Label>
                <Input
                  id="expressao"
                  value={formData.condicoes.expressao}
                  onChange={(e) => setFormData({
                    ...formData,
                    condicoes: { ...formData.condicoes, expressao: e.target.value }
                  })}
                  placeholder="Ex: quantidade * 1.5"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use para cálculos complexos (ex: quantidade * 1.5)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mensagem_erro">Mensagem de Erro</Label>
                  <Input
                    id="mensagem_erro"
                    value={formData.condicoes.mensagem_erro}
                    onChange={(e) => setFormData({
                      ...formData,
                      condicoes: { ...formData.condicoes, mensagem_erro: e.target.value }
                    })}
                    placeholder="Ex: Estoque insuficiente"
                  />
                </div>

                <div>
                  <Label htmlFor="mensagem_alerta">Mensagem de Alerta</Label>
                  <Input
                    id="mensagem_alerta"
                    value={formData.condicoes.mensagem_alerta}
                    onChange={(e) => setFormData({
                      ...formData,
                      condicoes: { ...formData.condicoes, mensagem_alerta: e.target.value }
                    })}
                    placeholder="Ex: Arte pendente de aprovação"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>Ações</span>
            </CardTitle>
            <CardDescription>
              Defina o que acontece quando a regra é executada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="acao_tipo">Tipo de Ação *</Label>
              <Select
                value={formData.acoes.tipo}
                onValueChange={(value) => setFormData({
                  ...formData,
                  acoes: { ...formData.acoes, tipo: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a ação" />
                </SelectTrigger>
                <SelectContent>
                  {acoes.map((acao) => (
                    <SelectItem key={acao.id} value={acao.id}>
                      <div>
                        <div className="font-medium">{acao.nome}</div>
                        <div className="text-xs text-gray-500">{acao.descricao}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.acoes.tipo === 'bloquear' && (
              <div>
                <Label htmlFor="status_os">Status da OS</Label>
                <Input
                  id="status_os"
                  value={formData.acoes.status_os}
                  onChange={(e) => setFormData({
                    ...formData,
                    acoes: { ...formData.acoes, status_os: e.target.value }
                  })}
                  placeholder="Ex: BLOQUEADA"
                />
              </div>
            )}

            {formData.acoes.tipo === 'notificar' && (
              <div>
                <Label htmlFor="notificar">Notificar Perfis</Label>
                <Input
                  id="notificar"
                  value={formData.acoes.notificar?.join(', ') || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    acoes: { 
                      ...formData.acoes, 
                      notificar: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    }
                  })}
                  placeholder="Ex: admin, gerente, supervisor"
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id="delay"
                checked={formData.acoes.delay > 0}
                onCheckedChange={(checked) => setFormData({
                  ...formData,
                  acoes: { ...formData.acoes, delay: checked ? 60 : 0 }
                })}
              />
              <Label htmlFor="delay">Delay de Execução</Label>
            </div>

            {formData.acoes.delay > 0 && (
              <div>
                <Label htmlFor="delay_value">Delay (segundos)</Label>
                <Input
                  id="delay_value"
                  type="number"
                  min="0"
                  value={formData.acoes.delay}
                  onChange={(e) => setFormData({
                    ...formData,
                    acoes: { ...formData.acoes, delay: parseInt(e.target.value) || 0 }
                  })}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview da Regra */}
        <Card>
          <CardHeader>
            <CardTitle>Preview da Regra</CardTitle>
            <CardDescription>
              Visualize como a regra será configurada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Badge className={categoriaSelecionada?.cor}>
                  <span className="mr-1">{categoriaSelecionada?.icone}</span>
                  {categoriaSelecionada?.nome}
                </Badge>
                <Badge className={tipoSelecionado?.cor}>
                  <TipoIcone className="h-3 w-3 mr-1" />
                  {tipoSelecionado?.nome}
                </Badge>
                <Badge variant={formData.ativo ? 'default' : 'secondary'}>
                  {formData.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Condição:</h4>
                <p className="text-sm">
                  Se <code className="bg-gray-200 px-1 rounded">{formData.condicoes.campo}</code>{' '}
                  {operadores.find(op => op.id === formData.condicoes.operador)?.nome.toLowerCase()}{' '}
                  <code className="bg-gray-200 px-1 rounded">{formData.condicoes.valor}</code>
                </p>
                
                <h4 className="font-medium mb-2 mt-4">Ação:</h4>
                <p className="text-sm">
                  {acoes.find(a => a.id === formData.acoes.tipo)?.nome}
                  {formData.acoes.status_os && ` → Status: ${formData.acoes.status_os}`}
                  {formData.acoes.delay > 0 && ` (Delay: ${formData.acoes.delay}s)`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ações do Formulário */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleTestar}
            disabled={loading}
          >
            <TestTube className="h-4 w-4 mr-2" />
            Testar Regra
          </Button>

          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              asChild
            >
              <Link href="/configuracoes/validacoes-automaticas/regras">
                Cancelar
              </Link>
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : 'Salvar Regra'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
