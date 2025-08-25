"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Award } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Award className="h-6 w-6 text-primary" />
            World Staffing Awards 2026
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link 
              href="/" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Home
            </Link>
            <Link 
              href="/nominate" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/nominate") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Nominate
            </Link>
            <Link 
              href="/directory" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/directory") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Directory
            </Link>

          </div>

          {/* CTA Button */}
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <Button asChild className="hidden sm:inline-flex">
              <Link href="/nominate">Submit Nomination</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}