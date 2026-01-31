import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Plus, Search, Book, Trash2, Edit2, Loader2, BookOpen, User as UserIcon, Calendar, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Interfaces ---
interface Book {
    id: string;
    title: string;
    author: string | null;
    description: string | null;
    subject_id: string | null;
    topic_id: string | null;
    created_at: string;
    subjects?: { name: string } | null; // Optional: for displaying subject name if you join
}

interface Subject {
    id: string;
    name: string;
}

export const BookManager: React.FC = () => {
    // --- State ---
    const [books, setBooks] = useState<Book[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]); // New State for Subjects
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Updated Form Data to include subject_id
    const [formData, setFormData] = useState({
        title: '',
        author: '',
        description: '',
        subject_id: '', 
    });

    // --- Effects ---
    useEffect(() => {
        fetchBooks();
        fetchSubjects(); // Fetch subjects on load
    }, []);

    // --- Data Fetching ---
    const fetchSubjects = async () => {
        try {
            const { data, error } = await supabase
                .from('subjects')
                .select('id, name')
                .order('name');
            
            if (error) throw error;
            if (data) setSubjects(data);
        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    };

    const fetchBooks = async () => {
        setLoading(true);
        try {
            // We select * and also join subjects to show the name if needed
            const { data, error } = await supabase
                .from('books')
                .select('*, subjects(name)')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setBooks(data as any);
        } catch (error: any) {
            console.error('Fetch books error:', error);
            toast({ title: 'Error fetching books', description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    // --- Handlers ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            toast({ title: 'Validation Error', description: 'Book title is required', variant: 'destructive' });
            return;
        }

        setIsSaving(true);
        try {
            // Prepare payload: convert empty string to null for UUID fields
            const payload = {
                title: formData.title,
                author: formData.author,
                description: formData.description,
                subject_id: formData.subject_id || null, // Critical Fix
                is_active: true
            };

            const { error } = await supabase.from('books').insert([payload]);
            if (error) throw error;

            toast({ title: 'Book Added', description: `${formData.title} has been added to the library.` });
            setIsAdding(false);
            // Reset form
            setFormData({ title: '', author: '', description: '', subject_id: '' });
            fetchBooks();
        } catch (error: any) {
            console.error('Add book error:', error);
            toast({ title: 'Failed to add book', description: error.message, variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    const deleteBook = async (id: string, title: string) => {
        const confirmMessage = `⚠️ CRITICAL WARNING ⚠️\n\nYou are about to delete:\n"${title}"\n\nThis will remove it from the catalog. Related files might become orphaned.\n\nProceed?`;
        if (!confirm(confirmMessage)) return;

        setIsDeleting(id);
        try {
            const { error } = await supabase.from('books').delete().eq('id', id);
            if (error) throw error;

            toast({ title: 'Book Deleted', description: 'Entry removed successfully.' });
            fetchBooks();
        } catch (error: any) {
            console.error('Delete book error:', error);
            toast({ title: 'Delete Failed', description: error.message, variant: 'destructive' });
        } finally {
            setIsDeleting(null);
        }
    };

    const filteredBooks = books.filter(book =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (book.author?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    );

    // --- Render ---
    return (
        <div className="space-y-10 animate-fade-in">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-bold font-display tracking-tight">Library Catalog</h2>
                    <p className="text-muted-foreground text-lg">Organize and manage curriculum resources</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-gold transition-colors" />
                        <Input
                            placeholder="Search catalog..."
                            className="pl-10 w-full md:w-64 bg-card border-border/50 focus:ring-gold/20"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button
                        onClick={() => setIsAdding(!isAdding)}
                        className={cn(
                            "shadow-gold/10 font-bold transition-all duration-300",
                            isAdding
                                ? "bg-destructive hover:bg-destructive/90 text-white px-6"
                                : "bg-gold hover:bg-gold-light text-navy-dark px-6 border-b-4 border-gold-dark active:border-b-0 active:translate-y-[2px]"
                        )}
                    >
                        {isAdding ? 'Close Form' : <><Plus className="w-5 h-5 mr-2" /> New Book</>}
                    </Button>
                </div>
            </div>

            {/* Add Book Form */}
            {isAdding && (
                <Card className="glass-effect border-gold/20 shadow-elevated overflow-hidden animate-slide-in-top">
                    <div className="h-2 bg-gradient-gold" />
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Book className="w-5 h-5 text-gold" />
                            Registry: New Publication
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Left Column */}
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Book Title</Label>
                                    <Input
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g. Modern Indian History"
                                        required
                                        className="h-12 text-lg font-medium border-border/50 focus:border-gold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Author</Label>
                                    <Input
                                        value={formData.author}
                                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                        placeholder="e.g. Bipan Chandra"
                                        className="h-12 border-border/50"
                                    />
                                </div>
                                {/* NEW: Subject Dropdown */}
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Subject Category</Label>
                                    <select 
                                        className="flex h-12 w-full rounded-md border border-border/50 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={formData.subject_id}
                                        onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                                    >
                                        <option value="">Select a Subject...</option>
                                        {subjects.map((s) => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-5 flex flex-col justify-between">
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Description / Summary</Label>
                                    <Textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Briefly describe the significance of this work..."
                                        className="min-h-[120px] resize-none border-border/50 focus:border-gold"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={isSaving}
                                    className="w-full h-12 bg-navy-dark text-white hover:bg-navy-dark/90 font-bold tracking-widest uppercase transition-all"
                                >
                                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Register in Library'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Books Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {loading ? (
                    <div className="col-span-full py-24 flex flex-col items-center justify-center space-y-4">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full border-4 border-gold/20 border-t-gold animate-spin" />
                            <BookOpen className="absolute inset-0 m-auto w-6 h-6 text-gold animate-pulse" />
                        </div>
                        <p className="text-muted-foreground font-medium animate-pulse">Syncing Library Database...</p>
                    </div>
                ) : filteredBooks.length === 0 ? (
                    <div className="col-span-full py-24 border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-center space-y-4">
                        <div className="p-4 rounded-full bg-muted">
                            <Search className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold font-display">No matches found</h3>
                            <p className="text-muted-foreground">Your search didn't return any library entries.</p>
                        </div>
                        <Button variant="outline" onClick={() => setSearchQuery('')}>Clear Search</Button>
                    </div>
                ) : filteredBooks.map((book) => (
                    <Card key={book.id} className="group relative bg-card border-none shadow-medium hover:shadow-elevated transition-all duration-500 overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />

                        <CardHeader className="relative pb-2">
                            <div className="flex items-start justify-between">
                                <div className="p-3 rounded-2xl bg-muted group-hover:bg-gold/10 group-hover:text-gold transition-colors duration-500">
                                    <BookOpen className="w-6 h-6" />
                                </div>
                                <div className="flex gap-1">
                                    <button className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        disabled={isDeleting === book.id}
                                        onClick={() => deleteBook(book.id, book.title)}
                                        className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                                    >
                                        {isDeleting === book.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            
                            {/* Subject Badge */}
                            {book.subjects?.name && (
                                <div className="mt-2">
                                    <span className="inline-flex items-center rounded-full bg-gold/10 px-2.5 py-0.5 text-xs font-medium text-gold ring-1 ring-inset ring-gold/20">
                                        {book.subjects.name}
                                    </span>
                                </div>
                            )}

                            <CardTitle className="text-xl font-display font-bold mt-2 group-hover:text-gold transition-colors">
                                {book.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="relative space-y-4 pb-8">
                            <p className="text-sm text-muted-foreground line-clamp-3 min-h-[4.5rem] leading-relaxed">
                                {book.description || 'No executive summary provided for this library entry.'}
                            </p>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/40">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <UserIcon className="w-3.5 h-3.5 text-gold/60" />
                                    <span className="font-bold truncate">{book.author || 'Anonymous'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground justify-end">
                                    <Calendar className="w-3.5 h-3.5 text-gold/60" />
                                    <span>{new Date(book.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};