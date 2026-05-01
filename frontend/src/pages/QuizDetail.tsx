import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Navbar } from '../components/Navbar';
import { ChevronLeft, Info, HelpCircle, BarChart, Sparkles } from 'lucide-react';

interface QuizDetail {
  id: number;
  title: string;
  description: string;
  questions: any[];
}

const QuizDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [loading, setLoading] = useState(true);
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

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="h-12 w-12 animate-spin border-4 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  if (!quiz) return null;

  return (
    <div className="min-h-screen bg-mesh text-slate-900">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 pt-32 pb-12">
        <Link to="/" className="inline-flex items-center text-slate-400 hover:text-primary-600 font-bold mb-10 transition-colors group">
          <ChevronLeft className="h-5 w-5 mr-1 group-hover:-translate-x-1 transition-transform" />
          Back to Explorations
        </Link>

        <Card className="mb-10 relative overflow-hidden border-t-8 border-t-primary-600">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Sparkles className="h-32 w-32" />
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
            <div className="max-w-xl">
              <span className="inline-block px-4 py-1 bg-primary-100 text-primary-700 text-xs font-black uppercase tracking-widest rounded-full mb-6">
                Adventure awaits
              </span>
              <h1 className="text-4xl font-black mb-6 text-slate-900 tracking-tight leading-tight">{quiz.title}</h1>
              <p className="text-slate-500 text-xl font-medium leading-relaxed">{quiz.description || 'No description provided, but we know you can handle this! Get ready to test your knowledge.'}</p>
            </div>
            <div className="shrink-0">
              <Link to={`/take/${quiz.id}`}>
                <Button size="lg" className="w-full md:w-auto px-12 py-6 text-xl rounded-3xl shadow-2xl">
                  Start Quiz
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="flex flex-col items-center text-center p-10 hover:border-primary-200 transition-colors">
            <div className="p-4 rounded-3xl bg-blue-50 text-blue-500 mb-6 shadow-sm">
              <HelpCircle className="h-8 w-8" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-2">{quiz.questions.length}</h3>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Questions</p>
          </Card>

          <Card className="flex flex-col items-center text-center p-10 hover:border-accent-emerald/20 transition-colors">
            <div className="p-4 rounded-3xl bg-accent-emerald/10 text-accent-emerald mb-6 shadow-sm">
              <BarChart className="h-8 w-8" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-2">Unlimited</h3>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Retries</p>
          </Card>

          <Card className="flex flex-col items-center text-center p-10 hover:border-accent-amber/20 transition-colors">
            <div className="p-4 rounded-3xl bg-accent-amber/10 text-accent-amber mb-6 shadow-sm">
              <Info className="h-8 w-8" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-2">Instant</h3>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Feedback</p>
          </Card>
        </div>

        <div className="mt-16 bg-white rounded-3xl p-10 border border-slate-100 shadow-sm">
          <h2 className="text-2xl font-black mb-8 flex items-center text-slate-900">
            <Info className="h-6 w-6 mr-3 text-primary-500" />
            Rules of the Game
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-slate-500 font-medium">
            <div className="flex items-start space-x-4">
              <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 text-slate-400 font-bold">1</div>
              <p>Read each question carefully. Precision is key to high scores!</p>
            </div>
            <div className="flex items-start space-x-4">
              <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 text-slate-400 font-bold">2</div>
              <p>Trust your instincts. Your first choice is often the right one.</p>
            </div>
            <div className="flex items-start space-x-4">
              <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 text-slate-400 font-bold">3</div>
              <p>Finish in one sitting. Stay focused and win the trophy!</p>
            </div>
            <div className="flex items-start space-x-4">
              <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 text-slate-400 font-bold">4</div>
              <p>Have fun! This is about learning and growing your brain.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default QuizDetail;
