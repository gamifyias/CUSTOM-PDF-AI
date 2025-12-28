-- Create table for book PDFs (multiple PDFs per book)
CREATE TABLE public.book_pdfs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  pdf_url TEXT NOT NULL,
  pdf_name TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.book_pdfs ENABLE ROW LEVEL SECURITY;

-- Anyone can view book PDFs
CREATE POLICY "Anyone can view book pdfs"
ON public.book_pdfs
FOR SELECT
USING (true);

-- Create storage bucket for book PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('book-pdfs', 'book-pdfs', true);

-- Storage policies for book PDFs
CREATE POLICY "Anyone can view book pdfs storage"
ON storage.objects FOR SELECT
USING (bucket_id = 'book-pdfs');

CREATE POLICY "Authenticated users can upload book pdfs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'book-pdfs');

CREATE POLICY "Authenticated users can delete book pdfs"
ON storage.objects FOR DELETE
USING (bucket_id = 'book-pdfs');