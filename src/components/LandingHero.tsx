import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ThumbsUp, Activity, Stars } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LandingHeroProps {
  user: any;
  onShowAuth: () => void;
  onScrollToSection: (sectionId: string) => void;
}

export const LandingHero = ({ user, onShowAuth, onScrollToSection }: LandingHeroProps) => {
  const navigate = useNavigate();

  const handlePrimaryCta = useCallback(() => {
    if (user) navigate("/dashboard");
    else onShowAuth();
  }, [user, navigate, onShowAuth]);

  return (
    <section
      id="hero"
      className="border-b border-border bg-gradient-subtle"
    >
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Inovação em Inteligência Artificial
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground">
            Acesso{" "}
            <span className="text-primary">
              aos melhores
              <br />
              modelos
            </span>{" "}
            de Inteligência
            <br />
            Artificial <span className="text-primary">do mundo</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Nosso hub de IA combina os melhores modelos de inteligência
            artificial para potencializar seus projetos de forma simples e
            eficiente.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => onScrollToSection("planos")}
              className="shadow-glow"
            >
              Começar Agora
            </Button>
            <Button
              variant="outline"
              onClick={() => onScrollToSection("modelos")}
            >
              Ver Modelos
            </Button>
          </div>

          <div className="pt-8">
            <p className="text-sm text-muted-foreground mb-4">
              Empresas que confiam em nosso hub
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-muted-foreground">
              <div className="flex items-center gap-2">
                <ThumbsUp className="h-4 w-4" />
                <span className="text-sm">Marca Um</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="text-sm">Marca Dois</span>
              </div>
              <div className="flex items-center gap-2">
                <Stars className="h-4 w-4 hover:text-primary" />
                <span className="text-sm">Marca Três</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};