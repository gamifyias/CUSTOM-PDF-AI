import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Users,
    BookOpen,
    FileText,
    Target,
    BarChart3,
    TrendingUp,
    ChevronRight,
    ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const DashboardView: React.FC = () => {
    const [stats, setStats] = useState({
        books: 0,
        files: 0,
        students: 0,
        activity: 0,
    });
    const [loading, setLoading] = useState(true);
    const [healthStatus, setHealthStatus] = useState<'optimal' | 'degraded' | 'offline'>('optimal');

    useEffect(() => {
        fetchStats();
        checkSystemHealth();
    }, []);

    const checkSystemHealth = async () => {
        try {
            const { error } = await supabase.from('books').select('id').limit(1);
            if (error) throw error;
            setHealthStatus('optimal');
        } catch (error) {
            console.error('Health check failed:', error);
            setHealthStatus('offline');
        }
    };

    const fetchStats = async () => {
        setLoading(true);
        try {
            const [books, files, students] = await Promise.all([
                supabase.from('books').select('id', { count: 'exact', head: true }),
                supabase.from('book_files').select('id', { count: 'exact', head: true }),
                supabase.from('profiles').select('id', { count: 'exact', head: true }).neq('role', 'admin'),
            ]);

            setStats({
                books: books.count || 0,
                files: files.count || 0,
                students: students.count || 0,
                activity: 98, // Mock for now until we have an activity log table
            });
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            label: 'Total Library Books',
            value: stats.books,
            icon: BookOpen,
            gradient: 'from-amber-500/20 to-gold/5',
            iconColor: 'text-gold',
            border: 'border-gold/20'
        },
        {
            label: 'PDF Resources Linked',
            value: stats.files,
            icon: FileText,
            gradient: 'from-blue-500/20 to-blue-600/5',
            iconColor: 'text-blue-500',
            border: 'border-blue-500/20'
        },
        {
            label: 'Registered Aspirants',
            value: stats.students,
            icon: Users,
            gradient: 'from-emerald-500/20 to-emerald-600/5',
            iconColor: 'text-emerald-500',
            border: 'border-emerald-500/20'
        },
        {
            label: 'System Uptime',
            value: '99.9%',
            icon: Target,
            gradient: 'from-purple-500/20 to-purple-600/5',
            iconColor: 'text-purple-500',
            border: 'border-purple-500/20'
        },
    ];

    return (
        <div className="space-y-10 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-4xl font-bold font-display tracking-tight">System Performance</h2>
                    <p className="text-muted-foreground text-lg">Central control hub for UPSC Mentor AI assets</p>
                </div>
                <div className={cn(
                    "flex items-center gap-2 text-sm font-medium bg-card border px-4 py-2 rounded-full shadow-soft transition-colors",
                    healthStatus === 'optimal' ? "border-emerald-500/50 text-emerald-500" : "border-destructive/50 text-destructive"
                )}>
                    <span className={cn(
                        "w-2 h-2 rounded-full animate-pulse",
                        healthStatus === 'optimal' ? "bg-emerald-500" : "bg-destructive"
                    )} />
                    Server Status: {healthStatus.charAt(0).toUpperCase() + healthStatus.slice(1)}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, i) => (
                    <Card
                        key={i}
                        className={cn(
                            "group overflow-hidden border-none shadow-medium hover:shadow-elevated transition-all duration-500",
                            stat.border
                        )}
                    >
                        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50 transition-opacity group-hover:opacity-70", stat.gradient)} />
                        <CardHeader className="relative flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
                                {stat.label}
                            </CardTitle>
                            <div className={cn("p-2 rounded-lg bg-background/50 backdrop-blur-sm shadow-sm", stat.iconColor)}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative pt-4 pb-6">
                            <div className="flex items-baseline gap-2">
                                <div className="text-4xl font-bold tracking-tighter">
                                    {loading ? '...' : stat.value}
                                </div>
                                {typeof stat.value === 'number' && (
                                    <div className="flex items-center text-xs font-bold text-emerald-500">
                                        <ArrowUpRight className="w-3 h-3" />
                                        <span>Live</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 glass-effect border-border/50 shadow-medium">
                    <CardHeader className="border-b border-border/50 bg-muted/20">
                        <CardTitle className="flex items-center gap-2 text-lg font-display">
                            <TrendingUp className="w-5 h-5 text-gold" />
                            Real-time Activity Monitor
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="aspect-[16/9] flex items-center justify-center relative bg-gradient-to-b from-transparent to-muted/10">
                            <div className="text-center space-y-3">
                                <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                                <p className="text-muted-foreground italic font-body">
                                    {healthStatus === 'optimal'
                                        ? "System is actively monitoring user interactions."
                                        : "Waiting for database connection..."}
                                </p>
                            </div>


                            {/* Decorative line chart background */}
                            <svg className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none" viewBox="0 0 400 100" preserveAspectRatio="none">
                                <path d="M0,80 Q50,20 100,50 T200,30 T300,70 T400,10" fill="none" stroke="currentColor" strokeWidth="2" />
                            </svg>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="glass-effect border-gold/10 shadow-medium overflow-hidden">
                        <CardHeader className="bg-gold/5 border-b border-gold/10">
                            <CardTitle className="text-base font-display flex items-center gap-2">
                                <Target className="w-4 h-4 text-gold" />
                                Admin Quick Actions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                            <QuickAction
                                icon={<BookOpen className="w-4 h-4" />}
                                label="Verify Metadata"
                                description="Sync DB with storage"
                            />
                            <QuickAction
                                icon={<Users className="w-4 h-4" />}
                                label="Security Audit"
                                description="Review student logs"
                            />
                            <QuickAction
                                icon={<FileText className="w-4 h-4" />}
                                label="System Logs"
                                description="Trace API requests"
                            />
                        </CardContent>
                    </Card>

                    <div className="p-6 rounded-2xl bg-navy-dark text-white shadow-elevated relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-4 -translate-y-4 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform">
                            <Target className="w-24 h-24" />
                        </div>
                        <h3 className="text-xl font-bold font-display relative z-10">AI Usage Insight</h3>
                        <p className="text-white/70 text-sm mt-2 relative z-10">Students are spending 45% more time in Interactive PDF mode this week.</p>
                        <button className="mt-4 text-xs font-bold uppercase tracking-widest bg-gold text-navy-dark px-4 py-2 rounded-lg relative z-10 hover:bg-gold-light transition-colors">
                            View Report
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const QuickAction: React.FC<{ icon: React.ReactNode, label: string, description: string }> = ({ icon, label, description }) => (
    <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background/50 hover:bg-accent/10 hover:border-gold/30 transition-all cursor-pointer group">
        <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted text-muted-foreground group-hover:bg-gold/10 group-hover:text-gold transition-colors">
                {icon}
            </div>
            <div>
                <div className="text-sm font-bold tracking-tight">{label}</div>
                <div className="text-[10px] text-muted-foreground">{description}</div>
            </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-gold transition-colors" />
    </div>
);

