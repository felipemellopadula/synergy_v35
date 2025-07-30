import { useState } from "react";
import { 
  MessageSquare, 
  Image as ImageIcon, 
  Video, 
  UserCheck, 
  Code, 
  Sparkles,
  Brain,
  Zap
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserProfile } from "@/components/UserProfile";
import { HubButton } from "@/components/HubButton";
import { ChatInterface } from "@/components/ChatInterface";
import { toast } from "sonner";

const Index = () => {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const handleToolClick = (tool: string) => {
    if (tool === 'chat') {
      setActiveTool('chat');
    } else {
      toast.info(`${tool} será implementado em breve!`);
    }
  };

  const closeChat = () => {
    setActiveTool(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-primary">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              AI Hub
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <UserProfile tokens={15750} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Powered by AI</span>
          </div>
          
          <h2 className="text-5xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
            Seu Hub de Inteligência Artificial
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            Acesse os melhores modelos de IA do mundo em um só lugar. 
            Chat, geração de imagens, vídeos e muito mais.
          </p>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            
            {/* Chat Tool */}
            <HubButton
              icon={MessageSquare}
              title="Chat"
              description="Converse com os melhores modelos de IA como GPT-4, Claude 4, Gemini e mais"
              onClick={() => handleToolClick('chat')}
              gradient="bg-gradient-primary"
            />

            {/* Image Generation */}
            <HubButton
              icon={ImageIcon}
              title="Imagem"
              description="Gere imagens incríveis usando Luma Ray 2 e outros modelos avançados"
              onClick={() => handleToolClick('image')}
              gradient="bg-gradient-to-br from-pink-500 to-purple-600"
            />

            {/* Video Generation */}
            <HubButton
              icon={Video}
              title="Vídeo"
              description="Crie vídeos impressionantes com tecnologia de IA de última geração"
              onClick={() => handleToolClick('video')}
              gradient="bg-gradient-to-br from-blue-500 to-cyan-500"
            />

            {/* Humanizer */}
            <HubButton
              icon={UserCheck}
              title="Humanizar"
              description="Torne seu conteúdo mais natural e humano com IA especializada"
              onClick={() => handleToolClick('humanize')}
              gradient="bg-gradient-to-br from-green-500 to-emerald-500"
            />

            {/* Code Assistant */}
            <HubButton
              icon={Code}
              title="Código"
              description="Assistente de programação inteligente para desenvolvimento de software"
              onClick={() => handleToolClick('code')}
              gradient="bg-gradient-to-br from-orange-500 to-red-500"
            />

            {/* AI Tools */}
            <HubButton
              icon={Zap}
              title="Ferramentas"
              description="Mais ferramentas de IA para produtividade e criatividade"
              onClick={() => handleToolClick('tools')}
              gradient="bg-gradient-to-br from-indigo-500 to-purple-500"
            />

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 mt-16">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>© 2024 AI Hub. Powered by cutting-edge artificial intelligence.</p>
        </div>
      </footer>

      {/* Chat Interface */}
      <ChatInterface 
        isOpen={activeTool === 'chat'} 
        onClose={closeChat}
      />
    </div>
  );
};

export default Index;
