import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import api from '../api/axios';
import { 
  Zap, 
  Trophy, 
  CheckCircle2, 
  Coins, 
  Target, 
  Sparkles,
  Timer,
  Compass
} from 'lucide-react';

interface Quest {
  id: number;
  title: string;
  description: string;
  quest_type: string;
  requirement_value: number;
  reward_coins: number;
  reward_xp: number;
}

interface UserQuest {
  id: number;
  quest: Quest;
  progress: number;
  is_completed: boolean;
  is_claimed: boolean;
}

const Quests: React.FC = () => {
  const [userQuests, setUserQuests] = useState<UserQuest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuests();
  }, []);

  const fetchQuests = async () => {
    try {
      const res = await api.get('/quests/');
      setUserQuests(res.data);
    } catch (err) {
      console.error('Failed to fetch quests', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimQuest = async (uqId: number) => {
    try {
      await api.post(`/quests/${uqId}/claim/`);
      fetchQuests();
    } catch (err) {
      console.error('Failed to claim quest', err);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="h-12 w-12 animate-spin border-4 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-mesh text-slate-900">
      <Navbar />
      
      <main className="max-w-6xl mx-auto px-4 pt-32 pb-20">
        {/* Hero Section */}
        <div className="relative mb-20">
          <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-r from-primary-600/10 to-accent-violet/10 rounded-[3rem] blur-3xl -z-10" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-12 p-12 bg-white/40 backdrop-blur-xl rounded-[4rem] border border-white/60 shadow-2xl shadow-primary-500/5">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center space-x-2 bg-amber-50 text-amber-600 px-4 py-2 rounded-2xl mb-6 font-black text-xs uppercase tracking-widest animate-bounce">
                <Sparkles className="h-4 w-4" />
                <span>Phần thưởng hàng ngày đang chờ</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">
                Nhiệm vụ <span className="text-primary-600">Anh hùng</span>
              </h1>
              <p className="text-xl text-slate-500 max-w-lg font-medium leading-relaxed">
                Hoàn thành các mục tiêu hàng ngày để nhận lượng lớn XP, Xu và phần thưởng độc quyền. Nhiệm vụ mới xuất hiện mỗi 24 giờ!
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-6 w-full md:w-auto">
              <Card className="p-8 border-0 bg-white/80 shadow-xl text-center flex flex-col items-center">
                <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 mb-4">
                  <Coins className="h-6 w-6" />
                </div>
                <p className="text-2xl font-black text-slate-900">100%</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tỉ lệ thưởng</p>
              </Card>
              <Card className="p-8 border-0 bg-white/80 shadow-xl text-center flex flex-col items-center">
                <div className="h-12 w-12 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-500 mb-4">
                  <Timer className="h-6 w-6" />
                </div>
                <p className="text-2xl font-black text-slate-900">24h</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thời gian làm mới</p>
              </Card>
            </div>
          </div>
        </div>

        {/* Quests List */}
        <div className="grid grid-cols-1 gap-8">
          <div className="flex items-center justify-between px-6">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white">
                <Target className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Mục tiêu hôm nay</h2>
            </div>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">
              Đã xong {userQuests.filter(q => q.is_completed).length} / {userQuests.length}
            </p>
          </div>

          {userQuests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {userQuests.map((uq) => (
                <Card key={uq.id} className={`group p-8 border-0 transition-all duration-500 relative overflow-hidden h-full flex flex-col ${
                  uq.is_completed ? 'bg-white shadow-2xl' : 'bg-white/60 shadow-xl opacity-90'
                }`}>
                  {/* Status Overlay */}
                  {uq.is_claimed && (
                    <div className="absolute inset-0 bg-accent-emerald/5 backdrop-blur-[1px] z-20 flex items-center justify-center pointer-events-none">
                      <div className="rotate-[-12deg] border-4 border-accent-emerald text-accent-emerald px-6 py-2 rounded-2xl font-black text-2xl uppercase tracking-widest">
                        Đã nhận
                      </div>
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-8 relative z-10">
                    <div className={`h-16 w-16 rounded-3xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${
                      uq.is_completed ? 'bg-accent-emerald text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-100 text-slate-400'
                    }`}>
                      <Zap className="h-8 w-8 fill-current" />
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className="px-3 py-1 rounded-full bg-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        {uq.quest.category}
                      </span>
                      {uq.is_completed && !uq.is_claimed && (
                        <div className="h-3 w-3 bg-rose-500 rounded-full animate-ping" />
                      )}
                    </div>
                  </div>

                  <div className="flex-1 relative z-10">
                    <h3 className="text-2xl font-black text-slate-900 mb-2 leading-tight">{uq.quest.title}</h3>
                    <p className="text-slate-500 text-sm mb-8 leading-relaxed">{uq.quest.description}</p>
                    
                    <div className="space-y-4 mb-8">
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tiến độ</p>
                          <p className="text-lg font-black text-slate-900">
                            {uq.progress} <span className="text-slate-300 font-bold">/ {uq.quest.requirement_value}</span>
                          </p>
                        </div>
                        <p className="text-primary-600 font-black text-sm">
                          {Math.min(100, Math.floor((uq.progress / uq.quest.requirement_value) * 100))}%
                        </p>
                      </div>
                      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 shadow-inner">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ease-out ${
                            uq.is_completed ? 'bg-accent-emerald' : 'bg-gradient-to-r from-primary-500 to-accent-violet'
                          }`}
                          style={{ width: `${Math.min(100, (uq.progress / uq.quest.requirement_value) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-slate-50 flex items-center justify-between relative z-10 mt-auto">
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-2">
                        <Coins className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-black text-slate-700">{uq.quest.reward_coins}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Zap className="h-4 w-4 text-primary-500" />
                        <span className="text-sm font-black text-slate-700">{uq.quest.reward_xp}</span>
                      </div>
                    </div>

                    <Button 
                      size="sm"
                      onClick={() => handleClaimQuest(uq.id)}
                      disabled={!uq.is_completed || uq.is_claimed}
                      className={`rounded-2xl px-6 h-12 text-sm font-black transition-all ${
                        uq.is_claimed 
                        ? 'bg-slate-100 text-slate-400' 
                        : uq.is_completed 
                        ? 'bg-accent-emerald hover:bg-accent-emerald/90 shadow-lg shadow-emerald-500/20' 
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      {uq.is_claimed ? 'Xong' : uq.is_completed ? 'Nhận ngay!' : 'Đang làm'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center bg-white/40 backdrop-blur-xl rounded-[4rem] border-2 border-dashed border-slate-200">
              <div className="h-24 w-24 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto mb-8 text-slate-200">
                <Compass className="h-12 w-12" />
              </div>
              <h3 className="text-2xl font-black text-slate-400 mb-2">Không có nhiệm vụ nào hôm nay</h3>
              <p className="text-slate-400">Hãy đợi lần làm mới tiếp theo để bắt đầu những cuộc phiêu lưu mới!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Quests;
