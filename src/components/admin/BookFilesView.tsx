import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { FileText, ExternalLink, Trash2, Loader2, Database, Search, Filter, HardDrive } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface BookFile {
    id: string;
    file_name: string;
    file_size_mb: number;
    storage_path: string;
    created_at: string;
    books: {
        title: string;
    } | null;
}

export const BookFilesView: React.FC = () => {
    const [files, setFiles] = useState<BookFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('book_files')
                .select('*, books(title)')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setFiles(data as any);
        } catch (error: any) {
            console.error('Fetch files error:', error);
            toast({ title: 'Error fetching assets', description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const deleteFile = async (id: string, path: string, fileName: string) => {
        if (!confirm(`CAUTION: This will permanently remove "${fileName}" from both cloud storage and the database. This action cannot be undone.`)) return;

        setIsDeleting(id);
        try {
            // 1. Delete from Storage
            const { error: storageError } = await supabase.storage.from('books').remove([path]);
            if (storageError) throw storageError;

            // 2. Delete from DB
            const { error: dbError } = await supabase.from('book_files').delete().eq('id', id);
            if (dbError) throw dbError;

            toast({ title: 'Asset Purged', description: 'The file has been permanently removed.' });
            fetchFiles();
        } catch (error: any) {
            console.error('Delete asset error:', error);
            toast({ title: 'Purge Failed', description: error.message, variant: 'destructive' });
        } finally {
            setIsDeleting(null);
        }
    };

    const filteredFiles = files.filter(file =>
        file.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (file.books?.title.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    );

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h2 className="text-4xl font-bold font-display tracking-tight text-foreground">Asset Management</h2>
                    <p className="text-muted-foreground text-lg">Inventory of synchronized scholarly resources</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-card border border-border px-5 py-3 rounded-2xl shadow-soft flex items-center gap-3">
                        <HardDrive className="w-5 h-5 text-gold" />
                        <div>
                            <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Total Storage Used</div>
                            <div className="text-sm font-bold">{(files.reduce((acc, f) => acc + f.file_size_mb, 0)).toFixed(2)} MB</div>
                        </div>
                    </div>
                </div>
            </div>

            <Card className="glass-effect border-border/50 shadow-elevated overflow-hidden">
                <div className="p-4 border-b border-border/50 bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-gold" />
                        <span className="text-sm font-bold uppercase tracking-tight">{files.length} Assets Indexed</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-gold transition-colors" />
                            <Input
                                placeholder="Filter records..."
                                className="pl-9 h-10 w-full md:w-64 bg-background border-border/50"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" size="icon" className="h-10 w-10 border-border/50">
                            <Filter className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto overflow-y-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-muted/30">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Asset Identity</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Linked Structure</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Payload Size</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sync Date</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Operations</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <Loader2 className="w-10 h-10 animate-spin text-gold" />
                                            <p className="text-muted-foreground font-medium animate-pulse uppercase tracking-widest text-xs">Querying Metadata Repository...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredFiles.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="p-4 rounded-full bg-muted">
                                                <Search className="w-6 h-6 text-muted-foreground" />
                                            </div>
                                            <p className="text-muted-foreground font-display text-lg">No assets match your current filter</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredFiles.map((file) => (
                                <tr key={file.id} className="hover:bg-accent/5 transition-all group duration-300">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 rounded-xl bg-accent/20 group-hover:bg-gold/10 group-hover:text-gold transition-colors">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold tracking-tight truncate max-w-[240px] group-hover:text-foreground transition-colors">{file.file_name}</div>
                                                <div className="text-[10px] text-muted-foreground uppercase font-medium">PDF Payload</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-gold/40" />
                                            <span className="text-sm font-medium">{file.books?.title || 'Standalone Resource'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-xs font-bold text-muted-foreground">
                                            {file.file_size_mb.toFixed(2)} MB
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-xs font-medium text-muted-foreground/80">
                                            {new Date(file.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 rounded-xl hover:bg-gold/10 hover:text-gold transition-all"
                                                onClick={() => window.open(`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/books/${file.storage_path}`, '_blank')}
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                disabled={isDeleting === file.id}
                                                className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                                                onClick={() => deleteFile(file.id, file.storage_path, file.file_name)}
                                            >
                                                {isDeleting === file.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

