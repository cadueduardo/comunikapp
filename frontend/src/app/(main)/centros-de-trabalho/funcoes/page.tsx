'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FuncoesPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/configuracoes/funcoes');
  }, [router]);

  return null;
}



