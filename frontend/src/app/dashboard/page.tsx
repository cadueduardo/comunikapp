'use client';

import { useState, useEffect } from 'react';
import { Skeleton } from "@/components/ui/skeleton"
import { TrialBanner } from "@/components/ui/trial-banner"

function DashboardContent() {
    return (
        <div>
            <TrialBanner />
            <h1 className="text-3xl font-bold">Dashboard Principal</h1>
            <p className="text-muted-foreground mt-2">
                Bem-vindo de volta! Aqui estão suas atualizações.
            </p>
            {/* O conteúdo real do dashboard virá aqui */}
        </div>
    )
}


function DashboardSkeleton() {
    return (
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="space-y-2">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
        </div>

        {/* Big Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        
        {/* Table Skeleton */}
        <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        </div>

      </div>
    );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000); // Simula 2 segundos de carregamento

    return () => clearTimeout(timer);
  }, []);

  return loading ? <DashboardSkeleton /> : <DashboardContent />;
} 