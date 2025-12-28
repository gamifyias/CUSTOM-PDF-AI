import { supabase } from '@/integrations/supabase/client';

export interface BookPDF {
  id: string;
  book_id: string;
  pdf_url: string;
  pdf_name: string;
  file_size: number | null;
  created_at: string;
}

export interface Book {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  image_url: string | null;
  subject: string | null;
  created_at: string;
  updated_at: string;
  pdfs?: BookPDF[];
}

interface AdminResponse {
  success: boolean;
  message?: string;
  error?: string;
  book?: Book;
  books?: Book[];
  pdf?: BookPDF;
}

const getStoredCredentials = () => {
  const stored = sessionStorage.getItem('admin_credentials');
  if (stored) {
    return JSON.parse(stored);
  }
  return null;
};

export const adminApi = {
  async login(adminId: string, adminPassword: string): Promise<AdminResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: { action: 'login', adminId, adminPassword }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.success) {
        sessionStorage.setItem('admin_credentials', JSON.stringify({ adminId, adminPassword }));
      }

      return data;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Login failed' };
    }
  },

  async logout(): Promise<void> {
    sessionStorage.removeItem('admin_credentials');
  },

  isLoggedIn(): boolean {
    return !!getStoredCredentials();
  },

  async changeCredentials(newAdminId: string, newPassword: string): Promise<AdminResponse> {
    const creds = getStoredCredentials();
    if (!creds) return { success: false, error: 'Not logged in' };

    try {
      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: { 
          action: 'change-credentials', 
          adminId: creds.adminId, 
          adminPassword: creds.adminPassword,
          newAdminId,
          newPassword
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.success) {
        sessionStorage.setItem('admin_credentials', JSON.stringify({ adminId: newAdminId, adminPassword: newPassword }));
      }

      return data;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to change credentials' };
    }
  },

  async addBook(book: Omit<Book, 'id' | 'created_at' | 'updated_at' | 'pdfs'>): Promise<AdminResponse> {
    const creds = getStoredCredentials();
    if (!creds) return { success: false, error: 'Not logged in' };

    try {
      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: { 
          action: 'add-book', 
          adminId: creds.adminId, 
          adminPassword: creds.adminPassword,
          book
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return data;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to add book' };
    }
  },

  async updateBook(bookId: string, book: Partial<Book>): Promise<AdminResponse> {
    const creds = getStoredCredentials();
    if (!creds) return { success: false, error: 'Not logged in' };

    try {
      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: { 
          action: 'update-book', 
          adminId: creds.adminId, 
          adminPassword: creds.adminPassword,
          bookId,
          book
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return data;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update book' };
    }
  },

  async deleteBook(bookId: string): Promise<AdminResponse> {
    const creds = getStoredCredentials();
    if (!creds) return { success: false, error: 'Not logged in' };

    try {
      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: { 
          action: 'delete-book', 
          adminId: creds.adminId, 
          adminPassword: creds.adminPassword,
          bookId
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return data;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete book' };
    }
  },

  async getBooks(): Promise<AdminResponse> {
    const creds = getStoredCredentials();
    if (!creds) return { success: false, error: 'Not logged in' };

    try {
      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: { 
          action: 'get-books', 
          adminId: creds.adminId, 
          adminPassword: creds.adminPassword
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return data;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch books' };
    }
  },

  async uploadImage(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      const { data, error } = await supabase.storage
        .from('book-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        return { success: false, error: error.message };
      }

      const { data: urlData } = supabase.storage
        .from('book-images')
        .getPublicUrl(data.path);

      return { success: true, url: urlData.publicUrl };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Upload failed' };
    }
  },

  async uploadPDF(file: File, bookId: string): Promise<{ success: boolean; pdf?: BookPDF; error?: string }> {
    const creds = getStoredCredentials();
    if (!creds) return { success: false, error: 'Not logged in' };

    try {
      const fileName = `${bookId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      const { data, error } = await supabase.storage
        .from('book-pdfs')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('PDF Upload error:', error);
        return { success: false, error: error.message };
      }

      const { data: urlData } = supabase.storage
        .from('book-pdfs')
        .getPublicUrl(data.path);

      // Add PDF record to database
      const { data: result, error: invokeError } = await supabase.functions.invoke('admin-auth', {
        body: { 
          action: 'add-pdf', 
          adminId: creds.adminId, 
          adminPassword: creds.adminPassword,
          bookId,
          pdfUrl: urlData.publicUrl,
          pdfName: file.name,
          fileSize: file.size
        }
      });

      if (invokeError) {
        return { success: false, error: invokeError.message };
      }

      return result;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'PDF upload failed' };
    }
  },

  async deletePDF(pdfId: string): Promise<AdminResponse> {
    const creds = getStoredCredentials();
    if (!creds) return { success: false, error: 'Not logged in' };

    try {
      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: { 
          action: 'delete-pdf', 
          adminId: creds.adminId, 
          adminPassword: creds.adminPassword,
          pdfId
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return data;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete PDF' };
    }
  }
};

// Public API for fetching books (no auth required)
export const booksApi = {
  async getAll(): Promise<Book[]> {
    const { data: books, error } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching books:', error);
      return [];
    }

    // Fetch PDFs for each book
    const booksWithPdfs = await Promise.all(
      (books || []).map(async (book) => {
        const { data: pdfs } = await supabase
          .from('book_pdfs')
          .select('*')
          .eq('book_id', book.id)
          .order('created_at', { ascending: true });

        return {
          ...book,
          pdfs: (pdfs || []) as BookPDF[],
        } as Book;
      })
    );

    return booksWithPdfs;
  },

  async getPDFContent(pdfUrl: string): Promise<string> {
    try {
      console.log('Fetching PDF from:', pdfUrl);

      const response = await fetch(pdfUrl, {
        mode: 'cors',
        credentials: 'omit',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      console.log('PDF blob size:', blob.size);

      if (blob.size === 0) {
        throw new Error('PDF file is empty');
      }

      const arrayBuffer = await blob.arrayBuffer();
      const pdfjsLib = await import('pdfjs-dist');

      // Use the worker from unpkg which is more reliable
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      console.log('PDF loaded, total pages:', pdf.numPages);

      let fullText = '';
      const maxPages = Math.min(pdf.numPages, 100);

      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = (textContent.items as any[])
          .map((item) => (typeof item?.str === 'string' ? item.str : ''))
          .join(' ');
        fullText += pageText + '\n\n';
      }

      fullText = fullText
        .replace(/\s+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      console.log('Extracted text length:', fullText.length);

      return fullText;
    } catch (error) {
      console.error('Error extracting PDF content:', error);
      throw error;
    }
  },

  async getPDFPageImages(
    pdfUrl: string,
    opts: { maxPages?: number; maxWidth?: number } = {}
  ): Promise<string[]> {
    const maxPages = Math.max(1, Math.min(opts.maxPages ?? 3, 5));
    const maxWidth = Math.max(640, Math.min(opts.maxWidth ?? 1024, 1280));

    console.log('Generating PDF page images from:', pdfUrl);

    const response = await fetch(pdfUrl, {
      mode: 'cors',
      credentials: 'omit',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch PDF for image render: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    if (blob.size === 0) throw new Error('PDF file is empty');

    const arrayBuffer = await blob.arrayBuffer();
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;
    const pagesToRender = Math.min(totalPages, maxPages);

    const images: string[] = [];

    for (let i = 1; i <= pagesToRender; i++) {
      const page = await pdf.getPage(i);
      const viewportBase = page.getViewport({ scale: 1 });
      const scale = Math.min(2, maxWidth / viewportBase.width);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) continue;

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      await page.render({ canvasContext: context, viewport, canvas }).promise;
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      images.push(dataUrl);
    }

    console.log('Generated images:', images.length);
    return images;
  },
};
