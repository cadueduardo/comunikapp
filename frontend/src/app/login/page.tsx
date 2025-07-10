'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { BackgroundBeamsWithCollision } from '@/components/ui/background-beams-with-collision';

const GoogleIcon = () => (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
);

export default function LoginPage() {
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('http://localhost:3001/lojas/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao fazer login.');
            }

            const { user } = await response.json();
            
            // Armazena dados do usuário (temporário - em produção seria JWT)
            localStorage.setItem('user', JSON.stringify(user));
            
            // Redireciona para o dashboard
            router.push('/dashboard');
            
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Ocorreu um erro desconhecido.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-white">
            <main className="w-full lg:grid lg:grid-cols-2 min-h-screen">
                <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto grid w-[400px] gap-6">
                        <div className="grid gap-2 text-center">
                            <h1 className="text-3xl font-bold">Faça seu login</h1>
                            <p className="text-balance text-muted-foreground">
                                Entre em sua conta para continuar
                            </p>
                        </div>
                        <form onSubmit={handleSubmit} className="grid gap-4">
                            {error && (
                                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative flex items-center">
                                    <XCircle className="w-5 h-5 mr-2"/>
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input 
                                    id="email" 
                                    type="email" 
                                    value={formData.email} 
                                    onChange={handleChange} 
                                    placeholder="seu@email.com" 
                                    required 
                                    disabled={loading} 
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">Senha</Label>
                                <Input 
                                    id="password" 
                                    type="password" 
                                    value={formData.password} 
                                    onChange={handleChange} 
                                    required 
                                    disabled={loading} 
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {loading ? 'Entrando...' : 'Entrar'}
                            </Button>
                            
                            <Button variant="outline" className="w-full" type="button" disabled={loading}>
                                <GoogleIcon />
                                Entrar com Google
                            </Button>
                        </form>
                        
                        <div className="text-center text-sm">
                            Não tem uma conta?{' '}
                            <Link href="/cadastro" className="underline">
                                Cadastre-se grátis
                            </Link>
                        </div>
                    </div>
                </div>
                <div className="hidden bg-muted lg:flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0">
                         <BackgroundBeamsWithCollision />
                    </div>
                    <div className="relative z-10 flex flex-col items-center text-center p-8">
                         <div className="bg-white/90 backdrop-blur-sm p-8 rounded-xl shadow-2xl max-w-md">
                            <p className="text-xl font-medium text-gray-800">
                                "O Comunikapp transformou a maneira como fazemos orçamentos. De horas para minutos. Simplesmente indispensável para nossa operação diária."
                            </p>
                            <div className="mt-6">
                                <p className="font-semibold text-gray-900">Ana Clara</p>
                                <p className="text-sm text-gray-600">Sócia-fundadora, Placas & Cia</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
} 