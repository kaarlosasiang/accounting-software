"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

export function AuthNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`mx-auto sticky top-0 z-50 w-full backdrop-blur-lg transition-all duration-300 ${
        isScrolled ? "bg-background/80 shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <Image
            src={
              mounted && theme === "dark"
                ? "/am-fintrass-logo-light.png"
                : "/am-fintrass-logo.png"
            }
            alt="AM FINTRASS Logo"
            width={130}
            height={40}
          />
        </Link>
        <div className="flex items-center">
          <AnimatedThemeToggler className="cursor-pointer" />
        </div>
      </div>
    </header>
  );
}
