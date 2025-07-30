import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface HubButtonProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
  gradient?: string;
  children?: ReactNode;
}

export const HubButton = ({ 
  icon: Icon, 
  title, 
  description, 
  onClick, 
  gradient = "bg-gradient-primary",
  children 
}: HubButtonProps) => {
  return (
    <Card className="p-6 bg-gradient-card border-border shadow-card hover:shadow-glow transition-all duration-300 hover:scale-105 group cursor-pointer">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className={`p-4 rounded-full ${gradient} shadow-elegant group-hover:shadow-glow transition-all duration-300`}>
          <Icon className="h-8 w-8 text-white" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        </div>

        {children && (
          <div className="w-full pt-4 border-t border-border">
            {children}
          </div>
        )}

        <Button 
          onClick={onClick}
          className="w-full bg-primary hover:bg-primary-glow text-primary-foreground transition-all duration-300 hover:shadow-glow"
        >
          Acessar {title}
        </Button>
      </div>
    </Card>
  );
};