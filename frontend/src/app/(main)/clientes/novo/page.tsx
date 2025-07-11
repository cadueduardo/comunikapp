'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import Link from 'next/link';
import { toast } from 'sonner'; // Adicionado toast

export default function NovoClientePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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

      const response = await fetch('http://localhost:3001/clientes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanData),
      });

      if (response.ok) {
        toast.success('Cliente cadastrado com sucesso!');
        router.push('/clientes');
      } else {
        const error = await response.json();
        toast.error(`Erro ao cadastrar cliente: ${error.message || 'Erro desconhecido'}`);
      }
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
            <CardTitle>Endereço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  value={formData.cep}
                  onChange={(e) => handleChange('cep', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => handleChange('endereco', e.target.value)}
                  className="md:col-span-2"
                />
              </div>
              <div>
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  value={formData.numero}
                  onChange={(e) => handleChange('numero', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div>
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  value={formData.complemento}
                  onChange={(e) => handleChange('complemento', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  value={formData.bairro}
                  onChange={(e) => handleChange('bairro', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={formData.cidade}
                  onChange={(e) => handleChange('cidade', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  value={formData.estado}
                  onChange={(e) => handleChange('estado', e.target.value)}
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