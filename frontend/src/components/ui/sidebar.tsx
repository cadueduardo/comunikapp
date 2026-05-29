"use client";
import { cn } from "@/lib/utils";
import React, { useState, createContext, useContext, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconMenu2, IconX } from "@tabler/icons-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { SidebarBrandLogo } from "@/components/brand/SidebarBrandLogo";

const sidebarSurfaceClass =
  "bg-neutral-100 dark:bg-black border-r border-transparent dark:border-neutral-900";

// Types and Context Definition
interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}
interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}
const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

// Hook to use Sidebar context
export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

// Provider component
export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);
  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;
  const pathname = usePathname();

  // Fecha o drawer mobile (e recolhe sidebar desktop) ao mudar de rota
  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate: animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

// Main Sidebar component
export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

// ** Conditionally rendered SidebarBody **
export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  if (isDesktop) {
    return <DesktopSidebar {...props} />;
  }
  return <MobileSidebar {...(props as React.ComponentProps<"div">)} />;
};

// Desktop-only Sidebar
export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <motion.div
      className={cn(
        "hidden shrink-0 flex-col overflow-hidden px-4 py-4",
        "lg:sticky lg:top-0 lg:flex lg:h-full lg:max-h-dvh lg:min-h-0",
        sidebarSurfaceClass,
      )}
      animate={{
        width: animate ? (open ? 300 : 60) : 300,
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {open ? <Logo /> : <LogoIcon />}
      <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
        {children}
      </div>
    </motion.div>
  );
};

// Mobile-only Sidebar
export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();

  return (
    <>
      <div
        className={cn(
          "flex h-12 w-full shrink-0 items-center px-3 lg:hidden",
          sidebarSurfaceClass,
        )}
        {...props}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md p-2 text-neutral-800 dark:text-neutral-200"
          aria-label="Abrir menu"
          aria-expanded={open}
        >
          <IconMenu2 className="h-6 w-6" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              key="sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[200] bg-black/50 lg:hidden"
              onClick={() => setOpen(false)}
              aria-label="Fechar menu"
            />
            <motion.div
              key="sidebar-drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className={cn(
                "fixed inset-y-0 left-0 z-[201] flex w-[min(100vw,320px)] flex-col shadow-xl lg:hidden",
                sidebarSurfaceClass,
              )}
            >
              <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
                <Logo />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md p-2 text-neutral-800 dark:text-neutral-200"
                  aria-label="Fechar menu"
                >
                  <IconX className="h-6 w-6" />
                </button>
              </div>
              <div
                className={cn(
                  "flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-4 py-4",
                  className,
                )}
              >
                {children}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

// Sidebar link (used by both)
export const SidebarLink = ({
  link,
  className,
  onClick,
  ...props
}: {
  link: Links;
  className?: string;
  onClick?: () => void;
}) => {
  const { open, animate, setOpen } = useSidebar();

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.();
    setOpen(false);
    props.onClick?.(event);
  };

  return (
    <a
      href={link.href}
      className={cn(
        "flex items-center justify-start gap-2 group/sidebar py-2",
        className
      )}
      onClick={handleClick}
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
    </a>
  );
};

export const Logo = () => <SidebarBrandLogo collapsed={false} />;

export const LogoIcon = () => <SidebarBrandLogo collapsed />; 