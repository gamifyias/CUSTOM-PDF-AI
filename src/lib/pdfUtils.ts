import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import pdfjsWorkerSrc from 'pdfjs-dist/build/pdf.worker.min?url';

// Initialize worker once
GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc;

export const cleanExtractedText = (raw: string) => {
    return raw
        .replace(/\u0000/g, '')
        .replace(/[^\x20-\x7E\n\r\t]/g, ' ') // Remove non-printable chars but keep basic formatting
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n\n')
        .trim();
};

export const extractImagesFromPDF = async (pdfSource: File | ArrayBuffer | string, maxPages = 5): Promise<string[]> => {
    try {
        const loadingTask = getDocument(typeof pdfSource === 'string' ? { url: pdfSource } : { data: pdfSource instanceof File ? await pdfSource.arrayBuffer() : pdfSource });
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

                await page.render({canvasContext: context, viewport }).promise;
                images.push(canvas.toDataURL('image/jpeg', 0.8));
            } catch (err) {
                console.error(`Error rendering page ${i}:`, err);
            }
        }
        return images;
    } catch (error) {
        console.error("Error extracting images:", error);
        return [];
    }
};

export const extractTextFromPDF = async (pdfSource: File | ArrayBuffer | string): Promise<string> => {
    try {
        const loadingTask = getDocument(typeof pdfSource === 'string' ? { url: pdfSource } : { data: pdfSource instanceof File ? await pdfSource.arrayBuffer() : pdfSource });
        const pdf = await loadingTask.promise;

        const maxPages = Math.min(pdf.numPages, 100); // Limit to 100 pages for performance
        let out = '';

        for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const content = await page.getTextContent();

            const pageText = (content.items as any[])
                .map((item) => (typeof item?.str === 'string' ? item.str : ''))
                .join(' ');

            out += `--- Page ${pageNum} ---\n${pageText}\n\n`;

            if (out.length > 150000) break; // Character limit cap
        }

        return cleanExtractedText(out);
    } catch (error) {
        console.error("Error extracting text:", error);
        throw new Error("Failed to extract text from PDF");
    }
};
