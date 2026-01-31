import React from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { StudyModeConfig } from '@/types';
import { cn } from '@/lib/utils';
import {
  MessageSquare,
  PenTool,
  BookOpen,
  ClipboardCheck,
  Target,
  FileText,
  GraduationCap,
  Zap,
  Calendar,
  Brain,
  Sparkles,
  Rocket,
  ChevronRight,
  FileText as FileIcon,
  LayoutDashboard
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

// --- Configuration ---

const studyModes: StudyModeConfig[] = [
  { id: 'prelims', name: 'Prelims Mode', description: 'Fact-focused, elimination logic', icon: 'Target', color: 'text-blue-500' },
  { id: 'mains', name: 'Mains Mode', description: 'Intro-Body-Conclusion structure', icon: 'FileText', color: 'text-green-500' },
  { id: 'topper', name: 'Topper Style', description: 'High-scoring vocabulary', icon: 'GraduationCap', color: 'text-amber-500' },
  { id: 'revision', name: 'Revision Mode', description: 'Crisp bullet points', icon: 'Zap', color: 'text-yellow-500' },
  { id: 'exam-day', name: 'Exam Day', description: 'Short, high-ROI answers', icon: 'Calendar', color: 'text-red-500' },
  { id: 'concept', name: 'Concept Mode', description: 'Focus on why and how', icon: 'Brain', color: 'text-purple-500' },
  { id: 'beginner', name: 'Beginner', description: 'Simple explanations', icon: 'Sparkles', color: 'text-emerald-500' },
  { id: 'advanced', name: 'Advanced', description: 'Deeper academic reasoning', icon: 'Rocket', color: 'text-indigo-500' },
];

const getIcon = (iconName: string) => {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    Target, FileText, GraduationCap, Zap, Calendar, Brain, Sparkles, Rocket
  };
  return icons[iconName] || Target;
};

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

// --- Components ---

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { currentStudyMode, setStudyMode, uploadedPDF, isSidebarOpen } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'chat', label: 'AI Mentor', icon: MessageSquare },
    { id: 'library', label: 'Library', icon: BookOpen },
    { id: 'practice', label: 'Answer Practice', icon: PenTool },
    { id: 'test', label: 'Mock Tests', icon: ClipboardCheck, badge: 'Beta' },
  ];

  const handleNavClick = (id: string) => {
    if (id === 'library') {
      navigate('/library');
    } else {
      if (location.pathname !== '/') {
        navigate('/');
      }
      setActiveTab(id);
    }
  };

  const isActive = (id: string) => {
    if (id === 'library') return location.pathname === '/library';
    return activeTab === id && location.pathname === '/';
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-16 h-[calc(100vh-4rem)] w-72 transition-transform duration-300 ease-in-out z-40",
        "bg-background/80 backdrop-blur-xl border-r border-border/50 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]",
        !isSidebarOpen && "-translate-x-full"
      )}
    >
      <div className="flex flex-col h-full py-6 px-4 gap-8">
        
        {/* 1. Session Status Card */}
        <div className="relative group">
           <div className={cn(
             "absolute inset-0 rounded-2xl opacity-20 transition-all duration-500 blur-xl",
             uploadedPDF ? "bg-primary/40" : "bg-muted"
           )} />
           
           <div className={cn(
             "relative rounded-2xl p-4 border transition-all duration-300",
             uploadedPDF 
               ? "bg-gradient-to-br from-background via-background to-primary/5 border-primary/20" 
               : "bg-card border-border border-dashed"
           )}>
              <div className="flex items-start gap-3">
                <div className={cn(
                  "p-2.5 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                  uploadedPDF ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  {uploadedPDF ? <FileIcon className="w-5 h-5" /> : <LayoutDashboard className="w-5 h-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
                    Current Session
                  </p>
                  <h4 className="font-semibold text-sm truncate leading-tight text-foreground">
                    {uploadedPDF ? uploadedPDF.name : "No Document"}
                  </h4>
                  {uploadedPDF && (
                     <div className="flex items-center gap-1.5 mt-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium">Active & Ready</span>
                     </div>
                  )}
                </div>
              </div>
           </div>
        </div>

        {/* 2. Main Navigation */}
        <div className="space-y-1">
          <h3 className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest px-3 mb-2">
            Menu
          </h3>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                onClick={() => handleNavClick(item.id)}
                className={cn(
                  "w-full justify-start h-12 px-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                  isActive(item.id) 
                    ? "bg-primary/10 text-primary font-semibold hover:bg-primary/15" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                {isActive(item.id) && (
                   <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                )}
                
                <item.icon className={cn(
                  "h-5 w-5 mr-3 transition-transform duration-300",
                  isActive(item.id) ? "scale-110" : "group-hover:scale-105"
                )} />
                
                <span className="flex-1 text-left">{item.label}</span>
                
                {item.badge && (
                  <span className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded border border-primary/20">
                    {item.badge}
                  </span>
                )}
                
                {isActive(item.id) && <ChevronRight className="h-4 w-4 opacity-50" />}
              </Button>
            ))}
          </nav>
        </div>

        {/* 3. Study Modes (Scrollable) */}
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between px-3 mb-3">
             <h3 className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest">
               AI Persona
             </h3>
             <span className="text-[10px] text-muted-foreground bg-accent/30 px-2 py-0.5 rounded-full">
                {studyModes.length} Modes
             </span>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2 pb-6">
            {studyModes.map((mode) => {
              const Icon = getIcon(mode.icon);
              const isModeActive = currentStudyMode === mode.id;

              return (
                <button
                  key={mode.id}
                  onClick={() => setStudyMode(mode.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 border",
                    isModeActive
                      ? "bg-card border-primary/50 shadow-md shadow-primary/5 ring-1 ring-primary/20"
                      : "bg-transparent border-transparent hover:bg-accent/40 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg transition-colors",
                    isModeActive ? "bg-primary text-primary-foreground" : "bg-accent/50 text-muted-foreground"
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium", isModeActive && "text-primary")}>
                      {mode.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate opacity-80">
                      {mode.description}
                    </p>
                  </div>

                  {isModeActive && (
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_currentColor]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </aside>
  );
};