import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { adminApi, Book, BookPDF } from '@/lib/api/admin';
import { cn } from '@/lib/utils';
import {
  LogOut, Plus, Trash2, Edit2, Upload, BookOpen, Settings,
  Save, X, Loader2, ImageIcon, FileText
} from 'lucide-react';

type Tab = 'books' | 'settings';

export default function Admin({ onHide }: { onHide?: () => void }) {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('books');

  // Login state
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Books state
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formAuthor, setFormAuthor] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // PDF upload state
  const [uploadingPdfBookId, setUploadingPdfBookId] = useState<string | null>(null);

  // Settings state
  const [newAdminId, setNewAdminId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingCreds, setIsChangingCreds] = useState(false);

  useEffect(() => {
    setIsLoggedIn(adminApi.isLoggedIn());
    setIsLoading(false);
  }, []);

  const fetchBooks = useCallback(async () => {
    setIsLoadingBooks(true);
    const result = await adminApi.getBooks();
    if (result.success && result.books) {
      setBooks(result.books);
    } else {
      toast({ title: 'Error', description: result.error || 'Failed to load books', variant: 'destructive' });
    }
    setIsLoadingBooks(false);
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchBooks();
    }
  }, [isLoggedIn, fetchBooks]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId.trim() || !loginPassword.trim()) {
      toast({ title: 'Error', description: 'Please enter ID and password', variant: 'destructive' });
      return;
    }

    setIsLoggingIn(true);
    const result = await adminApi.login(loginId, loginPassword);
    if (result.success) {
      setIsLoggedIn(true);
      toast({ title: 'Success', description: 'Logged in successfully' });
    } else {
      toast({ title: 'Login Failed', description: result.error || 'Invalid credentials', variant: 'destructive' });
    }
    setIsLoggingIn(false);
  };

  const handleLogout = () => {
    adminApi.logout();
    setIsLoggedIn(false);
    setBooks([]);
    setLoginId('');
    setLoginPassword('');
    toast({ title: 'Logged out', description: 'You have been logged out' });
  };

  const resetForm = () => {
    setFormTitle('');
    setFormAuthor('');
    setFormDescription('');
    setFormSubject('');
    setFormImageUrl('');
    setShowAddForm(false);
    setEditingBook(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Error', description: 'Please upload an image file', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    const result = await adminApi.uploadImage(file);
    if (result.success && result.url) {
      setFormImageUrl(result.url);
      toast({ title: 'Success', description: 'Image uploaded' });
    } else {
      toast({ title: 'Upload Failed', description: result.error || 'Failed to upload image', variant: 'destructive' });
    }
    setIsUploading(false);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>, bookId: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingPdfBookId(bookId);

    for (const file of Array.from(files)) {
      if (file.type !== 'application/pdf') {
        toast({ title: 'Error', description: `"${file.name}" is not a PDF file`, variant: 'destructive' });
        continue;
      }

      const result = await adminApi.uploadPDF(file, bookId);
      if (result.success) {
        toast({ title: 'Success', description: `"${file.name}" uploaded` });
      } else {
        toast({ title: 'Upload Failed', description: result.error || `Failed to upload "${file.name}"`, variant: 'destructive' });
      }
    }

    setUploadingPdfBookId(null);
    fetchBooks();
  };

  const handleDeletePdf = async (pdfId: string) => {
    if (!confirm('Are you sure you want to delete this PDF?')) return;

    const result = await adminApi.deletePDF(pdfId);
    if (result.success) {
      toast({ title: 'Deleted', description: 'PDF removed' });
      fetchBooks();
    } else {
      toast({ title: 'Error', description: result.error || 'Failed to delete PDF', variant: 'destructive' });
    }
  };

  const handleSaveBook = async () => {
    if (!formTitle.trim()) {
      toast({ title: 'Error', description: 'Book title is required', variant: 'destructive' });
      return;
    }

    setIsSaving(true);

    const bookData = {
      title: formTitle.trim(),
      author: formAuthor.trim() || null,
      description: formDescription.trim() || null,
      subject: formSubject.trim() || null,
      image_url: formImageUrl.trim() || null,
    };

    let result;
    if (editingBook) {
      result = await adminApi.updateBook(editingBook.id, bookData);
    } else {
      result = await adminApi.addBook(bookData);
    }

    if (result.success) {
      toast({ title: 'Success', description: editingBook ? 'Book updated' : 'Book added' });
      resetForm();
      fetchBooks();
    } else {
      toast({ title: 'Error', description: result.error || 'Failed to save book', variant: 'destructive' });
    }

    setIsSaving(false);
  };

  const handleEditBook = (book: Book) => {
    setEditingBook(book);
    setFormTitle(book.title);
    setFormAuthor(book.author || '');
    setFormDescription(book.description || '');
    setFormSubject(book.subject || '');
    setFormImageUrl(book.image_url || '');
    setShowAddForm(true);
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!confirm('Are you sure you want to delete this book? All associated PDFs will also be deleted.')) return;

    const result = await adminApi.deleteBook(bookId);
    if (result.success) {
      toast({ title: 'Deleted', description: 'Book removed' });
      fetchBooks();
    } else {
      toast({ title: 'Error', description: result.error || 'Failed to delete book', variant: 'destructive' });
    }
  };

  const handleChangeCredentials = async () => {
    if (!newAdminId.trim() || !newPassword.trim()) {
      toast({ title: 'Error', description: 'New ID and password are required', variant: 'destructive' });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    if (newPassword.length < 8) {
      toast({ title: 'Error', description: 'Password must be at least 8 characters', variant: 'destructive' });
      return;
    }

    setIsChangingCreds(true);
    const result = await adminApi.changeCredentials(newAdminId.trim(), newPassword);
    if (result.success) {
      toast({ title: 'Success', description: 'Credentials updated. Please remember your new login details.' });
      setNewAdminId('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      toast({ title: 'Error', description: result.error || 'Failed to change credentials', variant: 'destructive' });
    }
    setIsChangingCreds(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mentor-card">
            <div className="text-center mb-6">
              <h1 className="font-display text-2xl font-bold text-foreground">Admin Login</h1>
              <p className="text-sm text-muted-foreground mt-1">GAMIFY IAS Administration</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Admin ID</label>
                <Input
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="Enter admin ID"
                  disabled={isLoggingIn}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <Input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter password"
                  disabled={isLoggingIn}
                />
              </div>
              <Button type="submit" variant="gold" className="w-full" disabled={isLoggingIn}>
                {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Login'}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Button variant="ghost" size="sm" onClick={() => onHide ? onHide() : navigate('/')}>
                ← {onHide ? 'Close' : 'Back to Home'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-accent" />
          <h1 className="font-display text-xl font-bold">GAMIFY IAS Admin</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => onHide ? onHide() : navigate('/')}>
            {onHide ? 'Close' : 'View Site'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-48 bg-card border-r border-border min-h-[calc(100vh-57px)] p-4">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('books')}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                activeTab === 'books' ? "bg-accent/10 text-accent" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <BookOpen className="w-4 h-4" />
              Manage Books
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                activeTab === 'settings' ? "bg-accent/10 text-accent" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeTab === 'books' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl font-bold">Books</h2>
                {!showAddForm && (
                  <Button variant="gold" onClick={() => setShowAddForm(true)}>
                    <Plus className="w-4 h-4" />
                    Add Book
                  </Button>
                )}
              </div>

              {/* Add/Edit Form */}
              {showAddForm && (
                <div className="mentor-card mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">{editingBook ? 'Edit Book' : 'Add New Book'}</h3>
                    <Button variant="ghost" size="icon" onClick={resetForm}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium mb-1">Title *</label>
                      <Input
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        placeholder="Book title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Author</label>
                      <Input
                        value={formAuthor}
                        onChange={(e) => setFormAuthor(e.target.value)}
                        placeholder="Author name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Subject</label>
                      <Input
                        value={formSubject}
                        onChange={(e) => setFormSubject(e.target.value)}
                        placeholder="e.g., Polity, History, Geography"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Book Image</label>
                      <div className="flex gap-2">
                        <Input
                          value={formImageUrl}
                          onChange={(e) => setFormImageUrl(e.target.value)}
                          placeholder="Image URL"
                          className="flex-1"
                        />
                        <label className="cursor-pointer">
                          <Button variant="outline" size="icon" asChild disabled={isUploading}>
                            <span>
                              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            </span>
                          </Button>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={isUploading}
                          />
                        </label>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <Textarea
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        placeholder="Book description"
                        rows={3}
                      />
                    </div>
                  </div>

                  {formImageUrl && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Preview:</p>
                      <img
                        src={formImageUrl}
                        alt="Book preview"
                        className="w-24 h-32 object-cover rounded border border-border"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <Button variant="gold" onClick={handleSaveBook} disabled={isSaving}>
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {editingBook ? 'Update Book' : 'Add Book'}
                    </Button>
                    <Button variant="outline" onClick={resetForm}>Cancel</Button>
                  </div>
                </div>
              )}

              {/* Books List */}
              {isLoadingBooks ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-accent" />
                </div>
              ) : books.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No books added yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {books.map((book) => (
                    <div key={book.id} className="mentor-card">
                      <div className="flex gap-4">
                        <div className="w-20 h-28 flex-shrink-0 bg-muted rounded overflow-hidden">
                          {book.image_url ? (
                            <img
                              src={book.image_url}
                              alt={book.title}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold">{book.title}</h4>
                              {book.author && <p className="text-sm text-muted-foreground">{book.author}</p>}
                              {book.subject && (
                                <span className="inline-block mt-1 px-2 py-0.5 bg-accent/10 rounded text-xs text-accent">
                                  {book.subject}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleEditBook(book)}>
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteBook(book.id)}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                          {book.description && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{book.description}</p>
                          )}
                        </div>
                      </div>

                      {/* PDFs Section */}
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-sm font-medium flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            PDF Files ({book.pdfs?.length || 0})
                          </h5>
                          <label className="cursor-pointer">
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              disabled={uploadingPdfBookId === book.id}
                            >
                              <span>
                                {uploadingPdfBookId === book.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <Upload className="w-4 h-4" />
                                    Add PDF
                                  </>
                                )}
                              </span>
                            </Button>
                            <input
                              type="file"
                              accept="application/pdf"
                              multiple
                              onChange={(e) => handlePdfUpload(e, book.id)}
                              className="hidden"
                              disabled={uploadingPdfBookId === book.id}
                            />
                          </label>
                        </div>

                        {book.pdfs && book.pdfs.length > 0 ? (
                          <div className="space-y-2">
                            {book.pdfs.map((pdf) => (
                              <div key={pdf.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                                <FileText className="w-4 h-4 text-accent flex-shrink-0" />
                                <span className="text-sm truncate flex-1">{pdf.pdf_name}</span>
                                {pdf.file_size && (
                                  <span className="text-xs text-muted-foreground">
                                    {(pdf.file_size / 1024 / 1024).toFixed(2)} MB
                                  </span>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleDeletePdf(pdf.id)}
                                >
                                  <Trash2 className="w-3 h-3 text-destructive" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">No PDFs uploaded yet</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h2 className="font-display text-2xl font-bold mb-6">Settings</h2>

              <div className="mentor-card max-w-md">
                <h3 className="font-semibold mb-4">Change Admin Credentials</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Update your admin ID and password. Make sure to remember the new credentials!
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">New Admin ID</label>
                    <Input
                      value={newAdminId}
                      onChange={(e) => setNewAdminId(e.target.value)}
                      placeholder="Enter new admin ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">New Password</label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 8 chars)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Confirm Password</label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>
                  <Button variant="gold" onClick={handleChangeCredentials} disabled={isChangingCreds}>
                    {isChangingCreds ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Update Credentials
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
