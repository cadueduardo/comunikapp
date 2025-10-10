'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
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
  onPrazoChange
}: ResumoOSSidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(isCollapsed);
  
  const collapsed = onCollapsedChange !== undefined ? isCollapsed : internalCollapsed;
  const setCollapsed = onCollapsedChange || setInternalCollapsed;

  return (
    <div className="w-full lg:w-[25%] lg:pr-6 mb-6 lg:mb-0">
      <div className="space-y-6">
        <div>
          {/* Título com botão de colapso - Mobile only */}
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
          
          {/* Conteúdo colapsável */}
          <div className={`space-y-3 transition-all duration-300 ${
            collapsed ? 'lg:block hidden' : 'block'
          }`}>
            <div>
              <span className="text-sm text-gray-600">Cliente:</span>
              <p className="font-medium text-gray-900">{clienteNome}</p>
            </div>
            
            <div>
              <span className="text-sm text-gray-600">Projeto:</span>
              <p className="font-medium text-gray-900">{projeto}</p>
            </div>
            
            {/* Componente de Prazo */}
            <PrazoOSComponent 
              osId={osId} 
              dataPrazo={dataPrazo}
              onPrazoChange={onPrazoChange}
            />
            
            <div>
              <span className="text-sm text-gray-600">Prioridade:</span>
              <p className="font-medium text-gray-900">{prioridade}</p>
            </div>
            
            <div>
              <span className="text-sm text-gray-600">Status:</span>
              <p className="text-sm text-gray-700 mt-1">{status}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

