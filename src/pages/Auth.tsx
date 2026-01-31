import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { LogIn, UserPlus, Loader2, Sparkles, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const AuthPage: React.FC = () => {
    const { session } = useAuth();
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (session) navigate('/', { replace: true });
    }, [session, navigate]);

    // Reintegrated your original particle logic with the float animation
    const particles = useMemo(() => {
        return [...Array(20)].map((_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            delay: `${Math.random() * 5}s`
        }));
    }, []);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { full_name: fullName } },
                });
                if (error) throw error;
                toast({ title: "Check your email", description: "Verification link sent." });
                setIsSignUp(false);
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                toast({ title: "Success", description: "Logged in successfully." });
                setTimeout(() => navigate('/', { replace: true }), 100);
            }
        } catch (error: any) {
            toast({ title: "Authentication Error", description: error.message, variant: "destructive" });
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#020617] p-4 relative overflow-hidden">
            {/* BACKGROUND ANIMATION - Re-using your original logic */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {particles.map((p) => (
                    <div
                        key={p.id}
                        className="absolute w-1.5 h-1.5 bg-gold/20 rounded-full animate-float"
                        style={{
                            left: p.left,
                            top: p.top,
                            animationDelay: p.delay,
                        }}
                    />
                ))}
            </div>

            {/* Glowing Orbs for Depth */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gold/5 blur-[100px] rounded-full" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full" />

            {/* Main Card with your original 'animate-scale-in' */}
            <Card className="w-full max-w-md bg-slate-900/40 backdrop-blur-xl border-gold/10 shadow-2xl animate-scale-in z-10 relative overflow-hidden">
                {/* Subtle top accent line */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
                
                <CardHeader className="text-center space-y-2 pt-8">
                    <div className="mx-auto w-14 h-14 rounded-2xl bg-gold flex items-center justify-center mb-2 shadow-gold animate-glow">
                        <Sparkles className="w-7 h-7 text-slate-950" />
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight text-white">
                        GAMIFY <span className="text-gold">IAS</span>
                    </CardTitle>
                    <CardDescription className="text-slate-400 flex items-center justify-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-gold/50" />
                        {isSignUp ? 'Create your student account' : 'Welcome back, Aspirant'}
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleAuth}>
                    <CardContent className="space-y-4 px-8">
                        {isSignUp && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                <Label className="text-slate-300" htmlFor="fullName">Full Name</Label>
                                <Input
                                    id="fullName"
                                    placeholder="Arjun Singh"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="bg-slate-950/40 border-gold/10 focus:border-gold/40 transition-all h-11"
                                    required
                                />
                            </div>
                        )}
                        
                        <div className="space-y-2">
                            <Label className="text-slate-300" htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="aspirant@upsc.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-slate-950/40 border-gold/10 focus:border-gold/40 transition-all h-11"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-slate-300" htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-slate-950/40 border-gold/10 focus:border-gold/40 transition-all h-11 pr-10"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-gold transition-colors"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col space-y-4 px-8 pb-8">
                        <Button
                            type="submit"
                            className="w-full bg-gold hover:bg-yellow-500 text-slate-950 font-bold h-11 transition-all shadow-lg shadow-gold/10"
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            ) : isSignUp ? (
                                <UserPlus className="w-5 h-5 mr-2" />
                            ) : (
                                <LogIn className="w-5 h-5 mr-2" />
                            )}
                            {isSignUp ? 'Register' : 'Login'}
                        </Button>

                        <div className="relative w-full py-2">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-white/5" />
                            </div>
                            <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                                <span className="bg-[#0f172a] px-3 text-slate-500 italic">Preferred Method</span>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full border-gold/10 hover:border-gold/30 hover:bg-gold/5 h-11 text-slate-300 transition-all"
                            onClick={() => {/* Google logic */}}
                            disabled={loading}
                        >
                            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94L5.84 14.1z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            </svg>
                            Continue with Google
                        </Button>

                        <button
                            type="button"
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-xs text-slate-400 hover:text-gold transition-colors font-medium"
                        >
                            {isSignUp ? 'Already have an account? Login' : "Don't have an account? Register"}
                        </button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};