import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Navbar } from '../components/Navbar';
import { Card } from '../components/ui/Card';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Award, 
  Target, 
  Zap, 
  Calendar,
  Activity,
  ChevronRight,
  Flame,
  Trophy
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/auth/stats/');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="h-12 w-12 animate-spin border-4 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-mesh text-slate-900">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 pt-32 pb-20">
        <div className="flex items-center space-x-6 mb-16">
          <div className="h-16 w-16 rounded-[2rem] bg-gradient-to-tr from-primary-600 to-accent-violet flex items-center justify-center text-white shadow-2xl shadow-primary-500/20">
            <Activity className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2">Bảng điều khiển kết quả</h1>
            <p className="text-slate-500 font-medium tracking-tight">Phân tích và thông tin chuyên sâu về hành trình học tập của bạn.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          <Card className="p-8 border-0 shadow-xl bg-white group hover:scale-[1.02] transition-all">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-6">
              <Zap className="h-6 w-6" />
            </div>
            <p className="text-4xl font-black text-slate-900 mb-1">{stats?.results_taken || 0}</p>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Bộ câu hỏi đã giải</p>
          </Card>

          <Card className="p-8 border-0 shadow-xl bg-white group hover:scale-[1.02] transition-all">
            <div className="h-12 w-12 rounded-2xl bg-accent-emerald/10 text-accent-emerald flex items-center justify-center mb-6">
              <Target className="h-6 w-6" />
            </div>
            <p className="text-4xl font-black text-slate-900 mb-1">{stats?.avg_score || 0}%</p>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Độ chính xác TB</p>
          </Card>

          <Card className="p-8 border-0 shadow-xl bg-white group hover:scale-[1.02] transition-all">
            <div className="h-12 w-12 rounded-2xl bg-accent-amber/10 text-accent-amber flex items-center justify-center mb-6">
              <TrendingUp className="h-6 w-6" />
            </div>
            <p className="text-4xl font-black text-slate-900 mb-1">{user?.level}</p>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Cấp độ thông thạo</p>
          </Card>

          <Card className="p-8 border-0 shadow-xl bg-white group hover:scale-[1.02] transition-all">
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center mb-6 ${user?.is_streak_active ? 'bg-orange-50 text-orange-500' : 'bg-slate-50 text-slate-300'}`}>
              <Flame className={`h-6 w-6 ${user?.is_streak_active ? 'fill-orange-500' : ''}`} />
            </div>
            <p className={`text-4xl font-black mb-1 ${user?.is_streak_active ? 'text-slate-900' : 'text-slate-400'}`}>{user?.streak_count || 0}</p>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Chuỗi hiện tại</p>
          </Card>

          <Card className="p-8 border-0 shadow-xl bg-white group hover:scale-[1.02] transition-all">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-6">
              <Trophy className="h-6 w-6" />
            </div>
            <p className="text-4xl font-black text-slate-900 mb-1">{user?.max_streak || 0}</p>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Chuỗi cao nhất</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="p-10 border-0 shadow-2xl">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-xl font-black text-slate-900 flex items-center">
                <PieChart className="h-6 w-6 mr-3 text-primary-600" />
                Phân bổ danh mục
              </h3>
            </div>
            
            <div className="space-y-8">
              {stats?.category_stats && stats.category_stats.length > 0 ? (
                stats.category_stats.map((cat: any) => (
                  <div key={cat.quiz__category__name}>
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-black text-slate-700">{cat.quiz__category__name || 'Chung'}</span>
                      <span className="text-xs font-bold text-slate-400 uppercase">{cat.count} Quiz</span>
                    </div>
                    <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden p-0.5">
                      <div 
                        className="h-full bg-gradient-to-r from-primary-500 to-accent-violet rounded-full"
                        style={{ width: `${(cat.count / stats.results_taken) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-slate-400 font-medium italic">
                  Hoàn thành thêm quiz để xem biểu đồ phân bổ!
                </div>
              )}
            </div>
          </Card>

          <Card className="p-10 border-0 shadow-2xl">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-xl font-black text-slate-900 flex items-center">
                <BarChart3 className="h-6 w-6 mr-3 text-accent-emerald" />
                Tiến trình huy hiệu
              </h3>
              <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                {stats?.badges.filter((b: any) => b.earned).length} / {stats?.badges.length}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {stats?.badges.map((badge: any) => (
                <div key={badge.id} className={`p-4 rounded-[2rem] border-2 transition-all flex flex-col items-center justify-center text-center ${
                  badge.earned ? 'border-primary-100 bg-primary-50/30' : 'border-slate-50 opacity-40 grayscale'
                }`}>
                   <Award className={`h-8 w-8 mb-2 ${badge.earned ? 'text-primary-600' : 'text-slate-300'}`} />
                   <p className="text-[10px] font-black text-slate-800 leading-tight">{badge.name}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-10 pt-10 border-t border-slate-100">
              <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Hoạt động gần đây</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-xl bg-white flex items-center justify-center text-primary-600 shadow-sm">
                      <Zap className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-bold text-slate-700">Đã hoàn thành Quiz</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-400">HÔM NAY</span>
                </div>
                {/* Add more activity items here */}
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
