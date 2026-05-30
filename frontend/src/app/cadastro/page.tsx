'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BackgroundBeamsWithCollision } from "@/components/ui/background-beams-with-collision";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Eye, EyeOff, Loader2, RefreshCw, XCircle } from "lucide-react";
import { useRouter } from 'next/navigation';
import { lojasApi, platformApi } from "@/lib/api-client";
import { isValidCnpj, isValidCpf, maskDocumentInput } from "@/lib/cpf-cnpj";

const PASSWORD_LENGTH = 18;
const PASSWORD_CHARSETS = [
    "ABCDEFGHJKLMNPQRSTUVWXYZ",
    "abcdefghijkmnopqrstuvwxyz",
    "23456789",
    "!@#$%*+-_=?."
];
const PASSWORD_CHARS = PASSWORD_CHARSETS.join("");

const getRandomIndex = (max: number) => {
    const randomValues = new Uint32Array(1);
    crypto.getRandomValues(randomValues);
    return randomValues[0] % max;
};

const shufflePassword = (chars: string[]) => {
    for (let i = chars.length - 1; i > 0; i -= 1) {
        const j = getRandomIndex(i + 1);
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    return chars.join("");
};

const generateStrongPassword = () => {
    const chars = PASSWORD_CHARSETS.map(charset => charset[getRandomIndex(charset.length)]);

    while (chars.length < PASSWORD_LENGTH) {
        chars.push(PASSWORD_CHARS[getRandomIndex(PASSWORD_CHARS.length)]);
    }

    return shufflePassword(chars);
};

interface CadastroPayload {
    nome_loja: string;
    nome_responsavel: string;
    email: string;
    telefone: string;
    senha: string;
    token_convite: string;
    cnpj?: string;
    cpf?: string;
}


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
        password: "",
        inviteCode: ""
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [inviteLoading, setInviteLoading] = useState(false);
    const [accessGranted, setAccessGranted] = useState(false);
    const [emailLocked, setEmailLocked] = useState(false);
    const [manualInviteToken, setManualInviteToken] = useState("");
    const router = useRouter();

    const validateInviteToken = async (inviteToken: string) => {
        const token = inviteToken.trim();
        if (!token) {
            throw new Error("Informe o token de convite recebido por e-mail.");
        }

        setInviteLoading(true);
        setError(null);
        try {
            const response = await platformApi.validateInvite(token) as {
                email?: string;
                nome?: string;
            };
            setFormData(prev => ({
                ...prev,
                inviteCode: token,
                email: response?.email ? String(response.email) : prev.email,
                name: response?.nome ? String(response.nome) : prev.name,
            }));
            setEmailLocked(!!response?.email);
            setAccessGranted(true);
        } finally {
            setInviteLoading(false);
        }
    };

    useEffect(() => {
        if (tipoPessoa === "fisica") {
            setLabelDocumento("CPF");
            setPlaceholderDocumento("000.000.000-00");
        } else {
            setLabelDocumento("CNPJ");
            setPlaceholderDocumento("00.000.000/0000-00");
        }
    }, [tipoPessoa]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const inviteToken = params.get("convite") || params.get("token") || "";
        if (!inviteToken) {
            return;
        }

        validateInviteToken(inviteToken).catch((err: unknown) => {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Convite inválido ou expirado.");
            }
        });
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        if (id === "documento") {
            const masked = maskDocumentInput(value, tipoPessoa as 'fisica' | 'juridica');
            setFormData(prev => ({ ...prev, documento: masked }));
            return;
        }
        setFormData(prev => ({ ...prev, [id]: value }));
    };
    
    const handleTipoPessoaChange = (value: string) => {
        setTipoPessoa(value);
    };

    const handleGeneratePassword = () => {
        setFormData(prev => ({ ...prev, password: generateStrongPassword() }));
        setShowPassword(true);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        if (!formData.inviteCode.trim()) {
            setError("Informe um convite valido para continuar.");
            setLoading(false);
            return;
        }

        if (tipoPessoa === 'fisica' && !isValidCpf(formData.documento)) {
            setError("Informe um CPF valido.");
            setLoading(false);
            return;
        }

        if (tipoPessoa === 'juridica' && !isValidCnpj(formData.documento)) {
            setError("Informe um CNPJ valido.");
            setLoading(false);
            return;
        }

        const payload: CadastroPayload = {
          nome_loja: formData.storeName,
          nome_responsavel: formData.name,
          email: formData.email,
          telefone: formData.phone,
          senha: formData.password,
          token_convite: formData.inviteCode,
        };

        if (tipoPessoa === 'juridica') {
          payload.cnpj = formData.documento;
        } else {
          payload.cpf = formData.documento;
        }

        try {
            await lojasApi.register(payload as unknown as Record<string, unknown>);
            
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

    if (!accessGranted) {
        return (
            <div className="min-h-screen w-full bg-white">
                <main className="w-full lg:grid lg:grid-cols-2 min-h-screen">
                    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                        <div className="mx-auto grid w-[420px] gap-6">
                            <div className="grid gap-2 text-center">
                                <h1 className="text-3xl font-bold">Cadastro por convite</h1>
                                <p className="text-balance text-muted-foreground">
                                    O Comunikapp esta em beta fechado. Use o link enviado ao seu e-mail ou solicite acesso abaixo.
                                </p>
                            </div>

                            {error && (
                                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative flex items-center">
                                    <XCircle className="w-5 h-5 mr-2"/>
                                    <span>{error}</span>
                                </div>
                            )}

                            <Button asChild className="w-full">
                                <Link href="/beta">Quero conhecer o beta</Link>
                            </Button>

                            <div className="grid gap-2">
                                <Label htmlFor="manualInviteToken">Ja recebi convite por e-mail</Label>
                                <Input
                                    id="manualInviteToken"
                                    value={manualInviteToken}
                                    onChange={(e) => setManualInviteToken(e.target.value)}
                                    placeholder="Cole o token ou abra o link recebido"
                                    disabled={inviteLoading}
                                    autoComplete="off"
                                />
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                disabled={inviteLoading || !manualInviteToken.trim()}
                                onClick={() => {
                                    validateInviteToken(manualInviteToken).catch((err: unknown) => {
                                        if (err instanceof Error) {
                                            setError(err.message);
                                        } else {
                                            setError("Convite invalido ou expirado.");
                                        }
                                    });
                                }}
                            >
                                {inviteLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Validar convite
                            </Button>
                        </div>
                    </div>
                    <div className="hidden bg-muted lg:flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0">
                             <BackgroundBeamsWithCollision />
                        </div>
                    </div>
                </main>
            </div>
        );
    }

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
                                Complete seu cadastro para iniciar o teste de 30 dias. Sem cartao de credito.
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
                                <Input id="email" type="email" value={formData.email} onChange={handleChange} placeholder="seu@email.com" required disabled={loading || emailLocked} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="inviteCode">Convite</Label>
                                <Input id="inviteCode" value={formData.inviteCode} readOnly placeholder="Convite validado" required disabled={loading || inviteLoading} autoComplete="off" className="bg-muted" />
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
                                <div className="flex items-center justify-between gap-3">
                                    <Label htmlFor="password">Senha</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-8 gap-2 px-3 text-xs"
                                        onClick={handleGeneratePassword}
                                        disabled={loading}
                                    >
                                        <RefreshCw className="h-3.5 w-3.5" />
                                        Gerar senha
                                    </Button>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        disabled={loading}
                                        className="pr-11"
                                        autoComplete="new-password"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                                        onClick={() => setShowPassword(prev => !prev)}
                                        disabled={loading}
                                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Use uma senha forte e guarde em um gerenciador de senhas ou outro local seguro. Depois de criada, ela não será exibida novamente.
                                </p>
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {loading ? 'Criando sua conta...' : 'Criar conta grátis'}
                            </Button>
                            <Link href="/beta" className="text-center text-sm text-muted-foreground underline">
                                Ainda nao tem convite? Quero conhecer
                            </Link>
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
