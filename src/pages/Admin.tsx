import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import {
    LayoutDashboard,
    BookMarked,
    UploadCloud,
    FileBox,
    ChevronRight,
    LogOut,
} from 'lucide-react';

import { DashboardView } from '@/components/admin/DashboardView';
import { BookManager } from '@/components/admin/BookManager';
import { FileUploader } from '@/components/admin/FileUploader';
import { BookFilesView } from '@/components/admin/BookFilesView';

type AdminTab = 'dashboard' | 'books' | 'upload' | 'files';

const Admin: React.FC = () => {
    const { profile, signOut } = useAuth();

    const { isSidebarOpen } = useApp();
    const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

    const adminMenuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'books', label: 'Manage Books', icon: BookMarked },
        { id: 'upload', label: 'Upload PDF', icon: UploadCloud },
        { id: 'files', label: 'Book Files', icon: FileBox },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return <DashboardView />;
            case 'books': return <BookManager />;
            case 'upload': return <FileUploader />;
            case 'files': return <BookFilesView />;
            default: return <DashboardView />;
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar activeTab="admin" setActiveTab={() => { }} />

                <main className={cn(
                    "flex-1 overflow-y-auto bg-accent/30 transition-all duration-300",
                    isSidebarOpen ? "ml-0 md:ml-72" : "ml-0"
                )}>
                    {/* Local Admin Navigation Bar (Top) */}
                    <div className="bg-card/50 backdrop-blur-xl border-b border-border p-4 sticky top-0 z-30 shadow-sm">
                        <div className="max-w-6xl mx-auto flex items-center justify-between">
                            <div className="flex items-center gap-2 md:gap-4 overflow-x-auto no-scrollbar py-1">
                                {adminMenuItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveTab(item.id as AdminTab)}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 relative",
                                            activeTab === item.id
                                                ? "text-gold bg-gold/5"
                                                : "text-muted-foreground hover:text-foreground hover:bg-accent/10"
                                        )}
                                    >
                                        <item.icon className={cn("w-4 h-4", activeTab === item.id ? "text-gold" : "text-muted-foreground")} />
                                        <span className="whitespace-nowrap">{item.label}</span>
                                        {activeTab === item.id && (
                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-gold rounded-full shadow-gold" />
                                        )}
                                    </button>
                                ))}
                            </div>
                            <div className="hidden lg:flex items-center gap-4 border-l border-border pl-6 ml-6">
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Admin Session</span>
                                    <span className="text-sm font-display font-medium text-foreground">{profile?.full_name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.location.href = '/'}
                                        className="hidden md:flex items-center gap-2 border-border/50 hover:bg-gold/10 hover:text-gold hover:border-gold/30 transition-all font-bold text-xs uppercase tracking-widest mr-2"
                                    >
                                        Back to App
                                    </Button>

                                    <div className="w-10 h-10 rounded-xl bg-gradient-gold p-[2px] shadow-gold/20">
                                        <div className="w-full h-full rounded-[10px] bg-card flex items-center justify-center overflow-hidden">
                                            <div className="text-navy font-bold text-xs">{profile?.full_name?.charAt(0) || 'A'}</div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={async () => {
                                            await signOut();
                                            window.location.href = '/auth';
                                        }}
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all"
                                        title="Logout Session"
                                    >
                                        <LogOut className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                        </div>
                    </div>

                    <div className="max-w-6xl mx-auto p-8 animate-fade-in">
                        {renderContent()}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Admin;
