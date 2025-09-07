import { useState, useEffect, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

// Lazy load theme toggle to reduce initial bundle
const ThemeToggleLazy = lazy(() =>
  import("@/components/ThemeToggle").then((m) => ({ default: m.ThemeToggle }))
);

interface LandingHeaderProps {
  user: any;
  onShowAuth: () => void;
}

export const LandingHeader = ({ user, onShowAuth }: LandingHeaderProps) => {
  const navigate = useNavigate();
  
  // Theme detection with minimal reflows
  const [isLight, setIsLight] = useState<boolean>(() =>
    typeof document !== "undefined"
      ? document.documentElement.classList.contains("light")
      : true
  );

  // Single logo loading with theme switching
  const logoSrc = isLight
    ? "/lovable-uploads/5e06d662-7533-4ca8-a35e-3167dc0f31e6.png"
    : "/lovable-uploads/76f92d5d-608b-47a5-a829-bdb436a60274.png";

  useEffect(() => {
    // Theme observer
    const apply = () =>
      setIsLight(document.documentElement.classList.contains("light"));
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <header className="border-b border-border sticky top-0 z-30 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <a
          href="/"
          className="flex items-center gap-2"
          aria-label="Synergy AI"
        >
          <img
            src={logoSrc}
            alt="Synergy AI logo"
            className="h-8 w-auto"
            width="32"
            height="32"
            loading="eager"
            decoding="async"
          />
        </a>
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <a
            href="#modelos"
            className="hover:text-foreground transition-colors"
          >
            Soluções
          </a>
          <a
            href="#planos"
            className="hover:text-foreground transition-colors"
          >
            Planos
          </a>
          <a
            href="#contato"
            className="hover:text-foreground transition-colors"
          >
            Contato
          </a>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <Suspense
            fallback={<div className="h-6 w-10 rounded bg-muted" />}
          >
            <ThemeToggleLazy />
          </Suspense>
          {user ? (
            <Button
              onClick={() => navigate("/dashboard")}
              size="sm"
              className="text-xs sm:text-sm"
            >
              Dashboard
            </Button>
          ) : (
            <Button
              onClick={onShowAuth}
              size="sm"
              className="text-xs sm:text-sm"
            >
              Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};