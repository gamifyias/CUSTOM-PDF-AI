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
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { extractTextFromPDF, extractImagesFromPDF } from '@/lib/pdfUtils';
import { toast } from '@/hooks/use-toast';
import { Loader2, Sparkles, BookOpen, UploadCloud, FileText } from 'lucide-react';
import { PDFDocument } from '@/types';
import { BookSelector } from '@/components/library/BookSelector';

// --- Components for cleaner rendering ---

const LoadingView = ({ title }: { title: string }) => (
  <div className="h-full flex flex-col items-center justify-center space-y-6 bg-background/50 backdrop-blur-sm">
    <div className="relative">
      <div className="absolute inset-0 bg-gold/20 blur-xl rounded-full animate-pulse" />
      <Loader2 className="w-16 h-16 text-primary animate-spin relative z-10" />
    </div>
    <div className="text-center space-y-2">
      <h3 className="text-xl font-semibold tracking-tight text-foreground">{title}</h3>
      <p className="text-muted-foreground animate-pulse text-sm">Preparing your study environment...</p>
    </div>
  </div>
);

const EmptyStateHero = () => (
  <div className="flex flex-col items-center justify-center w-full max-w-5xl mx-auto p-6 md:p-12 animate-fade-in space-y-12">
    {/* Hero Header */}
    <div className="text-center space-y-4 max-w-2xl mx-auto">
      <div className="inline-flex items-center justify-center p-2 rounded-full bg-primary/10 text-primary mb-2 ring-1 ring-primary/20">
        <Sparkles className="w-4 h-4 mr-2" />
        <span className="text-sm font-medium">AI-Powered Study Companion</span>
      </div>
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
        What are we learning today?
      </h1>
      <p className="text-lg text-muted-foreground">
        Upload a document or select a book from your library to generate quizzes, summaries, and chat with your content.
      </p>
    </div>

    {/* Action Cards Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
      {/* Upload Card */}
      <div className="group relative flex flex-col items-center p-8 rounded-2xl border border-border bg-card hover:shadow-lg transition-all duration-300 hover:border-primary/50">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
          <UploadCloud className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Upload New PDF</h3>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Analyze a new document, research paper, or textbook chapter.
        </p>
        <div className="w-full">
          <PDFUpload />
        </div>
      </div>

      {/* Library Card */}
      <div className="group relative flex flex-col items-center p-8 rounded-2xl border border-border bg-card hover:shadow-lg transition-all duration-300 hover:border-primary/50">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
          <BookOpen className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-semibold mb-2">From Your Library</h3>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Pick up where you left off with your saved books and notes.
        </p>
        <div className="w-full">
          <BookSelector />
        </div>
      </div>
    </div>
  </div>
);

// --- Main Component ---

const MainContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [showWelcome, setShowWelcome] = useState(true);
  const [contentReady, setContentReady] = useState(false);
  const { isSidebarOpen, isFocusMode, uploadedPDF, setUploadedPDF, setPdfContent, setPdfImages, clearMessages } = useApp();

  const [searchParams, setSearchParams] = useSearchParams();
  const bookId = searchParams.get('bookId');
  const [isLoadingBook, setIsLoadingBook] = useState(false);

  useEffect(() => {
    const welcomed = sessionStorage.getItem('gamify_welcomed');
    if (welcomed) {
      setShowWelcome(false);
      setContentReady(true);
    }
  }, []);

  // Handle Book Loading
  useEffect(() => {
    const loadBook = async () => {
      if (!bookId || uploadedPDF) return;

      setIsLoadingBook(true);
      try {
        const { data: book, error: bookError } = await supabase
          .from('books').select('title').eq('id', bookId).single();
        if (bookError || !book) throw new Error('Book not found');

        const { data: fileData, error: fileError } = await supabase
          .from('book_files').select('storage_path, file_name').eq('book_id', bookId).single();
        if (fileError || !fileData) throw new Error('Book file not found');

        const { data: blob, error: downloadError } = await supabase
          .storage.from('books').download(fileData.storage_path);
        if (downloadError || !blob) throw new Error('Failed to download book');

        toast({ title: 'Processing Book', description: `Analyzing ${book.title}...` });

        const file = new File([blob], fileData.file_name, { type: 'application/pdf' });
        const [content, images] = await Promise.all([
          extractTextFromPDF(file),
          extractImagesFromPDF(file, 5)
        ]);

        const pdfDoc: PDFDocument = {
          id: bookId,
          name: book.title,
          size: blob.size,
          uploadedAt: new Date(),
          pageCount: images.length > 0 ? Math.max(images.length, 1) : 1,
        };

        setUploadedPDF(pdfDoc);
        setPdfContent(content);
        setPdfImages(images);
        clearMessages();
        setSearchParams({});
        toast({ title: 'Ready to Chat', description: `Loaded ${book.title} successfully.` });

      } catch (error: any) {
        console.error('Book Load Error:', error);
        toast({ title: 'Error', description: error.message || 'Failed to load book', variant: 'destructive' });
      } finally {
        setIsLoadingBook(false);
      }
    };

    if (bookId) loadBook();
  }, [bookId, uploadedPDF, setUploadedPDF, setPdfContent, setPdfImages, clearMessages, setSearchParams]);

  const handleWelcomeComplete = () => {
    sessionStorage.setItem('gamify_welcomed', 'true');
    setShowWelcome(false);
    setTimeout(() => setContentReady(true), 100);
  };

  const renderContent = () => {
    // 1. Loading State
    if (isLoadingBook) {
      return <LoadingView title="Fetching from Library" />;
    }

    // 2. Empty State (No PDF)
    // If we are in 'chat' mode but no PDF is loaded, show the Hero Dashboard.
    if (!uploadedPDF && activeTab === 'chat') {
      return (
        <div className="h-full flex flex-col overflow-y-auto custom-scrollbar">
          <div className="flex-1 flex items-center justify-center">
             <EmptyStateHero />
          </div>
        </div>
      );
    }
    
    // If we are not in chat, but no PDF is loaded, we usually prompt upload.
    // However, tabs like 'notes' might work without a specific active PDF if designed that way.
    // Assuming other tabs need a PDF, we fallback to the empty hero or show the specific component.
    if (!uploadedPDF && activeTab !== 'chat') {
       // Optional: You could force redirect to chat, or show a simpler empty state.
       // For now, let's keep the user flow consistent:
       return (
         <div className="h-full flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <div className="bg-card border border-border rounded-xl p-8 max-w-md shadow-sm">
               <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
               <h3 className="text-lg font-semibold mb-2">Document Required</h3>
               <p className="text-muted-foreground mb-6">Please upload a document or select a book to access this feature.</p>
               <div className="space-y-4">
                 <PDFUpload />
                 <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border"/></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or</span></div>
                 </div>
                 <BookSelector />
               </div>
            </div>
         </div>
       );
    }

    // 3. Active Content State
    const contentClasses = "h-full animate-in fade-in slide-in-from-bottom-2 duration-500";
    
    switch (activeTab) {
      case 'chat':
        return (
          <div className="h-full flex flex-col overflow-hidden">
             {/* Note: The ChatInterface usually handles its own scrolling */}
             <div className="flex-1 min-h-0 bg-background/50 backdrop-blur-sm">
               <ChatInterface />
             </div>
          </div>
        );
      case 'practice':
        return <div className={contentClasses}><AnswerPractice /></div>;
      case 'test':
        return <div className={contentClasses}><MockTest /></div>;
      case 'notes':
        return <div className={contentClasses}><StudyNotes /></div>;
      default:
        return <ChatInterface />;
    }
  };

  return (
    <>
      {showWelcome && <WelcomeScreen onComplete={handleWelcomeComplete} />}

      <div
        className={cn(
          'min-h-screen bg-background text-foreground transition-all duration-500 ease-in-out',
          isFocusMode ? 'focus-mode' : '',
          contentReady ? 'opacity-100' : 'opacity-0'
        )}
      >
        <Header />
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main
          className={cn(
            'transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] pt-16', // pt-16 accounts for Header
            isSidebarOpen ? 'ml-0 md:ml-72' : 'ml-0',
            // Height calculation ensures we don't get double scrollbars
            'h-screen'
          )}
        >
          <div className="h-full p-4 md:p-6 overflow-hidden">
            {/* The Main Content Container:
              We add a nice paper/card effect here to distinguish content from the app background 
              if not in focus mode.
            */}
            <div className={cn(
              "h-full w-full rounded-3xl overflow-hidden transition-all duration-300 relative",
              isFocusMode 
                ? "bg-transparent" 
                : "bg-background/95 border border-border/50 shadow-sm md:shadow-xl ring-1 ring-black/5 dark:ring-white/5"
            )}>
              {/* Optional Background Texture/Gradient for the container */}
              {!isFocusMode && !uploadedPDF && (
                 <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-accent/5 pointer-events-none" />
              )}
              
              <div className="h-full relative z-10 paper-texture">
                {renderContent()}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

const Index: React.FC = () => {
  return <MainContent />;
};

export default Index;