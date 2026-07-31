import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
    poweredByHeader: false,
    outputFileTracingRoot: __dirname,
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    env: {
        // Fallback alinhado com o backend em dev (backend/src/main.ts default = 4000).
        // Em producao, BACKEND_URL e sempre definido via frontend/.env.production
        // (apontando para 127.0.0.1:4001 ou para o dominio publico).
        BACKEND_URL: process.env.BACKEND_URL || 'http://127.0.0.1:4000',
    },
    async headers() {
        // Gate 0S / HS-04: a página pública da proposta recebe o código de
        // aprovação por formulário. Estes cabeçalhos são defesa adicional para
        // que o segredo não escape por canais laterais do navegador.
        //
        // O Nginx de produção já envia `Referrer-Policy: no-referrer` no bloco
        // do app; repetir aqui garante o mesmo comportamento em dev e em
        // qualquer topologia sem aquele proxy na frente.
        return [
            {
                source: '/orcamento-v2/:id',
                headers: [
                    { key: 'Referrer-Policy', value: 'no-referrer' },
                    // Sem isto, o histórico do navegador e caches
                    // intermediários guardariam a página preenchida.
                    {
                        key: 'Cache-Control',
                        value: 'no-store, no-cache, must-revalidate',
                    },
                    // A página é endereçável por qualquer um que tenha o id do
                    // orçamento; não pode entrar em índice de busca.
                    {
                        key: 'X-Robots-Tag',
                        value: 'noindex, nofollow, noarchive, nosnippet',
                    },
                ],
            },
        ];
    },
    async rewrites() {
        // fallback: só proxyia /api/* se não houver Route Handler do Next
        // (ex.: /api/auth/login, /api/auth/me ficam no BFF HttpOnly).
        const backend =
            process.env.BACKEND_URL || 'http://127.0.0.1:4000';
        return {
            fallback: [
                {
                    source: '/api/:path*',
                    destination: `${backend}/:path*`,
                },
            ],
        };
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'placehold.co',
                port: '',
                pathname: '/**',
            },
            // Em dev o backend serve uploads na porta 4000.
            {
                protocol: 'http',
                hostname: '127.0.0.1',
                port: '4000',
                pathname: '/uploads/**',
            },
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '4000',
                pathname: '/uploads/**',
            },
            // Mantemos 4001 tambem para nao quebrar producao local (PM2/Nginx)
            // que segue a convencao do .env.production.example.
            {
                protocol: 'http',
                hostname: '127.0.0.1',
                port: '4001',
                pathname: '/uploads/**',
            },
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '4001',
                pathname: '/uploads/**',
            },
        ],
    },
};

export default nextConfig; 
