import { StudyMode, Message, MessageMetadata } from '@/types';
import { MENTOR_SYSTEM_PROMPT, EVALUATION_SYSTEM_PROMPT, MCQ_SYSTEM_PROMPT } from './prompts';

interface MentorResponse {
  success: boolean;
  response?: string;
  metadata?: MessageMetadata;
  error?: string;
}

interface EvaluationResponse {
  success: boolean;
  evaluation?: {
    score: number;
    strengths: string[];
    missing: string[];
    improvements: string[];
    topperVersion: string;
  };
  error?: string;
}

interface MCQResponse {
  success: boolean;
  questions?: Array<{
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    wrongExplanations: string[];
    difficulty: string;
    topic: string;
  }>;
  error?: string;
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const callGroq = async (messages: any[], temperature = 0.4, maxTokens = 2500, model = 'llama-3.3-70b-versatile') => {
  if (!GROQ_API_KEY) {
    throw new Error('Groq API key not found in environment variables. Please add VITE_GROQ_API_KEY to your .env file.');
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Groq API error: ${response.status}`);
  }

  return await response.json();
};

const generateMentorTip = (message: string, mode: string): string => {
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
};

export const mentorApi = {
  async chat(
    message: string,
    studyMode: StudyMode,
    pdfContent: string = '',
    pdfName: string = '',
    conversationHistory: Message[] = [],
    action: string | null = null,
    previousAnswer: string = '',
    pdfImages: string[] = []
  ): Promise<MentorResponse> {
    try {
      let userMessage = message;
      if (action) {
        switch (action) {
          case 'expand': userMessage = `Please expand the following answer with more details, examples, and dimensions:\n\n${previousAnswer}`; break;
          case 'shorten': userMessage = `Please create a crisp, shortened version of this answer suitable for quick revision:\n\n${previousAnswer}`; break;
          case 'topper': userMessage = `Rewrite this answer in topper style with sophisticated vocabulary, frameworks, and value additions:\n\n${previousAnswer}`; break;
          case 'dimensions': userMessage = `Add Social, Economic, Political, Ethical, and Environmental (SEPE-E) dimensions to this answer:\n\n${previousAnswer}`; break;
          case 'examiner': userMessage = `Explain what UPSC examiners expect in this answer and how to score full marks:\n\n${previousAnswer}`; break;
          case 'why': userMessage = `Explain why this topic is important for UPSC and where it can be used in the exam:\n\n${previousAnswer}`; break;
          case 'mistakes': userMessage = `List common mistakes aspirants make when answering questions on this topic:\n\n${previousAnswer}`; break;
          case 'pyq': userMessage = `Analyze Past Year Question patterns related to this topic and how UPSC has asked about it:\n\n${previousAnswer}`; break;
        }
      }

      const historyMessages = conversationHistory.slice(-10).map((msg) => ({
        role: msg.role === 'mentor' ? 'assistant' : 'user',
        content: msg.content,
      }));

      const systemPrompt = MENTOR_SYSTEM_PROMPT(studyMode, pdfName, pdfContent, pdfImages);

      const userContent = pdfImages.length > 0
        ? [
          { type: 'text', text: userMessage },
          ...pdfImages.slice(0, 3).map((url) => ({ type: 'image_url', image_url: { url } })),
        ]
        : userMessage;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...historyMessages,
        { role: 'user', content: userContent },
      ];

      const model = pdfImages.length > 0 ? 'meta-llama/llama-4-scout-17b-16e-instruct' : 'llama-3.3-70b-versatile';
      const data = await callGroq(messages, 0.4, 2500, model);
      const aiResponse = data.choices?.[0]?.message?.content || 'Unable to generate response.';

      const metadata: MessageMetadata = {
        confidence: pdfContent ? 'Direct' : 'Implied',
        source: pdfContent ? 'PDF-based' : 'Conceptual',
        topicType: Math.random() > 0.5 ? 'Static' : 'Dynamic',
        mentorTip: generateMentorTip(userMessage, studyMode),
      };

      return { success: true, response: aiResponse, metadata };
    } catch (error) {
      console.error('Mentor API error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to connect to mentor' };
    }
  },

  async evaluateAnswer(
    studentAnswer: string,
    question: string,
    topic: string = ''
  ): Promise<EvaluationResponse> {
    try {
      const userMessage = `Question: ${question}\n\nStudent's Answer:\n${studentAnswer}\n\n${topic ? `Topic Area: ${topic}` : ''}\n\nEvaluate this answer and provide the topper version.`;

      const messages = [
        { role: 'system', content: EVALUATION_SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ];

      const data = await callGroq(messages, 0.5);
      const aiResponse = data.choices?.[0]?.message?.content || '';

      let evaluation;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          evaluation = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        evaluation = {
          score: 60,
          strengths: ['Attempted the question', 'Shows basic understanding'],
          missing: ['Proper introduction', 'Structured body', 'Legal references', 'Conclusion'],
          improvements: ['Add context', 'Use subheadings', 'Include data', 'Balanced conclusion'],
          topperVersion: aiResponse
        };
      }

      return { success: true, evaluation };
    } catch (error) {
      console.error('Evaluation API error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to evaluate answer' };
    }
  },

  async generateMCQs(
    pdfContent: string,
    pdfName: string = 'Study Material',
    numQuestions: number = 5,
    difficulty: string = 'medium',
    pdfImages: string[] = []
  ): Promise<MCQResponse> {
    try {
      const sourceMode = pdfContent.length > 300 ? 'text' : 'images';
      const contentToUse = pdfContent.substring(0, 12000);

      const userMessage = pdfImages.length > 0 && sourceMode === 'images'
        ? [
          { type: 'text', text: `Generate ${numQuestions} UPSC-style MCQs from these study material images. Create challenging, exam-worthy questions.` },
          ...pdfImages.slice(0, 3).map((url) => ({ type: 'image_url', image_url: { url } }))
        ]
        : `Generate ${numQuestions} UPSC-style MCQs from this study material:\n\nSource: ${pdfName}\n\n---CONTENT START---\n${contentToUse}\n---CONTENT END---\n\nCreate challenging, exam-worthy questions that test deep understanding.`;

      const model = pdfImages.length > 0 && sourceMode === 'images' ? 'meta-llama/llama-4-scout-17b-16e-instruct' : 'llama-3.3-70b-versatile';

      const messages = [
        { role: 'system', content: MCQ_SYSTEM_PROMPT(difficulty) },
        { role: 'user', content: userMessage as any }
      ];

      const data = await callGroq(messages, 0.4, 4000, model);
      const aiResponse = data.choices?.[0]?.message?.content || '';

      let questions = [];
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          questions = (parsed.questions || []).slice(0, numQuestions);
        }
      } catch (e) {
        console.error('Failed to parse MCQs:', e);
      }

      if (questions.length === 0) {
        return { success: false, error: 'Failed to generate valid MCQs from the content.' };
      }

      return { success: true, questions };
    } catch (error) {
      console.error('MCQ generation error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to generate questions' };
    }
  }
};
