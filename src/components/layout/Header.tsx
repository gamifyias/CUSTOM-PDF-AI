import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";

import {
  Moon,
  Sun,
  Menu,
  LogOut,
} from "lucide-react";

export const Header: React.FC = () => {
  const {
    isDarkMode,
    toggleDarkMode,
    isFocusMode,
    toggleSidebar,
  } = useApp();

  const { signOut } = useAuth();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 h-16",
        "backdrop-blur-xl bg-gradient-to-r from-card/80 via-card/70 to-card/80",
        "border-b border-white/5",
        "transition-all duration-300",
        isFocusMode && "bg-background border-transparent"
      )}
    >
      <div className="h-full px-4 flex items-center justify-between">

        {/* LEFT */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="hover:bg-white/5 transition-all duration-200"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="hidden sm:flex flex-col leading-tight">
            <h1 className="text-lg font-bold tracking-tight text-foreground">
              GAMIFY{" "}
              <span className="bg-gradient-to-r from-yellow-400 to-gold bg-clip-text text-transparent animate-gradient">
                IAS
              </span>
            </h1>
            <span className="text-[10px] text-muted-foreground tracking-wider">
              THE UPSC AI COMPANION
            </span>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            title={isDarkMode ? "Light Mode" : "Dark Mode"}
            className="transition-all duration-200 hover:scale-110"
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5 text-yellow-400 hover:rotate-12 transition-transform" />
            ) : (
              <Moon className="h-5 w-5 hover:-rotate-12 transition-transform" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            title="Sign Out"
            className="transition-all duration-200 hover:bg-red-500/10 hover:text-red-500 hover:scale-110"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

      </div>
    </header>
  );
};
