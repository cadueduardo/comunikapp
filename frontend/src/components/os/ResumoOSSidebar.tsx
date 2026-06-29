'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PrazoOSComponent } from './PrazoOSComponent';

interface ResumoOSSidebarProps {
  osId: string;
  clienteNome: string;
  projeto: string;
  dataPrazo?: Date;
  prioridade?: string;
  status?: string;
  isCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  onPrazoChange?: (novaData: Date) => void;
  variant?: 'default' | 'arte-workspace';
}

function CampoResumo({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="text-sm font-medium leading-relaxed text-foreground break-words">
        {children}
      </div>
    </div>
  );
}

export function ResumoOSSidebar({
  osId,
  clienteNome,
  projeto,
  dataPrazo,
  prioridade = 'Normal',
  status = 'Em análise de materiais e aguardando aprovação final.',
  isCollapsed = false,
  onCollapsedChange,
  onPrazoChange,
  variant = 'default',
}: ResumoOSSidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(isCollapsed);

  const collapsed = onCollapsedChange !== undefined ? isCollapsed : internalCollapsed;
  const setCollapsed = onCollapsedChange || setInternalCollapsed;

  const conteudo = (
    <div
      className={`space-y-5 transition-all duration-300 ${
        collapsed ? 'lg:block hidden' : 'block'
      }`}
    >
      <CampoResumo label="Cliente">{clienteNome}</CampoResumo>
      <CampoResumo label="Projeto">{projeto}</CampoResumo>
      <div className="space-y-1">
        <PrazoOSComponent
          osId={osId}
          dataPrazo={dataPrazo}
          onPrazoChange={onPrazoChange}
        />
      </div>
      <CampoResumo label="Prioridade">{prioridade}</CampoResumo>
      <CampoResumo label="Status">{status}</CampoResumo>
    </div>
  );

  if (variant === 'arte-workspace') {
    return (
      <Card className="h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Resumo da OS</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">{conteudo}</CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full lg:w-[25%] lg:pr-6 mb-6 lg:mb-0">
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Resumo da OS</h3>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="lg:hidden p-1 hover:bg-gray-100 rounded"
            >
              <ChevronDown
                className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                  collapsed ? 'rotate-[-90deg]' : ''
                }`}
              />
            </button>
          </div>
          {conteudo}
        </div>
      </div>
    </div>
  );
}
