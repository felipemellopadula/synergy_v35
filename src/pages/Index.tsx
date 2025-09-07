// Minimal landing page that loads only essential code initially
import { useEffect, useState, useCallback, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LandingHeader } from "@/components/LandingHeader";
import { LandingHero } from "@/components/LandingHero";

// Lazy load heavy sections that are below the fold
const LandingSections = lazy(() => import("@/components/LandingSections"));
const AuthModal = lazy(() => import("@/components/AuthModal").then(m => ({ default: m.AuthModal })));

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const scrollToSection = useCallback((sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    // Set title immediately
    document.title = "Synergy AI Hub – Modelos de IA, Recursos e Planos";

    // Defer non-critical tasks
    let id: number | NodeJS.Timeout = 0;
    
    if (typeof requestIdleCallback !== 'undefined') {
      id = requestIdleCallback(() => {
        // Preload other logo for smooth theme switching
        const otherLogo = new Image();
        otherLogo.decoding = "async";
        otherLogo.src = document.documentElement.classList.contains("light")
          ? "/lovable-uploads/76f92d5d-608b-47a5-a829-bdb436a60274.png"
          : "/lovable-uploads/5e06d662-7533-4ca8-a35e-3167dc0f31e6.png";

        // Set meta description
        const setMeta = (name: string, content: string) => {
          let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
          if (!el) {
            el = document.createElement("meta");
            el.setAttribute("name", name);
            document.head.appendChild(el);
          }
          el.setAttribute("content", content);
        };
        setMeta(
          "description",
          "Acesse os melhores modelos de IA: ChatGPT, Claude, Gemini e mais. Recursos poderosos, preços simples e dashboard intuitivo."
        );

        // Add canonical link
        let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
        if (!link) {
          link = document.createElement("link");
          link.setAttribute("rel", "canonical");
          document.head.appendChild(link);
        }
        link.setAttribute("href", window.location.href);
      });
    } else {
      id = setTimeout(() => {}, 1);
    }

    return () => {
      if (typeof requestIdleCallback !== 'undefined' && typeof id === 'number') {
        cancelIdleCallback(id as number);
      } else {
        clearTimeout(id as NodeJS.Timeout);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex-1 flex flex-col">
        <LandingHeader 
          user={user} 
          onShowAuth={() => setShowAuthModal(true)} 
        />
        
        <main className="flex-1">
          <LandingHero
            user={user}
            onShowAuth={() => setShowAuthModal(true)}
            onScrollToSection={scrollToSection}
          />
          
          {/* Load heavy sections lazily */}
          <Suspense fallback={
            <div className="container mx-auto px-4 py-16 animate-pulse">
              <div className="space-y-8">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-64 bg-muted rounded" />
                ))}
              </div>
            </div>
          }>
            <LandingSections />
          </Suspense>
        </main>
      </div>

      {/* Auth modal loaded only when needed */}
      {showAuthModal && (
        <Suspense fallback={null}>
          <AuthModal 
            isOpen={showAuthModal} 
            onClose={() => setShowAuthModal(false)} 
          />
        </Suspense>
      )}
    </div>
  );
};

export default Index;