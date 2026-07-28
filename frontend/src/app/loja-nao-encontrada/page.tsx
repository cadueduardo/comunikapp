import Link from 'next/link';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { Button } from '@/components/ui/button';

export default function LojaNaoEncontradaPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <BrandLogo variant="horizontal" heightPx={40} />
      <div className="max-w-md space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Loja não encontrada
        </h1>
        <p className="text-sm text-muted-foreground">
          Este endereço não corresponde a nenhuma loja ativa no ComunikApp.
          Confira o link ou acesse a página principal.
        </p>
      </div>
      <Button asChild>
        <Link href="https://comunikapp.com.br/login">Ir para o login</Link>
      </Button>
    </main>
  );
}
