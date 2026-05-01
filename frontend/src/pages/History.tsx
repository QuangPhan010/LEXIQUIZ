import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Card } from '../components/ui/Card';
import { Navbar } from '../components/Navbar';
import { History as HistoryIcon, ArrowRight, Calendar, Award, Trophy } from 'lucide-react';

interface ResultRecord {
  id: number;
  quiz_title: string;
  score: number;
  total_questions: number;
  completed_at: string;
}

const History: React.FC = () => {
  const [history, setHistory] = useState<ResultRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get('/history/');
        setHistory(response.data);
      } catch (err) {
        console.error('Failed to fetch history', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="min-h-screen bg-mesh text-slate-900">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-4 pt-32 pb-12">
        <div className="flex items-center space-x-4 mb-12">
          <div className="bg-primary-600 p-3.5 rounded-2xl shadow-lg shadow-primary-500/20">
            <HistoryIcon className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-4xl font-black tracking-tight">Your Progress</h1>
        </div>

        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-3xl bg-white border border-slate-100 animate-pulse" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <Card className="text-center py-24 bg-white/50 border-dashed border-2">
            <Trophy className="h-20 w-20 text-slate-200 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-slate-800">No attempts yet</h3>
            <p className="text-slate-500 mt-2 text-lg">Start your learning journey today!</p>
            <Link to="/" className="mt-8 inline-block text-primary-600 font-black hover:underline underline-offset-8 decoration-4">
              Browse All Quizzes →
            </Link>
          </Card>
        ) : (
          <div className="space-y-6">
            {history.map((record) => {
              const percentage = (record.score / record.total_questions) * 100;
              const isPassed = percentage >= 50;
              
              return (
                <Link key={record.id} to={`/result/${record.id}`}>
                  <Card className="hover:shadow-2xl hover:shadow-primary-500/10 transition-all border-l-8 border-l-slate-100 hover:border-l-primary-500 p-8 group">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8">
                      <div className="flex items-center space-x-6">
                        <div className={`p-4 rounded-2xl shadow-sm ${isPassed ? 'bg-accent-emerald/10 text-accent-emerald' : 'bg-rose-50 text-rose-500'}`}>
                          <Award className="h-8 w-8" />
                        </div>
                        <div>
                          <h3 className="font-black text-2xl text-slate-800 group-hover:text-primary-600 transition-colors mb-2">
                            {record.quiz_title}
                          </h3>
                          <div className="flex items-center text-slate-400 font-bold text-sm">
                            <Calendar className="h-4 w-4 mr-2" />
                            {new Date(record.completed_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-end gap-12">
                        <div className="text-right">
                          <p className="text-3xl font-black text-slate-900 leading-none">
                            {record.score}<span className="text-slate-300 text-lg font-bold ml-1">/ {record.total_questions}</span>
                          </p>
                          <div className="w-32 h-2.5 bg-slate-100 rounded-full mt-4 overflow-hidden border border-slate-200 p-0.5">
                            <div 
                              className={`h-full rounded-full ${isPassed ? 'bg-accent-emerald' : 'bg-primary-500'} transition-all duration-1000`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                        <ArrowRight className="h-6 w-6 text-slate-200 group-hover:text-primary-500 group-hover:translate-x-2 transition-all" />
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default History;
