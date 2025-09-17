'use client';

import React from 'react';
import { OrcamentoV2Form } from '@/components/ui/orcamentos-v2/orcamento-v2-form';
import { PreviewCalculoV2 } from '@/components/ui/shared/sections';

export default function NovoOrcamentoV2Page() {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        {/* Área do Título - isolada */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => window.history.back()}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="hidden sm:inline">Voltar</span>
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Novo Orçamento V2</h1>
              <p className="text-sm sm:text-base text-gray-600">Crie um novo orçamento para o cliente usando o sistema V2</p>
            </div>
          </div>
        </div>

        {/* Área do Formulário e Preview - mesma altura */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Formulário principal */}
          <div className="flex-1">
            <OrcamentoV2Form mode="novo" hideHeader={true} />
          </div>

          {/* Sidebar com preview de cálculo */}
          <div className="w-full lg:w-80 lg:flex-shrink-0">
            <div className="sticky top-6">
              <PreviewCalculoV2 />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
