"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function ImprimirOSPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [htmlContent, setHtmlContent] = useState<string>("");

  useEffect(() => {
    if (params.id) {
      carregarTemplateImpressao();
    }
  }, [params.id]);

  const carregarTemplateImpressao = async () => {
    try {
      setLoading(true);
      
      // Obter token de autenticação
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado. Faça login novamente.');
      }
      
      // Buscar template de impressão do backend
      const response = await fetch(`/api/os/${params.id}/imprimir`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error || `Erro ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const html = await response.text();
      setHtmlContent(html);
    } catch (error) {
      console.error("Erro ao carregar template:", error);
      toast.error(`Erro ao carregar template de impressão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      router.push(`/os/${params.id}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImprimir = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // TODO: Implementar download de PDF
    toast.info("Funcionalidade de PDF em desenvolvimento");
  };

  const handleVersaoSimples = () => {
    router.push(`/os/${params.id}/imprimir?versao=simples`);
  };

  const handleVersaoCompleta = () => {
    router.push(`/os/${params.id}/imprimir?versao=completa`);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando template de impressão...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com controles */}
      <div className="bg-white border-b p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/os/${params.id}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-semibold">Impressão da OS #{params.id}</h1>
              <p className="text-sm text-gray-600">Template otimizado para impressão</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleVersaoSimples}
            >
              Versão Simples
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleVersaoCompleta}
            >
              Versão Completa
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={carregarTemplateImpressao}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDownloadPDF}
            >
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <Button 
              onClick={handleImprimir}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </div>
      </div>

      {/* Conteúdo do template */}
      <div className="max-w-4xl mx-auto p-6">
        <div 
          className="bg-white shadow-lg"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>

      {/* Instruções de impressão */}
      <div className="bg-blue-50 border-t p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <Printer className="h-5 w-5 text-blue-600 mt-0.5" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-900">Instruções para Impressão</h3>
              <ul className="mt-1 text-sm text-blue-800 space-y-1">
                <li>• Clique em "Imprimir" para abrir o diálogo de impressão</li>
                <li>• Selecione "Mais configurações" e marque "Gráficos de segundo plano"</li>
                <li>• Use papel A4 para melhor resultado</li>
                <li>• A versão simples é ideal para impressão rápida (1 página)</li>
                <li>• A versão completa inclui checklists e apontamentos (2-3 páginas)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
