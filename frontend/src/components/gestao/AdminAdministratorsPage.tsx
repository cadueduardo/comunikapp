'use client';

import { Users } from 'lucide-react';
import { useState } from 'react';
import { AdminInvitationsManager } from '@/components/gestao/AdminInvitationsManager';
import { AdminUsersManager } from '@/components/gestao/AdminUsersManager';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function AdminAdministratorsPage() {
  const [tab, setTab] = useState('ativos');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administradores"
        subtitle="Gerencie a equipe interna ativa e os convites pendentes."
        icon={<Users className="h-7 w-7" />}
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="ativos">Ativos</TabsTrigger>
          <TabsTrigger value="convites">Convites</TabsTrigger>
        </TabsList>
        <TabsContent value="ativos" className="mt-6">
          <AdminUsersManager />
        </TabsContent>
        <TabsContent value="convites" className="mt-6">
          <AdminInvitationsManager embedded />
        </TabsContent>
      </Tabs>
    </div>
  );
}
