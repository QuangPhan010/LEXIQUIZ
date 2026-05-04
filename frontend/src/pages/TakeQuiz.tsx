import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ChevronRight, CheckCircle2, Circle, ArrowLeft, HelpCircle, Clock } from 'lucide-react';

interface Question {
  id: number;
  text: string;
  choices: {
    id: number;
    text: string;
  }[];
}

const TakeQuiz: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [quiz, setQuiz] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [startTime] = useState(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  const shuffleArray = (array: any[]) => {
    return [...array].sort(() => Math.random() - 0.5);
  };

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await api.get(`/quizzes/${id}/`);
        const quizData = response.data;
        
        // Randomize choices for each question
        if (quizData.questions) {
          quizData.questions = quizData.questions.map((q: any) => ({
            ...q,
            choices: shuffleArray(q.choices)
          }));
        }
        
        setQuiz(quizData);
        if (quizData.time_limit > 0) {
          setTimeLeft(quizData.time_limit);
        }
      } catch (err) {
        console.error('Failed to fetch quiz', err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [id, navigate]);

  useEffect(() => {
    if (timeLeft === null) return;
    
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    timerRef.current = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft]);

  const handleSelectChoice = (choiceId: number) => {
    const questionId = quiz.questions[currentQuestionIndex].id;
    setAnswers({
      ...answers,
      [questionId]: choiceId
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    
    const duration = Math.floor((Date.now() - startTime) / 1000);

    try {
      const response = await api.post('/submit/', {
        quiz_id: id,
        answers: answers,
        duration: duration
      });
      navigate(`/result/${response.data.id}`);
    } catch (err) {
      console.error('Failed to submit quiz', err);
      alert('Ui da! Lỗi khi nộp bài rồi. Thử lại cái nè.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="h-12 w-12 animate-bounce flex items-center justify-center bg-primary-600 rounded-2xl shadow-xl shadow-primary-500/20">
        <div className="h-2 w-2 bg-white rounded-full animate-ping" />
      </div>
    </div>
  );

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-10">
          <HelpCircle className="h-16 w-16 text-slate-300 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-slate-900 mb-4">Không tìm thấy câu hỏi</h2>
          <p className="text-slate-500 mb-8">Bộ câu hỏi này dường như không có câu hỏi nào. Vui lòng thử bộ khác.</p>
          <Button onClick={() => navigate('/')}>Quay lại Trang chủ</Button>
        </Card>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Playful Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between gap-2">
          <button 
            onClick={() => {
              if (window.confirm('Bỏ cuộc bây giờ là mất hết thành quả đó nha! Chắc chưa?')) {
                navigate('/');
              }
            }}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-900 shrink-0"
          >
            <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          
          <div className="flex flex-col items-center flex-1 min-w-0">
            <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-1 sm:mb-2 truncate">
              Câu {currentQuestionIndex + 1} / {quiz.questions.length}
            </span>
            <div className="w-full max-w-[150px] sm:max-w-xs h-2 sm:h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-0.5">
              <div 
                className="h-full bg-gradient-to-r from-primary-500 to-accent-violet rounded-full transition-all duration-500 ease-out shadow-sm"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
            {timeLeft !== null && (
              <div className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl font-mono font-bold text-xs sm:text-sm ${
                timeLeft < 30 ? 'bg-red-50 text-red-500 animate-pulse' : 'bg-slate-50 text-slate-600'
              }`}>
                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{formatTime(timeLeft)}</span>
              </div>
            )}
            <div className="hidden sm:flex w-10 h-10 bg-accent-amber/10 text-accent-amber rounded-xl items-center justify-center font-bold">
              {currentQuestionIndex + 1}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center pt-20 sm:pt-24 pb-12 px-4 bg-mesh">
        <div className="w-full max-w-3xl">
          <div className="mb-8 sm:mb-12 text-center">
            <div className="inline-flex p-3 sm:p-4 bg-white rounded-[1.5rem] sm:rounded-3xl shadow-lg shadow-slate-200/50 mb-6 sm:mb-8 transform -rotate-3 hover:rotate-0 transition-transform">
              <HelpCircle className="h-6 w-6 sm:h-8 sm:w-8 text-primary-500" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black mb-6 sm:mb-8 leading-tight text-slate-800">
              {currentQuestion.text}
            </h2>
          </div>

          <div className={`grid gap-3 sm:gap-4 ${currentQuestion.question_type === 'TF' ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {currentQuestion.choices.map((choice: any, index: number) => {
              const isSelected = answers[currentQuestion.id] === choice.id;
              const labels = ['A', 'B', 'C', 'D'];

              return (
                <div key={choice.id} className="relative">
                  <input
                    type="radio"
                    name="choice"
                    id={`choice-${choice.id}`}
                    className="peer sr-only"
                    checked={isSelected}
                    onChange={() => handleSelectChoice(choice.id)}
                  />
                  <label
                    htmlFor={`choice-${choice.id}`}
                    className={`block w-full text-left p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-2 cursor-pointer transition-all duration-300 group flex items-center justify-between ${
                      isSelected 
                      ? 'bg-primary-50 border-primary-500 shadow-xl shadow-primary-500/10' 
                      : 'bg-white border-slate-100 hover:border-primary-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-4 sm:space-x-6">
                      {currentQuestion.question_type !== 'TF' && (
                        <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-base sm:text-lg transition-colors ${
                          isSelected ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' : 'bg-slate-100 text-slate-400 group-hover:bg-primary-100 group-hover:text-primary-500'
                        }`}>
                          {labels[index]}
                        </div>
                      )}
                      <span className={`text-lg sm:text-xl font-bold ${isSelected ? 'text-primary-900' : 'text-slate-600'} ${currentQuestion.question_type === 'TF' ? 'w-full text-center' : ''}`}>
                        {choice.text}
                      </span>
                    </div>
                    {currentQuestion.question_type !== 'TF' && (
                      isSelected ? (
                        <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-primary-500 animate-in zoom-in-50 duration-300" />
                      ) : (
                        <Circle className="h-6 w-6 sm:h-8 sm:w-8 text-slate-100 group-hover:text-slate-200" />
                      )
                    )}
                  </label>
                </div>
              );
            })}
          </div>

          <div className="mt-8 sm:mt-12 flex justify-center">
            <Button 
              size="lg" 
              onClick={handleNext}
              disabled={!answers[currentQuestion.id]}
              isLoading={submitting}
              className="w-full sm:w-auto px-16 py-4 sm:py-5 text-lg sm:text-xl rounded-2xl sm:rounded-3xl"
            >
              {currentQuestionIndex === quiz.questions.length - 1 ? 'Xong rồi! Xem kết quả' : 'Tiến lên!'}
              <ChevronRight className="ml-2 h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TakeQuiz;
