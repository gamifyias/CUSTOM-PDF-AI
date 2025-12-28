import React, { useState, useEffect } from 'react';
import { booksApi, Book, BookPDF } from '@/lib/api/admin';
import { useApp } from '@/contexts/AppContext';
import { BookOpen, ImageIcon, Download, MessageSquare, FileText, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

export const BooksSection: React.FC = () => {
  const { setUploadedPDF, setPdfContent, setPdfImages } = useApp();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingBookId, setLoadingBookId] = useState<string | null>(null);
  const [expandedBook, setExpandedBook] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooks = async () => {
      const data = await booksApi.getAll();
      setBooks(data);
      setIsLoading(false);
    };
    fetchBooks();
  }, []);

  const handleDownload = async (pdf: BookPDF) => {
    try {
      // Fetch the file and create a blob URL to force download
      const response = await fetch(pdf.pdf_url);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = pdf.pdf_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
      toast({ title: 'Download started', description: pdf.pdf_name });
    } catch (error) {
      console.error('Download error:', error);
      // Fallback: open in new tab
      window.open(pdf.pdf_url, '_blank');
    }
  };

  const handleUseBook = async (book: Book, pdf: BookPDF) => {
    setLoadingBookId(book.id);
    try {
      toast({ title: 'Loading book...', description: `Preparing "${pdf.pdf_name}" for study` });

      // First try text extraction (fast & cheap)
      const content = await booksApi.getPDFContent(pdf.pdf_url);
      console.log('PDF content loaded, length:', content.length);

      // If text is sparse (scanned PDF), fall back to page images for OCR in the mentor.
      const shouldUseImages = !content || content.trim().length < 400;
      const images = shouldUseImages ? await booksApi.getPDFPageImages(pdf.pdf_url, { maxPages: 3 }) : [];

      if (!content && images.length === 0) {
        throw new Error('Unable to read this PDF. Please try downloading it or upload a different PDF.');
      }

      setUploadedPDF({
        id: pdf.id,
        name: pdf.pdf_name,
        size: pdf.file_size || 0,
        uploadedAt: new Date(),
      });

      setPdfContent(content || '');
      setPdfImages(images);

      toast({
        title: 'Book ready!',
        description:
          images.length > 0
            ? `Scanned PDF detected — using ${images.length} page image(s) for OCR. You can now chat about "${book.title}".`
            : `${content.length.toLocaleString()} characters extracted. You can now chat about "${book.title}".`,
      });
    } catch (error) {
      console.error('Error loading book:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load book content';
      toast({
        title: 'Error loading PDF',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoadingBookId(null);
    }
  };

  const toggleExpanded = (bookId: string) => {
    setExpandedBook(expandedBook === bookId ? null : bookId);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (books.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center animate-glow">
          <BookOpen className="w-4 h-4 text-accent-foreground" />
        </div>
        <h2 className="font-display text-xl font-semibold">Study Materials</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {books.map((book, index) => {
          const isExpanded = expandedBook === book.id;
          const hasPdfs = book.pdfs && book.pdfs.length > 0;
          const isLoadingThis = loadingBookId === book.id;

          return (
            <div
              key={book.id}
              className="mentor-card hover:border-accent/50 transition-all duration-300 hover-lift animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex gap-4">
                <div className="w-20 h-28 flex-shrink-0 bg-muted rounded overflow-hidden">
                  {book.image_url ? (
                    <img
                      src={book.image_url}
                      alt={book.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        target.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground line-clamp-2">
                    {book.title}
                  </h3>
                  {book.author && (
                    <p className="text-sm text-muted-foreground mt-1">{book.author}</p>
                  )}
                  {book.subject && (
                    <span className="inline-block mt-2 px-2 py-0.5 bg-accent/10 rounded text-xs text-accent font-medium">
                      {book.subject}
                    </span>
                  )}
                  {book.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      {book.description}
                    </p>
                  )}
                </div>
              </div>

              {/* PDFs Section */}
              {hasPdfs && (
                <div className="mt-4 border-t border-border pt-3">
                  <button
                    onClick={() => toggleExpanded(book.id)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
                  >
                    <FileText className="w-4 h-4" />
                    <span>{book.pdfs!.length} PDF{book.pdfs!.length > 1 ? 's' : ''} available</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
                  </button>

                  {isExpanded && (
                    <div className="mt-3 space-y-2">
                      {book.pdfs!.map((pdf) => (
                        <div key={pdf.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                          <FileText className="w-4 h-4 text-accent flex-shrink-0" />
                          <span className="text-sm truncate flex-1">{pdf.pdf_name}</span>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(pdf)}
                              className="h-7 px-2"
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="gold"
                              size="sm"
                              onClick={() => handleUseBook(book, pdf)}
                              disabled={isLoadingThis}
                              className="h-7 px-2"
                            >
                              {isLoadingThis ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <MessageSquare className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Quick actions when single PDF */}
              {hasPdfs && book.pdfs!.length === 1 && !isExpanded && (
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(book.pdfs![0])}
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                  <Button
                    variant="gold"
                    size="sm"
                    onClick={() => handleUseBook(book, book.pdfs![0])}
                    disabled={isLoadingThis}
                    className="flex-1"
                  >
                    {isLoadingThis ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Study
                      </>
                    )}
                  </Button>
                </div>
              )}

              {!hasPdfs && (
                <p className="mt-4 text-xs text-muted-foreground italic">No PDFs available</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
