import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ChevronRight, CheckCircle2, Circle, ArrowLeft, HelpCircle, Clock } from 'lucide-react';
import { OrderingQuestion } from '../components/quiz/OrderingQuestion';
import { MatchingQuestion } from '../components/quiz/MatchingQuestion';

interface Question {
  id: number;
  text: string;
  question_type: 'MCQ' | 'TF' | 'ORDER' | 'MATCH';
  choices: {
    id: number;
    text: string;
    match_text?: string;
  }[];
}

const TakeQuiz: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [quiz, setQuiz] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
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
        
        // Randomize choices for each question if not ORDER or MATCH (or handle them carefully)
        if (quizData.questions) {
          quizData.questions = quizData.questions.map((q: any) => {
            if (q.question_type === 'ORDER' || q.question_type === 'MATCH') {
              // These components handle their own shuffling/initialization
              return q;
            }
            return {
              ...q,
              choices: shuffleArray(q.choices)
            };
          });
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
    setAnswers(prev => ({
      ...prev,
      [questionId]: choiceId
    }));
  };

  const handleSpecialAnswer = (questionId: number, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
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
      // Ensure all keys are strings to avoid any ambiguity during serialization
      const formattedAnswers: { [key: string]: any } = {};
      Object.entries(answers).forEach(([key, val]) => {
        formattedAnswers[String(key)] = val;
      });

      const response = await api.post('/submit/', {
        quiz_id: id,
        answers: formattedAnswers,
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
        <div className="max-w-7xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between gap-2">
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
              {quiz.title}
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

      <div className="flex-1 flex flex-col md:flex-row pt-16 sm:pt-20">
        {/* Left Sidebar - Question Navigation */}
        <aside className="w-full md:w-64 lg:w-72 bg-white border-r border-slate-100 p-4 sm:p-6 overflow-y-auto max-h-[30vh] md:max-h-[calc(100vh-80px)] sticky top-16 sm:top-20 z-40">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 hidden md:block">
            Danh sách câu hỏi
          </h3>
          <div className="grid grid-cols-5 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {quiz.questions.map((q: any, idx: number) => {
              const isCurrent = idx === currentQuestionIndex;
              const isAnswered = !!answers[q.id];
              
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`aspect-square rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center border-2 ${
                    isCurrent 
                      ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-500/30 ring-4 ring-primary-500/10' 
                      : isAnswered 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:border-emerald-300'
                        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-100 hidden md:block">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-3 h-3 rounded-full bg-primary-600"></div>
              <span className="text-xs font-bold text-slate-500">Đang chọn</span>
            </div>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-200"></div>
              <span className="text-xs font-bold text-slate-500">Đã trả lời</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-white border border-slate-200"></div>
              <span className="text-xs font-bold text-slate-500">Chưa trả lời</span>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex items-start justify-center p-4 sm:p-8 bg-mesh overflow-y-auto">
          <div className="w-full max-w-3xl pt-4 md:pt-12 pb-12">
            <div className="mb-6 sm:mb-10 text-center">
              <div className="inline-flex p-3 sm:p-4 bg-white rounded-[1.2rem] sm:rounded-3xl shadow-lg shadow-slate-200/50 mb-4 sm:mb-6 transform -rotate-2 hover:rotate-0 transition-transform">
                <HelpCircle className="h-6 w-6 sm:h-8 sm:w-8 text-primary-500" />
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black mb-4 sm:mb-6 leading-tight text-slate-800 px-2">
                {currentQuestion.text}
              </h2>
            </div>

            <div className="bg-white p-4 sm:p-8 md:p-10 rounded-[2rem] sm:rounded-[2.5rem] shadow-xl shadow-slate-200/30 border border-slate-100/50 relative">
              <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 px-4 py-1 sm:py-1.5 bg-accent-violet text-white text-[10px] sm:text-xs font-black rounded-full shadow-lg transform rotate-3">
                {currentQuestion.question_type === 'MCQ' ? 'TRẮC NGHIỆM' : 
                 currentQuestion.question_type === 'TF' ? 'ĐÚNG / SAI' :
                 currentQuestion.question_type === 'ORDER' ? 'SẮP XẾP' : 'NỐI CẶP'}
              </div>

              {currentQuestion.question_type === 'ORDER' ? (
                <OrderingQuestion 
                  key={`order-${currentQuestion.id}`}
                  choices={currentQuestion.choices} 
                  onAnswer={(ans) => handleSpecialAnswer(currentQuestion.id, ans)} 
                />
              ) : currentQuestion.question_type === 'MATCH' ? (
                <MatchingQuestion 
                  key={`match-${currentQuestion.id}`}
                  choices={currentQuestion.choices} 
                  onAnswer={(ans) => handleSpecialAnswer(currentQuestion.id, ans)} 
                />
              ) : (
                <div className={`grid gap-3 sm:gap-4 ${currentQuestion.question_type === 'TF' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {currentQuestion.choices.map((choice: any, index: number) => {
                    const isSelected = answers[currentQuestion.id] === choice.id;
                    const labels = ['A', 'B', 'C', 'D'];

                    return (
                      <div key={choice.id} className="relative">
                        <input
                          type="radio"
                          name={`choice-${currentQuestion.id}`}
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
              )}
            </div>

            <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              {currentQuestionIndex > 0 && (
                <button
                  onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
                  className="w-full sm:w-auto px-10 py-4 font-black text-slate-400 hover:text-slate-900 transition-colors"
                >
                  Câu trước
                </button>
              )}
              <Button 
                size="lg" 
                onClick={handleNext}
                disabled={!answers[currentQuestion.id]}
                isLoading={submitting}
                className="w-full sm:w-auto px-16 py-4 sm:py-5 text-lg sm:text-xl rounded-2xl sm:rounded-3xl shadow-xl shadow-primary-500/20"
              >
                {currentQuestionIndex === quiz.questions.length - 1 ? 'Xong rồi! Xem kết quả' : 'Câu tiếp theo'}
                <ChevronRight className="ml-2 h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TakeQuiz;
