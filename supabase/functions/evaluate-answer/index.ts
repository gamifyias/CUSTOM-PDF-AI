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
    const { studentAnswer, question, topic = '' } = await req.json();

    console.log('Answer evaluation request:', { hasAnswer: !!studentAnswer, hasQuestion: !!question });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a UPSC answer evaluation expert. Your task is to:

1. EVALUATE the student's answer critically
2. IDENTIFY what's missing for full marks
3. REWRITE it as a topper-level answer
4. PROVIDE specific improvement suggestions

Be constructive but honest. UPSC expects specific structure, vocabulary, and content.

Respond in this exact JSON format:
{
  "score": <number 0-100>,
  "strengths": ["strength1", "strength2"],
  "missing": ["missing element 1", "missing element 2", "missing element 3", "missing element 4"],
  "improvements": ["specific improvement 1", "specific improvement 2", "specific improvement 3", "specific improvement 4"],
  "topperVersion": "The complete rewritten answer in topper style with proper structure, subheadings, and exam-oriented language"
}`;

    const userMessage = `Question: ${question}

Student's Answer:
${studentAnswer}

${topic ? `Topic Area: ${topic}` : ''}

Evaluate this answer and provide the topper version.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.5,
        max_tokens: 2500,
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

    console.log('Evaluation response received');

    // Parse the JSON response
    let evaluation;
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        evaluation = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Provide fallback evaluation
      evaluation = {
        score: 60,
        strengths: ['Attempted the question', 'Shows basic understanding'],
        missing: [
          'Proper introduction',
          'Structured body with subheadings',
          'Constitutional/Legal references',
          'Conclusion with way forward'
        ],
        improvements: [
          'Add an introduction that contextualizes the topic',
          'Use subheadings for different dimensions',
          'Include specific examples and data',
          'End with a balanced, forward-looking conclusion'
        ],
        topperVersion: aiResponse
      };
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        evaluation 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in answer evaluation:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'An error occurred' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
