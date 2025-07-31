'use client';

import { useEffect, useState } from 'react';

export default function DebugLogsPage() {
  const [logs, setLogs] = useState<any>(null);
  const [errorLogs, setErrorLogs] = useState<any>(null);

  useEffect(() => {
    // Buscar logs do localStorage
    const savedLogs = localStorage.getItem('debug_orcamento_logs');
    const savedErrorLogs = localStorage.getItem('debug_orcamento_error_logs');
    
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs));
    }
    
    if (savedErrorLogs) {
      setErrorLogs(JSON.parse(savedErrorLogs));
    }
  }, []);

  const clearLogs = () => {
    if (confirm('Tem certeza que deseja limpar todos os logs? Esta ação não pode ser desfeita.')) {
      localStorage.removeItem('debug_orcamento_logs');
      localStorage.removeItem('debug_orcamento_error_logs');
      setLogs(null);
      setErrorLogs(null);
    }
  };

  const exportLogs = () => {
    const allLogs = {
      success: logs,
      error: errorLogs,
      exportTimestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(allLogs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug_logs_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Debug Logs - Orçamentos</h1>
      
      <div className="mb-4 flex gap-2">
        <button 
          onClick={clearLogs}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Limpar Logs
        </button>
        {(logs || errorLogs) && (
          <button 
            onClick={exportLogs}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Exportar Logs
          </button>
        )}
      </div>

             {logs && (
         <div className="mb-8">
           <h2 className="text-xl font-semibold mb-4 text-green-600">✅ Logs de Sucesso</h2>
           <div className="mb-2 text-sm text-gray-600">
             <strong>Ação:</strong> {logs.action} | 
             <strong>Timestamp:</strong> {new Date(logs.timestamp).toLocaleString('pt-BR')} | 
             <strong>Status:</strong> {logs.status} | 
             <strong>Mode:</strong> {logs.mode || 'N/A'}
           </div>
           <div className="bg-gray-100 p-4 rounded">
             <pre className="text-sm overflow-auto">
               {JSON.stringify(logs, null, 2)}
             </pre>
           </div>
         </div>
       )}

             {errorLogs && (
         <div className="mb-8">
           <h2 className="text-xl font-semibold mb-4 text-red-600">❌ Logs de Erro</h2>
           <div className="mb-2 text-sm text-gray-600">
             <strong>Ação:</strong> {errorLogs.action} | 
             <strong>Timestamp:</strong> {new Date(errorLogs.timestamp).toLocaleString('pt-BR')} | 
             <strong>Status:</strong> {errorLogs.status} | 
             <strong>Mode:</strong> {errorLogs.mode || 'N/A'}
           </div>
           <div className="bg-gray-100 p-4 rounded">
             <pre className="text-sm overflow-auto">
               {JSON.stringify(errorLogs, null, 2)}
             </pre>
           </div>
         </div>
       )}

      {!logs && !errorLogs && (
        <div className="text-gray-500">
          Nenhum log encontrado. Crie um orçamento primeiro para gerar logs.
        </div>
      )}
    </div>
  );
} 