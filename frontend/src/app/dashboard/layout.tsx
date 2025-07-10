'use client';
import { useEffect } from 'react';
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

// Logo e LogoIcon foram movidos para sidebar.tsx
// export const Logo = () => { ... };
// export const LogoIcon = () => { ... };

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, getFirstName, logout, loading } = useUser();
  const router = useRouter();
  // const [open, setOpen] = useState(false); // REMOVIDO

  // Proteção de rota
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return null;
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
    <div className="flex flex-col lg:flex-row bg-gray-100 dark:bg-neutral-800 w-full h-screen overflow-hidden">
      {/* O Sidebar agora gerencia seu próprio estado */}
      <Sidebar> 
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {/* O Logo é renderizado condicionalmente dentro do DesktopSidebar */}
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
      
      {/* Área de conteúdo principal */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-10">
          {children}
        </div>
      </main>
    </div>
  );
} 