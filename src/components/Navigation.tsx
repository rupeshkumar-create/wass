"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Award } from "lucide-react";
import { useNominationStatus } from "@/hooks/useNominationStatus";
import { useState, useEffect } from "react";

export function Navigation() {
  const pathname = usePathname();
  const nominationStatus = useNominationStatus();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Prevent hydration mismatch by showing default text until mounted and loaded
  const navText = !mounted || nominationStatus.loading ? "Vote" : (nominationStatus.enabled ? "Nominate" : "Vote");
  const buttonText = !mounted || nominationStatus.loading ? "Vote Now" : (nominationStatus.enabled ? "Submit Nomination" : "Vote Now");
  const buttonHref = !mounted || nominationStatus.loading ? "/directory" : (nominationStatus.enabled ? "/nominate" : "/directory");

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
              {navText}
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
            <Button asChild className="hidden sm:inline-flex">
              <Link href={buttonHref}>
                {buttonText}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}