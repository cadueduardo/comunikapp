"use client";
import { cn } from "@/lib/utils";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconMenu2, IconX } from "@tabler/icons-react";
import { useMediaQuery } from "@/hooks/use-media-query";
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
        "min-h-screen lg:sticky lg:top-0 lg:flex lg:h-screen lg:min-h-0",
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
          "flex h-10 w-full flex-row items-center justify-between px-4 py-4",
          sidebarSurfaceClass,
        )}
        {...props}
      >
        <div className="flex justify-start z-20 w-full">
          <IconMenu2
            className="text-neutral-800 dark:text-neutral-200"
            onClick={() => setOpen(!open)}
          />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "fixed inset-0 z-[100] flex h-full w-full flex-col justify-between bg-white p-10 dark:bg-black",
                className
              )}
            >
              <div className="flex flex-col flex-1">
                <Logo />
                {children}
              </div>
              <div
                className="absolute right-10 top-10 z-50 text-neutral-800 dark:text-neutral-200"
                onClick={() => setOpen(!open)}
              >
                <IconX />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

// Sidebar link (used by both)
export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
}) => {
  const { open, animate } = useSidebar();
  return (
    <a
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
    </a>
  );
};

export const Logo = () => <SidebarBrandLogo collapsed={false} />;

export const LogoIcon = () => <SidebarBrandLogo collapsed />; 