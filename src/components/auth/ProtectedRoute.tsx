import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { session, profile, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background">
                <Loader2 className="w-10 h-10 animate-spin text-gold" />
            </div>
        );
    }

    // 1. Check if user is authenticated
    if (!session) {
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    // 2. Check if user has a valid role (not null) unless they are already on /subscription
    // null role means they haven't paid or been assigned a plan
    if (profile?.role === 'null' || !profile?.role) {
        // If role is explicitly 'null' string or missing
        return <Navigate to="/subscription" replace />;
    }

    return <>{children}</>;
};
