import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Navbar } from '../components/Navbar';
import { Trophy, RefreshCw, Home, History, Star, PartyPopper, Clock, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Result: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { refreshUser } = useAuth();

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const response = await api.get(`/results/${id}/`);
        setResult(response.data);
        // Refresh user profile to show updated XP/Level
        await refreshUser();
      } catch (err) {
        console.error('Failed to fetch result', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [id, refreshUser]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="h-12 w-12 animate-spin border-4 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  if (!result) return <div className="text-slate-900 text-center pt-24">Result not found.</div>;

  const percentage = (result.score / result.total_questions) * 100;
  const isPassed = percentage >= 50;
  const xpEarned = result.score * 10;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className="min-h-screen bg-mesh text-slate-900">
      <Navbar />
      
      <main className="max-w-3xl mx-auto px-4 pt-32 pb-12">
        <Card className="text-center py-16 relative overflow-hidden shadow-2xl border-0">
          <div className={`absolute top-0 left-0 w-full h-3 ${isPassed ? 'bg-accent-emerald' : 'bg-primary-500'}`} />
          
          <div className="relative">
            <div className={`inline-flex p-6 rounded-full mb-8 ${isPassed ? 'bg-accent-emerald/10 text-accent-emerald' : 'bg-primary-100 text-primary-500'} animate-bounce`}>
              {isPassed ? <PartyPopper className="h-16 w-16" /> : <Trophy className="h-16 w-16" />}
            </div>

            <h1 className="text-5xl font-black mb-4 tracking-tight text-slate-900">
              {isPassed ? 'Awesome Job!' : 'Nice Try!'}
            </h1>
            <p className="text-lg text-slate-500 font-medium mb-8">
              You've just completed <span className="text-slate-900 font-bold underline decoration-primary-500/30">{result.quiz_title}</span>
            </p>

            <div className="flex justify-center mb-12">
              <div className="flex items-center space-x-3 bg-accent-amber/10 text-accent-amber px-6 py-3 rounded-2xl animate-in fade-in zoom-in duration-500 delay-300">
                <Zap className="h-6 w-6 fill-accent-amber" />
                <span className="text-2xl font-black">+{xpEarned} XP</span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center space-y-10">
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-64 h-64 transform -rotate-90">
                  <circle
                    className="text-slate-100"
                    strokeWidth="12"
                    stroke="currentColor"
                    fill="transparent"
                    r="100"
                    cx="128"
                    cy="128"
                  />
                  <circle
                    className={`${isPassed ? 'text-accent-emerald' : 'text-primary-500'} transition-all duration-1000 ease-out`}
                    strokeWidth="12"
                    strokeDasharray={628}
                    strokeDashoffset={628 - (628 * percentage) / 100}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="100"
                    cx="128"
                    cy="128"
                  />
                </svg>
                <div className="absolute text-center transform rotate-0">
                  <span className="text-7xl font-black block text-slate-900 leading-none">{result.score}</span>
                  <span className="text-slate-400 text-sm font-black uppercase tracking-widest mt-2 block">out of {result.total_questions}</span>
                </div>
              </div>

              <div className="flex space-x-12 pt-4">
                <div className="text-center">
                  <p className="text-slate-400 text-xs uppercase font-black tracking-widest mb-2">Efficiency</p>
                  <p className="text-4xl font-black text-slate-900">{Math.round(percentage)}%</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-400 text-xs uppercase font-black tracking-widest mb-2">Time Taken</p>
                  <div className="flex items-center justify-center text-4xl font-black text-slate-900">
                    <Clock className="h-6 w-6 mr-2 text-slate-300" />
                    {formatDuration(result.duration)}
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-slate-400 text-xs uppercase font-black tracking-widest mb-2">Result</p>
                  <p className={`text-4xl font-black ${isPassed ? 'text-accent-emerald' : 'text-primary-500'}`}>
                    {isPassed ? 'Passed' : 'Try Again'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-16 text-left">
              <div className="flex items-center space-x-3 mb-8">
                <HelpCircle className="h-6 w-6 text-primary-500" />
                <h2 className="text-2xl font-black text-slate-800">Review Answers</h2>
              </div>
              
              <div className="space-y-6">
                {result.answers && result.answers.map((answer: any, index: number) => {
                  const isCorrect = answer.selected_choice === answer.correct_choice_id;
                  return (
                    <div key={index} className={`p-6 rounded-3xl border-2 transition-all ${
                      isCorrect ? 'border-accent-emerald/20 bg-accent-emerald/5' : 'border-primary-100 bg-white shadow-sm'
                    }`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <span className={`h-8 w-8 rounded-xl flex items-center justify-center text-xs font-black ${
                            isCorrect ? 'bg-accent-emerald text-white' : 'bg-primary-500 text-white'
                          }`}>
                            {index + 1}
                          </span>
                          <h3 className="font-bold text-slate-800">{answer.question_text}</h3>
                        </div>
                        {isCorrect ? (
                          <div className="flex items-center space-x-1 text-accent-emerald text-xs font-black uppercase tracking-widest bg-accent-emerald/10 px-3 py-1 rounded-full">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Correct</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 text-primary-500 text-xs font-black uppercase tracking-widest bg-primary-50 px-3 py-1 rounded-full">
                            <Circle className="h-3 w-3" />
                            <span>Incorrect</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Answer</p>
                          <div className={`p-3 rounded-2xl border ${
                            isCorrect ? 'border-accent-emerald/30 bg-white text-accent-emerald font-bold' : 'border-primary-200 bg-primary-50 text-primary-600 font-bold'
                          }`}>
                            {answer.selected_choice_text || 'No Answer'}
                          </div>
                        </div>
                        {!isCorrect && (
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Correct Answer</p>
                            <div className="p-3 rounded-2xl border border-accent-emerald bg-white text-accent-emerald font-bold">
                              {answer.correct_choice_text}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
              <Link to={`/take/${result.quiz}`}>
                <Button variant="primary" className="w-full py-5 text-lg rounded-2xl">
                  <RefreshCw className="h-5 w-5 mr-3" />
                  Try Again
                </Button>
              </Link>
              <Link to="/history">
                <Button variant="outline" className="w-full py-5 text-lg rounded-2xl">
                  <History className="h-5 w-5 mr-3" />
                  My Progress
                </Button>
              </Link>
            </div>
            
            <div className="mt-10 flex items-center justify-center space-x-6">
              <Link to="/" className="text-slate-400 hover:text-slate-900 font-bold transition-colors flex items-center">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Link>
              <div className="h-1 w-1 bg-slate-200 rounded-full" />
              <button className="text-slate-400 hover:text-primary-600 font-bold transition-colors flex items-center">
                <Star className="h-4 w-4 mr-2" />
                Rate Quiz
              </button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Result;
