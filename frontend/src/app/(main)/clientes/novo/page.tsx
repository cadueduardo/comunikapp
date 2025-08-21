'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Loader2, MapPin } from "lucide-react";
import Link from 'next/link';
import { toast } from 'sonner';
import { clientesApi } from '@/lib/api-client';

export default function NovoClientePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [enderecoPreenchido, setEnderecoPreenchido] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    tipo_pessoa: 'PESSOA_FISICA',
    documento: '',
    email: '',
    telefone: '',
    whatsapp: '',
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    razao_social: '',
    nome_fantasia: '',
    inscricao_estadual: '',
    responsavel: '',
    cargo_responsavel: '',
    observacoes: '',
    status_cliente: 'ATIVO',
    origem: '',
    segmento: '',
  });

  // Formatar CEP
  const formatarCep = (cep: string) => {
    const apenasNumeros = cep.replace(/\D/g, '');
    if (apenasNumeros.length <= 5) {
      return apenasNumeros;
    }
    return apenasNumeros.slice(0, 5) + '-' + apenasNumeros.slice(5, 8);
  };

  // Buscar endereço por CEP
  const buscarCep = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '');
    
    if (cepLimpo.length !== 8) {
      toast.error('CEP deve ter 8 dígitos');
      return;
    }

    setBuscandoCep(true);
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        toast.error('CEP não encontrado');
        return;
      }

      // Preencher os campos automaticamente
      setFormData(prev => ({
        ...prev,
        endereco: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        estado: data.uf || '',
      }));

      setEnderecoPreenchido(true);
      toast.success('📍 Endereço encontrado! Agora preencha o número e complemento.');
      
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast.error('Erro ao buscar CEP. Tente novamente.');
    } finally {
      setBuscandoCep(false);
    }
  };

  // Detectar quando CEP está completo e buscar automaticamente
  const handleCepChange = (cep: string) => {
    const cepFormatado = formatarCep(cep);
    handleChange('cep', cepFormatado);
    
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      buscarCep(cepLimpo);
    } else {
      // Reset se CEP incompleto
      if (enderecoPreenchido) {
        setEnderecoPreenchido(false);
        setFormData(prev => ({
          ...prev,
          endereco: '',
          bairro: '',
          cidade: '',
          estado: '',
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }

      // Remove campos vazios para evitar problemas de validação
      const cleanData = Object.fromEntries(
        Object.entries(formData).filter(([, v]) => v !== '')
      );

      await clientesApi.create(cleanData, token);
      toast.success('Cliente cadastrado com sucesso!');
      router.push('/clientes');
    } catch (error) {
      console.error('Erro ao cadastrar cliente:', error);
      toast.error('Erro ao cadastrar cliente. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/clientes">
          <Button variant="outline" size="sm" className="cursor-pointer hover:bg-gray-100 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Novo Cliente</h1>
          <p className="text-gray-600">Cadastre um novo cliente na sua base</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados Básicos */}
        <Card>
          <CardHeader>
            <CardTitle>Dados Básicos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome / Razão Social *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => handleChange('nome', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="tipo_pessoa">Tipo de Pessoa *</Label>
                <Select value={formData.tipo_pessoa} onValueChange={(value) => handleChange('tipo_pessoa', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PESSOA_FISICA">Pessoa Física</SelectItem>
                    <SelectItem value="PESSOA_JURIDICA">Pessoa Jurídica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="documento">
                  {formData.tipo_pessoa === 'PESSOA_FISICA' ? 'CPF' : 'CNPJ'} *
                </Label>
                <Input
                  id="documento"
                  value={formData.documento}
                  onChange={(e) => handleChange('documento', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="status_cliente">Status</Label>
                <Select value={formData.status_cliente} onValueChange={(value) => handleChange('status_cliente', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ATIVO">Ativo</SelectItem>
                    <SelectItem value="PROSPECT">Prospect</SelectItem>
                    <SelectItem value="INATIVO">Inativo</SelectItem>
                    <SelectItem value="BLOQUEADO">Bloqueado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.tipo_pessoa === 'PESSOA_JURIDICA' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
                  <Input
                    id="nome_fantasia"
                    value={formData.nome_fantasia}
                    onChange={(e) => handleChange('nome_fantasia', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="inscricao_estadual">Inscrição Estadual</Label>
                  <Input
                    id="inscricao_estadual"
                    value={formData.inscricao_estadual}
                    onChange={(e) => handleChange('inscricao_estadual', e.target.value)}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contato */}
        <Card>
          <CardHeader>
            <CardTitle>Contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => handleChange('telefone', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={formData.whatsapp}
                  onChange={(e) => handleChange('whatsapp', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="responsavel">Responsável</Label>
                <Input
                  id="responsavel"
                  value={formData.responsavel}
                  onChange={(e) => handleChange('responsavel', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="cargo_responsavel">Cargo do Responsável</Label>
                <Input
                  id="cargo_responsavel"
                  value={formData.cargo_responsavel}
                  onChange={(e) => handleChange('cargo_responsavel', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Endereço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* CEP com busca automática */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cep">CEP *</Label>
                <div className="relative">
                  <Input
                    id="cep"
                    placeholder="00000-000"
                    value={formData.cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    maxLength={9}
                    className={`${buscandoCep ? 'pr-10' : ''} ${enderecoPreenchido ? 'border-green-300 bg-green-50' : ''}`}
                  />
                  {buscandoCep && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    </div>
                  )}
                </div>
                {enderecoPreenchido && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Endereço encontrado automaticamente!
                  </p>
                )}
              </div>
            </div>

            {/* Endereço (readonly se preenchido automaticamente) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3">
                <Label htmlFor="endereco">Logradouro</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => handleChange('endereco', e.target.value)}
                  readOnly={enderecoPreenchido}
                  className={enderecoPreenchido ? 'bg-gray-50 text-gray-600' : ''}
                  placeholder={enderecoPreenchido ? '' : 'Rua, Avenida, etc.'}
                />
              </div>
              <div>
                <Label htmlFor="numero">Número *</Label>
                <Input
                  id="numero"
                  value={formData.numero}
                  onChange={(e) => handleChange('numero', e.target.value)}
                  placeholder="123"
                  className={enderecoPreenchido ? 'border-blue-300 focus:border-blue-500' : ''}
                />
              </div>
            </div>

            {/* Complemento e Bairro */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  value={formData.complemento}
                  onChange={(e) => handleChange('complemento', e.target.value)}
                  placeholder="Apto, Sala, etc."
                  className={enderecoPreenchido ? 'border-blue-300 focus:border-blue-500' : ''}
                />
              </div>
              <div>
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  value={formData.bairro}
                  onChange={(e) => handleChange('bairro', e.target.value)}
                  readOnly={enderecoPreenchido}
                  className={enderecoPreenchido ? 'bg-gray-50 text-gray-600' : ''}
                  placeholder={enderecoPreenchido ? '' : 'Nome do bairro'}
                />
              </div>
            </div>

            {/* Cidade e Estado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={formData.cidade}
                  onChange={(e) => handleChange('cidade', e.target.value)}
                  readOnly={enderecoPreenchido}
                  className={enderecoPreenchido ? 'bg-gray-50 text-gray-600' : ''}
                  placeholder={enderecoPreenchido ? '' : 'Nome da cidade'}
                />
              </div>
              <div>
                <Label htmlFor="estado">Estado (UF)</Label>
                <Input
                  id="estado"
                  value={formData.estado}
                  onChange={(e) => handleChange('estado', e.target.value)}
                  readOnly={enderecoPreenchido}
                  className={enderecoPreenchido ? 'bg-gray-50 text-gray-600' : ''}
                  placeholder={enderecoPreenchido ? '' : 'Ex: SP'}
                  maxLength={2}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CRM */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Adicionais (CRM)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="origem">Origem do Cliente</Label>
                <Input
                  id="origem"
                  placeholder="Ex: Indicação, Google, Instagram"
                  value={formData.origem}
                  onChange={(e) => handleChange('origem', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="segmento">Segmento de Atuação</Label>
                <Input
                  id="segmento"
                  placeholder="Ex: Varejo, Indústria, Serviços"
                  value={formData.segmento}
                  onChange={(e) => handleChange('segmento', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleChange('observacoes', e.target.value)}
                placeholder="Adicione informações relevantes sobre o cliente..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Botão de Salvar */}
        <div className="flex justify-end">
          <Button type="submit" disabled={loading} className="cursor-pointer hover:bg-primary/90 transition-colors">
            {loading ? 'Salvando...' : <><Save className="h-4 w-4 mr-2" /> Salvar Cliente</>}
          </Button>
        </div>
      </form>
    </div>
  );
} 