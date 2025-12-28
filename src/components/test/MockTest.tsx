import React, { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MCQuestion } from '@/types';
import { mentorApi } from '@/lib/api/mentor';
import { toast } from '@/hooks/use-toast';
import {
  Play,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Flag,
  Trophy,
  RotateCcw,
  Loader2,
  Zap,
} from 'lucide-react';

type TestState = 'idle' | 'generating' | 'running' | 'completed';

export const MockTest: React.FC = () => {
  const { uploadedPDF, pdfContent, addXP, incrementTestsCompleted, updateAccuracy } = useApp();
  const [testState, setTestState] = useState<TestState>('idle');
  const [questions, setQuestions] = useState<MCQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState(600);
  const [violations, setViolations] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const currentQuestion = questions[currentQuestionIndex];

  // Tab visibility detection
  useEffect(() => {
    if (testState !== 'running') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setViolations(prev => {
          const newCount = prev + 1;
          toast({
            title: '⚠️ Warning',
            description: `Tab switch detected (${newCount}/3). Test will auto-submit after 3 violations.`,
            variant: 'destructive',
          });
          if (newCount >= 3) {
            setTestState('completed');
            setShowResults(true);
          }
          return newCount;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [testState]);

  // Timer
  useEffect(() => {
    if (testState !== 'running') return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setTestState('completed');
          setShowResults(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [testState]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const generateTest = async () => {
    if (!pdfContent) {
      toast({
        title: 'No PDF Content',
        description: 'Please upload a PDF with readable content.',
        variant: 'destructive',
      });
      return;
    }

    setTestState('generating');

    try {
      const response = await mentorApi.generateMCQs(
        pdfContent,
        uploadedPDF?.name || 'Study Material',
        numQuestions,
        difficulty
      );

      if (response.success && response.questions && response.questions.length > 0) {
        const typedQuestions = response.questions.map(q => ({
          ...q,
          difficulty: (q.difficulty as 'easy' | 'medium' | 'hard') || 'medium'
        }));
        setQuestions(typedQuestions);
        setTestState('running');
        setCurrentQuestionIndex(0);
        setAnswers({});
        setFlagged(new Set());
        setTimeRemaining(numQuestions * 120); // 2 min per question
        setViolations(0);
        setShowResults(false);
      } else {
        toast({
          title: 'Generation Failed',
          description: response.error || 'Failed to generate questions. Try again.',
          variant: 'destructive',
        });
        setTestState('idle');
      }
    } catch (error) {
      console.error('MCQ generation error:', error);
      toast({
        title: 'Error',
        description: 'Failed to connect to the question generator.',
        variant: 'destructive',
      });
      setTestState('idle');
    }
  };

  const selectAnswer = (optionIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: optionIndex,
    }));
  };

  const toggleFlag = () => {
    setFlagged(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestion.id)) {
        newSet.delete(currentQuestion.id);
      } else {
        newSet.add(currentQuestion.id);
      }
      return newSet;
    });
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const submitTest = () => {
    setTestState('completed');
    setShowResults(true);
    
    const correct = questions.filter(q => answers[q.id] === q.correctAnswer).length;
    addXP(correct * 20);
    incrementTestsCompleted();
    updateAccuracy(correct, questions.length);
  };

  const calculateResults = () => {
    const total = questions.length;
    const attempted = Object.keys(answers).filter(k => answers[k] !== null).length;
    const correct = questions.filter(q => answers[q.id] === q.correctAnswer).length;
    const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
    
    return { total, attempted, correct, accuracy };
  };

  if (!uploadedPDF) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Trophy className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="font-display text-xl font-semibold mb-2">Mock Tests</h3>
        <p className="text-muted-foreground max-w-md">
          Upload a PDF study material to unlock AI-generated mock tests from your content.
        </p>
      </div>
    );
  }

  // Test Idle State
  if (testState === 'idle') {
    return (
      <div className="h-full overflow-y-auto p-4 md:p-6">
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center mx-auto mb-6 shadow-gold">
            <Trophy className="w-12 h-12 text-accent-foreground" />
          </div>
          <h2 className="font-display text-3xl font-bold mb-4">AI-Powered Mock Test</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Generate UPSC-style MCQs directly from your study material using AI.
          </p>

          <div className="mentor-card mb-6 text-left">
            <h4 className="font-semibold mb-4">Test Configuration</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Number of Questions</label>
                <div className="flex gap-2">
                  {[3, 5, 10].map(n => (
                    <button
                      key={n}
                      onClick={() => setNumQuestions(n)}
                      className={cn(
                        "px-4 py-2 rounded-lg border transition-all",
                        numQuestions === n 
                          ? "border-accent bg-accent/10 text-accent-foreground font-medium" 
                          : "border-border hover:border-accent/50"
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Difficulty</label>
                <div className="flex gap-2">
                  {[
                    { value: 'easy', label: 'Easy', color: 'text-success' },
                    { value: 'medium', label: 'Medium', color: 'text-warning' },
                    { value: 'hard', label: 'Hard', color: 'text-destructive' },
                  ].map(d => (
                    <button
                      key={d.value}
                      onClick={() => setDifficulty(d.value as any)}
                      className={cn(
                        "px-4 py-2 rounded-lg border transition-all",
                        difficulty === d.value 
                          ? "border-accent bg-accent/10 font-medium" 
                          : "border-border hover:border-accent/50",
                        difficulty === d.value && d.color
                      )}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm pt-2">
                <div>
                  <span className="text-muted-foreground">Source:</span>
                  <span className="ml-2 font-medium truncate block">{uploadedPDF.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Time:</span>
                  <span className="ml-2 font-medium">{numQuestions * 2} minutes</span>
                </div>
                <div>
                  <span className="text-muted-foreground">XP Reward:</span>
                  <span className="ml-2 font-medium text-gold">Up to {numQuestions * 20} XP</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-warning/10 border border-warning/20 mb-6 text-left">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-warning mb-1">Integrity Notice</p>
                <p className="text-muted-foreground">
                  Tab switching will be detected. 3 violations will auto-submit the test.
                </p>
              </div>
            </div>
          </div>

          <Button variant="gold" size="xl" onClick={generateTest}>
            <Zap className="w-5 h-5" />
            Generate & Start Test
          </Button>
        </div>
      </div>
    );
  }

  // Generating State
  if (testState === 'generating') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center mb-6 shadow-gold animate-pulse">
          <Loader2 className="w-12 h-12 text-accent-foreground animate-spin" />
        </div>
        <h3 className="font-display text-xl font-semibold mb-2">Generating Questions...</h3>
        <p className="text-muted-foreground text-center max-w-md">
          AI is analyzing your PDF and creating UPSC-style MCQs. This may take a moment.
        </p>
      </div>
    );
  }

  // Test Results
  if (showResults) {
    const results = calculateResults();
    
    return (
      <div className="h-full overflow-y-auto p-4 md:p-6">
        <div className="max-w-3xl mx-auto py-8 animate-slide-up">
          {/* Score Card */}
          <div className="mentor-card gold-border text-center py-8 mb-6">
            <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br from-gold to-gold-dark text-accent-foreground mb-4 shadow-gold">
              <div>
                <span className="font-display text-3xl font-bold">{results.correct}</span>
                <span className="text-lg">/{results.total}</span>
              </div>
            </div>
            <p className="text-2xl font-display font-bold mb-1">Test Complete!</p>
            <p className="text-muted-foreground">
              {results.accuracy >= 80 ? 'Excellent performance!' : 
               results.accuracy >= 60 ? 'Good effort, keep practicing!' : 
               'Review the explanations to improve.'}
            </p>
            
            <div className="flex justify-center gap-8 mt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-success">{results.correct}</p>
                <p className="text-xs text-muted-foreground">Correct</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-destructive">{results.attempted - results.correct}</p>
                <p className="text-xs text-muted-foreground">Wrong</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{results.accuracy}%</p>
                <p className="text-xs text-muted-foreground">Accuracy</p>
              </div>
            </div>

            {violations > 0 && (
              <p className="text-xs text-warning mt-4">
                ⚠️ {violations} integrity violation(s) detected
              </p>
            )}
          </div>

          {/* Question Review */}
          <div className="space-y-4">
            <h3 className="font-display text-xl font-semibold">Review Answers</h3>
            {questions.map((q, index) => {
              const userAnswer = answers[q.id];
              const isCorrect = userAnswer === q.correctAnswer;
              
              return (
                <div key={q.id} className="mentor-card">
                  <div className="flex items-start gap-3 mb-3">
                    <span className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium",
                      isCorrect ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                    )}>
                      {isCorrect ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium whitespace-pre-wrap">{q.question}</p>
                      {q.topic && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-muted rounded text-xs">
                          {q.topic}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2 ml-11">
                    {q.options.map((option, optIndex) => (
                      <div
                        key={optIndex}
                        className={cn(
                          "p-2 rounded text-sm",
                          optIndex === q.correctAnswer && "bg-success/10 border border-success/30",
                          userAnswer === optIndex && optIndex !== q.correctAnswer && "bg-destructive/10 border border-destructive/30"
                        )}
                      >
                        <span className="font-medium mr-2">{String.fromCharCode(65 + optIndex)}.</span>
                        {option}
                        {optIndex === q.correctAnswer && (
                          <span className="ml-2 text-xs text-success">✓ Correct</span>
                        )}
                        {userAnswer === optIndex && optIndex !== q.correctAnswer && (
                          <span className="ml-2 text-xs text-destructive">✗ Your answer</span>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-3 ml-11 p-3 rounded bg-muted/50 text-sm">
                    <p className="font-medium mb-1">Explanation:</p>
                    <p className="text-muted-foreground">{q.explanation}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-8">
            <Button variant="gold" onClick={() => setTestState('idle')}>
              <RotateCcw className="w-4 h-4" />
              Take Another Test
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Test Running State
  return (
    <div className="h-full flex flex-col">
      {/* Test Header */}
      <div className="bg-card border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          {violations > 0 && (
            <span className="text-xs text-warning flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {violations} warning{violations > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
            timeRemaining < 60 ? "bg-destructive/20 text-destructive" : "bg-muted"
          )}>
            <Clock className="w-4 h-4" />
            {formatTime(timeRemaining)}
          </div>
          <Button variant="gold" size="sm" onClick={submitTest}>
            Submit Test
          </Button>
        </div>
      </div>

      {/* Question Navigation Pills */}
      <div className="bg-muted/30 border-b border-border p-3 flex gap-2 overflow-x-auto">
        {questions.map((q, index) => (
          <button
            key={q.id}
            onClick={() => goToQuestion(index)}
            className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium flex-shrink-0 transition-all",
              currentQuestionIndex === index && "ring-2 ring-accent",
              answers[q.id] !== undefined && answers[q.id] !== null
                ? "bg-success text-success-foreground"
                : "bg-card border border-border",
              flagged.has(q.id) && "ring-2 ring-warning"
            )}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {/* Question Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-3xl mx-auto">
          {currentQuestion && (
            <div className="mentor-card">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "px-2 py-1 rounded text-xs font-medium",
                    currentQuestion.difficulty === 'easy' && "bg-success/20 text-success",
                    currentQuestion.difficulty === 'medium' && "bg-warning/20 text-warning",
                    currentQuestion.difficulty === 'hard' && "bg-destructive/20 text-destructive"
                  )}>
                    {currentQuestion.difficulty}
                  </span>
                  {currentQuestion.topic && (
                    <span className="px-2 py-1 rounded text-xs bg-muted">
                      {currentQuestion.topic}
                    </span>
                  )}
                </div>
                <button
                  onClick={toggleFlag}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    flagged.has(currentQuestion.id) 
                      ? "bg-warning/20 text-warning" 
                      : "hover:bg-muted text-muted-foreground"
                  )}
                >
                  <Flag className="w-4 h-4" />
                </button>
              </div>

              <p className="text-lg font-medium whitespace-pre-wrap mb-6">
                {currentQuestion.question}
              </p>

              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => selectAnswer(index)}
                    className={cn(
                      "w-full text-left p-4 rounded-lg border transition-all duration-200",
                      answers[currentQuestion.id] === index
                        ? "border-accent bg-accent/10 ring-2 ring-accent"
                        : "border-border hover:border-accent/50 hover:bg-muted/50"
                    )}
                  >
                    <span className="font-semibold mr-3">{String.fromCharCode(65 + index)}.</span>
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="bg-card border-t border-border p-4 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => goToQuestion(currentQuestionIndex - 1)}
          disabled={currentQuestionIndex === 0}
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{Object.keys(answers).filter(k => answers[k] !== null).length} answered</span>
          <span>•</span>
          <span>{flagged.size} flagged</span>
        </div>

        <Button
          variant="outline"
          onClick={() => goToQuestion(currentQuestionIndex + 1)}
          disabled={currentQuestionIndex === questions.length - 1}
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
