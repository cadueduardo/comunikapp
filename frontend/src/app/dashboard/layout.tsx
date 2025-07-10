'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar, SidebarBody } from '@/components/ui/sidebar';
import {
  IconLayoutDashboard,
  IconFileText,
  IconUsers,
  IconSettings,
  IconLogout,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useSidebar } from '@/components/ui/sidebar';
import { useUser } from '@/contexts/UserContext';

// Componente customizado para SidebarLink com Next.js Link
const SidebarLink = ({
  link,
  className,
  onClick,
  ...props
}: {
  link: {
    label: string;
    href: string;
    icon: React.JSX.Element | React.ReactNode;
  };
  className?: string;
  onClick?: () => void;
}) => {
  const { open, animate } = useSidebar();
  
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "flex items-center justify-start gap-2 group/sidebar py-2 w-full text-left",
          className
        )}
        {...props}
      >
        {link.icon}

        <motion.span
          animate={{
            display: animate ? (open ? "inline-block" : "none") : "inline-block",
            opacity: animate ? (open ? 1 : 0) : 1,
          }}
          className="text-neutral-700 dark:text-neutral-200 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
        >
          {link.label}
        </motion.span>
      </button>
    );
  }

  return (
    <Link
      href={link.href}
      className={cn(
        "flex items-center justify-start gap-2 group/sidebar py-2",
        className
      )}
      {...props}
    >
      {link.icon}

      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-neutral-700 dark:text-neutral-200 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
      >
        {link.label}
      </motion.span>
    </Link>
  );
};

export const Logo = () => {
  return (
    <Link
      href="/dashboard"
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium text-black dark:text-white whitespace-pre"
      >
        Comunikapp
      </motion.span>
    </Link>
  );
};

export const LogoIcon = () => {
  return (
    <Link
      href="/dashboard"
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
    </Link>
  );
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, getFirstName, logout, loading } = useUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Proteção de rota - redireciona para login se não estiver logado
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Mostra loading ou redireciona se não há usuário
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Será redirecionado pelo useEffect
  }
  
  const links = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: (
        <IconLayoutDashboard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: 'Orçamentos',
      href: '/dashboard/orcamentos',
      icon: (
        <IconFileText className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: 'Clientes',
      href: '/dashboard/clientes',
      icon: (
        <IconUsers className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: 'Configurações',
      href: '/dashboard/configuracoes',
      icon: (
        <IconSettings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
  ];

  return (
    <div className="flex flex-row bg-gray-100 dark:bg-neutral-800 w-full h-screen overflow-hidden">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <SidebarLink
              link={{
                label: getFirstName(),
                href: "#",
                icon: (
                  <div className="h-7 w-7 flex-shrink-0 rounded-full bg-neutral-300 dark:bg-neutral-600 flex items-center justify-center">
                    <span className="text-neutral-700 dark:text-neutral-200 text-sm font-medium">
                      {getFirstName().charAt(0).toUpperCase()}
                    </span>
                  </div>
                ),
              }}
            />
            <SidebarLink
              link={{
                label: "Sair",
                href: "#",
                icon: (
                  <IconLogout className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
                ),
              }}
              onClick={logout}
            />
          </div>
        </SidebarBody>
      </Sidebar>
      <div className="flex flex-1">
        <div className="p-6 md:p-10 bg-white dark:bg-neutral-900 flex flex-col gap-2 flex-1 w-full h-full overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
} 