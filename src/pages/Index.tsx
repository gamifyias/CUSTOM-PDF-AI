import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from '@/contexts/AppContext';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { PDFUpload } from '@/components/pdf/PDFUpload';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { AnswerPractice } from '@/components/practice/AnswerPractice';
import { MockTest } from '@/components/test/MockTest';
import { StudyNotes } from '@/components/notes/StudyNotes';
import { WelcomeScreen } from '@/components/welcome/WelcomeScreen';
import { cn } from '@/lib/utils';

const MainContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [showWelcome, setShowWelcome] = useState(true);
  const [contentReady, setContentReady] = useState(false);
  const { isSidebarOpen, isFocusMode, uploadedPDF } = useApp();

  useEffect(() => {
    // Check if welcome was already shown this session
    const welcomed = sessionStorage.getItem('gamify_welcomed');
    if (welcomed) {
      setShowWelcome(false);
      setContentReady(true);
    }
  }, []);

  const handleWelcomeComplete = () => {
    sessionStorage.setItem('gamify_welcomed', 'true');
    setShowWelcome(false);
    setTimeout(() => setContentReady(true), 100);
  };

  const renderContent = () => {
    if (!uploadedPDF && activeTab !== 'chat') {
      return (
        <div className="h-full flex items-center justify-center animate-fade-in">
          <PDFUpload />
        </div>
      );
    }

    switch (activeTab) {
      case 'chat':
        return (
          <div className="h-full flex flex-col overflow-y-auto">
            {!uploadedPDF && (
              <div className="p-4 md:p-6 space-y-6">
                <div className="animate-slide-in-bottom" style={{ animationDelay: '0.2s' }}>
                  <PDFUpload />
                </div>
              </div>
            )}
            <div className="flex-1 min-h-0">
              <ChatInterface />
            </div>
          </div>
        );
      case 'practice':
        return (
          <div className="animate-fade-in">
            <AnswerPractice />
          </div>
        );
      case 'test':
        return (
          <div className="animate-fade-in">
            <MockTest />
          </div>
        );
      case 'notes':
        return (
          <div className="animate-fade-in">
            <StudyNotes />
          </div>
        );
      default:
        return <ChatInterface />;
    }
  };

  return (
    <>
      {showWelcome && <WelcomeScreen onComplete={handleWelcomeComplete} />}

      <div
        className={cn(
          'min-h-screen bg-background transition-opacity duration-500',
          isFocusMode && 'focus-mode',
          contentReady ? 'opacity-100' : 'opacity-0'
        )}
      >
        <Header />
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main
          className={cn(
            'transition-all duration-300 h-[calc(100vh-4rem)]',
            isSidebarOpen ? 'ml-0 md:ml-72' : 'ml-0'
          )}
        >
          <div className="h-full paper-texture">{renderContent()}</div>
        </main>
      </div>
    </>
  );
};

const Index: React.FC = () => {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
};

export default Index;
