import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Navbar } from '../components/Navbar';
import { Trophy, RefreshCw, Home, History, Star, PartyPopper } from 'lucide-react';

const Result: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const response = await api.get(`/results/${id}/`);
        setResult(response.data);
      } catch (err) {
        console.error('Failed to fetch result', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="h-12 w-12 animate-spin border-4 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  if (!result) return <div className="text-slate-900 text-center pt-24">Result not found.</div>;

  const percentage = (result.score / result.total_questions) * 100;
  const isPassed = percentage >= 50;

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
            <p className="text-lg text-slate-500 font-medium mb-12">
              You've just completed <span className="text-slate-900 font-bold underline decoration-primary-500/30">{result.quiz_title}</span>
            </p>

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

              <div className="flex space-x-16 pt-4">
                <div className="text-center">
                  <p className="text-slate-400 text-xs uppercase font-black tracking-widest mb-2">Efficiency</p>
                  <p className="text-4xl font-black text-slate-900">{Math.round(percentage)}%</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-400 text-xs uppercase font-black tracking-widest mb-2">Result</p>
                  <p className={`text-4xl font-black ${isPassed ? 'text-accent-emerald' : 'text-primary-500'}`}>
                    {isPassed ? 'Passed' : 'Try Again'}
                  </p>
                </div>
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
