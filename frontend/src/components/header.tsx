"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  BrandLogo,
  BRAND_LOGO_HEIGHT,
} from "@/components/brand/BrandLogo";

const Header = () => {
    const [scrolled, setScrolled] = useState(false);
    const isDesktop = useMediaQuery("(min-width: 768px)");

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    const navItems = [
        { name: "Módulos", href: "#modulos" },
        { name: "Preços", href: "#precos" },
    ];

    return (
        <AnimatePresence>
            <motion.header
                initial={{
                    opacity: 1,
                    y: 0,
                }}
                animate={{
                    y: 0,
                    opacity: 1,
                }}
                transition={{ duration: 0.2 }}
                className={cn(
                    "flex items-center justify-between w-full z-50 transition-all duration-300 ease-in-out",
                    scrolled
                        ? "fixed top-4 inset-x-0 max-w-2xl mx-auto rounded-full bg-black/50 border border-neutral-700 backdrop-blur-sm p-2.5"
                        : "relative px-6 py-4"
                )}
            >
                <Link
                    href="/"
                    className={cn(
                        "flex shrink-0 items-center pl-2 md:pl-4",
                        scrolled && "relative z-10 isolate [transform:translateZ(0)]",
                    )}
                >
                    <BrandLogo
                        variant="logoWhiteCompact"
                        heightPx={
                            scrolled
                                ? BRAND_LOGO_HEIGHT.landingCompact
                                : BRAND_LOGO_HEIGHT.landingHero
                        }
                        maxWidthPx={scrolled ? 220 : isDesktop ? 340 : 240}
                    />
                </Link>
                {/* Mobile: Cadastrar e Login sempre visíveis */}
                <nav className="flex md:hidden items-center gap-2">
                    <Link href="/login">
                        <Button variant="ghost" size={scrolled ? "sm" : "default"}>Login</Button>
                    </Link>
                    <Link href="/beta">
                        <Button size={scrolled ? "sm" : "default"} className="bg-white text-black hover:bg-neutral-200">Quero conhecer</Button>
                    </Link>
                </nav>
                {/* Desktop: nav completa */}
                <nav className="hidden md:flex items-center space-x-2">
                    {navItems.map((item) => (
                         <Link key={item.name} href={item.href} className="text-neutral-300 hover:text-white px-3 py-1 text-sm">
                            {item.name}
                        </Link>
                    ))}
                    <div className="w-px h-6 bg-neutral-700 mx-2"></div>
                     <Link href="/login">
                        <Button variant="ghost" size={scrolled ? "sm" : "default"}>Login</Button>
                    </Link>
                    <Link href="/beta">
                        <Button size={scrolled ? "sm" : "default"} className="bg-white text-black hover:bg-neutral-200">Quero conhecer</Button>
                    </Link>
                </nav>
            </motion.header>
        </AnimatePresence>
    );
};

export default Header;
