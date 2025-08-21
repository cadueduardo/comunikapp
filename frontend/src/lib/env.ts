// Configuração de ambiente para o frontend
export const ENV_CONFIG = {
  // URL da API - pode ser configurada por variável de ambiente
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  
  // Nome da aplicação
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Comunikapp',
  
  // Versão da aplicação
  APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  
  // Ambiente
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Debug mode
  DEBUG: process.env.NODE_ENV === 'development',
  
  // Timeout para requisições (em ms)
  REQUEST_TIMEOUT: parseInt(process.env.NEXT_PUBLIC_REQUEST_TIMEOUT || '10000'),
  
  // Retry attempts para requisições falhadas
  MAX_RETRIES: parseInt(process.env.NEXT_PUBLIC_MAX_RETRIES || '3'),
  
  // Delay entre tentativas (em ms)
  RETRY_DELAY: parseInt(process.env.NEXT_PUBLIC_RETRY_DELAY || '1000'),
};

// Função helper para obter configuração
export const getEnvConfig = (key: keyof typeof ENV_CONFIG) => {
  return ENV_CONFIG[key];
};





