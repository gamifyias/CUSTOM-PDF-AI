import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, BookOpen, Brain, Target, Zap } from 'lucide-react';

interface WelcomeScreenProps {
  onComplete: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1400),
      setTimeout(() => setPhase(4), 2000),
      setTimeout(() => setPhase(5), 2800),
      setTimeout(() => onComplete(), 4000),
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-gradient-to-br from-navy-dark via-navy to-navy-light">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-gold/30 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Radial glow */}
      <div
        className={cn(
          'absolute w-[600px] h-[600px] rounded-full transition-all duration-1000',
          'bg-gradient-radial from-gold/20 via-gold/5 to-transparent',
          phase >= 1 ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
        )}
      />

      {/* Orbiting icons */}
      <div
        className={cn(
          'absolute w-80 h-80 transition-all duration-1000',
          phase >= 3 ? 'opacity-100' : 'opacity-0'
        )}
      >
        {[BookOpen, Brain, Target, Zap].map((Icon, i) => (
          <div
            key={i}
            className="absolute w-10 h-10 animate-orbit"
            style={{
              animationDelay: `${i * -1.5}s`,
              animationDuration: '6s',
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-navy-light/80 backdrop-blur-sm border border-gold/30 flex items-center justify-center shadow-gold">
              <Icon className="w-5 h-5 text-gold" />
            </div>
          </div>
        ))}
      </div>  

      {/* Main content */}
      <div className="relative z-10 text-center px-6">
        {/* Logo emblem */}
        <div
          className={cn(
            'mx-auto mb-8 transition-all duration-700 ease-out',
            phase >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
          )}
        >
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-gold via-gold-light to-gold-dark flex items-center justify-center shadow-gold animate-glow">
              <Sparkles className="w-12 h-12 text-navy-dark" />
            </div>
            {/* Pulse rings */}
            <div className="absolute inset-0 rounded-2xl border-2 border-gold/50 animate-ping-slow" />
            <div
              className="absolute inset-0 rounded-2xl border border-gold/30 animate-ping-slow"
              style={{ animationDelay: '0.5s' }}
            />
          </div>
        </div>

        {/* Brand name */}
        <h1
          className={cn(
            'font-display text-5xl md:text-7xl font-bold text-primary-foreground mb-4 tracking-tight transition-all duration-700',
            phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
        >
          <span className="text-gradient-gold-animated">GAMIFY</span>
          <span className="text-primary-foreground"> IAS</span>
        </h1>

        {/* Tagline with typewriter effect */}
        <div
          className={cn(
            'h-8 overflow-hidden transition-all duration-500',
            phase >= 3 ? 'opacity-100' : 'opacity-0'
          )}
        >
          <p className="text-lg md:text-xl text-gold font-medium tracking-widest uppercase animate-typewriter">
            The Ultimate UPSC AI
          </p>
        </div>

        {/* Decorative line */}
        <div
          className={cn(
            'mx-auto mt-8 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent transition-all duration-700',
            phase >= 4 ? 'w-64 opacity-100' : 'w-0 opacity-0'
          )}
        />

        {/* Features preview */}
        <div
          className={cn(
            'mt-8 flex flex-wrap justify-center gap-4 transition-all duration-700',
            phase >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          {['AI Mentor', 'Smart Practice', 'Mock Tests', 'Study Notes'].map((feature, i) => (
            <span
              key={feature}
              className="px-4 py-2 text-sm text-gold/80 border border-gold/20 rounded-full bg-navy/50 backdrop-blur-sm animate-fade-in-stagger"
              style={{ animationDelay: `${2.2 + i * 0.1}s` }}
            >
              {feature}
            </span>
          ))}
        </div>

        {/* Loading indicator */}
        <div
          className={cn(
            'mt-12 transition-all duration-500',
            phase >= 5 ? 'opacity-100' : 'opacity-0'
          )}
        >
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="mt-3 text-sm text-gold/60 animate-pulse">Initializing your study session...</p>
        </div>
      </div>
    </div>
  );
};
