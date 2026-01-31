import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, X, FileUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface Book {
    id: string;
    title: string;
}

export const FileUploader: React.FC = () => {
    const { user } = useAuth();
    const [books, setBooks] = useState<Book[]>([]);
    const [selectedBookId, setSelectedBookId] = useState<string>('');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        fetchBooks();
    }, []);

    const fetchBooks = async () => {
        const { data } = await supabase.from('books').select('id, title').order('title');
        if (data) setBooks(data);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type !== 'application/pdf') {
                toast({ title: 'Invalid format', description: 'Only PDF files are supported', variant: 'destructive' });
                return;
            }
            setFile(selectedFile);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.type !== 'application/pdf') {
                toast({ title: 'Invalid format', description: 'Only PDF files are supported', variant: 'destructive' });
                return;
            }
            setFile(droppedFile);
        }
    };

    const handleUpload = async () => {
        if (!file || !selectedBookId || !user) {
            toast({ title: 'Requirements missing', description: 'Please select both a target book and a PDF file.', variant: 'destructive' });
            return;
        }

        setUploading(true);
        setProgress(10);

        try {
            const timestamp = new Date().getTime();
            const fileName = `${timestamp}-${file.name.replace(/\s+/g, '_')}`;
            const filePath = `library/${selectedBookId}/${fileName}`;

            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('books')
                .upload(filePath, file);

            if (uploadError) throw uploadError;
            setProgress(60);

            // 2. Insert metadata into DB
            const { error: dbError } = await supabase.from('book_files').insert({
                book_id: selectedBookId,
                file_name: file.name,
                storage_bucket: 'books',
                storage_path: filePath,
                file_size_mb: parseFloat((file.size / (1024 * 1024)).toFixed(2)),
                uploaded_by: user.id
            });

            if (dbError) {
                // Rollback storage upload if DB entry fails
                await supabase.storage.from('books').remove([filePath]);
                throw dbError;
            }

            setProgress(100);
            toast({ title: 'Upload Successful', description: `${file.name} has been synchronized with the library.` });
            setFile(null);
            setSelectedBookId('');
        } catch (error: any) {
            console.error('Upload sequence error:', error);
            toast({ title: 'System Error', description: error.message, variant: 'destructive' });
        } finally {
            setTimeout(() => {
                setUploading(false);
                setProgress(0);
            }, 1500);
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-4 animate-fade-in">
            <Card className="glass-effect border-border/50 shadow-elevated overflow-hidden border-t-4 border-t-gold">
                <CardHeader className="pb-8">
                    <CardTitle className="text-2xl font-display font-bold flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gold/10 text-gold">
                            <FileUp className="w-6 h-6" />
                        </div>
                        Secure Asset Injection
                    </CardTitle>
                    <CardDescription className="text-base">Upload academic PDF resources to the cloud-linked library.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="space-y-3">
                        <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground ml-1">Target Curriculum Entrance</Label>
                        <Select
                            onValueChange={setSelectedBookId}
                            value={selectedBookId}
                            disabled={uploading || books.length === 0}
                        >
                            <SelectTrigger className={cn(
                                "h-14 border-border/50 text-lg font-medium focus:ring-gold/20",
                                books.length === 0 ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-accent/10"
                            )}>
                                <SelectValue placeholder={books.length === 0 ? "⚠️ No books found. Create a book first!" : "Select publication to link..."} />
                            </SelectTrigger>
                            <SelectContent className="max-h-80">
                                {books.length === 0 ? (
                                    <div className="p-4 text-center text-muted-foreground text-sm">
                                        No books available. Please go to "Book Manager" to add a book first.
                                    </div>
                                ) : (
                                    books.map(b => (
                                        <SelectItem key={b.id} value={b.id} className="h-12 font-medium">{b.title}</SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground ml-1">PDF Payload</Label>
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={cn(
                                "group relative border-2 border-dashed rounded-2xl p-12 transition-all duration-500 flex flex-col items-center justify-center gap-6",
                                isDragging
                                    ? "bg-gold/5 border-gold scale-[1.01] shadow-gold/5"
                                    : "bg-muted/30 border-border/50 hover:bg-muted/50 hover:border-gold/30",
                                file && "border-gold/30 bg-gold/5"
                            )}
                        >
                            <input
                                type="file"
                                className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                accept=".pdf"
                                onChange={handleFileChange}
                                disabled={uploading}
                            />

                            {file ? (
                                <div className="text-center space-y-4 animate-scale-in">
                                    <div className="relative inline-block">
                                        <div className="w-20 h-20 rounded-2xl bg-gold/10 flex items-center justify-center">
                                            <FileText className="w-10 h-10 text-gold" />
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                            className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-destructive text-white flex items-center justify-center shadow-lg hover:bg-destructive/90 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold tracking-tight">{file.name}</p>
                                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mt-1">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB • PDF Document
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="w-20 h-20 rounded-full bg-accent/50 flex items-center justify-center group-hover:bg-gold/10 transition-colors duration-500">
                                        <Upload className="w-10 h-10 text-muted-foreground group-hover:text-gold transition-colors duration-500" />
                                    </div>
                                    <div className="text-center space-y-1">
                                        <p className="text-xl font-bold font-display">Drag and drop payload</p>
                                        <p className="text-muted-foreground">Select a scholarly PDF resource from your device</p>
                                    </div>
                                    <div className="flex items-center gap-4 text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">
                                        <span className="px-2 py-1 rounded border border-border">PDF only</span>
                                        <span className="px-2 py-1 rounded border border-border">MAX 50MB</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {uploading && (
                        <div className="space-y-4 animate-fade-in pt-4">
                            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gold">
                                <span className="flex items-center gap-2">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Encrypting & Synchronizing...
                                </span>
                                <span>{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2 bg-accent/20 transition-all duration-1000 [&>div]:bg-gradient-gold" />
                        </div>
                    )}

                    <Button
                        onClick={handleUpload}
                        className={cn(
                            "w-full h-16 text-lg font-bold uppercase tracking-widest transition-all duration-500 shadow-lg active:scale-[0.98]",
                            !file || !selectedBookId || uploading
                                ? "bg-muted text-muted-foreground cursor-not-allowed"
                                : "bg-gold hover:bg-gold-light text-navy-dark shadow-gold/20"
                        )}
                        disabled={!file || !selectedBookId || uploading}
                    >
                        {uploading ? (
                            <Loader2 className="w-6 h-6 animate-spin mr-3" />
                        ) : (
                            <CheckCircle2 className="w-6 h-6 mr-3" />
                        )}
                        {uploading ? 'Processing Injection...' : 'Authorize Sync'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

