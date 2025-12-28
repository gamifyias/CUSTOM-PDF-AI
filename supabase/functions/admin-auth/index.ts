import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, adminId, adminPassword, newAdminId, newPassword, book, bookId, pdfId, pdfUrl, pdfName, fileSize } = await req.json();

    // Verify admin credentials for all actions
    const { data: adminData, error: adminError } = await supabase
      .from('admin_settings')
      .select('*')
      .eq('admin_id', adminId)
      .eq('admin_password', adminPassword)
      .single();

    if (adminError || !adminData) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid admin credentials' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    switch (action) {
      case 'login': {
        return new Response(
          JSON.stringify({ success: true, message: 'Login successful' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'change-credentials': {
        if (!newAdminId || !newPassword) {
          return new Response(
            JSON.stringify({ success: false, error: 'New credentials required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error: updateError } = await supabase
          .from('admin_settings')
          .update({ 
            admin_id: newAdminId, 
            admin_password: newPassword,
            updated_at: new Date().toISOString()
          })
          .eq('id', adminData.id);

        if (updateError) {
          console.error('Update credentials error:', updateError);
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to update credentials' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Credentials updated' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'add-book': {
        if (!book || !book.title) {
          return new Response(
            JSON.stringify({ success: false, error: 'Book title required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: newBook, error: insertError } = await supabase
          .from('books')
          .insert({
            title: book.title,
            author: book.author || null,
            description: book.description || null,
            image_url: book.image_url || null,
            subject: book.subject || null,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Insert book error:', insertError);
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to add book' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, book: newBook }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update-book': {
        if (!bookId || !book) {
          return new Response(
            JSON.stringify({ success: false, error: 'Book ID and data required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: updatedBook, error: updateError } = await supabase
          .from('books')
          .update({
            title: book.title,
            author: book.author || null,
            description: book.description || null,
            image_url: book.image_url || null,
            subject: book.subject || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', bookId)
          .select()
          .single();

        if (updateError) {
          console.error('Update book error:', updateError);
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to update book' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, book: updatedBook }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete-book': {
        if (!bookId) {
          return new Response(
            JSON.stringify({ success: false, error: 'Book ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // PDFs will be cascade deleted due to foreign key
        const { error: deleteError } = await supabase
          .from('books')
          .delete()
          .eq('id', bookId);

        if (deleteError) {
          console.error('Delete book error:', deleteError);
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to delete book' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Book deleted' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get-books': {
        const { data: books, error: fetchError } = await supabase
          .from('books')
          .select('*')
          .order('created_at', { ascending: false });

        if (fetchError) {
          console.error('Fetch books error:', fetchError);
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to fetch books' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Fetch PDFs for each book
        const booksWithPdfs = await Promise.all(
          (books || []).map(async (book) => {
            const { data: pdfs } = await supabase
              .from('book_pdfs')
              .select('*')
              .eq('book_id', book.id)
              .order('created_at', { ascending: true });
            
            return { ...book, pdfs: pdfs || [] };
          })
        );

        return new Response(
          JSON.stringify({ success: true, books: booksWithPdfs }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'add-pdf': {
        if (!bookId || !pdfUrl || !pdfName) {
          return new Response(
            JSON.stringify({ success: false, error: 'Book ID, PDF URL and name required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: newPdf, error: insertError } = await supabase
          .from('book_pdfs')
          .insert({
            book_id: bookId,
            pdf_url: pdfUrl,
            pdf_name: pdfName,
            file_size: fileSize || null,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Insert PDF error:', insertError);
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to add PDF' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, pdf: newPdf }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete-pdf': {
        if (!pdfId) {
          return new Response(
            JSON.stringify({ success: false, error: 'PDF ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error: deleteError } = await supabase
          .from('book_pdfs')
          .delete()
          .eq('id', pdfId);

        if (deleteError) {
          console.error('Delete PDF error:', deleteError);
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to delete PDF' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: 'PDF deleted' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Admin auth error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'An error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
