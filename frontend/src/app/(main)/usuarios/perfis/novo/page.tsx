'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { CrudPage } from '@/components/crud/CrudPage';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import Link from 'next/link';

export default function NovoPerfilPage() {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');

  const modulos = ['orcamentos', 'produtos', 'estoque', 'compras', 'pcp'];
  const acoes = ['visualizar', 'criar', 'editar', 'excluir', 'aprovar'];

  return (
    <CrudPage
      header={
        <PageHeader
          title="Novo Perfil de Acesso"
          backHref="/usuarios/perfis"
          icon={<Shield className="h-8 w-8" />}
          subtitle="Crie um novo perfil com permissões específicas"
          actions={
            <Link href="/usuarios/perfis">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
              </Button>
            </Link>
          }
        />
      }
      table={
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Perfil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome do Perfil</label>
                <Input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Gerente de Produção"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descreva as responsabilidades deste perfil"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Permissões por Módulo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {modulos.map((modulo) => (
                  <div key={modulo} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3 capitalize">{modulo}</h4>
                    <div className="grid grid-cols-5 gap-2">
                      {acoes.map((acao) => (
                        <div key={acao} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`${modulo}-${acao}`}
                            className="rounded"
                          />
                          <label htmlFor={`${modulo}-${acao}`} className="text-sm capitalize">
                            {acao}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2">
            <Link href="/usuarios/perfis">
              <Button variant="outline">Cancelar</Button>
            </Link>
            <Button>Salvar Perfil</Button>
          </div>
        </div>
      }
    />
  );
}




