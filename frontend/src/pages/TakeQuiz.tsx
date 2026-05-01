import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ChevronRight, CheckCircle2, Circle, ArrowLeft, HelpCircle } from 'lucide-react';

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
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await api.get(`/quizzes/${id}/`);
        setQuiz(response.data);
      } catch (err) {
        console.error('Failed to fetch quiz', err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [id, navigate]);

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
    setSubmitting(true);
    try {
      const response = await api.post('/submit/', {
        quiz_id: id,
        answers: answers
      });
      navigate(`/result/${response.data.id}`);
    } catch (err) {
      console.error('Failed to submit quiz', err);
      alert('Error submitting quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="h-12 w-12 animate-bounce flex items-center justify-center bg-primary-600 rounded-2xl shadow-xl shadow-primary-500/20">
        <div className="h-2 w-2 bg-white rounded-full animate-ping" />
      </div>
    </div>
  );

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Playful Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 h-20 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-900"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          
          <div className="flex flex-col items-center flex-1">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              Question {currentQuestionIndex + 1} / {quiz.questions.length}
            </span>
            <div className="w-full max-w-xs h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-0.5">
              <div 
                className="h-full bg-gradient-to-r from-primary-500 to-accent-violet rounded-full transition-all duration-500 ease-out shadow-sm"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          
          <div className="w-10 h-10 bg-accent-amber/10 text-accent-amber rounded-xl flex items-center justify-center font-bold">
            {currentQuestionIndex + 1}
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center pt-24 pb-12 px-4 bg-mesh">
        <div className="w-full max-w-3xl">
          <div className="mb-12 text-center">
            <div className="inline-flex p-4 bg-white rounded-3xl shadow-lg shadow-slate-200/50 mb-8 transform -rotate-3 hover:rotate-0 transition-transform">
              <HelpCircle className="h-8 w-8 text-primary-500" />
            </div>
            <h2 className="text-3xl font-black mb-8 leading-tight text-slate-800">
              {currentQuestion.text}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {currentQuestion.choices.map((choice: any, index: number) => {
              const isSelected = answers[currentQuestion.id] === choice.id;
              const labels = ['A', 'B', 'C', 'D'];
              const accentColors = [
                'peer-checked:bg-primary-50 peer-checked:border-primary-500 text-primary-600',
                'peer-checked:bg-accent-pink/5 peer-checked:border-accent-pink text-accent-pink',
                'peer-checked:bg-accent-emerald/5 peer-checked:border-accent-emerald text-accent-emerald',
                'peer-checked:bg-accent-amber/5 peer-checked:border-accent-amber text-accent-amber'
              ];

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
                    className={`block w-full text-left p-6 rounded-3xl border-2 cursor-pointer transition-all duration-300 group flex items-center justify-between ${
                      isSelected 
                      ? 'bg-primary-50 border-primary-500 shadow-xl shadow-primary-500/10' 
                      : 'bg-white border-slate-100 hover:border-primary-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-6">
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-lg transition-colors ${
                        isSelected ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' : 'bg-slate-100 text-slate-400 group-hover:bg-primary-100 group-hover:text-primary-500'
                      }`}>
                        {labels[index]}
                      </div>
                      <span className={`text-xl font-bold ${isSelected ? 'text-primary-900' : 'text-slate-600'}`}>
                        {choice.text}
                      </span>
                    </div>
                    {isSelected ? (
                      <CheckCircle2 className="h-8 w-8 text-primary-500 animate-in zoom-in-50 duration-300" />
                    ) : (
                      <Circle className="h-8 w-8 text-slate-100 group-hover:text-slate-200" />
                    )}
                  </label>
                </div>
              );
            })}
          </div>

          <div className="mt-12 flex justify-center">
            <Button 
              size="lg" 
              onClick={handleNext}
              disabled={!answers[currentQuestion.id]}
              isLoading={submitting}
              className="px-16 py-5 text-xl rounded-3xl"
            >
              {currentQuestionIndex === quiz.questions.length - 1 ? 'Finish & See Result!' : 'Next Adventure'}
              <ChevronRight className="ml-2 h-6 w-6" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TakeQuiz;
