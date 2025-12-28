import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { StudyMode, PDFDocument, Message, UserProgress } from '@/types';

interface AppContextType {
  // Theme
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // Focus Mode
  isFocusMode: boolean;
  toggleFocusMode: () => void;

  // Study Mode
  currentStudyMode: StudyMode;
  setStudyMode: (mode: StudyMode) => void;

  // PDF
  uploadedPDF: PDFDocument | null;
  setUploadedPDF: (pdf: PDFDocument | null) => void;
  pdfContent: string;
  setPdfContent: (content: string) => void;
  pdfImages: string[];
  setPdfImages: (images: string[]) => void;

  // Messages
  messages: Message[];
  addMessage: (message: Message) => void;
  clearMessages: () => void;

  // User Progress
  userProgress: UserProgress;
  addXP: (amount: number) => void;
  incrementQuestionsAnswered: () => void;
  incrementTestsCompleted: () => void;
  updateAccuracy: (correct: number, total: number) => void;

  // Sidebar
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const defaultProgress: UserProgress = {
  xp: 0,
  level: 1,
  streak: 1,
  questionsAnswered: 0,
  testsCompleted: 0,
  accuracy: 0,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [currentStudyMode, setCurrentStudyMode] = useState<StudyMode>('mains');
  const [uploadedPDF, setUploadedPDF] = useState<PDFDocument | null>(null);
  const [pdfContent, setPdfContent] = useState<string>('');
  const [pdfImages, setPdfImages] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress>(defaultProgress);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => {
      const newValue = !prev;
      if (newValue) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return newValue;
    });
  }, []);

  const toggleFocusMode = useCallback(() => {
    setIsFocusMode(prev => !prev);
  }, []);

  const setStudyMode = useCallback((mode: StudyMode) => {
    setCurrentStudyMode(mode);
  }, []);

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const addXP = useCallback((amount: number) => {
    setUserProgress(prev => {
      const newXP = prev.xp + amount;
      const xpPerLevel = 500;
      const newLevel = Math.floor(newXP / xpPerLevel) + 1;
      return {
        ...prev,
        xp: newXP,
        level: newLevel,
      };
    });
  }, []);

  const incrementQuestionsAnswered = useCallback(() => {
    setUserProgress(prev => ({
      ...prev,
      questionsAnswered: prev.questionsAnswered + 1,
    }));
  }, []);

  const incrementTestsCompleted = useCallback(() => {
    setUserProgress(prev => ({
      ...prev,
      testsCompleted: prev.testsCompleted + 1,
    }));
  }, []);

  const updateAccuracy = useCallback((correct: number, total: number) => {
    setUserProgress(prev => {
      const totalAnswered = prev.questionsAnswered + total;
      const prevCorrect = (prev.accuracy / 100) * prev.questionsAnswered;
      const newAccuracy = totalAnswered > 0 ? Math.round(((prevCorrect + correct) / totalAnswered) * 100) : 0;
      return {
        ...prev,
        accuracy: newAccuracy,
      };
    });
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  return (
    <AppContext.Provider
      value={{
        isDarkMode,
        toggleDarkMode,
        isFocusMode,
        toggleFocusMode,
        currentStudyMode,
        setStudyMode,
        uploadedPDF,
        setUploadedPDF,
        pdfContent,
        setPdfContent,
        pdfImages,
        setPdfImages,
        messages,
        addMessage,
        clearMessages,
        userProgress,
        addXP,
        incrementQuestionsAnswered,
        incrementTestsCompleted,
        updateAccuracy,
        isSidebarOpen,
        toggleSidebar,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
