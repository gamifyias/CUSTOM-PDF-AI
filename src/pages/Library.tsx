import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import {
  Search,
  BookOpen,
  MessageCircle,
  Sparkles,
  GraduationCap,
  Library as LibraryIcon,
  Loader2,
  Book as BookIcon,
  Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useApp } from '@/contexts/AppContext';

// --- Types ---
interface Book {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  subjects: { name: string } | null;
}

// --- Sub-Components ---

const LibraryHero = () => (
  <div className="relative rounded-3xl overflow-hidden bg-primary/5 border border-border/50 shadow-xl mb-10 group">
    {/* Abstract Background Decoration */}
    <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-black/10 pointer-events-none" />
    <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
    <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

    <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div className="space-y-4 max-w-2xl">
        <Badge variant="outline" className="bg-background/50 backdrop-blur border-primary/20 text-primary px-3 py-1">
          <LibraryIcon className="w-3 h-3 mr-2" />
          Knowledge Base
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
          Your Digital <span className="text-primary">Athenaeum</span>
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Access verified study materials and standard textbooks. Select a book to start an interactive session with your AI tutor.
        </p>
      </div>
      
      {/* Visual Accent Icon */}
      <div className="hidden md:flex items-center justify-center w-32 h-32 bg-background/30 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg transform rotate-6 transition-transform group-hover:rotate-12 duration-500">
        <BookOpen className="w-16 h-16 text-primary/80" />
      </div>
    </div>
  </div>
);

const SearchToolbar = ({ 
  searchQuery, 
  setSearchQuery, 
  totalBooks 
}: { 
  searchQuery: string; 
  setSearchQuery: (v: string) => void; 
  totalBooks: number 
}) => (
  <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8 sticky top-0 z-20 py-4 bg-background/80 backdrop-blur-md -mx-4 px-4 md:-mx-6 md:px-6 transition-all">
    <div className="flex items-center gap-2">
      <div className="p-2 bg-accent/10 rounded-lg text-accent">
        <Sparkles className="w-5 h-5" />
      </div>
      <div>
        <h2 className="text-xl font-semibold">Collection</h2>
        <p className="text-xs text-muted-foreground">{totalBooks} Items Available</p>
      </div>
    </div>

    <div className="flex items-center gap-2 w-full md:w-auto">
      <div className="relative group w-full md:w-80">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        </div>
        <Input
          type="text"
          className="pl-10 h-11 bg-card/50 border-border/50 focus:bg-card hover:border-primary/30 focus:border-primary/50 transition-all rounded-xl shadow-sm"
          placeholder="Search by title, author..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-border/50 hover:border-primary/30 hover:bg-accent/5">
        <Filter className="w-4 h-4 text-muted-foreground" />
      </Button>
    </div>
  </div>
);

const BookCard = ({ book, onChat }: { book: Book; onChat: (id: string) => void }) => (
  <div 
    className="group relative flex flex-col h-full bg-card rounded-2xl border border-border/50 shadow-sm hover:shadow-xl hover:border-primary/30 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
  >
    {/* Card Header / Cover Area */}
    <div className="relative h-48 bg-gradient-to-br from-muted to-card overflow-hidden">
      <div className="absolute inset-0 bg-grid-black/5 dark:bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,black)]" />
      
      {/* Floating Book Icon */}
      <div className="absolute inset-0 flex items-center justify-center pt-4">
        <div className="w-24 h-32 bg-background rounded shadow-2xl flex items-center justify-center border-l-4 border-primary/40 transform group-hover:scale-105 group-hover:-rotate-2 transition-transform duration-500">
           <BookIcon className="w-10 h-10 text-primary/60" />
        </div>
      </div>
      
      {/* Subject Badge */}
      <div className="absolute top-3 right-3">
        <Badge variant="secondary" className="bg-background/80 backdrop-blur shadow-sm text-xs font-medium">
          {book.subjects?.name || 'General'}
        </Badge>
      </div>
    </div>

    {/* Content */}
    <div className="flex flex-col flex-1 p-5">
      <div className="flex-1 space-y-2">
        <h3 className="font-semibold text-lg leading-tight line-clamp-1 group-hover:text-primary transition-colors" title={book.title}>
          {book.title}
        </h3>
        <div className="flex items-center text-sm text-muted-foreground">
          <GraduationCap className="w-3 h-3 mr-1.5" />
          <span className="truncate">{book.author || 'Unknown Author'}</span>
        </div>
        <p className="text-xs text-muted-foreground/80 line-clamp-2 mt-2 h-8">
          {book.description || "No description available for this resource."}
        </p>
      </div>

      <div className="mt-5 pt-4 border-t border-border/50">
        <Button 
          onClick={() => onChat(book.id)}
          className="w-full bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground font-medium transition-all shadow-none hover:shadow-lg group-hover:scale-[1.02]"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Start Chat
        </Button>
      </div>
    </div>
  </div>
);

const EmptyState = ({ clearSearch }: { clearSearch: () => void }) => (
  <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in border-2 border-dashed border-border/50 rounded-3xl bg-card/30">
    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
      <Search className="w-8 h-8 text-muted-foreground" />
    </div>
    <h3 className="text-xl font-semibold mb-2">No books found</h3>
    <p className="text-muted-foreground max-w-md mb-6">
      We couldn't find any books matching your search criteria. Try using broader keywords.
    </p>
    <Button onClick={clearSearch} variant="outline">
      Clear Search Filters
    </Button>
  </div>
);

const BookSkeleton = () => (
  <div className="space-y-3">
    <div className="h-48 bg-muted/40 rounded-2xl animate-pulse" />
    <div className="space-y-2 p-2">
      <div className="h-4 w-3/4 bg-muted/40 rounded animate-pulse" />
      <div className="h-3 w-1/2 bg-muted/40 rounded animate-pulse" />
    </div>
  </div>
);

// --- Main Component ---

export const Library: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [fetchError, setFetchError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { isSidebarOpen } = useApp();
  const [activeTab, setActiveTab] = useState('library');

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*, subjects(name)')
        .order('title');

      if (error) throw error;
      setBooks(data as any || []);
    } catch (error: any) {
      console.error("Fetch Error:", error);
      // Fallback
      try {
        const { data: simpleData, error: simpleError } = await supabase
          .from('books').select('*').order('title');
        if (simpleError) throw simpleError;
        setBooks((simpleData || []).map((b: any) => ({ ...b, subjects: null })));
        toast({ title: 'Partial Load', description: 'Some categories unavailable.' });
      } catch (finalError: any) {
        setFetchError(finalError.message);
        toast({ title: 'Library Error', description: 'Could not load library.', variant: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startChat = (bookId: string) => {
    navigate(`/?bookId=${bookId}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className={cn(
          "flex-1 transition-all duration-300 relative z-10 overflow-y-auto",
          isSidebarOpen ? "ml-0 md:ml-72" : "ml-0"
        )}>
          <div className="min-h-full p-6 md:p-8 max-w-7xl mx-auto w-full">
            
            <LibraryHero />
            
            <SearchToolbar 
              searchQuery={searchQuery} 
              setSearchQuery={setSearchQuery} 
              totalBooks={filteredBooks.length} 
            />

            <div className="animate-in slide-in-from-bottom-4 duration-700 fade-in">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, i) => <BookSkeleton key={i} />)}
                </div>
              ) : filteredBooks.length === 0 ? (
                <EmptyState clearSearch={() => setSearchQuery('')} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                  {filteredBooks.map((book) => (
                    <BookCard key={book.id} book={book} onChat={startChat} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};``