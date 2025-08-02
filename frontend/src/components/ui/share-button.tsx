'use client';

import { useState } from 'react';
import { Share2, Copy, Smartphone, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ShareButtonProps {
  url: string;
  title: string;
  text: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

export function ShareButton({ 
  url, 
  title, 
  text, 
  variant = 'default', 
  size = 'default',
  className,
  children 
}: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);

    try {
      const shareData = { title, text, url };
      
      // Detecção melhorada de dispositivos que suportam compartilhamento nativo
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isPWA = window.matchMedia('(display-mode: standalone)').matches;
      const isSmallScreen = window.screen.width <= 768;
      
      const shouldUseNativeShare = navigator.share && (isMobileDevice || isTouchDevice || isPWA || isSmallScreen);
      
      if (shouldUseNativeShare) {
        await navigator.share(shareData);
        toast.success('📱 Compartilhado com sucesso!');
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('📋 Link copiado para a área de transferência');
      }
    } catch (error: any) {
      console.error('Erro ao compartilhar:', error);
      
      if (error.name === 'AbortError') {
        toast.info('Compartilhamento cancelado');
        return;
      }
      
      // Fallback para clipboard
      try {
        await navigator.clipboard.writeText(url);
        toast.success('📋 Link copiado (fallback)');
      } catch (clipboardError) {
        toast.error('❌ Erro ao compartilhar');
      }
    } finally {
      setIsSharing(false);
    }
  };

  // Detectar que tipo de compartilhamento será usado para mostrar ícone apropriado
  const isMobileDevice = typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  const isPWA = typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches;
  const isSmallScreen = typeof window !== 'undefined' && window.screen.width <= 768;
  const willUseNativeShare = typeof window !== 'undefined' && navigator.share && (isMobileDevice || isTouchDevice || isPWA || isSmallScreen);

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleShare}
      disabled={isSharing}
      className={className}
    >
      {isSharing ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
      ) : children ? (
        children
      ) : (
        <>
          {willUseNativeShare ? (
            <Smartphone className="h-4 w-4 mr-2" />
          ) : (
            <Copy className="h-4 w-4 mr-2" />
          )}
          {willUseNativeShare ? 'Compartilhar' : 'Copiar Link'}
        </>
      )}
    </Button>
  );
}

// Hook para detectar capacidades de compartilhamento
export function useShareCapabilities() {
  if (typeof window === 'undefined') {
    return {
      canShare: false,
      canCopy: false,
      preferredMethod: 'none' as const
    };
  }

  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isPWA = window.matchMedia('(display-mode: standalone)').matches;
  const isSmallScreen = window.screen.width <= 768;
  
  const canShare = !!navigator.share;
  const canCopy = !!navigator.clipboard?.writeText;
  const shouldUseNativeShare = canShare && (isMobileDevice || isTouchDevice || isPWA || isSmallScreen);

  return {
    canShare,
    canCopy,
    preferredMethod: shouldUseNativeShare ? 'native' : canCopy ? 'clipboard' : 'none' as const,
    isMobile: isMobileDevice,
    isTouchDevice,
    isPWA,
    isSmallScreen
  };
}