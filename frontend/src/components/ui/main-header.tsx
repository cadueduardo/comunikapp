'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { NotificacoesDropdown } from '@/components/ui/notificacoes-dropdown';
import { LogOut, User } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';

export function MainHeader() {
  const { logout, getFirstName } = useUser();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-900">
            Comunikapp
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Notificações */}
          <NotificacoesDropdown />

          {/* Usuário */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <User className="w-4 h-4" />
              <span>{getFirstName()}</span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
} 