'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MaquinasPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/configuracoes/maquinas');
  }, [router]);

  return null;
}



