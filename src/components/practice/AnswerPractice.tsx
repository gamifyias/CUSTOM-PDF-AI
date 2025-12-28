import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { mentorApi } from '@/lib/api/mentor';
import { toast } from '@/hooks/use-toast';
import {
  Send,
  Sparkles,
  ArrowRight,
  CheckCircle,
  XCircle,
  Lightbulb,
  Loader2,
  Star,
} from 'lucide-react';

interface EvaluationResult {
  score: number;
  strengths: string[];
  studentVersion: string;
  topperVersion: string;
  missing: string[];
  improvements: string[];
}

export const AnswerPractice: React.FC = () => {
  const { uploadedPDF, addXP, incrementQuestionsAnswered } = useApp();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);

  const sampleQuestions = [
    "Discuss the role of Governor in Indian federal structure.",
    "Examine the impact of climate change on Indian agriculture.",
    "Analyze the significance of cooperative federalism in India.",
    "Evaluate the effectiveness of MGNREGA in rural development.",
  ];

  const handleEvaluate = async () => {
    if (!answer.trim() || !question.trim()) {
      toast({
        title: 'Missing Input',
        description: 'Please enter both a question and your answer.',
        variant: 'destructive',
      });
      return;
    }

    setIsEvaluating(true);

    try {
      const response = await mentorApi.evaluateAnswer(answer, question);

      if (response.success && response.evaluation) {
        setEvaluation({
          score: response.evaluation.score,
          strengths: response.evaluation.strengths || [],
          studentVersion: answer,
          topperVersion: response.evaluation.topperVersion,
          missing: response.evaluation.missing,
          improvements: response.evaluation.improvements,
        });
        addXP(25);
        incrementQuestionsAnswered();
      } else {
        toast({
          title: 'Evaluation Failed',
          description: response.error || 'Failed to evaluate your answer. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Evaluation error:', error);
      toast({
        title: 'Error',
        description: 'Failed to connect to the evaluation service.',
        variant: 'destructive',
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  const resetPractice = () => {
    setQuestion('');
    setAnswer('');
    setEvaluation(null);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-gold';
    if (score >= 40) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent!';
    if (score >= 60) return 'Good Effort';
    if (score >= 40) return 'Needs Improvement';
    return 'Keep Practicing';
  };

  if (!uploadedPDF) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Sparkles className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="font-display text-xl font-semibold mb-2">Answer Practice</h3>
        <p className="text-muted-foreground max-w-md">
          Upload a PDF study material to unlock answer evaluation. Practice writing and get topper-level feedback.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl font-bold mb-2">Answer Practice</h2>
          <p className="text-muted-foreground">
            Write your answer and get AI-powered evaluation with topper-style improvements
          </p>
        </div>

        {!evaluation ? (
          <>
            {/* Question Input */}
            <div className="mentor-card">
              <label className="block text-sm font-medium mb-2">Question</label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter the UPSC question you want to practice..."
                rows={3}
                className="w-full px-4 py-3 bg-background border border-input rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
              
              {/* Sample Questions */}
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-2">Or try a sample question:</p>
                <div className="flex flex-wrap gap-2">
                  {sampleQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => setQuestion(q)}
                      className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-accent/20 transition-colors truncate max-w-[200px]"
                    >
                      {q.slice(0, 40)}...
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Answer Input */}
            <div className="mentor-card">
              <label className="block text-sm font-medium mb-2">Your Answer</label>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Write your answer here... (minimum 100 words recommended)"
                rows={12}
                className="w-full px-4 py-3 bg-background border border-input rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
              />
              <div className="flex justify-between items-center mt-3">
                <span className="text-xs text-muted-foreground">
                  {answer.split(/\s+/).filter(Boolean).length} words
                </span>
                <Button
                  variant="gold"
                  onClick={handleEvaluate}
                  disabled={!question.trim() || !answer.trim() || isEvaluating}
                >
                  {isEvaluating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Evaluating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Evaluate Answer
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Evaluation Results */}
            <div className="animate-slide-up space-y-6">
              {/* Score Card */}
              <div className="mentor-card gold-border text-center py-8">
                <div className={cn(
                  "inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-gold to-gold-dark text-accent-foreground mb-4 shadow-gold"
                )}>
                  <span className="font-display text-3xl font-bold">{evaluation.score}</span>
                </div>
                <p className={cn("text-lg font-medium", getScoreColor(evaluation.score))}>
                  {getScoreLabel(evaluation.score)}
                </p>
                <p className="text-sm text-muted-foreground">out of 100</p>
                <div className="mt-4 flex justify-center gap-4">
                  <span className="flex items-center gap-1 text-sm text-success">
                    <CheckCircle className="w-4 h-4" />
                    {evaluation.strengths?.length || 0} strengths
                  </span>
                  <span className="flex items-center gap-1 text-sm text-warning">
                    <XCircle className="w-4 h-4" />
                    {evaluation.missing.length} gaps
                  </span>
                </div>
              </div>

              {/* Strengths */}
              {evaluation.strengths && evaluation.strengths.length > 0 && (
                <div className="mentor-card">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Star className="w-5 h-5 text-gold" />
                    Strengths
                  </h4>
                  <ul className="space-y-2">
                    {evaluation.strengths.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Comparison */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Your Answer */}
                <div className="mentor-card">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">1</span>
                    Your Answer
                  </h4>
                  <div className="p-4 bg-muted/50 rounded-lg text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
                    {evaluation.studentVersion}
                  </div>
                </div>

                {/* Topper Version */}
                <div className="mentor-card gold-border">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-gold flex items-center justify-center text-accent-foreground text-xs">★</span>
                    Topper Version
                  </h4>
                  <div 
                    className="p-4 bg-gold/5 rounded-lg text-sm max-h-64 overflow-y-auto prose prose-sm dark:prose-invert"
                    dangerouslySetInnerHTML={{ 
                      __html: evaluation.topperVersion.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                    }}
                  />
                </div>
              </div>

              {/* Missing Elements */}
              <div className="mentor-card">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-warning" />
                  What Was Missing
                </h4>
                <ul className="space-y-2">
                  {evaluation.missing.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-warning mt-2 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Improvements */}
              <div className="mentor-card">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-gold" />
                  How to Improve
                </h4>
                <ul className="space-y-2">
                  {evaluation.improvements.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <ArrowRight className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Try Again */}
              <div className="text-center">
                <Button variant="outline" onClick={resetPractice}>
                  Practice Another Answer
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
