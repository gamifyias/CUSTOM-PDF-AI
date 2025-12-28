import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STUDY_MODE_PROMPTS: Record<string, string> = {
  prelims: `You are a UPSC Prelims exam mentor. Focus on:
- Fact-focused, precise answers
- Elimination logic for MCQs
- Highlighting trap words like "only", "always", "never", "all", "completely"
- Brief, factual responses suitable for objective questions
- Key dates, names, and factual information`,

  mains: `You are a UPSC Mains answer writing mentor. Structure all answers as:
**Introduction:** (2-3 lines contextualizing the topic)
**Body:** 
- Use subheadings for different dimensions
- Include Constitutional/Legal aspects
- Add current relevance and examples
**Conclusion:** (Forward-looking, balanced statement)
Keep answers between 150-200 words unless asked otherwise.`,

  topper: `You are a UPSC topper-style mentor. Write answers that:
- Use sophisticated vocabulary and multidimensional analysis
- Apply frameworks like PESTLE, SWOT for analysis
- Include relevant quotes, data, and case studies
- Structure with clear subheadings
- Add value additions: Constitutional articles, committee recommendations, international best practices
- End with actionable way forward`,

  revision: `You are a quick revision mentor. Provide:
- Crisp bullet points only
- No elaborate explanations
- Key facts, dates, provisions
- Memory hooks and acronyms
- Maximum 5-7 points per topic`,

  'exam-day': `You are an exam-day mentor. Provide:
- Very short, high-ROI answers
- Direct point + one supporting fact + brief conclusion
- No elaborate introductions
- Focus on scoring keywords
- Maximum 3-4 lines`,

  concept: `You are a conceptual clarity mentor. Focus on:
- Explaining "why" and "how" things work
- First principles thinking
- Connections to broader themes
- Analogies and examples for understanding
- Building blocks approach`,

  beginner: `You are a beginner-friendly UPSC mentor. Provide:
- Simple, jargon-free explanations
- Basic concepts first, then depth
- Everyday analogies
- Step-by-step understanding
- Encourage and motivate`,

  advanced: `You are an advanced academic mentor. Provide:
- Deeper academic reasoning and analysis
- Multiple theoretical perspectives
- Scholarly references and debates
- Critical analysis of competing viewpoints
- Research-oriented approach`,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      message,
      studyMode = 'mains',
      pdfContent = '',
      pdfImages = [],
      pdfName = '',
      conversationHistory = [],
      action = null,
      previousAnswer = '',
    } = await req.json();

    console.log('UPSC Mentor request:', { studyMode, action, hasPDF: !!pdfContent });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Enforce the "PDF first" rule (no answers without an uploaded PDF)
    const hasText = !!pdfContent && String(pdfContent).trim().length >= 200;
    const hasImages = Array.isArray(pdfImages) && pdfImages.length > 0;

    if (!hasText && !hasImages) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Please upload a readable PDF before asking questions.',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the system prompt
    const sourceMode = hasText ? 'text' : 'images';

    let systemPrompt = `You are GAMIFY IAS — a strict, calm, high-precision UPSC Civil Services mentor.

NON-NEGOTIABLE SCOPE:
- Discuss ONLY UPSC syllabus topics (Polity, Economy, History, Geography, Environment, Science & Tech (UPSC level), Ethics, Essay, Governance, IR, Security).
- If user asks anything outside UPSC, refuse briefly and redirect to UPSC.

NON-NEGOTIABLE SOURCE RULE:
- Use ONLY the uploaded PDF as the source for factual claims.
- If the PDF does not contain the answer, say: "Not found in the uploaded PDF." and ask for the relevant page/topic.
- Do NOT hallucinate. Do NOT use outside knowledge.

FORMAT RULES:
- Be structured, exam-oriented, and concise.
- Highlight trap words by wrapping them exactly like: **TRAP: only** / **TRAP: always** / **TRAP: never** / **TRAP: all**.
- Mention STATIC vs DYNAMIC (based on whether it depends on current affairs).

${STUDY_MODE_PROMPTS[studyMode] || STUDY_MODE_PROMPTS.mains}

PRIMARY STUDY SOURCE (${pdfName || 'Uploaded PDF'}):
${sourceMode === 'text' ? `---PDF TEXT START---\n${String(pdfContent).substring(0, 15000)}\n---PDF TEXT END---` : '---PDF PAGES PROVIDED AS IMAGES---\nYou will OCR/read the provided page images. Treat ONLY what you can read there as the source.'}
`;

    // Handle specific actions
    let userMessage = message;
    if (action) {
      switch (action) {
        case 'expand':
          userMessage = `Please expand the following answer with more details, examples, and dimensions:\n\n${previousAnswer}`;
          break;
        case 'shorten':
          userMessage = `Please create a crisp, shortened version of this answer suitable for quick revision:\n\n${previousAnswer}`;
          break;
        case 'topper':
          userMessage = `Rewrite this answer in topper style with sophisticated vocabulary, frameworks, and value additions:\n\n${previousAnswer}`;
          break;
        case 'dimensions':
          userMessage = `Add Social, Economic, Political, Ethical, and Environmental (SEPE-E) dimensions to this answer:\n\n${previousAnswer}`;
          break;
        case 'examiner':
          userMessage = `Explain what UPSC examiners expect in this answer and how to score full marks:\n\n${previousAnswer}`;
          break;
        case 'why':
          userMessage = `Explain why this topic is important for UPSC and where it can be used in the exam:\n\n${previousAnswer}`;
          break;
        case 'mistakes':
          userMessage = `List common mistakes aspirants make when answering questions on this topic:\n\n${previousAnswer}`;
          break;
        case 'pyq':
          userMessage = `Analyze Past Year Question patterns related to this topic and how UPSC has asked about it:\n\n${previousAnswer}`;
          break;
      }
    }

    // Build messages array
    const historyMessages = conversationHistory.slice(-10).map((msg: any) => ({
      role: msg.role === 'mentor' ? 'assistant' : 'user',
      content: msg.content,
    }));

    const userContent = hasImages
      ? [
          {
            type: 'text',
            text: userMessage,
          },
          ...pdfImages.slice(0, 3).map((url: string, idx: number) => ({
            type: 'image_url',
            image_url: { url },
          })),
        ]
      : userMessage;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...historyMessages,
      { role: 'user', content: userContent },
    ];

    console.log('Calling Lovable AI Gateway...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages,
        temperature: 0.4,
        max_tokens: 2200,
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
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'Unable to generate response.';

    console.log('AI response generated successfully');

    // Generate metadata
    const metadata = {
      confidence: pdfContent ? 'Direct' : 'Implied',
      source: pdfContent ? 'PDF-based' : 'Conceptual',
      topicType: Math.random() > 0.5 ? 'Static' : 'Dynamic',
      mentorTip: generateMentorTip(userMessage, studyMode),
    };

    return new Response(
      JSON.stringify({ 
        success: true, 
        response: aiResponse,
        metadata 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in UPSC mentor function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'An error occurred' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateMentorTip(message: string, mode: string): string {
  const tips = [
    'Link this to current affairs for extra marks.',
    'Consider adding a diagram in the actual exam.',
    'This is frequently asked in Prelims too.',
    'Use this concept in Essay paper as well.',
    'Add constitutional provisions for better scoring.',
    'Mention relevant committee recommendations.',
    'Connect to SDG goals for international perspective.',
    'Practice writing this in 150 words.',
  ];
  return tips[Math.floor(Math.random() * tips.length)];
}
