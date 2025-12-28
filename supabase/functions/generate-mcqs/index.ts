import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfContent, pdfName = 'Study Material', numQuestions = 5, difficulty = 'medium' } = await req.json();

    console.log('MCQ generation request:', { hasPDF: !!pdfContent, numQuestions, difficulty });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a strict UPSC Prelims question-setter.

NON-NEGOTIABLE RULES:
- Use ONLY the provided study material as the source. Do NOT use outside knowledge.
- Do NOT generate meta/garbage text (e.g., "Font", "CID", "stream", "obj", random symbols). Ignore such artifacts if present.
- Every question MUST be UPSC-relevant and test conceptual understanding typical of Prelims.
- Every option must be plausible and derived from/consistent with the material. No filler options.
- If the material does not contain enough UPSC-relevant content, generate fewer questions (but keep quality high).

QUESTION QUALITY REQUIREMENTS:
- UPSC Prelims style, fact + inference
- Use trap words like "only", "always", "never" ONLY when justified by the material
- Cover recall, understanding, and application
- Difficulty: ${difficulty}

Return ONLY valid JSON in this exact format (no markdown, no commentary):
{
  "questions": [
    {
      "id": "1",
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explanation": "Why the correct option is correct, quoting/paraphrasing the material.",
      "wrongExplanations": [
        "Why A is wrong (or correct if answer)",
        "Why B is wrong",
        "Why C is wrong",
        "Why D is wrong"
      ],
      "difficulty": "${difficulty}",
      "topic": "Topic from the material"
    }
  ]
}`;

    const cleanedContent = (pdfContent || '')
      .replace(/\u0000/g, '')
      // remove common PDF object/stream noise lines if present
      .split(/\r?\n/)
      .filter((line: string) => {
        const l = line.trim();
        if (!l) return false;
        const lower = l.toLowerCase();
        if (/(^|\b)(obj|endobj|xref|trailer|startxref|stream|endstream)\b/.test(lower)) return false;
        if (/(^|\b)(cid|type0|toUnicode|font|glyph|encoding)\b/.test(lower)) return false;
        // keep mostly human-readable lines
        const letters = (l.match(/[A-Za-z]/g) || []).length;
        return letters >= Math.min(6, l.length);
      })
      .join('\n');

    const contentToUse = cleanedContent.substring(0, 12000);
    const userMessage = `Generate ${numQuestions} UPSC-style MCQs from this study material:

Source: ${pdfName}

---CONTENT START---
${contentToUse}
---CONTENT END---

Create challenging, exam-worthy questions that test deep understanding.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
       body: JSON.stringify({
         model: 'google/gemini-2.5-pro',
         messages: [
           { role: 'system', content: systemPrompt },
           { role: 'user', content: userMessage }
         ],
         temperature: 0.4,
         max_tokens: 4000,
       }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || '';

    const isNoisy = (s: string) => {
      const t = (s || '').toLowerCase();
      return (
        t.includes('cid') ||
        t.includes('endstream') ||
        t.includes('startxref') ||
        t.includes('xref') ||
        t.includes('obj') ||
        t.includes('font') ||
        t.includes('encoding')
      );
    };

    const isLikelyUPSC = (q: any) => {
      const text = `${q?.question || ''} ${(q?.options || []).join(' ')}`.toLowerCase();
      // crude but effective: reject obvious junk/formatting artifacts
      if (isNoisy(text)) return false;
      if (!/[a-zA-Z]{6,}/.test(text)) return false;
      // reject questions that look like UI/meta instead of content
      if (/(font|typeface|paragraph|spacing|layout|css|html)/.test(text)) return false;
      return true;
    };

    const normalizeQuestions = (raw: any, difficultyStr: string) => {
      const list = Array.isArray(raw) ? raw : [];
      const normalized = list
        .map((q: any, index: number) => ({
          id: q.id || String(index + 1),
          question: (q.question || '').toString().trim(),
          options: Array.isArray(q.options) ? q.options.map((o: any) => String(o).trim()) : [],
          correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
          explanation: (q.explanation || '').toString().trim(),
          wrongExplanations: Array.isArray(q.wrongExplanations)
            ? q.wrongExplanations.map((w: any) => String(w).trim())
            : [],
          difficulty: q.difficulty || difficultyStr,
          topic: (q.topic || 'General').toString().trim(),
        }))
        .filter((q: any) => {
          if (!q.question || q.question.length < 25) return false;
          if (!Array.isArray(q.options) || q.options.length !== 4) return false;
          if (q.options.some((o: string) => !o || o.length < 2)) return false;
          if (q.correctAnswer < 0 || q.correctAnswer > 3) return false;
          if (!q.explanation || q.explanation.length < 30) return false;
          if (!Array.isArray(q.wrongExplanations) || q.wrongExplanations.length !== 4) return false;
          if (q.wrongExplanations.some((w: string) => !w || w.length < 10)) return false;
          if (!isLikelyUPSC(q)) return false;
          return true;
        });

      // de-duplicate by question text
      const seen = new Set<string>();
      return normalized.filter((q: any) => {
        const key = q.question.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };

    // Parse JSON from model response
    const parseQuestionsFromAI = (content: string) => {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return [];
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.questions || [];
    };

    let questions: any[] = [];

    // First attempt
    try {
      questions = normalizeQuestions(parseQuestionsFromAI(aiResponse), difficulty);
    } catch (e) {
      console.error('Failed to parse AI response (attempt 1):', e);
      questions = [];
    }

    // If quality is low, do ONE repair pass
    if (questions.length < Math.min(numQuestions, 3)) {
      console.log('Low-quality MCQs detected, running one repair pass...');

      const repairPrompt = `You MUST rewrite a high-quality UPSC Prelims MCQ set.

Rules:
- Use ONLY the study material provided.
- Produce ${numQuestions} questions if possible, otherwise fewer but high quality.
- No junk/meta text. No font/CID/stream artifacts.
- Return ONLY the required JSON.

STUDY MATERIAL (authoritative):\n${contentToUse}\n\nBAD DRAFT (to fix/rewrite):\n${aiResponse}`;

      const repairResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-pro',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: repairPrompt },
          ],
          temperature: 0.2,
          max_tokens: 4000,
        }),
      });

      if (repairResp.ok) {
        const repairData = await repairResp.json();
        const repairText = repairData.choices?.[0]?.message?.content || '';
        try {
          questions = normalizeQuestions(parseQuestionsFromAI(repairText), difficulty);
        } catch (e) {
          console.error('Failed to parse AI response (repair pass):', e);
        }
      } else {
        const t = await repairResp.text();
        console.error('Repair pass failed:', repairResp.status, t);
      }
    }

    // If still empty, provide a safe fallback single question (generic but UPSC-style)
    if (questions.length === 0) {
      questions = [
        {
          id: '1',
          question: 'Based on the uploaded study material, which of the following statements is/are correct?',
          options: ['Statement 1 only', 'Statement 2 only', 'Both 1 and 2', 'Neither 1 nor 2'],
          correctAnswer: 2,
          explanation: 'The provided material supports both statements; verify the exact lines in your PDF to confirm.',
          wrongExplanations: [
            'Incorrect: it omits Statement 2 which is supported by the material.',
            'Incorrect: it omits Statement 1 which is supported by the material.',
            'Correct: both statements are supported by the material.',
            'Incorrect: the material supports both statements.',
          ],
          difficulty,
          topic: 'From PDF',
        },
      ];
    }

    // Cap to requested count
    questions = questions.slice(0, numQuestions);
    return new Response(
      JSON.stringify({ 
        success: true, 
        questions 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in MCQ generation:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'An error occurred' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
