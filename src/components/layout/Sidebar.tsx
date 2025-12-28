import React from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { StudyModeConfig, StudyMode } from '@/types';
import { cn } from '@/lib/utils';
import {
  MessageSquare,
  FileText,
  ClipboardCheck,
  PenTool,
  BookOpen,
  Target,
  GraduationCap,
  Zap,
  Calendar,
  Brain,
  Sparkles,
  Rocket,
  ChevronRight,
} from 'lucide-react';

const studyModes: StudyModeConfig[] = [
  { id: 'prelims', name: 'Prelims Mode', description: 'Fact-focused, elimination logic', icon: 'Target', color: 'text-info' },
  { id: 'mains', name: 'Mains Mode', description: 'Intro-Body-Conclusion structure', icon: 'FileText', color: 'text-success' },
  { id: 'topper', name: 'Topper Style', description: 'High-scoring vocabulary', icon: 'GraduationCap', color: 'text-gold' },
  { id: 'revision', name: 'Revision Mode', description: 'Crisp bullet points', icon: 'Zap', color: 'text-warning' },
  { id: 'exam-day', name: 'Exam Day', description: 'Short, high-ROI answers', icon: 'Calendar', color: 'text-destructive' },
  { id: 'concept', name: 'Concept Mode', description: 'Focus on why and how', icon: 'Brain', color: 'text-purple-500' },
  { id: 'beginner', name: 'Beginner', description: 'Simple explanations', icon: 'Sparkles', color: 'text-emerald-500' },
  { id: 'advanced', name: 'Advanced', description: 'Deeper academic reasoning', icon: 'Rocket', color: 'text-indigo-500' },
];

const getIcon = (iconName: string) => {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    Target,
    FileText,
    GraduationCap,
    Zap,
    Calendar,
    Brain,
    Sparkles,
    Rocket,
  };
  return icons[iconName] || Target;
};

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { currentStudyMode, setStudyMode, uploadedPDF, isSidebarOpen } = useApp();

  const navItems = [
    { id: 'chat', label: 'AI Mentor', icon: MessageSquare },
    { id: 'practice', label: 'Answer Practice', icon: PenTool },
    { id: 'test', label: 'Mock Tests (Beta)', icon: ClipboardCheck },
  ];

  return (
    <aside 
      className={cn(
        "sidebar-container fixed left-0 top-16 h-[calc(100vh-4rem)] w-72 bg-sidebar border-r border-sidebar-border transition-all duration-300 z-40 overflow-y-auto",
        !isSidebarOpen && "-translate-x-full"
      )}
    >
      <div className="p-4 space-y-6">
        {/* PDF Status */}
        <div className="mentor-card bg-sidebar-accent border-sidebar-border hover-lift">
          <div className="flex items-center gap-3 mb-2">
            <div className={cn(
              "w-3 h-3 rounded-full transition-all duration-300",
              uploadedPDF ? "bg-success animate-pulse shadow-[0_0_10px_hsl(142_70%_45%/0.5)]" : "bg-muted-foreground"
            )} />
            <span className="text-sm font-medium text-sidebar-foreground">
              {uploadedPDF ? 'PDF Active' : 'No PDF Uploaded'}
            </span>
          </div>
          {uploadedPDF && (
            <p className="text-xs text-sidebar-foreground/70 truncate pl-6 animate-fade-in">
              {uploadedPDF.name}
            </p>
          )}
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {navItems.map((item, index) => (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 h-11 text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200 group",
                activeTab === item.id && "bg-sidebar-accent text-sidebar-primary font-medium"
              )}
              onClick={() => setActiveTab(item.id)}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <item.icon className={cn(
                "h-5 w-5 transition-transform duration-200 group-hover:scale-110",
                activeTab === item.id && "text-sidebar-primary"
              )} />
              {item.label}
              {activeTab === item.id && (
                <ChevronRight className="h-4 w-4 ml-auto animate-fade-in" />
              )}
            </Button>
          ))}
        </nav>

        {/* Study Modes */}
        <div>
          <h3 className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-3 px-2">
            Study Mode
          </h3>
          <div className="space-y-1">
            {studyModes.map((mode, index) => {
              const Icon = getIcon(mode.icon);
              const isActive = currentStudyMode === mode.id;
              
              return (
                <button
                  key={mode.id}
                  onClick={() => setStudyMode(mode.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group",
                    isActive 
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-gold animate-scale-in" 
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:translate-x-1"
                  )}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <Icon className={cn(
                    "h-4 w-4 transition-all duration-200",
                    isActive ? "text-sidebar-primary-foreground scale-110" : mode.color,
                    "group-hover:scale-110"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{mode.name}</p>
                    <p className={cn(
                      "text-[10px] truncate",
                      isActive ? "text-sidebar-primary-foreground/80" : "text-sidebar-foreground/50"
                    )}>
                      {mode.description}
                    </p>
                  </div>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-sidebar-primary-foreground animate-pulse" />
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
