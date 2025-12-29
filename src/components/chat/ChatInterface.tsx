import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Message, MentorAction, MessageMetadata } from '@/types';
import { mentorApi } from '@/lib/api/mentor';
import { toast } from '@/hooks/use-toast';
import {
  Send,
  Expand,
  Minimize2,
  Sparkles,
  Layers,
  Target,
  HelpCircle,
  AlertTriangle,
  History,
  Loader2,
  Bot,
  User,
  Settings,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import Admin from '@/pages/Admin';

const mentorActions: MentorAction[] = [
  { id: 'expand', label: 'Expand', icon: 'Expand', action: 'expand' },
  { id: 'shorten', label: 'Shorten', icon: 'Minimize2', action: 'shorten' },
  { id: 'topper', label: 'Topper Style', icon: 'Sparkles', action: 'topper' },
  { id: 'dimensions', label: 'Add Dimensions', icon: 'Layers', action: 'dimensions' },
  { id: 'examiner', label: 'Examiner View', icon: 'Target', action: 'examiner' },
  { id: 'why', label: 'Why This Matters', icon: 'HelpCircle', action: 'why' },
  { id: 'mistakes', label: 'Common Mistakes', icon: 'AlertTriangle', action: 'mistakes' },
  { id: 'pyq', label: 'PYQ Pattern', icon: 'History', action: 'pyq' },
];

const getActionIcon = (iconName: string) => {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    Expand,
    Minimize2,
    Sparkles,
    Layers,
    Target,
    HelpCircle,
    AlertTriangle,
    History,
  };
  return icons[iconName] || HelpCircle;
};

const highlightTrapWords = (text: string) => {
  const trapWords = ['only', 'always', 'never', 'all', 'completely', 'exclusively', 'none', 'every'];
  let highlighted = text;

  trapWords.forEach(word => {
    const regex = new RegExp(`\\b(${word})\\b`, 'gi');
    highlighted = highlighted.replace(regex, `<span class="trap-word">$1</span>`);
  });

  return highlighted;
};

