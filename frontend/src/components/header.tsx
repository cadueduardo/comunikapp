"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

const Header = () => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const offset = window.scrollY;
            if (offset > 20) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };
        window.addEventListener("scroll", handleScroll);
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
                    y: scrolled ? -20 : 0,
                    opacity: scrolled ? 1 : 1,
                }}
                transition={{ duration: 0.2 }}
                className={cn(
                    "flex items-center justify-between w-full z-50 transition-all duration-300 ease-in-out",
                    scrolled
                        ? "fixed top-4 inset-x-0 max-w-2xl mx-auto rounded-full bg-black/50 border border-neutral-700 backdrop-blur-sm p-2.5"
                        : "relative p-6"
                )}
            >
                <div className="text-xl font-bold pl-4 text-white">Comunikapp</div>
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
                    <Link href="/cadastro">
                        <Button size={scrolled ? "sm" : "default"} className="bg-white text-black hover:bg-neutral-200">Experimente Grátis</Button>
                    </Link>
                </nav>
            </motion.header>
        </AnimatePresence>
    );
};

export default Header; 