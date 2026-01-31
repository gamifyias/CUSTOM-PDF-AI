import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Subscription: React.FC = () => {
    const { signOut } = useAuth();

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-navy-dark via-navy to-navy-light p-4">
            <Card className="w-full max-w-lg glass-effect border-gold/20 shadow-2xl animate-scale-in">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mb-2 shadow-inner">
                        <ShieldAlert className="w-8 h-8 text-warning" />
                    </div>
                    <CardTitle className="text-3xl font-display font-bold text-foreground">
                        Subscription Required
                    </CardTitle>
                    <CardDescription className="text-muted-foreground text-lg">
                        Access Restricted
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 text-center">
                    <p className="text-foreground/80">
                        It looks like you don't have an active subscription plan associated with your account.
                    </p>
                    <div className="p-4 bg-navy-dark/40 rounded-lg border border-gold/10">
                        <p className="font-medium text-gold mb-2">Unlock Full Access</p>
                        <p className="text-sm text-muted-foreground">
                            Purchase our subscription starting from <span className="text-white font-bold">₹299</span>
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button
                            className="w-full bg-gold hover:bg-gold-light text-navy-dark font-bold h-12 text-lg shadow-gold"
                            onClick={() => window.open('https://products.gamifyias.in', '_blank')}
                        >
                            Get Subscription Now
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                            Already paid? Please contact your mentor to activate your access.
                        </p>

                        <div className="relative w-full py-2">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-white/10" />
                            </div>
                        </div>

                        <Button
                            variant="ghost"
                            onClick={() => signOut()}
                            className="text-muted-foreground hover:text-destructive"
                        >
                            <LogOut className="w-4 h-4 mr-2" /> Sign Out
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Subscription;
