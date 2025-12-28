-- Create books table
CREATE TABLE public.books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT,
  description TEXT,
  image_url TEXT,
  subject TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin_settings table for changeable credentials
CREATE TABLE public.admin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id TEXT NOT NULL UNIQUE,
  admin_password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on books (public read, no public write)
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Anyone can view books
CREATE POLICY "Anyone can view books"
ON public.books
FOR SELECT
USING (true);

-- Enable RLS on admin_settings (no direct access - only via edge function)
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- No direct access to admin_settings from client (edge function will use service role)

-- Insert default admin credentials
INSERT INTO public.admin_settings (admin_id, admin_password)
VALUES ('gamifyiasaiadmin', 'gamifyias@4122025');

-- Create storage bucket for book images
INSERT INTO storage.buckets (id, name, public)
VALUES ('book-images', 'book-images', true);

-- Allow public read access to book images
CREATE POLICY "Public can view book images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'book-images');

-- Allow authenticated uploads (we'll handle auth via edge function)
CREATE POLICY "Allow uploads to book-images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'book-images');

CREATE POLICY "Allow updates to book-images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'book-images');

CREATE POLICY "Allow deletes from book-images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'book-images');