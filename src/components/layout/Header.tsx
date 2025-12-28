import React from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { 
  Moon, 
  Sun, 
  Focus, 
  Menu, 
  Trophy,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const Header: React.FC = () => {
  const { 
    isDarkMode, 
    toggleDarkMode, 
    isFocusMode, 
    toggleFocusMode,
    toggleSidebar,
    userProgress 
  } = useApp();

  const xpForNextLevel = 500;
  const currentLevelXP = userProgress.xp % xpForNextLevel;

  return (
    <header className={cn(
      "h-16 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50 transition-all duration-300",
      isFocusMode && "bg-background border-transparent"
    )}>
      <div className="h-full px-4 flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            className="no-print hover:bg-accent/10 transition-all duration-200"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-3 group">
            <div className="hidden sm:block">
              <h1 className="font-display text-xl font-bold tracking-tight text-foreground">
                GAMIFY <span className="text-gradient-gold-animated">IAS</span>
              </h1>
              <p className="text-[10px] text-muted-foreground -mt-0.5 tracking-wider">The Revolutionary UPSC AI</p>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* <Button
            variant="ghost"
            size="icon"
            onClick={toggleFocusMode}
            className={cn(
              "transition-all duration-200 hover:scale-105",
              isFocusMode && "bg-accent text-accent-foreground shadow-gold"
            )}
            title="Focus Mode"
          >
            <Focus className="h-5 w-5" />
          </Button> */}

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="transition-all duration-200 hover:scale-105 hover:rotate-12"
            title={isDarkMode ? "Light Mode" : "Dark Mode"}
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5 text-gold" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
};
