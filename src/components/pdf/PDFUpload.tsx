import React, { useCallback, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { PDFDocument } from '@/types';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import pdfjsWorkerSrc from 'pdfjs-dist/build/pdf.worker.min?url';
export const PDFUpload: React.FC = () => {
  const { uploadedPDF, setUploadedPDF, setPdfContent, setPdfImages, clearMessages } = useApp();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const cleanExtractedText = (raw: string) => {
    return raw
      .replace(/\u0000/g, '')
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ') // Remove non-printable chars but keep basic formatting
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
  };

  const extractImagesFromPDF = async (file: File, maxPages = 5): Promise<string[]> => {
    GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc;
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    const pagesToRender = Math.min(pdf.numPages, maxPages);
    const images: string[] = [];

    for (let i = 1; i <= pagesToRender; i++) {
      try {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) continue;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport }).promise;
        images.push(canvas.toDataURL('image/jpeg', 0.8));
      } catch (err) {
        console.error(`Error rendering page ${i}:`, err);
      }
    }
    return images;
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc;

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    const maxPages = Math.min(pdf.numPages, 100); // Increased limit
    let out = '';

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();

      const pageText = (content.items as any[])
        .map((item) => (typeof item?.str === 'string' ? item.str : ''))
        .join(' ');

      out += `--- Page ${pageNum} ---\n${pageText}\n\n`;

      if (out.length > 120000) break; // Increased cap
    }

    return cleanExtractedText(out);
  };

  const processFile = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    setIsProcessing(true);

    try {
      // Extract text content and images
      const [content, images] = await Promise.all([
        extractTextFromPDF(file),
        extractImagesFromPDF(file, 5)
      ]);

      const pdfDoc: PDFDocument = {
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        uploadedAt: new Date(),
        pageCount: images.length > 0 ? Math.max(images.length, 1) : 1, // Fallback if meta fails
      };

      setUploadedPDF(pdfDoc);
      setPdfContent(content);
      setPdfImages(images);
      clearMessages();
    } catch (error) {
      console.error('Error processing PDF:', error);
      alert('Failed to process PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [setUploadedPDF, setPdfContent, setPdfImages, clearMessages]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const removePDF = useCallback(() => {
    setUploadedPDF(null);
    setPdfContent('');
    setPdfImages([]);
    clearMessages();
  }, [setUploadedPDF, setPdfContent, setPdfImages, clearMessages]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (uploadedPDF) {
    return (
      <div className="mentor-card animate-fade-in hover-lift">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0 animate-scale-in">
            <CheckCircle className="w-6 h-6 text-success" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-medium text-foreground truncate">{uploadedPDF.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(uploadedPDF.size)} • ~{uploadedPDF.pageCount} pages
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={removePDF}
                className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-all duration-200 hover:scale-110 hover:rotate-90"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-success">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse shadow-[0_0_8px_hsl(142_70%_45%/0.5)]" />
              Ready for AI-powered study session
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "mentor-card border-2 border-dashed transition-all duration-300 cursor-pointer hover-lift",
        isDragging && "border-accent bg-accent/5 scale-[1.02]",
        isProcessing && "pointer-events-none"
      )}
    >
      <label className="flex flex-col items-center gap-4 py-8 cursor-pointer">
        <div className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300",
          isDragging ? "bg-accent/20 scale-110" : "bg-muted",
          isProcessing && "animate-pulse"
        )}>
          {isProcessing ? (
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
          ) : (
            <Upload className={cn(
              "w-8 h-8 transition-all duration-300",
              isDragging ? "text-accent scale-110" : "text-muted-foreground"
            )} />
          )}
        </div>

        <div className="text-center">
          {isProcessing ? (
            <>
              <p className="font-medium text-foreground">Processing PDF...</p>
              <p className="text-sm text-muted-foreground mt-1">Extracting content for AI</p>
            </>
          ) : (
            <>
              <p className="font-medium text-foreground">
                {isDragging ? 'Drop your PDF here' : 'Upload Study Material'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Drag & drop or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                NCERT, Notes, Standard Books (PDF only)
              </p>
            </>
          )}
        </div>

        <input
          type="file"
          accept=".pdf"
          onChange={handleFileInput}
          className="hidden"
          disabled={isProcessing}
        />
      </label>

      <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/20 flex items-start gap-3 animate-fade-in">
        <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5 animate-pulse" />
        <p className="text-xs text-warning">
          <span className="font-semibold">Important:</span> The AI mentor will use this PDF as the authoritative source.
          Upload your main study material to begin your UPSC preparation.
        </p>
      </div>
    </div>
  );
};
