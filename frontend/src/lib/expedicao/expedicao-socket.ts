const resolveSocketBaseUrl = () => {
  const configuredUrl = (
    process.env.NEXT_PUBLIC_WS_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    ''
  ).replace(/\/$/, '');

  if (!configuredUrl || configuredUrl === '/api') {
    if (process.env.NODE_ENV !== 'production') {
      return 'http://localhost:4000';
    }
    return '';
  }

  if (configuredUrl.endsWith('/api')) {
    return configuredUrl.slice(0, -4);
  }

  return configuredUrl;
};

export const EXPEDICAO_SOCKET_URL = resolveSocketBaseUrl();

export const EXPEDICAO_WS_EVENTOS = {
  ATUALIZADA: 'expedicao_atualizada',
  DEVOLVIDA: 'expedicao_devolvida',
} as const;
