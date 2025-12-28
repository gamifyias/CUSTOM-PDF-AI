export type StudyMode = 
  | 'prelims' 
  | 'mains' 
  | 'topper' 
  | 'revision' 
  | 'exam-day' 
  | 'concept' 
  | 'beginner' 
  | 'advanced';

export interface StudyModeConfig {
  id: StudyMode;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface Message {
  id: string;
  role: 'user' | 'mentor';
  content: string;
  timestamp: Date;
  metadata?: MessageMetadata;
  actions?: MentorAction[];
}

export interface MessageMetadata {
  confidence: 'Direct' | 'Implied' | 'Academic';
  source: 'PDF-based' | 'Conceptual';
  topicType: 'Static' | 'Dynamic';
  mentorTip?: string;
}

export interface MentorAction {
  id: string;
  label: string;
  icon: string;
  action: string;
}

export interface PDFDocument {
  id: string;
  name: string;
  size: number;
  uploadedAt: Date;
  pageCount?: number;
}

export interface MockTest {
  id: string;
  title: string;
  questions: MCQuestion[];
  timeLimit: number; // in minutes
  status: 'pending' | 'in-progress' | 'completed';
  score?: number;
  accuracy?: number;
}

export interface MCQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  wrongExplanations: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  topic?: string;
}

export interface UserProgress {
  xp: number;
  level: number;
  streak: number;
  questionsAnswered: number;
  testsCompleted: number;
  accuracy: number;
}

export interface AnswerEvaluation {
  studentAnswer: string;
  topperVersion: string;
  missing: string[];
  improvements: string[];
  score: number;
}
