'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Image from "next/image";
import { BackgroundBeamsWithCollision } from "@/components/ui/background-beams-with-collision";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { useRouter } from 'next/navigation';

const GoogleIcon = () => (
    <svg className="w-5 h-5 mr-2" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg"><path d="M533.5 278.4c0-18.5-1.5-37.1-4.7-55.3H272.1v104.8h147c-6.1 33.8-25.7 63.7-54.4 82.7v68h87.7c51.5-47.4 81.1-117.4 81.1-200.2z" fill="#4285f4"/><path d="M272.1 544.3c73.4 0 135.3-24.1 180.4-65.7l-87.7-68c-24.4 16.6-55.9 26-92.6 26-71 0-131.2-47.9-152.8-112.3H28.9v70.1c46.2 91.9 140.3 149.9 243.2 149.9z" fill="#34a853"/><path d="M119.3 324.3c-11.4-33.8-11.4-70.4 0-104.2V150H28.9c-38.6 76.9-38.6 167.5 0 244.4l90.4-70.1z" fill="#fbbc04"/><path d="M272.1 107.7c38.8-.6 76.3 14 104.4 40.8l77.7-77.7C405 24.6 339.7-.8 272.1 0 169.2 0 75.1 58 28.9 150l90.4 70.1c21.5-64.5 81.8-112.4 152.8-112.4z" fill="#ea4335"/></svg>
);


export default function CadastroPage() {
    const [tipoPessoa, setTipoPessoa] = useState("juridica");
    const [labelDocumento, setLabelDocumento] = useState("CNPJ");
    const [placeholderDocumento, setPlaceholderDocumento] = useState("00.000.000/0000-00");
    
    const [formData, setFormData] = useState({
        storeName: "",
        name: "",
        email: "",
        phone: "",
        documento: "",
        password: ""
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (tipoPessoa === "fisica") {
            setLabelDocumento("CPF");
            setPlaceholderDocumento("000.000.000-00");
        } else {
            setLabelDocumento("CNPJ");
            setPlaceholderDocumento("00.000.000/0000-00");
        }
    }, [tipoPessoa]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };
    
    const handleTipoPessoaChange = (value: string) => {
        setTipoPessoa(value);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        const fullData = { ...formData, tipoPessoa: tipoPessoa === 'juridica' ? 'PESSOA_JURIDICA' : 'PESSOA_FISICA' };

        try {
            const response = await fetch('http://localhost:3001/lojas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', },
                body: JSON.stringify(fullData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ocorreu um erro ao criar a conta.');
            }

            // A única alteração é aqui: redirecionar em vez de setar sucesso
            router.push(`/cadastro/verificar?email=${encodeURIComponent(formData.email)}`);
            
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

    if (success) {
        return (
            <div className="min-h-screen w-full bg-white">
                <main className="w-full lg:grid lg:grid-cols-2 min-h-screen">
                    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                        <div className="mx-auto grid w-[400px] gap-6">
                            <div className="grid gap-2 text-center">
                                <h1 className="text-3xl font-bold">Conta criada com sucesso!</h1>
                                <p className="text-balance text-muted-foreground">
                                    Verifique seu email para confirmar sua conta.
                                </p>
                            </div>
                            <div className="grid gap-4">
                                <Button onClick={() => router.push('/login')} className="w-full">
                                    Ir para login
                                </Button>
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

    return (
        <div className="min-h-screen w-full bg-white">
            <main className="w-full lg:grid lg:grid-cols-2 min-h-screen">
                <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto grid w-[400px] gap-6">
                        <div className="grid gap-2 text-center">
                            <h1 className="text-3xl font-bold">Crie sua conta</h1>
                            <p className="text-balance text-muted-foreground">
                                Comece seu teste de 30 dias. Sem cartão de crédito.
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
                                <Label htmlFor="storeName">Nome da Loja</Label>
                                <Input id="storeName" value={formData.storeName} onChange={handleChange} placeholder="Minha Empresa de Placas" required disabled={loading} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Seu Nome Completo</Label>
                                <Input id="name" value={formData.name} onChange={handleChange} placeholder="Nome Sobrenome" required disabled={loading} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" value={formData.email} onChange={handleChange} placeholder="seu@email.com" required disabled={loading} />
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="phone">Telefone / WhatsApp</Label>
                                <Input id="phone" value={formData.phone} onChange={handleChange} placeholder="(99) 99999-9999" required disabled={loading} />
                            </div>

                            <div className="grid gap-2">
                                <Label>Tipo de Pessoa</Label>
                                <RadioGroup defaultValue={tipoPessoa} onValueChange={handleTipoPessoaChange} className="grid grid-cols-2 gap-4">
                                    <div>
                                        <RadioGroupItem value="juridica" id="juridica" className="peer sr-only" />
                                        <Label htmlFor="juridica" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                            Pessoa Jurídica
                                        </Label>
                                    </div>
                                    <div>
                                        <RadioGroupItem value="fisica" id="fisica" className="peer sr-only" />
                                        <Label htmlFor="fisica" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                            Pessoa Física
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="documento">{labelDocumento}</Label>
                                <Input id="documento" value={formData.documento} onChange={handleChange} placeholder={placeholderDocumento} required disabled={loading} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">Senha</Label>
                                <Input id="password" type="password" value={formData.password} onChange={handleChange} required disabled={loading} />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {loading ? 'Criando sua conta...' : 'Criar conta grátis'}
                            </Button>
                            <Button variant="outline" className="w-full" type="button" disabled={loading}>
                                <GoogleIcon />
                                Entrar com Google
                            </Button>
                        </form>
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