import { supabase } from '@/integrations/supabase/client';
import { StudyMode, Message, MessageMetadata } from '@/types';

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
      const { data, error } = await supabase.functions.invoke('upsc-mentor', {
        body: {
          message,
          studyMode,
          pdfContent,
          pdfName,
          pdfImages,
          conversationHistory: conversationHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          action,
          previousAnswer,
        },
      });

      if (error) {
        console.error('Mentor API error:', error);
        return { success: false, error: error.message };
      }

      return data as MentorResponse;
    } catch (error) {
      console.error('Mentor API error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to connect to mentor' 
      };
    }
  },

  async evaluateAnswer(
    studentAnswer: string,
    question: string,
    topic: string = ''
  ): Promise<EvaluationResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('evaluate-answer', {
        body: {
          studentAnswer,
          question,
          topic
        }
      });

      if (error) {
        console.error('Evaluation API error:', error);
        return { success: false, error: error.message };
      }

      return data as EvaluationResponse;
    } catch (error) {
      console.error('Evaluation API error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to evaluate answer' 
      };
    }
  },

  async generateMCQs(
    pdfContent: string,
    pdfName: string = 'Study Material',
    numQuestions: number = 5,
    difficulty: string = 'medium'
  ): Promise<MCQResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('generate-mcqs', {
        body: {
          pdfContent,
          pdfName,
          numQuestions,
          difficulty
        }
      });

      if (error) {
        console.error('MCQ generation error:', error);
        return { success: false, error: error.message };
      }

      return data as MCQResponse;
    } catch (error) {
      console.error('MCQ generation error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate questions' 
      };
    }
  }
};
