import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Card } from '../components/ui/Card';
import { Navbar } from '../components/Navbar';
import { History as HistoryIcon, ArrowRight, Calendar, Award, Trophy, TrendingUp, Target, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

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
        // Sort history by date for the chart (ascending)
        const sortedHistory = [...response.data].sort((a, b) => 
          new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
        );
        setHistory(response.data);
      } catch (err) {
        console.error('Failed to fetch history', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const chartData = [...history].reverse().map(record => ({
    name: new Date(record.completed_at).toLocaleDateString(),
    score: Math.round((record.score / record.total_questions) * 100),
    title: record.quiz_title
  })).slice(-10); // Last 10 attempts

  const averageScore = history.length > 0 
    ? Math.round(history.reduce((acc, curr) => acc + (curr.score / curr.total_questions), 0) / history.length * 100) 
    : 0;
  
  const totalXP = history.reduce((acc, curr) => acc + curr.score * 10, 0);

  return (
    <div className="min-h-screen bg-mesh text-slate-900">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-4 pt-32 pb-12">
        <div className="flex items-center space-x-4 mb-12">
          <div className="bg-primary-600 p-3.5 rounded-2xl shadow-lg shadow-primary-500/20">
            <HistoryIcon className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Tiến trình của bạn</h1>
        </div>

        {!loading && history.length > 0 && (
          <div className="space-y-8 mb-12">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white border-t-4 border-t-primary-500">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-primary-50 text-primary-500 rounded-2xl">
                    <Target className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Độ chính xác TB</p>
                    <p className="text-3xl font-black text-slate-900">{averageScore}%</p>
                  </div>
                </div>
              </Card>
              <Card className="bg-white border-t-4 border-t-accent-amber">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-accent-amber/10 text-accent-amber rounded-2xl">
                    <Zap className="h-6 w-6 fill-accent-amber" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Tổng XP</p>
                    <p className="text-3xl font-black text-slate-900">{totalXP}</p>
                  </div>
                </div>
              </Card>
              <Card className="bg-white border-t-4 border-t-accent-emerald">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-accent-emerald/10 text-accent-emerald rounded-2xl">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Đã hoàn thành</p>
                    <p className="text-3xl font-black text-slate-900">{history.length}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Chart */}
            <Card className="p-8 border-0 shadow-xl overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-primary-500" />
                  <h2 className="text-xl font-black text-slate-800">Xu hướng chính xác</h2>
                </div>
                <span className="text-xs font-bold text-slate-400">10 lần làm gần nhất</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                      domain={[0, 100]}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                      itemStyle={{ fontWeight: 800, color: '#6366f1' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#6366f1" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorScore)" 
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        )}

        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-3xl bg-white border border-slate-100 animate-pulse" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <Card className="text-center py-24 bg-white/50 border-dashed border-2">
            <Trophy className="h-20 w-20 text-slate-200 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-slate-800">Chưa có lượt làm nào</h3>
            <p className="text-slate-500 mt-2 text-lg">Bắt đầu hành trình học tập ngay hôm nay!</p>
            <Link to="/" className="mt-8 inline-block text-primary-600 font-black hover:underline underline-offset-8 decoration-4">
              Xem tất cả bộ câu hỏi →
            </Link>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2 mb-4">
              <h2 className="text-2xl font-black text-slate-800">Lịch sử làm bài</h2>
            </div>
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