const formatContent = (content: string) => {
  return content
    .replace(/\n/g, '<br/>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/📖/g, '<span class="text-success">📖</span>')
    .replace(/💡/g, '<span class="text-gold">💡</span>')
    .replace(/\[TRAP: (.*?)\]/g, '<span class="trap-word">$1</span>');
};

export const ChatInterface: React.FC = () => {
  const { messages, addMessage, uploadedPDF, currentStudyMode, addXP, pdfContent, pdfImages } = useApp();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!input.trim()) return;

    if (!uploadedPDF) {
      addMessage({
        id: crypto.randomUUID(),
        role: 'mentor',
        content: '⚠️ **Please upload a PDF first.**\n\nI need a study material to serve as the authoritative source for your preparation. Upload your NCERT, standard textbook, or notes to begin.',
        timestamp: new Date(),
      });
      return;
    }

    const hasText = !!pdfContent && pdfContent.trim().length >= 200;
    const hasImages = Array.isArray(pdfImages) && pdfImages.length > 0;

    if (!hasText && !hasImages) {
      addMessage({
        id: crypto.randomUUID(),
        role: 'mentor',
        content:
          '⚠️ **PDF content not loaded properly.**\n\nI couldn’t extract readable text or page images from this PDF. Please try:\n1. Re-uploading the PDF\n2. Using a different PDF\n3. Selecting another book from the library',
        timestamp: new Date(),
      });
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    addMessage(userMessage);
    const userQuery = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      const response = await mentorApi.chat(
        userQuery,
        currentStudyMode,
        pdfContent,
        uploadedPDF.name,
        messages,
        null,
        '',
        pdfImages
      );

      if (response.success && response.response) {
        const mentorMessage: Message = {
          id: crypto.randomUUID(),
          role: 'mentor',
          content: response.response,
          timestamp: new Date(),
          metadata: response.metadata,
          actions: mentorActions,
        };

        addMessage(mentorMessage);
        addXP(10);
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to get response from mentor',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: 'Connection Error',
        description: 'Failed to connect to the mentor. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = async (action: string) => {
    const lastMentorMessage = [...messages].reverse().find(m => m.role === 'mentor');
    if (!lastMentorMessage) return;

    setIsLoading(true);

    try {
      const response = await mentorApi.chat(
        '',
        currentStudyMode,
        pdfContent,
        uploadedPDF?.name || '',
        messages,
        action,
        lastMentorMessage.content
      );

      if (response.success && response.response) {
        const actionMessage: Message = {
          id: crypto.randomUUID(),
          role: 'mentor',
          content: response.response,
          timestamp: new Date(),
          metadata: response.metadata,
          actions: mentorActions,
        };

        addMessage(actionMessage);
        addXP(5);
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to process action',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Action error:', error);
      toast({
        title: 'Error',
        description: 'Failed to process action. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center mx-auto mb-4 shadow-gold animate-glow">
              <Bot className="w-10 h-10 text-accent-foreground" />
            </div>
            <h3 className="font-display text-xl font-semibold mb-2">Your UPSC Mentor</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {uploadedPDF
                ? `Ready to study from "${uploadedPDF.name}". Ask me anything about your preparation.`
                : "Upload your study material to begin. I'll use it as the primary source for all answers."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {['What is federalism?', 'Explain Article 21', 'Key features of Indian Constitution'].map((q, i) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="px-3 py-1.5 text-sm bg-muted rounded-full hover:bg-accent/20 transition-all duration-200 hover:scale-105 animate-fade-in"
                  style={{ animationDelay: `${300 + i * 100}ms` }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={message.id}
            className={cn(
              "animate-fade-in",
              message.role === 'user' && "flex justify-end"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className={cn(
              "chat-bubble",
              message.role === 'mentor' ? "chat-bubble-mentor" : "chat-bubble-user"
            )}>
              {/* Avatar */}
              <div className="flex items-start gap-3 mb-2">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                  message.role === 'mentor'
                    ? "bg-gradient-to-br from-gold to-gold-dark"
                    : "bg-primary-foreground/20"
                )}>
                  {message.role === 'mentor' ? (
                    <Bot className="w-4 h-4 text-accent-foreground" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium opacity-70 mb-1">
                    {message.role === 'mentor' ? 'GAMIFY IAS Mentor' : 'You'}
                  </p>
                </div>
              </div>

              {/* Content */}
              <div
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{
                  __html: highlightTrapWords(formatContent(message.content))
                }}
              />

              {/* Metadata */}
              {message.metadata && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/50">
                  <span className="metadata-tag">
                    📊 {message.metadata.confidence}
                  </span>
                  <span className="metadata-tag">
                    📖 {message.metadata.source}
                  </span>
                  <span className="metadata-tag">
                    {message.metadata.topicType === 'Static' ? '📌' : '🔄'} {message.metadata.topicType}
                  </span>
                  {message.metadata.mentorTip && (
                    <span className="metadata-tag bg-gold/10 text-gold">
                      💡 {message.metadata.mentorTip}
                    </span>
                  )}
                </div>
              )}

              {/* Actions */}
              {message.actions && message.actions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {message.actions.map((action, actionIndex) => {
                    const Icon = getActionIcon(action.icon);
                    return (
                      <button
                        key={action.id}
                        onClick={() => handleActionClick(action.action)}
                        disabled={isLoading}
                        className="action-button disabled:opacity-50 hover:scale-105 transition-all duration-200 animate-fade-in"
                        style={{ animationDelay: `${actionIndex * 50}ms` }}
                      >
                        <Icon className="w-3 h-3" />
                        {action.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="animate-fade-in">
            <div className="chat-bubble chat-bubble-mentor">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-accent-foreground animate-spin" />
                </div>
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={uploadedPDF ? "Ask your UPSC question..." : "Upload a PDF to start..."}
              disabled={isLoading}
              rows={1}
              className="w-full px-4 py-3 bg-background border border-input rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50"
            />
          </div>
          <Button
            type="submit"
            variant="gold"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="h-12 w-12 flex-shrink-0"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
        <div className="flex flex-col items-center gap-2 mt-2">
          <p className="text-xs text-muted-foreground text-center">
            Mode: <span className="font-medium text-foreground capitalize">{currentStudyMode.replace('-', ' ')}</span>
            {uploadedPDF && <span className="ml-2">• Source: {uploadedPDF.name}</span>}
          </p>

          <Dialog open={showAdmin} onOpenChange={setShowAdmin}>
            <DialogTrigger asChild>
              <button className="text-[10px] text-muted-foreground hover:text-accent transition-colors flex items-center gap-1">
                <Settings className="w-3 h-3" />
                Admin ?
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] w-[1200px] h-[90vh] p-0 overflow-hidden border-none bg-transparent shadow-2xl">
              <div className="w-full h-full bg-background rounded-xl shadow-2xl overflow-auto relative glass-effect border border-border">
                <div className="absolute top-4 right-12 z-50">
                  <button
                    onClick={() => setShowAdmin(false)}
                    className="p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <Minimize2 className="w-4 h-4" />
                  </button>
                </div>
                <Admin onHide={() => setShowAdmin(false)} />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};
