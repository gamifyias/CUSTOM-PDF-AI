import React from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { BookOpen, FileText, Clock, TrendingUp } from 'lucide-react';

export const StudyNotes: React.FC = () => {
  const { uploadedPDF, userProgress } = useApp();

  const stats = [
    { label: 'Questions Asked', value: userProgress.questionsAnswered || 0, icon: FileText },
    { label: 'Tests Completed', value: userProgress.testsCompleted || 0, icon: Clock },
    { label: 'Current Streak', value: userProgress.streak || 0, icon: TrendingUp },
    { label: 'Overall Accuracy', value: `${userProgress.accuracy || 0}%`, icon: TrendingUp },
  ];

  if (!uploadedPDF) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <BookOpen className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="font-display text-xl font-semibold mb-2">Study Notes</h3>
        <p className="text-muted-foreground max-w-md">
          Upload a PDF study material to access your study notes and progress tracking.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl font-bold mb-2">Study Dashboard</h2>
          <p className="text-muted-foreground">
            Track your progress and review your study sessions
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="mentor-card text-center">
              <stat.icon className="w-8 h-8 mx-auto mb-2 text-gold" />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Current PDF */}
        <div className="mentor-card">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gold" />
            Current Study Material
          </h3>
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="w-12 h-16 bg-gradient-to-br from-gold to-gold-dark rounded flex items-center justify-center">
              <FileText className="w-6 h-6 text-accent-foreground" />
            </div>
            <div>
              <p className="font-medium">{uploadedPDF.name}</p>
              <p className="text-sm text-muted-foreground">
                {uploadedPDF.pageCount} pages • Uploaded recently
              </p>
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="mentor-card">
          <h3 className="font-semibold mb-4">💡 Today's Mentor Tips</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0 text-xs">1</span>
              <p>Focus on understanding concepts, not memorizing facts. UPSC tests application.</p>
            </li>
            <li className="flex items-start gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0 text-xs">2</span>
              <p>Practice answer writing daily. Even 2 answers a day compounds over months.</p>
            </li>
            <li className="flex items-start gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0 text-xs">3</span>
              <p>Link current affairs to static portions. This is what toppers do differently.</p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
