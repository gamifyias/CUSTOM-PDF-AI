import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { BookOpen, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface Book {
    id: string;
    title: string;
    author: string | null;
    subjects: { name: string } | null;
}

export const BookSelector: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (open && books.length === 0) {
            fetchBooks();
        }
    }, [open]);

    const fetchBooks = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('books')
                .select('id, title, author, subjects(name)')
                .order('title');

            if (error) {
                // Fallback for missing relation
                const { data: simpleData } = await supabase
                    .from('books')
                    .select('id, title, author')
                    .order('title');
                setBooks((simpleData || []).map((b: any) => ({ ...b, subjects: null })));
            } else {
                setBooks(data as any || []);
            }
        } catch (error) {
            console.error("Error fetching books:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectBook = (bookId: string) => {
        setOpen(false);
        navigate(`/?bookId=${bookId}`);
    };

    const filteredBooks = books.filter(book =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full h-16 border-dashed border-2 flex flex-col items-center justify-center gap-1 hover:border-gold/50 hover:bg-gold/5">
                    <BookOpen className="w-5 h-5 text-muted-foreground group-hover:text-gold" />
                    <span className="text-xs font-medium text-muted-foreground">Select from Library</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col glass-effect border-gold/20">
                <DialogHeader>
                    <DialogTitle className="text-xl font-display">Select Study Material</DialogTitle>
                </DialogHeader>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search standard books..."
                        className="pl-9 bg-accent/20 border-gold/10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex-1 overflow-y-auto min-h-[300px] mt-2 pr-2 custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="w-8 h-8 animate-spin text-gold" />
                        </div>
                    ) : filteredBooks.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            No books found matching your search.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {filteredBooks.map((book) => (
                                <Card
                                    key={book.id}
                                    className="p-3 cursor-pointer hover:bg-gold/5 hover:border-gold/30 transition-all flex flex-col gap-2 group"
                                    onClick={() => handleSelectBook(book.id)}
                                >
                                    <div className="flex items-start justify-between">
                                        <h4 className="font-medium text-sm line-clamp-2 group-hover:text-gold transition-colors">{book.title}</h4>
                                        <BookOpen className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
                                    </div>
                                    <div className="flex items-center justify-between mt-auto">
                                        <span className="text-xs text-muted-foreground truncate max-w-[120px]">{book.author || 'Unknown Author'}</span>
                                        {book.subjects?.name && (
                                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-accent/50 text-foreground">{book.subjects.name}</Badge>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
