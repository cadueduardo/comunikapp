'use client';

import { Shield, Users } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { CrudPage } from '@/components/crud/CrudPage';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function UsuariosPage() {
  return (
    <CrudPage
      header={
        <PageHeader
          title="Usuários"
          backHref="/dashboard"
          icon={<Users className="h-8 w-8" />}
          subtitle="Escolha o recurso"
        />
      }
      table={
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/usuarios/gestao">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Gestão de Usuários</CardTitle>
                    <CardDescription className="text-sm">Gerencie usuários da sua loja.</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/usuarios/perfis">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Shield className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Gestão de Perfis</CardTitle>
                    <CardDescription className="text-sm">Configure perfis e permissões.</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        </div>
      }
    />
  );
}


