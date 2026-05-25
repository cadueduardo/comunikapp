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
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: process.env.BACKEND_URL
                    ? `${process.env.BACKEND_URL}/:path*`
                    : 'http://127.0.0.1:4000/:path*',
            },
        ];
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
